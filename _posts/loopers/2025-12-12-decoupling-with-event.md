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
series_order: 8
toc: true
toc_sticky: true
---

## TL;DR

- **Command vs Event**: Command는 "너 이거 해", Event는 "나 이런 일 있었어"
- **트레이드오프**: 결합도와 확장성을 얻는 대신, 추적과 정합성 관리가 어려워진다
- **주의**: AFTER_COMMIT + @Transactional 조합 시 `REQUIRES_NEW` 필수

---

## 들어가며

쿠폰 서비스가 느려지면 주문도 느려져야 할까? 데이터 플랫폼 전송이 실패하면 주문도 롤백해야 할까?

진행 중인 이커머스 프로젝트의 주문 트랜잭션이 점점 커지고 있었다. 처음엔 단순한 주문 트랜잭션에 쿠폰 사용, 로깅 등 여러 요구사항이 추가되면서 어느새 하나의 트랜잭션에서 너무 많은 일을 하고 있었다.

이번 글에서는 Spring ApplicationEvent를 활용해 핵심 로직과 후속 로직을 분리한 과정을 정리했다. 이벤트를 처음으로 사용하여 느슨한 결합을 시도해본 경험을 공유하고자 한다.

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

도메인 엔티티에서는 이렇게 사용한다.

```java
// domain layer
public class Payment {
    public void complete() {
        this.status = PaymentStatus.COMPLETED;
        Events.raise(PaymentCompletedEvent.of(this));
    }
}
```

> **💡 다른 방식**: EventPublisher 인터페이스를 도메인에 두고 구현체를 인프라에 두는 DIP 방식도 있다. Spring 의존성을 도메인에서 완전히 분리하고 싶을 때 유용하다.

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

쿠폰 사용이 실패해도 주문은 이미 커밋되어 있다. 쿠폰 실패는 별도로 복구하면 한다.

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

`@Async` 덕분에 좋아요 등록 응답이 빨라지고, 카운트는 잠시 후 반영된다. 이것이 **Eventual Consistency**다.


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

실무에서나 사이드 프로젝트에서는 거의 혼자 개발하고, 트래픽도 적기 때문에 이벤트의 필요성을 크게 체감하지 못했다.

이벤트의 필요성을 더 직접적으로 느끼려면 성능 테스트를 해본다든지, 아예 도메인을 분리해서 이벤트 방식의 장점을 체감해보는 것도 방법일 것 같다.

시간이 허락한다면 직접 해보면서 왜 다들 이벤트 방식을 사용하는지 조금 더 알아봐야겠다.
