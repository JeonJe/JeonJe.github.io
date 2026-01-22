---
title: "예약 시스템 동시성 제어: Redis 분산 락을 선택한 이유와 구현 경험"
description: "병원 예약 시스템의 중복 예약 문제를 해결하기 위해 비관적 락, 낙관적 락, Redis 분산 락을 비교하고, 실시간 슬롯 계산 구조에서 Redis 분산 락을 선택한 이유와 AOP 기반 구현 경험을 담았습니다."
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
series: work-improvement
series_order: 8
toc: true
toc_sticky: true
image: /assets/img/thumbnail/redis-distributed-lock-concurrency-control.png
---

## 들어가며

콘서트 티켓팅에서 **같은 좌석**을 동시 요청하면 어떻게 될까?  
만약 **동시성(concurrency)** 제어 처리가 제대로 되어 있지 않은 시스템이라면, 하나의 자리에 N건의 예약이 생겨버려
아주 곤란한 상황이 발생할 것이다.

내가 개발하고 있는 예약 서비스도 동시성 문제가 발생할 수 있는 구조였다.
환자가 9시에 예약을 신청하는 순간, 병원에서도 다른 예약을 9시에 잡게 되면 **중복 예약(Overbooking)** 이 발생할 수 있었다.

이번 글에서는 예약 시스템에서 동시성 제어를 위한 대안들인 (비관적 락, 낙관적 락, **Redis 분산 락**)을 비교하고, 왜 **Redis 기반 분산 락**을 선택했는지를 정리해보았다.

---

## 문제 인식: 숨어있는 Race Condition

### 예약 시스템의 Check-Then-Act 패턴 분석

현재 예약 시스템의 핵심 로직은 아래와 같다.

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

겉보기엔 예약이 가능한지 확인 후 예약을 생성하니 중복된 예약을 잘 막을 것처럼 보인다.

두 사용자가 동시에 14:30 예약을 하는 시나리오를 시퀀스 다이어그램을 통해 살펴보자.
![](https://i.imgur.com/0OPt92J.png)


코드는 **예약 시간을 검증하는 Check와 예약을 저장하는 Act가 원자적으로 처리되지 않아** 둘 다 "예약 가능"으로 판단하고 예약을 생성해버린다.

그리고 주의가 필요한 부분이 하나 더 있다.
아래와 같이 예약 슬롯을 **애플리케이션에서 타임슬롯을 매번 계산**하는 것이다.

```java
// 예약 가능 시간을 실시간으로 계산
public void calculateTimeSlotAvailableCount(
  DefaultReservationTimeSlot reservationTimeSlot,
  List<TimeSlotBlock> timeSlotBlocks,
  ReservationTimeSlotViewType strategyType) {

  TimeSlotCalculatorStrategy strategy = factory.getStrategy(strategyType);

  //병원(예약 슬롯, 현황판), 환자(의사 지정, 의사 미지정)에 따라 예약 슬롯 초기화 
  strategy.initTimeSlot(reservationTimeSlot);

  //예약을 받을 수 있는 인원 카운팅
  Map<LocalDateTime, Integer> reservationSchedules =
    calculateTimeBlocksAvailableCount(reservationTimeSlot, timeSlotBlocks, strategy);
    
    ...

}

```

서비스 초기에는 환자가 특정 의사에게 예약을 신청하는 단순한 구조였고 사용자도 많지 않았기 때문에 예약 슬롯을 별도로 저장하지 않았다고 한다.
지금 구조는 예약 슬롯 테이블이 필요하지 않다는 장점이 있지만, 요청마다 예약 슬롯 계산이 필요하고, **문제가 생겼을 때 디버깅이 복잡**하다는 단점도 있다.

위와 같은 상황에서 동시성 제어를 위한 해결 방법들을 찾아보았다.


### 동시성 테스트로 취약점 확인

문제 상황을 테스트 코드로 작성하여 재현을 시도하였다.

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

**결과: 예약이 중복으로 저장되었다.**

즉, 중복 예약으로 인해 환자는 예상치 못한 대기 시간을 기다리게 되고, 병원은 스케줄 조정에 시간을 낭비할 수 있는 구조였다.

문제를 해결하기 위해 총 3가지 방법을 고려해보았다.

---

## 해결책 탐색: 3가지 동시성 제어 방법 비교

| 동시성 제어 방법 | 핵심 아이디어 | 장점 | 한계 | 적용 가능성 |
| :-- | :-- | :-- | :-- | :-- |
| **비관적 락** | 데이터를 조회할 때 바로 락을 걸어 다른 요청을 막는다 | 확실하게 중복 방지 가능 | 락을 걸 대상(타임슬롯)이 없음 | ❌ 적용 어려움 |
| **낙관적 락** | 갱신 시점에 버전 번호로 충돌을 감지한다 | 락 대기 없이 빠르다 | 버전 필드를 달 테이블이 없음, 시간 겹침 감지 불가 | ❌ 구조상 불가 |
| **Redis 분산 락** | Redis 키로 임계 구역을 잠근다 | 구조 변경 없이 즉시 적용 가능 | Redis 의존성, 약간의 오버헤드 | ✅ **가장 현실적** |

### 비관적 락: 물리 슬롯 부재로 적용 불가

비관적 락은 `SELECT FOR UPDATE` 키워드를 사용하여 레코드락(범위일 경우 넥스트 키 락)으로 다른 트랜잭션이 데이터에 동시에 접근하지 못하게 하는 방식이다.

```sql
SELECT * FROM time_slots
WHERE room_id = ? AND slot_time = ?
  FOR UPDATE;
```

간단하고 확실한 방식이지만, 현재 예약 구조는 락의 대상인 **타임슬롯을 애플리케이션에서 실시간으로 계산**하기 때문에 적합하지 않다고 판단했다.
대안으로 다른 테이블(진료 공간이나 직원 테이블)에 대한 락도 고려해보았는데, 너무 넓은 범위에 락을 거는 것은 적절하지 않아 보였다.


### 낙관적 락: 버전 필드를 달 곳이 없음

낙관적 락은 충돌이 나지 않을 것을 기대하고, 충돌이 발생하면 재시도를 하여 처리하는 방식이다. 일반적으로 버전 필드를 두고 UPDATE 시 충돌을 감지하지만, 비관적 락을 고려했을 때와 같이 **버전 필드를 달 테이블 자체가 없다**. 
타임슬롯을 DB에 저장하지 않고 실시간으로 계산하기 때문이다.

설령 슬롯 테이블을 새로 만들어도 한계가 있다. 유니크 키 제약조건을 예로 들면:

```sql
ALTER TABLE reservation
  ADD CONSTRAINT uk_reservation
    UNIQUE (room_id, employee_id, appointment_time);
```

**정확히 같은 시간**의 중복은 막을 수 있지만, **시간이 일부만 겹치는 경우**는 막지 못한다.

```sql
-- 13:00-14:00 예약
INSERT INTO reservation VALUES (1, 101, '13:00', '14:00');  -- 성공

-- 13:30-14:30 예약 (30분 겹침!)
INSERT INTO reservation VALUES (2, 101, '13:30', '14:30');  -- 성공 (다른 레코드라서 통과)
```

버전 필드도 마찬가지다. **같은 레코드**에 대한 동시 수정만 감지하지, **다른 레코드 간의 시간 범위 겹침**은 감지하지 못하는 어려움이 있다.


### 분산 락: 기존 구조 유지하며 동시성만 원자화

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

오! 분산락 방식을 고려했을 때, 다음과 같은 장점이 있었다.
1. **구조 변경 없음**: 기존 실시간 계산 방식 그대로 유지
2. **적용 간단**: 어노테이션 하나로 적용 가능
3. **세밀한 제어**: 진료실 + 날짜 조합으로 락 대상 범위 최소화
4. **사용 중인 인프라**: 이미 다른 기능에서 Redis 사용 중
5. **적절한 성능**: Redis 메모리 기반으로 빠른 응답 (평균 20ms 오버헤드)


시퀀스 다이어그램을 통해 Redis 분산락이 기존의 Check-Then-Act의 문제를 진짜로 해결할 수 있는지 살펴보았다.

![](https://i.imgur.com/d9MY51N.png)

1. 동일한 예약 시간(진료실+날짜)에 대해 하나의 락 키 생성
2. 먼저 도착한 요청만 락 획득, 나머지는 대기
3. 락을 가진 요청만 Check-Then-Act 수행
4. 두 번째 요청이 확인할 때는 이미 예약이 존재

분산 락은 **기존 로직을 감싸서 보호**하는 방식이어서 리팩토링 범위를 최소화하면서도 동시성 문제를 해결할 수 있는 현실적인 선택이었다.

---

## 분산 락 적용기: 구현부터 운영까지

### 어떻게 구현했나: @DistributedLock 어노테이션을 만들어 사용

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

### 실제 적용: 예약 생성부터 수정까지

**예약 생성/수정에 적용**

```java
@Service
public class ReservationService {

  @DistributedLock(key = DistributedLockKeys.RESERVATION)
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


### 성능은 괜찮을까?

**경합이 없을 때** 분산 락의 **오버헤드는 평균 20ms 내외**로 매우 작다.

만약 **경합이 생기면** 두 번째 요청은 선행 작업이 끝날 때까지 기다리므로 총 시간이 길어질 수 있는데, 이는 **중복 예약을 막기 위한 의도된 동작**이다.

#### **경합이 없을 때 (일반적인 상황)**
- 평균 오버헤드 **20ms** = SpEL 약 **2ms (10%)** + **락 획득 10ms (50%)** + **락 해제 8ms (40%)**
- 비즈니스 로직이 **1초**라면, 락 비용은 **약 2%** 수준으로 거의 체감되지 않는다.

![](https://i.imgur.com/E4nnq4s.png)


#### **경합이 발생했을 때**
- **첫 번째 요청**: 총 **27ms** _(SpEL 5ms / 획득 15ms / 해제 7ms)_
- **두 번째 요청**: 총 **1,090ms** — 대부분은 **락 대기 시간** 때문.

대기 시간은 선행 요청의 **비즈니스 로직 시간(≈1,036ms)** 에 거의 비례한다.

![](https://i.imgur.com/ZnyruPq.png)

결론적으로, 평균 20ms로 **임계 구역에 한 번에 한 요청만** 들어가도록 보장이 가능해졌고,
이 정도로 데이터 정합성을 확보할 수 있다면 **충분히 감수할 만한 트레이드오프**라고 생각했다.

---

## 마지막으로

이번에 동시성 제어를 추가하면서 가장 신경 쓴 부분은 **현재 상황에 맞는 현실적인 기술 선택**이었다.

### 현실적인 기술 선택 과정

동시성 제어 방법을 **현재 시스템의 제약사항과 비즈니스 맥락**에 대입해보며 확인해보았다.

- **코드베이스 제약**: MyBatis 사용, 실시간 슬롯 계산 방식, 리팩토링 범위 최소화 요구
- **비즈니스 맥락**: 현재는 트래픽이 적지만 성장 가능성 있음, 예약은 핵심 기능
- **실용적 판단**: 분산 락은 기존 Redis 인프라 활용 가능, 어노테이션 하나로 적용

"성능에 영향이 있을 것 같은데"라는 의구심을 직접 측정해서 "20ms 오버헤드, 전체 처리 시간의 2%"라는 구체적 수치를 참고하여 판단하였다.

### 외부 의존성과 장애 대응

Redis 분산 락을 사용하면서 가장 고민했던 부분은 **"Redis가 장애 나면 예약 서비스는 어떻게 되나?"** 였다.

**Fail-Safe 전략: 서비스 가용성 우선**

완벽한 동시성 제어와 서비스 가용성 사이에서 가용성을 선택했다.
Redis 장애 시 일시적으로 중복 예약이 발생할 수 있지만, 예약 서비스 자체가 중단되는 것보다는 낫다고 판단했다. 대신 장애를 빠르게 감지하고 대응할 수 있도록 모니터링 체계를 구축했다.

- **상세 로깅**: 락 획득/해제/실패 등 모든 동작을 Elasticsearch에 기록
- **즉시 알림**: Redis 장애 발생 시 Slack으로 실시간 알림
- **운영 대시보드**: 락 대기 시간, 경합 빈도 등 핵심 지표 모니터링

외부 시스템을 도입할 때는 정상 동작만큼이나 **장애 시나리오와 대응 방안**을 함께 설계하는 것이 중요하다.


분산 락으로 당장의 동시성 문제는 해결했지만, 트래픽이 본격적으로 늘어나면 예약 슬롯 테이블 도입과 또 다른 방식의 동시성 제어가 필요할 것으로 예상된다. 그건 그때! 생각하자.
이번 경험을 통해 **"지금 해결해야 할 문제"와 "나중에 해결할 문제"를 구분하는 것**도 중요한 역량이라는 것을 가장 많이 느꼈다.
