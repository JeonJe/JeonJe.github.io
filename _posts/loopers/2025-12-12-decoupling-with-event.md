---
title: "처음뵙겠습니다 이벤트입니다 — 이벤트 사용의 장단점과 시행착오"
description: "이벤트로 후속 로직을 분리하면서 배운 트레이드오프와 이벤트 테스트 및 AFTER_COMMIT + @Transactional 사용 시행착오 정리하였습니다."
categories:
  - 루퍼스
tags:
  - Event
  - Spring
  - Transaction
  - 이커머스
series: loopers-ecommerce
series_order: 7
toc: true
toc_sticky: true
image: /assets/img/thumbnail/decoupling-with-event.jpg
---

## TL;DR

- **Command vs Event**: Command는 "너 이거 해", Event는 "나 이런 일 있었어"
- **트레이드오프**: 결합도와 확장성을 얻는 대신, 추적과 정합성 관리가 어려워진다
- **주의**: AFTER_COMMIT + @Transactional 조합 시 `REQUIRES_NEW` 필수

---

## 들어가며

쿠폰 서비스가 느려지면 주문도 느려져야 할까? 로깅이 실패했다고 주문까지 롤백해야 할까?

이커머스 프로젝트를 진행하면서 주문 트랜잭션 하나에 너무 많은 책임이 쌓여갔다.

- 주문 생성
- 재고 차감
- 쿠폰 사용
- 포인트 차감
- 로깅

쿠폰 서비스 응답이 지연되면 주문 응답도 느려지고, 로깅 실패 하나에 전체가 롤백되고, 트랜잭션이 길어질수록 재고 락도 오래 잡히는 상황이었다.

이번 글에서는 Spring ApplicationEvent를 활용해 주문 트랜잭션에서 쿠폰, 포인트, 로깅 등을 느슨하게 분리한 과정을 정리했다. 이벤트를 처음 적용해보면서 겪은 시행착오와 배운 점을 공유하고자 한다.



---

## 이벤트란? 왜 써야 할까?

| 구분 | Command | Event |
|------|---------|-------|
| 방향 | "너 이거 해" (수신자 지정) | "나 이런 일 있었어" (발산) |
| 결합도 | 높음 (호출자가 수신자를 앎) | 낮음 (발행자는 구독자를 모름) |
| 확장성 | 호출자 수정 필요 | 핸들러만 추가 |
| 제어 | 순서/롤백 쉬움 | 유실/중복/정합성 고민 필요 |

기존 주문 코드를 돌아보니, 전형적인 **Command 방식**이었다.

```java
// Command 방식: 주문이 모든 후속 처리를 직접 호출
public Order createOrder(...) {
    Order order = orderService.create(...);
    couponService.useCoupon(couponId);        // 쿠폰 사용해!
    dataPlatform.send(order);                  // 로그 보내!
    return order;
}
```

Command는 "누가 무엇을 해야 하는지" 정확히 알고 지시한다. 순서 제어와 실패 시 롤백이 쉽지만, **OrderFacade에서 모든 후속 작업을 알아야 한다**. 새 요구사항이 추가될 때마다 점점 역할이 많아진다.

반면 **Event는 "나 이런 일 있었어"라는 과거의 상태만 알린다**.

```java
// Event 방식: 주문은 자기 할 일만 하고 주문이 생성됐다는 이벤트 발행
public Order createOrder(...) {
    Order order = orderService.create(...);
    eventPublisher.publish(OrderCreatedEvent.of(order));  // 주문 생성됐어!
    return order;
}
```

주문은 쿠폰이 어떻게 처리되는지, 로그가 어디로 가는지 모른다. 관심사가 분리되고, 새 요구사항은 새 핸들러만 추가하면 된다.


### 핵심 로직 vs 후속 로직

그렇다면 모든 걸 이벤트로 바꿔야 할까? 아니다. 이벤트 분리를 결정할 때 고려해야 할 여러 기준들이 있다.

| 기준 | 질문 |
|------|------|----------|------------|
| **롤백 필요성** | 실패 시 메인도 롤백해야 하나?
| **처리량** | 동기로 다 처리 가능한가?
| **장애 격리** | 후속 장애가 핵심을 막아야 하나?
| **도메인 경계** | 같은 bounded context인가?

이번 프로젝트에서 이벤트 분리를 적용한 케이스들이다.

| 케이스 | 핵심 로직 | 후속 로직 | 분리 이유 |
|--------|----------|----------|----------|
| **쿠폰 사용** | 주문 생성 | 쿠폰 상태 변경 | 쿠폰 실패해도 주문은 완료. 수동 복구 가능 |
| **데이터 플랫폼** | 주문/결제 완료 | 로그 전송 | 외부 시스템 장애가 핵심 기능을 막으면 안 됨 |
| **좋아요 집계** | 좋아요 등록 | 카운트 증가 | 집계는 잠시 늦어도 됨|

### 이벤트의 장점과 단점

이벤트가 무조건 좋은 건 아니다. 아래 장단점을 고려해서 적용해야 한다.

**장점**
- 결합도 감소: 주문이 쿠폰/로깅을 몰라도 됨
- 확장성: 새 요구사항은 핸들러 추가로 해결
- 트랜잭션 경계 분리: 후속 로직 실패가 핵심 로직에 영향 없음

**단점**
- 추적 어려움: "이 이벤트 누가 처리하지?" 한눈에 파악이 어려움
- 정합성 고민: Eventual Consistency 수용 필요
- 복구 전략 필요: 서버 장애 등으로 이벤트 유실 시 어떻게 복구할지 고민 필요
- 트랜잭션 복잡도: 분리된 트랜잭션 간 타이밍, 전파 레벨 등 추가 고려 필요

---

## 이벤트 설계하기

이벤트 기반 설계를 적용하려면 이벤트 클래스, 발행자, 핸들러를 어느 레이어에 둘지 결정해야 한다.

| 구성 요소 | 레이어 | 이유 |
|----------|--------|------|
| 이벤트 클래스 | 도메인 | 도메인에서 발생한 사실을 표현 |
| 퍼블리셔 인터페이스 | 도메인 | 도메인이 발행 방법을 알 필요 없음 |
| 퍼블리셔 구현체 | 인프라 | Spring ApplicationEventPublisher 의존 |
| 이벤트 핸들러 | 애플리케이션 | 여러 도메인 서비스 조합 필요 |

### 이벤트는 어디에 둘까?

이벤트는 도메인 레이어에 위치한다. `OrderCompletedEvent`, `PaymentCompletedEvent`처럼 **도메인에서 발생한 사실**을 담는 객체이기 때문이다.

```java
// domain layer
public class PaymentCompletedEvent {
    private final Long orderId;
    private final Long amount;

    public static PaymentCompletedEvent of(Payment payment) {
        return new PaymentCompletedEvent(payment.getOrderId(), payment.getAmount());
    }
}
```

### 이벤트는 어디서 발행할까?

이 프로젝트에서는 `Events`라는 유틸리티 클래스를 만들어 도메인에서 이벤트를 발행했다.

```java
// infrastructure layer
public class Events {
    private static ApplicationEventPublisher publisher;

    public static void raise(Object event) {
        if (publisher != null) {
            publisher.publishEvent(event);
        }
    }
}
```

도메인 엔티티에서는 아래와 같이 사용한다.

```java
// domain layer
public class Payment {
    public void complete() {
        this.status = PaymentStatus.COMPLETED;
        Events.raise(PaymentCompletedEvent.of(this));
    }
}
```

> **💡 다른 방식**: 
> 이 방식은 도메인에서 `Events.raise()`를 호출하면서 `ApplicationEventPublisher`(스프링 이벤트)를 알게 되어 레이어 경계가 흐려지는 단점이 있다.
> 경계를 명확히 하려면 도메인에서는 "이벤트가 발행되었다"는 것만 표현하기 위해 도메인에 EventPublisher 인터페이스를 두고, 실제로 어디로 보낼지는 인프라 레이어에서 결정하는 방식을 사용할 수도 있다.

### 이벤트 핸들러는 어디에 둘까?

핸들러는 애플리케이션 레이어에 둔다. 이벤트를 받아서 여러 도메인 서비스를 조합해 후속 작업을 처리하기 때문이다.

```java
// application layer
@Component
@RequiredArgsConstructor
public class PaymentEventHandler {
    private final OrderService orderService;

    /**
     * 결제 완료 후 주문 상태 변경
     * - AFTER_COMMIT: 결제 트랜잭션 커밋 후 실행
     * - REQUIRES_NEW: 새 트랜잭션에서 실행 (기존 트랜잭션 종료 상태)
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(PaymentCompletedEvent event) {
        orderService.complete(event.getOrderId());
    }
}
```

---

## 이벤트로 도메인 분리하기

### 주문 → 쿠폰 사용 분리

기존에는 주문 생성 시 쿠폰 사용을 동기적으로 처리했다. 쿠폰 서비스가 실패하면 주문도 실패했다.

```java
// Before: 동기 호출
public Order createOrder(OrderCommand command) {
    Order order = orderService.create(command);
    couponService.useCoupon(command.couponId());  // 쿠폰 실패 → 주문 롤백
    return order;
}
```

이벤트로 분리하면 주문은 독립적으로 완료된다.

```java
// OrderService.java - 주문 생성 후 이벤트 발행
public Order create(OrderCommand command) {
    Order order = orderRepository.save(Order.of(...));

    Events.raise(OrderCreatedEvent.of(
        order.getId(),
        order.getUserId(),
        command.couponId(),
        command.pointAmount(),
        LocalDateTime.now(clock)
    ));
    return order;
}
```

```java
// OrderEventHandler.java - 쿠폰 사용 처리
@Async
@TransactionalEventListener(phase = AFTER_COMMIT)
public void handleCouponUsage(OrderCreatedEvent event) {
    if (!event.hasCoupon()) {
        log.debug("[Event:OrderCreated:Coupon] NO_COUPON orderId={}", event.orderId());
        return;
    }

    log.info("[Event:OrderCreated:Coupon] orderId={}, couponId={}",
        event.orderId(), event.couponId());
    couponService.useCoupon(event.couponId(), event.userId(), event.orderId());
}
```

쿠폰 사용이 실패해도 주문은 이미 커밋되어 있다. 쿠폰 실패는 배치 스케줄러로 주기적으로 미사용 쿠폰을 조회해서 재시도하거나, 실패 로그를 기반으로 수동 복구할 수 있다.

### 결제 → 주문 완료 분리

결제가 완료되면 주문 상태를 COMPLETED로 변경해야 한다. 결제 도메인이 주문 도메인을 직접 호출하면 결합도가 높아진다.

```java
// Before: 직접 호출
public void completePayment(Long paymentId) {
    Payment payment = paymentService.complete(paymentId);
    orderService.complete(payment.getOrderId());  // 결제가 주문을 알아야 함
}
```

이벤트로 분리하면 결제는 결제 일만 한다.

```java
// After: 결제 도메인에서 이벤트 발행
public class Payment {
    public void complete() {
        this.status = PaymentStatus.COMPLETED;
        Events.raise(PaymentCompletedEvent.of(this));
    }
}

// 핸들러가 주문 상태 변경
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void handle(PaymentCompletedEvent event) {
    orderService.complete(event.getOrderId());
}
```

결제 도메인은 주문의 존재를 모른다. 새로운 후속 처리가 필요하면 핸들러만 추가하면 된다.

### 좋아요 → 카운트 집계 분리 (Eventual Consistency)

좋아요 등록 시 상품의 좋아요 카운트를 증가시켜야 한다. 하지만 집계는 정확히 실시간일 필요가 없다.

```java
// ProductLikeService.java
public void like(Long userId, Long productId, LocalDateTime likedAt) {
    ProductLike like = ProductLike.of(userId, productId, likedAt);
    productLikeRepository.saveAndFlush(like);
    Events.raise(ProductLikedEvent.of(userId, productId, likedAt));
}
```

카운트 증가는 비동기로 처리한다. `@Async`와 `@TransactionalEventListener`를 조합한다.

```java
// LikeEventHandler.java
@Slf4j
@Component
@RequiredArgsConstructor
public class LikeEventHandler {

    private final ProductService productService;

    @Async
    @TransactionalEventListener(phase = AFTER_COMMIT)
    public void handleProductLiked(ProductLikedEvent event) {
        log.info("[Event:ProductLiked] userId={}, productId={}",
            event.userId(), event.productId());
        productService.increaseLikeCount(event.productId());
    }
}
```

`@Async` 덕분에 좋아요 등록 응답이 빨라지고, 카운트는 비동기로 처리되어 잠시 후 반영된다.


---

## 시행착오와 배운 점

### 비동기 이벤트 테스트 전략

기존에 하나의 트랜잭션으로 묶여 있던 로직을 이벤트 기반으로 분리하면서 비동기 처리가 필요해졌고, 기존 테스트가 깨지는 문제가 발생했다. 테스트 전략을 두 가지로 나눴다.

**단위 테스트**: `verify()`로 이벤트가 발행됐는지 확인

```java
@Test
void 결제_완료시_이벤트_발행() {
    Payment payment = Payment.of(...);
    payment.complete();

    verify(events).raise(any(PaymentCompletedEvent.class));
}
```

**통합 테스트**: 실제 상태 변경을 확인하기 위해 `Awaitility` 사용

비동기 처리가 끝날 때까지 기다려야 하므로 `Awaitility`를 사용했다.

```java
@Test
void 결제_완료시_주문_상태_변경() {
    paymentService.complete(paymentId);

    await().atMost(10, SECONDS).untilAsserted(() -> {
        Order order = orderRepository.findById(orderId);
        assertThat(order.getStatus()).isEqualTo(COMPLETED);
    });
}
```

Awaitility를 적용하고 보니, 시간 기반 대기에 따라 테스트가 성공할 수도 있고 실패할 수도 있지 않을까 하는 고민이 들었다.

현재는 Coderabbit의 코드 리뷰 피드백을 반영하여 10초로 늘려놓은 상태다.

### AFTER_COMMIT + @Transactional = 에러?

`@TransactionalEventListener(phase = AFTER_COMMIT)` 핸들러에 `@Transactional`을 붙이면 아래와 같은 에러가 발생한다.

```java
// 이렇게 하면 에러!
@Async
@TransactionalEventListener(phase = AFTER_COMMIT)
@Transactional  // ← 기본값 REQUIRED
public void handlePaymentSucceeded(PaymentSucceededEvent event) {
    // ...
}
```

```
IllegalStateException: @TransactionalEventListener method must not be annotated
with @Transactional unless when declared as REQUIRES_NEW or NOT_SUPPORTED
```

스프링은 AFTER_COMMIT 리스너를 "트랜잭션의 연장"이 아니라, **트랜잭션 이후의 명시적 후처리 단계**로 취급한다. 이 단계에서 `@Transactional(REQUIRED)`로 트랜잭션을 다시 여는 건 설계 의도가 불분명한 코드로 간주된다.

즉, 기술적 제약이 아니라 **트랜잭션 경계에 대한 의도를 명확히 강제**하기 위함이다.

그래서 스프링은 선택지를 두 개로 제한한다:
- **REQUIRES_NEW**: 새 트랜잭션을 확실히 열겠다
- **NOT_SUPPORTED**: 트랜잭션 없이 실행하겠다

#### 해결책 1: 서비스에 위임 (단순 호출)

서비스 메서드 하나만 호출하는 경우, 핸들러에 `@Transactional`을 붙일 필요가 없다.

```java
@Async
@TransactionalEventListener(phase = AFTER_COMMIT)
public void handleCouponUsage(OrderCreatedEvent event) {
    couponService.useCoupon(event.couponId());  // 서비스가 트랜잭션 관리
}
```

서비스의 `@Transactional`이 새 트랜잭션을 시작한다. 핸들러는 "언제 실행할지"만 담당하고, 트랜잭션 경계는 서비스가 담당하는 구조다.

#### 해결책 2: REQUIRES_NEW (복합 로직)

여러 서비스를 조합해서 하나의 트랜잭션으로 묶어야 하는 경우엔 `REQUIRES_NEW`가 필요하다.

```java
@Async
@TransactionalEventListener(phase = AFTER_COMMIT)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void handlePaymentSucceeded(PaymentSucceededEvent event) {
    // 재고 확인 → 주문 완료 → 재고 차감 (하나의 트랜잭션)
    orderService.completeOrder(event.orderId());
    productService.decreaseStocks(event.orderId());
}
```
결제 후, 주문 완료 처리 → 재고 차감이 **하나의 트랜잭션**으로 묶여 있다.
이때는 `REQUIRES_NEW`로 명시적으로 새 트랜잭션을 열어야 한다.

---

## 끝으로

이벤트로 주문 트랜잭션에서 쿠폰/포인트/로깅 같은 후속 로직을 분리했다.
그 결과 주문이 여러 서비스를 직접 호출하지 않아도 되어 높은 결합도를 낮 출 수 있었고, 후속 로직의 실패가 주문으로 전파되지 않게 되었다.
또한, 트랜잭션이 길어지며 생기던 성능 저하(응답 지연, 락 점유)도 완화됐고, 후속 처리는 별도의 재시도/복구 흐름으로 다룰 수 있게 되었다.

대신 흐름이 분산되면서 추적과 운영 비용이 커졌다. 주문을 만들 때 어떤 후 속 로직이 언제 실행되는지 한눈에 보기 어렵고, “이 이벤트는 누가 처리하 지?”를 찾는 시간이 늘어났다.
또한, 유실/중복 실행을 전제로 멱등성, 재시도/보상 같은 복구 전략이 필요해져서 코드 복잡도가 올라갔다.
그리고 과정이 실제로 잘 동작하는지 확인하기 위한 로그/메트릭/트레이싱 같은 관측성도 함께 챙겨야 한다.

이번에 이벤트를 학습하면서 설계의 선택지가 하나 더 생겼다.
핵심 흐름을 가볍게 유지하면서 후속 처리의 실패 전파를 줄여야 하는 구간, 또는 외부 연 동/집계/로깅처럼 트랜잭션에 묶기 부담스러운 작업이 있을 때는
이제는 하나의 트랜잭션으로 처리하는 방식만 떠올리지 않고, “이건 이벤트로 분리해볼까?”를 먼저 고민할 수 있게 되었다.
