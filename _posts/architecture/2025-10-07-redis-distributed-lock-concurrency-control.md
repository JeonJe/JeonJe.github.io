---
title: "예약 시스템 동시성 제어: Redis 분산 락을 선택한 이유와 구현 경험"
description: "병원 예약 시스템의 중복 예약 문제를 해결하기 위해 비관적 락, 낙관적 락, 유니크 제약조건, 조건부 UPDATE, Redis 분산 락을 비교하고, 실시간 슬롯 계산 구조에서 Redis 분산 락을 선택한 이유와 AOP 기반 구현 경험을 담았습니다."
categories:
  - Architecture
  - 동시성제어
tags:
  - Redis
  - 분산락
  - 동시성제어
  - Spring AOP
  - Redisson
  - 예약시스템
  - Race Condition
  - 비관적락
  - 낙관적락
toc: true
toc_sticky: true
image: /assets/img/thumbnail/redis-distributed-lock-concurrency-control.png
---

## *들어가며*

티켓팅에서 **같은 좌석**을 동시에 잡거나, 하나의 주문건에 **결제 요청이 동시에** 들어오면 어떻게 될까?  
**동시성(concurrency)** 을 제대로 다루지 못하면 좌석이 **이중 배정**되거나 결제가 **중복 승인**될 수 있다.

내가 담당하는 예약 서비스도 마찬가지였다. 병원·환자 서비스에서는 환자가 앱에서 진료 시간을 예약할 수 있고, **병원이 사용하는 클라이언트 서비스**에서도 같은 시간에 예약을 잡을 수 있다. 만약 두 요청이 동시에 요청된다면 **중복 예약(Overbooking)** 이 발생할 수 있었다.

이번 글에서는 이런 상황을 막기 위해 검토한 방법들(비관적 락, 낙관적 락, 유니크 제약조건, 조건부 UPDATE, **Redis 분산 락**)을 비교하고, 왜 최종적으로 **Redis 기반 분산 락**을 선택했는지, 그리고 그 **선택의 이유와 효과**를 다루고자 한다.

---

## **문제 인식: 숨어있는 Race Condition**

### **예약 시스템의 Check-Then-Act 패턴 분석**

현재 예약 시스템의 핵심 로직을 단순화하면 이렇다:

```java
@Transactional
public void createReservation(ReservationRequest request) {
    // 1. Check: 예약 가능 여부 확인
    if (isAvailable(request)) {
        // 2. Act: 예약 생성
        saveReservation(request);
    }
}
```

겉보기엔 트랜잭션도 걸려있고 문제없어 보인다. 하지만 이게 바로 **Check-Then-Act 패턴의 함정**이다.

두 사용자가 동시에 14:30 예약을 하는 시나리오를 시퀀스 다이어그램을 통해 살펴보자.
![](https://i.imgur.com/0OPt92J.png)


**Check와 Act가 원자적으로 처리되지 않아** 둘 다 "예약 가능"으로 판단하고 예약을 생성해버린다.


동시성 제어 관점에서 제약 조건이 있다. 예약 가능한 시간은 **애플리케이션에서 타임슬롯을 매번 계산**하여 확인한다.

```java
// 예약 가능 시간을 실시간으로 계산 (실제로는 훨씬 복잡)
private boolean isAvailable(ReservationRequest request) {
    // 매번 여러 조건을 조합해서 계산
    return checkHospitalHours(request)
        && checkDoctorSchedule(request)  
        && checkRoomAvailability(request)
        && !hasConflict(request);
}
```

**일반적인 예약 시스템과 현재 시스템의 차이점:**
- **일반 시스템**: time_slots 테이블에 미리 생성된 슬롯 존재 → DB 락으로 쉽게 해결
- **현재 시스템**: 예약 시점에 실시간으로 가능 여부 계산 → 락을 걸 대상이 없음

초기 서비스는 환자 앱에서만 의사 진료 시간을 기준으로 예약 슬롯을 계산하는 단순한 구조였다고 한다. 빠른 출시가 중요했던 당시에는 별도의 예약 슬롯 스키마 없이 애플리케이션 로직으로 처리하는 게 합리적인 선택이었을 것이다.

하지만 서비스가 성장하면서 병원에서도 환자 예약을 직접 관리해야 하는 요구가 생겼고, 단순 예약뿐만 아니라 병원 일정, 진료실 운영 방식 등 다양한 변수들이 예약 슬롯 계산에 영향을 주게 되면서 로직이 점점 복잡해졌다.

매번 예약 슬롯을 계산하는 현재 방식은 여러 한계가 있다. **성능 문제**는 물론이고, **계산 결과를 캐싱하기 어려워** 동일한 요청에도 반복 계산이 필요하며, **예약 슬롯에 문제가 생겼을 때 데이터로 한눈에 확인하기 어려워 디버깅이 복잡**하다.

예약 슬롯을 위한 DB 스키마를 도입하면 이런 문제들이 해결되겠지만, 리팩토링 범위가 너무 크다. 현재 예약 트래픽과 예약 건수 자체가 많지 않은 상황에서 전체 시스템을 뜯어고치기보다는, **리팩토링 범위를 최소화하면서 동시성 문제에만 집중**해야 한다는 제약 조건이 있었다.

즉, **기존 구조를 유지하면서도 Race Condition을 해결할 방법**을 찾아야 했다.

### **동시성 테스트로 취약점 확인**

이론상 문제가 실제로 발생하는지 검증해봤다:

```java
@Test
void 동시_예약_요청시_중복예약_발생_테스트() {
    // Given: 동일 시간대 2개 요청 준비
    var targetTime = "2025-12-24 14:30";
    var threadCount = 2;
    var executor = Executors.newFixedThreadPool(threadCount);
    var latch = new CountDownLatch(threadCount);
    
    var successCount = new AtomicInteger();
    
    // When: 정확히 동시에 실행
    for (int i = 0; i < threadCount; i++) {
        executor.submit(() -> {
            latch.countDown();
            latch.await();  // 모든 스레드 동기화
            
            if (reservationService.create(targetTime)) {
                successCount.incrementAndGet();
            }
        });
    }
    
    executor.shutdown();
    
    // Then: 기대값 vs 실제값
    assertEquals(1, successCount.get());  // ❌ 실패! 실제로는 2
}
```

**결과: 예약 2건이 모두 성공한다.** 
Race Condition이 실제로 발생한다는 것을 테스트를 통해 직접 확인했다.

만약 이런 중복 예약이 발생한다면 환자는 예상치 못한 대기 시간을 겪게 되고, 병원은 불필요한 민원 처리와 스케줄 조정에 시간을 낭비하게 된다.

이제 어떤 해결책들을 검토했는지 살펴보자.

---

## **해결책 탐색: 5가지 동시성 제어 방법 비교**

| 동시성 제어 방법 | 핵심 아이디어 | 장점 | 한계 | 적용 가능성 |
| :-- | :-- | :-- | :-- | :-- |
| **비관적 락** | 데이터를 조회할 때 바로 락을 걸어 다른 요청을 막는다 | 확실하게 중복 방지 가능 | 락을 걸 대상(타임슬롯)이 없음 | ❌ 적용 어려움 |
| **낙관적 락** | 갱신 시점에 버전 번호로 충돌을 감지한다 | 락 대기 없이 빠르다 | 테이블마다 버전 관리 필요, 복잡도 ↑ | ⚠️ 구조상 부담 큼 |
| **유니크 제약조건** | 컬럼 조합으로 같은 시간대 예약을 막는다 | 간단하고 빠름 | 겹치는 시간대는 막지 못함 | ❌ 실효성 낮음 |
| **조건부 UPDATE** | 조건이 맞을 때만 한 줄로 업데이트한다 | 재고 관리엔 유용 | 슬롯이 DB에 없어서 쓸 수 없음 | ❌ 구조상 불가 |
| **Redis 분산 락** | Redis 키로 임계 구역을 잠근다 | 구조 변경 없이 즉시 적용 가능 | Redis 의존성, 약간의 오버헤드 | ✅ **가장 현실적** |

### **비관적 락: 물리 슬롯 부재로 적용 불가**

비관적 락은 `SELECT FOR UPDATE`를 사용해 데이터를 조회하는 순간 락을 걸어 다른 트랜잭션이 접근하지 못하게 하는 방식이다.

```sql
SELECT * FROM time_slots 
WHERE room_id = ? AND slot_time = ?
FOR UPDATE;
```

일반적인 예약 시스템이라면 이렇게 타임슬롯 row에 락을 걸면 끝이다. 구현도 간단하고 확실한 동시성 보장이 가능하다.

하지만 현재 시스템은 **타임슬롯을 실시간으로 계산**한다. 락을 걸 대상 자체가 DB에 존재하지 않는다. 억지로 진료실이나 의사 테이블에 락을 건다면? 14:30 예약 하나 때문에 해당 진료실의 모든 시간대 예약이 대기해야 한다. 너무 넓은 락 범위는 성능 저하를 일으킬 수밖에 없다.

**결론: 락을 걸 대상이 없어 적용 불가능**

### **낙관적 락: 버전 관리·재시도 비용이 큼**

낙관적 락은 Version 컬럼을 추가해 업데이트 시점에 충돌을 감지하는 방식이다.

```java
// JPA라면 이렇게 간단하지만...
@Version
private Long version;

// MyBatis에서는 모든 걸 수동으로
UPDATE reservation 
SET status = 'CONFIRMED', version = version + 1
WHERE id = ? AND version = ?
```

JPA와 달리 MyBatis는 낙관적 락을 위한 어노테이션도 없고, Version 관리를 모두 수동으로 해야 한다.

더 큰 문제는 **여러 테이블이 연관된 복잡한 계산 로직**이다. 의사 스케줄, 진료실 운영시간, 병원 일정 등 여러 테이블의 상태가 예약 가능 여부에 영향을 준다. 이 모든 테이블에 Version을 추가하고 추적한다? 복잡도가 기하급수적으로 증가한다.

**결론: 구현 비용 대비 효과가 떨어짐**

### **유니크 제약조건: 시작 시각만 차단, 겹침은 미차단**

가장 간단해 보이는 방법이다. DDL 한 줄이면 끝!

```sql
ALTER TABLE reservation 
ADD CONSTRAINT uk_reservation 
UNIQUE (room_id, employee_id, appointment_time);
```

하지만 이건 **정확히 같은 시작 시간만 막는다**. 실제로 문제가 되는 시간 겹침은?

```sql
-- 13:00-14:00 예약
INSERT INTO reservation VALUES (1, 101, '13:00', '14:00');  -- 성공

-- 13:30-14:30 예약 (30분 겹침!)  
INSERT INTO reservation VALUES (2, 101, '13:30', '14:30');  -- 성공 😱
```

시작 시간이 다르면 제약조건을 통과한다. 시간 범위 겹침을 전혀 감지하지 못하는 치명적 문제가 있다.

**결론: 오버부킹을 막지 못해 무용지물**

### **조건부 UPDATE: 슬롯 테이블이 없어 원자화 불가**

재고 관리에서 자주 쓰는 원자적 UPDATE 패턴이다.

```sql
UPDATE inventory 
SET quantity = quantity - 1 
WHERE product_id = ? AND quantity > 0;
```

재고처럼 수량이 있는 row가 있다면 완벽하다. 하지만 현재 시스템은 **예약 슬롯 자체가 DB에 없다**. UPDATE할 대상이 없는데 어떻게 조건부 UPDATE를 하겠는가?

슬롯 테이블을 새로 만든다면? 그건 이미 전체 리팩토링이다. 리팩토링 범위를 최소화한다는 제약 조건에 위배된다.

**결론: 현재 구조에서는 적용 불가능**

### **분산 락: 기존 구조 유지하며 동시성만 원자화**

Redis를 이용한 분산 락은 키 기반으로 동시성을 제어한다.

```java
@DistributedLock(key = "'reservation:' + #roomId + ':' + #time")
public void createReservation(Long roomId, LocalDateTime time) {
    // 기존 계산 로직 그대로 사용
    if (isAvailable(roomId, time)) {
        saveReservation(roomId, time);
    }
}
```

**왜 지금 상황에서 가장 적합한가?**

1. **구조 변경 없음**: 기존 실시간 계산 방식 그대로 유지
2. **구현 간단**: 어노테이션 하나로 적용 가능
3. **세밀한 제어**: 진료실 + 시간 조합으로 필요한 부분만 락
4. **검증된 인프라**: 이미 다른 기능에서 Redisson을 사용 중이라 추가 학습 비용 없음
5. **적절한 성능**: Redis 메모리 기반으로 빠른 응답 (평균 20ms 오버헤드)

다른 방법들이 모두 "현재 구조를 바꿔야 한다"는 벽에 막혔지만, 분산 락은 **기존 로직을 감싸서 보호**하는 방식이다. 리팩토링 범위를 최소화하면서도 동시성 문제를 해결할 수 있는 현실적인 선택이었다.

아래 시퀀스 다이어그램을 통해 Redis 분산락이 기존의 Check-Then-Act의 문제를 해결하는지 구체적으로 살펴보자.
![](https://i.imgur.com/d9MY51N.png)

핵심은 **락을 통한 순차적 처리**다:
1. 동일한 예약 시간(진료실+날짜)에 대해 하나의 락 키 생성
2. 먼저 도착한 요청만 락 획득, 나머지는 대기
3. 락을 가진 요청만 Check-Then-Act 수행
4. 두 번째 요청이 확인할 때는 이미 예약이 존재

이렇게 **기존 로직을 전혀 수정하지 않고도** 동시성 문제를 해결할 수 있다.

**결론: 제약 조건 내에서 가장 합리적인 선택이라 판단했다.**

---

## **분산 락 적용기: 구현부터 운영까지**
### **어떻게 구현했나: @DistributedLock 어노테이션을 만들어 사용**

**AOP로 선언적 방식 선택**

분산 락 로직을 비즈니스 코드에 섞고 싶지 않았다. Spring AOP의 `@Around`를 활용해서 메서드 실행 전후를 감싸는 방식으로 구현했다.

```java
@DistributedLock(
    key = DistributedLockKeys.RESERVATION,  // 중앙화된 키 사용
    waitTime = 3, //sec
    leaseTime = 5 //sec
)
public void createReservation(ReservationRequest request) {
    // 비즈니스 로직만 집중
}
```

**타임아웃 설정**
- **waitTime (3초)**: 락 획득 대기 시간. 너무 길면 응답 지연, 너무 짧으면 정상 요청도 실패
- **leaseTime (5초)**: 락 자동 해제 시간. 예상치 못한 장애로 락이 해제되지 않는 것을 방지

**Fail-Safe: Redis 장애 시에도 서비스 지속**

구현 시 가장 신경 쓴 부분은 Redis 장애로 인해 예약 서비스가 중단되지 않도록 하는 것이었다.

```java
@Around("@annotation(distributedLock)")
public Object lock(ProceedingJoinPoint joinPoint, DistributedLock distributedLock) throws Throwable {
    try {
        boolean acquired = lock.tryLock(waitTime, leaseTime, timeUnit);
        if (acquired) {
            try {
                return joinPoint.proceed();
            } finally {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        } else {
            // 빠른 실패: 대기 초과 또는 이미 동일 키 작업 진행 중
            throw new TooManyRequestsException("Lock wait timeout"); // or return Response.status(429)...
        }
    } catch (RedisException e) {
        // Fail-Safe: Redis 장애 시 동시성 제어 없이 진행 (알림 필수)
        log.error("Redis 연결 실패, 락 없이 진행: {}", e.getMessage());
        slackClient.sendAlert("Redis 장애 발생!");
        return joinPoint.proceed();
    }
}
```

**완벽한 동시성 제어**와 **서비스 가용성** 중 후자를 우선했다. Redis 장애 시 일시적으로 중복 예약이 발생할 수 있지만, 예약 서비스 자체가 중단되는 것보다는 낫다고 판단했다.

대신 모든 락 동작(획득/해제/실패)을 상세히 로깅하고, Redis 장애 발생 시 Slack으로 즉시 알림을 보내 빠르게 인지하고 대응할 수 있도록 했다.

### **실제 적용: 예약 생성부터 수정까지**

실제로 어떻게 적용했는지 코드로 보자.

**예약 생성/수정에 적용**

```java
@Service
public class ReservationService {
    
    @DistributedLock(key =DistributedLockKeys.RESERVATION)
    @Transactional
    public void createReservation(ReservationRequest request) {
        // 첫 번째 파라미터의 진료실ID와 예약날짜로 락 생성
        // 예: "reservation:123:2024-12-25"
        if (isTimeSlotAvailable(request)) {
            reservationMapper.insert(request);
        }
    }
}
```

**락 키 중앙 관리**
처음엔 각 메서드마다 SpEL 표현식을 하드코딩했는데, 중복되고 관리가 어려워서 한 곳으로 모았다.

```java
public final class DistributedLockKeys {
    
    // 예약 생성/수정 (진료실 + 날짜)
    // 주의: 첫 번째 파라미터(#p0)에서 필드를 추출
    public static final String RESERVATION = 
        "'reservation:' + #p0.roomId + ':' + #p0.reservationDate";
    
    // 병원 일정 관리 (진료실 + 날짜)  
    public static final String SCHEDULE = 
        "'schedule:' + #p0.roomId + ':' + #p0.scheduleDate";
    
    // 임시 예약 (진료실 + 날짜)
    public static final String TEMP_RESERVATION = 
        "'temp:' + #p0.roomId + ':' + #p0.date";
}
```

**SpEL 사용 시 주의점**

```java
// ❌ 잘못된 예: 파라미터 순서 바뀜
@DistributedLock(key = DistributedLockKeys.RESERVATION)  
public void createReservation(String userId, ReservationRequest request) {
    // SpEL이 첫 번째 파라미터(userId)를 참조해서 에러 발생!
}

// ✅ 올바른 예: 락에 필요한 객체를 첫 번째로
@DistributedLock(key = DistributedLockKeys.RESERVATION)
public void createReservation(ReservationRequest request, String userId) {
    // 정상 동작
}
```

`#p0`은 첫 번째 파라미터를 의미한다. 따라서 락 키 생성에 필요한 객체는 반드시 **첫 번째 파라미터**로 전달해야 한다. 이런 제약사항을 모르면 런타임 에러로 이어지기 때문에, 각 키 정의마다 주석으로 명확히 표시했다.


### **성능은 괜찮을까?**

**경합[^contend]이 없을 때** 분산 락의 **오버헤드[^overhead]는 평균 20ms 내외**로 매우 작다.

**경합이 생기면** 두 번째 요청은 선행 작업이 끝날 때까지 기다리므로 총 시간이 길어질 수 있는데, 이는 **중복 예약을 막기 위한 의도된 동작**이다.

#### **경합이 없을 때 (일반적인 상황)**
- 평균 오버헤드 **20ms** = SpEL 약 **2ms (10%)** + **락 획득 10ms (50%)** + **락 해제 8ms (40%)**
- 비즈니스 로직이 **1초**라면, 락 비용은 **약 2%** 수준으로 거의 체감되지 않는다.

![](https://i.imgur.com/E4nnq4s.png)


#### **경합이 발생했을 때**
- **첫 번째 요청**: 총 **27ms** _(SpEL 5ms / 획득 15ms / 해제 7ms)_
- **두 번째 요청**: 총 **1,090ms** — 대부분은 **락 대기 시간** 때문.

대기 시간은 선행 요청의 **비즈니스 로직 시간(≈1,036ms)** 에 거의 비례한다.

![](https://i.imgur.com/ZnyruPq.png)
결론적으로, **임계 구역에 한 번에 한 요청만** 들어가도록 보장하는 대가로 **평균 20ms**를 지불하는 셈이다.
이 정도 비용으로 데이터 정합성을 확보할 수 있다면 **충분히 감수할 만한 트레이드오프**다.

[^overhead]: 기능을 수행하기 위해 추가로 드는 **시간/자원 비용**.
[^contend]: 여러 요청이 같은 자원을 두고 **경쟁**하는 상태.


---

## **마지막으로**

이번에 동시성 제어를 추가하면서 가장 신경 쓴 부분은 **현재 상황에 맞는 현실적인 기술 선택**이었다.

### **현실적인 기술 선택 과정**

5가지 동시성 제어 방법을 단순히 이론적으로만 비교한 게 아니었다. 각 방법을 **현재 시스템의 제약사항과 비즈니스 맥락**에 대입해보며 평가했다.

- **코드베이스 제약**: MyBatis 사용, 실시간 슬롯 계산 방식, 리팩토링 범위 최소화 요구
- **비즈니스 맥락**: 현재는 트래픽이 적지만 성장 가능성 있음, 예약은 핵심 기능
- **실용적 판단**: 분산 락은 기존 Redis 인프라 활용 가능, 어노테이션 하나로 적용

무엇보다 실제 측정을 통해 판단했다. "성능에 영향이 있을 것 같은데"가 아니라 "측정해보니 20ms 오버헤드, 전체 처리 시간의 2%"라는 구체적 수치로 의사결정했다.

### **외부 의존성과 장애 대응**

Redis 분산 락을 사용하면서 가장 고민했던 부분은 **"Redis가 장애 나면 예약 서비스는 어떻게 되나?"** 였다.

**Fail-Safe 전략: 서비스 가용성 우선**

완벽한 동시성 제어와 서비스 가용성 사이에서 후자를 선택했다. Redis 장애 시 일시적으로 중복 예약이 발생할 수 있지만, 예약 서비스 자체가 중단되는 것보다는 낫다고 판단했다. 대신 장애를 빠르게 감지하고 대응할 수 있도록 모니터링 체계를 구축했다.

- **상세 로깅**: 락 획득/해제/실패 등 모든 동작을 Elasticsearch에 기록
- **즉시 알림**: Redis 장애 발생 시 Slack으로 실시간 알림
- **운영 대시보드**: 락 대기 시간, 경합 빈도 등 핵심 지표 모니터링

외부 시스템을 도입할 때는 정상 동작만큼이나 **장애 시나리오와 대응 방안**을 함께 설계하는 것이 중요하다.


분산 락으로 당장의 동시성 문제는 해결했지만, 트래픽이 본격적으로 늘어나면 예약 슬롯 테이블 도입이 필요할 것이고 또 다른 방식의 동시성 제어를 고민해야 할 것이다. 그건 나중에 고민하자.
이번 경험을 통해 **"지금 해결해야 할 문제"와 "나중에 해결할 문제"를 구분하는 것**도 중요한 역량이라는 것을 가장 많이 느꼈다.

---
