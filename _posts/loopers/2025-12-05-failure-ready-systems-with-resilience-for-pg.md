---
title: "외부 시스템이 죽어도 우리는 살아야 한다 — CircuitBreaker로 회복 탄력성 확보하기"
description: "외부 시스템은 언제든 느려지고, 언제든 죽는다. SLO를 기준으로 Timeout과 CircuitBreaker를 설정하고, 장애 전파를 막는 방법을 정리했다."
categories:
  - 루퍼스
tags:
  - Resilience
  - CircuitBreaker
  - Timeout
  - Fallback
  - PG연동
  - 이커머스
series: loopers-ecommerce
series_order: 6
toc: true
toc_sticky: true
image: /assets/img/thumbnail/failure-ready-systems-with-resilience-for-pg.jpeg
---

## TL;DR

1. **SLO을 먼저 고민하자** — "사용자가 서비스를 사용할 때 얼마나 기다릴 수 있을까"를 고민하고, 그 값을 기준으로 Timeout과 CircuitBraker 설정값을 정한다.
2. **Slow Call도 에러만큼 위험하다** — 지연은 스레드 고갈로 이어지고, 연쇄 장애를 유발할수 있다. 평소에 TPS/응답 시간을 모니터링하고, API가 느려지는 것에 예민하게 반응할 수 있게 대비를 해야한다.
3. **외부 시스템은 믿지 않는다** — 외부시스템은 언제든 느려지고, 언제든 죽을 수 있다는 사실을 계속 인지한다.

---

## 들어가면서

갑자기 다음 지도나 토스 결제 같은 외부 시스템에 장애가 나면 과연 우리들의 서비스는 괜찮을까?

지난 9월 [다음 우편번호 검색 장애](https://github.com/daumPostcode/QnA/issues/1443)가 발생했다.

이 장애의 영향으로 약 1시간 동안, '모비닥' 서비스를 사용하는 환자분들 중 일부께서 진료를 신청하지 못하는 불편함을 겪으셨다.

만약 우편번호 검색 외부시스템이 장애가 발생할 수 있다는 것을 충분히 인지하고, 진료 시 주소를 필수 입력값으로 두지 않았다면 서비스 사용자들이 큰 불편함을 느끼지 못했을 것이다.

외부 시스템도 시스템이기 때문에, 느려지기도 하고 심지어는 응답을 안 주기도 한다. 그렇기 때문에 **느려지거나 죽어도 우리 서비스는 버틸 수 있도록 적절한 안전장치들이 잘 마련되어 있어야 한다.**

이번 글에서는 이런 상황을 대비할 수 있는 Resilience가 무엇인지, 그리고 Timeout·Circuit Breaker·Fallback으로 어떻게 외부 장애로부터 우리 시스템을 보호하는지 정리했다.

---

## Resilience란?

> re·sil·ience
>
> 1. (충격·부상 등에서의) 회복력
> 2. 탄성(彈性), 탄력
>
> — 네이버 영어 사전

시스템에서 Resilience(회복 탄력성)란, **장애가 발생해도 빠르게 정상으로 회복하는 능력**을 말한다.

그렇다면 시스템의 회복 탄력성이 안 좋을 때는 언제 일까?
외부 시스템 장애에 대한 적절한 대비책이 없을 때 이다. 그 이유는 장애 원인 파악, 복구도 우리가 직접 할 수 없기 때문이다.
그래서 외부 시스템 연동 시에는 Resilience 설계가 꼭 필요하다.

### 장애는 전파된다 — 그래서 막아야 한다

외부 PG사에 결제 요청을 보내는 API가 느려졌다고 가정해보자.
응답 지연은 스레드 점유 시간 증가로 이어진다. 사용 가능한 스레드가 하나둘씩 줄어들어 고갈되면, 다른 API 요청을 처리할 스레드마저 없어진다.

PG 하나가 느려졌을 뿐인데, 상품 조회 API까지 멈출 수 있다. 외부 장애가 내부로 **전파**되는 것이다.

```
PG 응답 지연 → 스레드 점유 시간 증가 → 스레드 풀 고갈 → 다른 API도 응답 불가 → 전체 장애
```

그렇다면 어떻게 대비해야 할까? 크게 세 가지 전략이 있다.

| 전략     | 설명                      | 예시                       |
| -------- | ------------------------- | -------------------------- |
| **감지** | 문제를 빨리 알아챈다      | Timeout으로 지연 감지      |
| **차단** | 장애가 번지지 않게 막는다 | CircuitBreaker로 호출 차단 |
| **대응** | 실패 시 대안을 제공한다   | Fallback으로 기본값 반환   |

---

## Resilience4j로 구현하기

그렇다면 감지/차단/대응을 실제로 어떻게 구현할까?

[Resilience4j](https://resilience4j.readme.io/docs/getting-started)는 함수형 프로그래밍을 위해 설계된 경량 장애 허용(fault tolerance) 라이브러리다.
메서드나 람다에 `CircuitBreaker`, `RateLimiter`, `Retry`, `Bulkhead` 같은 데코레이터를 붙여서 장애에 대응할 수 있게 해준다.

그 중 이번 글에서는 핵심적인 세 가지 모듈을 살펴보았다.

| 모듈               | 역할              | 앞서 말한 전략 |
| ------------------ | ----------------- | -------------- |
| **TimeLimiter**    | 응답 시간 제한    | 감지           |
| **CircuitBreaker** | 장애 시 호출 차단 | 차단           |
| **Fallback**       | 실패 시 대안 제공 | 대응           |

> Resilience4j에는 `Bulkhead`(동시 호출 수 제한), `RateLimiter`(초당 호출 수 제한) 같은 모듈도 있다. 이 글에서는 다루지 않는다.

### 1. TimeLimiter — 기다림의 끝을 정한다

프로그램을 실행했는데 로딩이 5분, 10분째 계속된다. "곧 되겠지" 하면서 기다리다 보면 끝이 없다.

Timeout은 **"느리면 버린다"**는 원칙이다. 임계 시간을 넘기면 기다리지 않고 바로 실패 처리한다. 그래야 스레드가 다른 요청을 처리할 수 있다.

Timeout은 크게 두 종류로 나눌 수 있다.

- **Connection Timeout**: 서버와 연결을 맺는 데 걸리는 최대 시간. 전화로 치면 "연결 중..." 상태를 얼마나 기다릴지 정한다.
- **Read Timeout**: 연결 후 응답을 받는 데 걸리는 최대 시간. 전화가 연결됐는데 상대방이 말을 안 할 때 얼마나 기다릴지 정한다.

### 2. Circuit Breaker — 안 받는 전화는 나중에 건다

계속 안 받는 사람에게 전화를 거는 건 시간 낭비다. 몇 번 시도해보고 안 되면 "나중에 다시 걸어야지" 하고 포기하는 게 합리적이다.
Circuit Breaker을 활용하면 외부 시스템이 우리의 요청에 정상적인 응답을 하지 못하면, 일정 시간 동안 요청 자체를 보내지 않는다.

![circuit_breaker_operation](/assets/img/2025-12-05-failure-ready-systems-with-resilience-for-pg/circuit_breaker_operation.png)

- **CLOSED** (정상): 요청이 정상적으로 전달된다. 실패가 임계치를 넘으면 OPEN으로 전환.
- **OPEN** (차단): 요청을 보내지 않고 즉시 실패 처리한다. 일정 시간이 지나면 HALF_OPEN으로 전환.
- **HALF_OPEN** (테스트): "복구됐나?" 확인차 몇 건만 보내본다. 성공하면 CLOSED, 실패하면 다시 OPEN.

### 3. Fallback — 전화가 안 되면 문자라도

전화가 안 될 때 문자로라도 연락하는 것처럼, Fallback은 **실패 시 대안을 제공**한다.

예를 들어, 외부 추천 시스템이 죽었을 때:

- Fallback 없음 → 흰 화면
- Fallback 있음 → 미리 준비된 인기 상품 목록

이렇게 대비책이 있으면 외부 장애가 나더라도 사용자는 "에러 화면" 대신 "차선의 결과"를 보게 된다.

---

## 이커머스 PG 연동에서 Resilience 설정

TimeLimiter, CircuitBreaker, Fallback을 어떻게 설정하면 좋을까? "타임아웃 10초, 실패율 10%"로 간단하게 정할 수 있을까?

근거 있는 설정값을 정하려면 먼저 **SLO**(Service Level Objective)가 필요하다. SLO는 "결제 API는 10초 내 응답"처럼 서비스 품질에 대한 내부 목표다. 이 기준이 있어야 적절한 타임아웃과 실패율 임계치 등을 계산할 수 있다.

### 1. SLO 먼저

이번 이커머스 프로젝트에서 가정한 트래픽 패턴이다.

| 항목              | 값                  |
| ----------------- | ------------------- |
| 평균 TPS          | 100                 |
| 피크 TPS          | 200~300 (점심/저녁) |
| 새벽 TPS          | 10 (평균의 10%)     |
| 결제 p99 응답시간 | 5초                 |

#### 결제 SLO는 10초

PG사마다 권장 타임아웃이 다르다. 카카오페이는 최소 12초, 토스페이먼츠는 초기 30초를 권장한다.
결제는 "빠른 실패"보다 "성공"이 중요하다. 타임아웃을 너무 짧게 잡으면 정상 결제도 끊어버릴 수 있다.

이번 프로젝트에서는 **결제 API SLO를 10초**로 정했다. PG 시뮬레이터가 1~5초사이의 응답지연이 있었고, 충분한 버퍼 시간을 더해 SLO를 결정하였다.

> 내부 로직(1초) + 버퍼(1초) + PG 호출(5초) + 버퍼(1초) + 여유(2초) = **10초**

#### 시스템별 SLO

PG, DB, Redis는 역할과 장애 특성이 다르다. 각각에 맞는 SLO가 필요하다.

| 대상      | 역할                                  | 방향                     |
| --------- | ------------------------------------- | ------------------------ |
| **PG**    | 결제 처리. 실패하면 매출 손실         | 넉넉하게. 성공이 최우선  |
| **DB**    | 핵심 저장소. 장애 시 전체 서비스 중단 | 짧게. 빨리 실패하고 복구 |
| **Redis** | 캐시. 없어도 서비스는 동작해야 함     | 매우 짧게. 없으면 bypass |

**설정값에 정답은 없다.** 처음에는 보수적으로 시작하고, 모니터링하며 최적의 값을 찾아가면 된다.

### 2. Timeout 설정

#### connect-timeout: 3초

TCP 연결은 보통 수십~수백ms면 된다. 1초로 잡으면 네트워크 지연에 너무 민감해서 3초로 설정했다. 충분한 버퍼를 확보하면서도 장애 시 빠르게 감지할 수 있다.

#### read-timeout: 10초

PG사마다 권장이 다르다. 카카오페이는 최소 12초, 토스페이먼츠는 초기 30초를 권장한다. 결제는 "빠른 실패"보다 "성공"이 중요하다고 생각해서 보수적으로 10초를 선택했다.

#### timelimiter: 12초

read-timeout보다 2초 더 길게 잡았다. 둘이 같으면 어느 쪽이 먼저 끊을지 race condition이 생길 수 있어서, 정상적으로는 read-timeout이 먼저 동작하고 timelimiter는 예비 안전망으로 남겨뒀다.

#### DB connection-timeout: 3초

DB는 장애 시 서킷을 열어봤자 의미가 없다고 생각했다. DB 없이는 서비스가 불가능하기 때문이다. 대신 HikariCP의 connection-timeout을 3초로 설정해서 커넥션 풀 고갈 시 빠르게 실패하도록 했다.

#### Redis timeout: 500ms

Redis는 캐시다. 없어도 서비스는 동작해야 한다. 정상 응답은 수~수십ms이므로, 500ms로 잡았다. 이보다 느리면 캐시 효과가 없다.

### 3. Retry 설정

결제에서 재시도는 꼭 필요할까? 아래와 같은 이유로 재시도를 설정하지 않았다.

우선 재시도 비용이 크다고 생각했다.
단순하게 생각하면, 재시도 횟수 × 타임아웃 ≤ SLO여야 한다. SLO 10초에 타임아웃 5초면 재시도는 1회가 한계다.
그다음으로 결제는 재시도보다 **느리더라도 한 번에 성공**하는 것이 중요하다고 판단했다.
만약 결제에 실패하더라도 별도의 스케줄러가 복구하거나, 사용자가 다시 시도하면 된다.

결제에서 재시도는 신중해야 한다. Read 타임아웃이 발생했더라도 PG에서는 이미 결제가 성공했을 수 있다. 이 상태에서 재시도하면 중복 결제가 발생한다. 멱등키로 방어할 수 있지만, 모든 PG가 멱등키를 지원하는 건 아니다.

반면 재시도가 적절한 경우도 있다. 읽기 작업이나 멱등한 작업과 같이 재시도를 해도 문제가 없는 경우가 그렇다.

### 4. CircuitBreaker 설정

CircuitBraker에는 다양한 설정값이 있다.

| 설정                                    | 의미                                          | 기본값        |
| --------------------------------------- | --------------------------------------------- | ------------- |
| `slidingWindowType`                     | 호출 기록 방식 (`COUNT_BASED` / `TIME_BASED`) | `COUNT_BASED` |
| `slidingWindowSize`                     | 슬라이딩 윈도우 크기 (횟수 또는 초)           | 100           |
| `failureRateThreshold`                  | 실패율이 이 값 이상이면 서킷 `OPEN`           | 50%           |
| `slowCallDurationThreshold`             | 이보다 느리면 Slow Call로 판단                | 60초          |
| `slowCallRateThreshold`                 | Slow Call 비율이 이 값 이상이면 서킷 `OPEN`   | 100%          |
| `minimumNumberOfCalls`                  | 실패율 계산 전 필요한 최소 호출 수            | 100           |
| `waitDurationInOpenState`               | `OPEN` 상태 유지 시간 (이후 `HALF_OPEN`)      | 60초          |
| `permittedNumberOfCallsInHalfOpenState` | `HALF_OPEN`에서 허용하는 호출 수              | 10            |
| `recordExceptions`                      | 실패로 기록할 예외 목록                       | 비어있음      |
| `ignoreExceptions`                      | 무시할 예외 목록 (실패로 카운트 안 함)        | 비어있음      |

#### 주요 설정 판단 근거

결제 시스템 특성에 맞게 CircuitBraker의 설정값을 조정해 주었다.

**관찰 범위**

**1. `slidingWindowType` — 시간 기준인가, 횟수 기준인가**

`COUNT_BASED`는 "최근 N건"을, `TIME_BASED`는 "최근 N초"를 본다. 이커머스는 새벽과 피크 시간의 트래픽 차이가 크다. `COUNT_BASED`를 쓰면 새벽에는 100건이 쌓이는 데 한참 걸리고, 피크에는 순식간에 넘어간다.

`TIME_BASED`를 선택했다. 30초라는 윈도우가 트래픽에 관계없이 일정하게 유지되기 때문이다.

**2. `slidingWindowSize` — 얼마나 긴 시간을 볼 것인가**

CircuitBreaker가 장애를 판단하려면 "최근 상황"을 봐야 한다. 이 윈도우가 너무 짧으면 순간적인 오류에도 서킷이 열리는 **플래핑(flapping)** 현상이 생긴다. 반대로 너무 길면 실제 장애를 감지하는 데 시간이 걸린다.

30초를 선택했다. TPS 100 기준으로, 새벽 저트래픽 시간에도 300건 정도 샘플이 쌓이고, 피크 시간에는 더 많은 데이터로 정확히 판단할 수 있다. 10초는 플래핑 위험이 있고, 60초는 장애 감지가 늦어진다.

**3. `minimumNumberOfCalls` — 최소 몇 건을 본 후 판단할 것인가**

서버 시작 직후 5건 중 3건이 실패했다고 바로 서킷을 열기엔 이르다.

10건을 선택했다. TPS 100 기준으로 0.1초면 충족되므로 정상 운영에는 영향이 없고, 서버 시작 직후의 섣부른 판단을 막을 수 있다.

**장애 판단**

**4. `failureRateThreshold` — 실패율이 몇 퍼센트면 서킷을 열 것인가**

이 값이 너무 낮으면 일시적 오류에도 서킷이 열리고, 너무 높으면 실제 장애 상황에서도 요청을 계속 보내게 된다.

30%를 선택했다. 30초 윈도우에서 300건 중 90건이 실패한다면, 3건 중 1건이 실패하는 셈이다. 이 정도면 심각한 문제가 발생했다고 판단할 수 있다. 10%는 너무 민감하고, 50%는 이미 사용자 절반이 피해를 본 후다.

**5. `slowCallDurationThreshold` — 느린 호출의 기준**

Timeout까지 가지 않았지만 "비정상적으로 느린" 호출도 장애의 전조일 수 있다.

6초를 선택했다. 결제 API의 p99 응답 시간(5초)에 20% 버퍼를 더한 값이다. 중요한 점은 **`slowCallDurationThreshold`가 `timelimiter`(12초)보다 작아야 한다**는 것이다. 그래야 타임아웃 전에 "느려지고 있다"는 신호를 잡을 수 있다.

**6. `slowCallRateThreshold` — 느린 호출이 몇 퍼센트면 장애인가**

`slowCallDurationThreshold`를 넘은 호출이 이 비율 이상이면 서킷이 열린다.

1.3%를 선택했다. 정상 상태에서 p99 밖의 호출은 약 1%이므로, 30% 버퍼를 더한 값이다. Slow Call은 스레드 고갈로 이어질 수 있어서 민감하게 잡았다.

**복구 설정**

**7. `waitDurationInOpenState` — 서킷이 열린 후 얼마나 기다릴 것인가**

서킷이 `OPEN` 상태가 되면 요청을 차단한다. 하지만 언젠가는 외부 시스템이 복구됐는지 확인해야 한다. 이 설정은 얼마나 기다리고 다시 `HALF_OPEN` 상태로 전환할 것인가를 결정한다.

5초를 선택했다. 30초 윈도우 내에서 최대 6번의 복구 시도가 가능하다. 1초는 아직 복구 중인 PG에 부하를 주고, 10초는 이미 복구됐는데도 한참을 기다리게 된다.

**8. `permittedNumberOfCallsInHalfOpenState` — 복구 확인에 몇 건을 보낼 것인가**

`HALF_OPEN` 상태에서 허용하는 호출 수다. 이 호출들이 성공하면 서킷이 닫히고, 실패하면 다시 열린다.

3건을 선택했다. 1건은 우연한 성공/실패에 흔들릴 수 있고, 10건은 복구 확인에 너무 오래 걸린다.

#### 최종 설정값 정리

| 설정                                    | 기본값        | 내 설정            |
| --------------------------------------- | ------------- | ------------------ |
| `slidingWindowType`                     | `COUNT_BASED` | `TIME_BASED`       |
| `slidingWindowSize`                     | 100           | 30초               |
| `failureRateThreshold`                  | 50%           | 30%                |
| `slowCallDurationThreshold`             | 60초          | 6초                |
| `slowCallRateThreshold`                 | 100%          | 1.3%               |
| `waitDurationInOpenState`               | 60초          | 5초                |
| `minimumNumberOfCalls`                  | 100           | 10                 |
| `permittedNumberOfCallsInHalfOpenState` | 10            | 3                  |
| `recordExceptions`                      | 비어있음      | 5xx, 429           |
| `ignoreExceptions`                      | 비어있음      | 400, 401, 403, 404 |

> **`recordExceptions` vs `ignoreExceptions`**
>
> - 5xx, 429 → 서버/인프라 문제. 재시도하면 성공할 수도 있다. 실패로 기록
> - 4xx → 클라이언트 잘못. 재시도해도 똑같이 실패. 무시

#### 실제 코드

**application.yml**

```yaml
spring:
  cloud:
    openfeign:
      circuitbreaker:
        enabled: true
      client:
        config:
          pg-client:
            connect-timeout: 3000 # 3초
            read-timeout: 10000 # 10초

resilience4j:
  circuitbreaker:
    instances:
      pg-client:
        # 관찰 범위
        sliding-window-type: TIME_BASED
        sliding-window-size: 30           # 30초 윈도우
        minimum-number-of-calls: 10       # 최소 10건 후 판단
        # 장애 판단
        failure-rate-threshold: 30        # 30% 실패 시 OPEN
        slow-call-duration-threshold: 6s  # 6초 이상이면 Slow Call
        slow-call-rate-threshold: 1.3     # Slow Call 1.3% 이상 시 OPEN
        # 복구 설정
        wait-duration-in-open-state: 5s   # 5초 후 HALF_OPEN
        permitted-number-of-calls-in-half-open-state: 3
        ignore-exceptions:
          - feign.FeignException$BadRequest # 400
          - feign.FeignException$Unauthorized # 401
          - feign.FeignException$Forbidden # 403
          - feign.FeignException$NotFound # 404
  timelimiter:
    instances:
      pg-client:
        timeout-duration: 12s # read-timeout + 여유
```

**FeignClient + FallbackFactory**

```java
@FeignClient(
    name = "pg-client",
    url = "${pg-client.base-url}",
    fallbackFactory = PgClientFallbackFactory.class
)
public interface PgClient {

  @PostMapping("/api/v1/payments")
  PgPaymentResponse requestPayment(
      @RequestHeader("X-USER-ID") String userId,
      @RequestBody PgPaymentRequest request
  );
}
```

OpenFeign + Resilience4j 조합에서는 `@FeignClient`에 `fallbackFactory`만 지정하면 CircuitBreaker가 자동 적용된다. 별도 `@CircuitBreaker` 어노테이션이 필요 없다.

```java
@Component
public class PgClientFallbackFactory implements FallbackFactory<PgClient> {

  @Override
  public PgClient create(Throwable cause) {
    return new PgClient() {
      @Override
      public PgPaymentResponse requestPayment(String userId, PgPaymentRequest request) {
        // 서킷 Open 또는 Timeout 시 실행되는 fallback
        throw new PgRequestFailedException(
            "PG 결제 요청 실패: " + cause.getMessage(),
            cause
        );
      }
    };
  }
}
```

**@CircuitBreaker 어노테이션 직접 사용 (Redis 예시)**

OpenFeign이 아닌 경우에는 `@CircuitBreaker` 어노테이션을 직접 사용한다.

```java
@Component
public class ResilientCacheTemplate implements CacheTemplate {

  private final RedisCacheTemplate delegate;

  @Override
  @CircuitBreaker(name = "redis-cache", fallbackMethod = "getFallback")
  public <T> Optional<T> get(CacheKey<T> cacheKey) {
    return delegate.get(cacheKey);
  }

  // fallback 메서드: 서킷 Open 시 빈 값 반환
  private <T> Optional<T> getFallback(CacheKey<T> cacheKey, Throwable t) {
    log.warn("Redis 서킷 Open, fallback: key={}", cacheKey.key());
    return Optional.empty();
  }
}
```

---

## 끝으로

이번 PG 연동을 구현하면서 '회사에서 개발하고 있는 서비스는 외부 시스템 장애로부터 안전한가?'라는 생각이 들었다. 최근 실무에서 외부 AI에게 분석을 요청하는 기능을 구현했는데, 서킷브레이커를 달긴 했지만 SLO 정의 없이 기본값을 그대로 사용했다.

이번 학습을 통해 외부 시스템 장애에 대한 대비가 부족했다는 걸 느꼈다. 앞으로는 다음 세 가지를 기억하려 한다.

1. **SLO 먼저** — "사용자가 몇 초까지 기다릴 수 있는가?"부터 정의한다. 기준이 있어야 근거 있는 설정이 가능하다.
2. **Slow Call도 에러다** — 지연은 스레드 고갈로 이어지고, 연쇄 장애를 유발한다.
3. **외부 시스템은 믿지 않는다** — 언제든 느려지고, 언제든 죽을 수 있다.

---

## 참고

- [Resilience4j - Getting Started](https://resilience4j.readme.io/docs/getting-started)
- [Resilience4j - CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker)
- [배민 테크 블로그 - PG 장애 대응](https://techblog.woowahan.com/15236/)
- [올리브영 테크 블로그 - CircuitBreaker](https://oliveyoung.tech/2023-08-31/circuitbreaker-inventory-squad/)
