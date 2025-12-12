---
title: "처음뵙겠습니다 이벤트입니다 — 결제·쿠폰 후속 처리를 분리하며 느낀 장점과 단점, 그리고 시행착오"
description: "Spring 이벤트로 핵심 로직과 후속 로직을 분리하면서 배운 것들. BEFORE_COMMIT과 AFTER_COMMIT의 차이, REQUIRES_NEW가 필요한 이유, 그리고 이벤트 기반 설계의 트레이드오프를 정리했습니다."
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

1. **이벤트는 "이미 발생한 사실"을 알리는 신호다** — 발행자는 수신자를 모르고, 덕분에 도메인 간 결합이 끊어진다.
2. **장점**: 핵심 트랜잭션 보호, 결합도 감소, 확장 용이 — 후속 로직이 실패해도 메인은 살아있다.
3. **단점**: 즉시 일관성 포기, 디버깅 어려움, 실패 처리 복잡 — 공짜는 없다.

---

## 들어가며

주문이 성공했는데 쿠폰 차감에서 에러가 나면 어떻게 될까?

기존 코드에서는 주문 생성 트랜잭션 안에서 쿠폰 사용, 포인트 적립까지 한 번에 처리했다. 구현은 단순하지만, 쿠폰 차감이 실패하면 주문까지 롤백된다. 사용자 입장에서 "왜 주문이 안 됐지?"라는 상황이 생길 수 있다.

이번 주에는 이 문제를 이벤트로 해결해봤다. 그 과정에서 이벤트가 뭔지, `BEFORE_COMMIT`과 `AFTER_COMMIT`이 뭐가 다른지, 왜 `REQUIRES_NEW`가 필요한지를 배웠다.

---

## 이벤트란?

이벤트는 "이미 발생한 사실"을 객체로 표현한 것이다.

예를 들어 `OrderCreatedEvent`는 "주문이 생성됐다"는 사실을 담는다. 누가 언제 뭘 주문했는지 정보를 가지고 있고, 이 사실을 다른 곳에 알리는 신호 역할을 한다.

Spring에서는 이렇게 쓴다.

```java
// 이벤트 발행
applicationEventPublisher.publishEvent(new OrderCreatedEvent(order));

// 이벤트 수신
@TransactionalEventListener
public void handle(OrderCreatedEvent event) {
    // 후속 작업 수행
}
```

핵심은 **발행자가 수신자를 모른다**는 점이다. Order 서비스는 "주문이 생성됐다"는 사실만 알리고, 누가 그걸 받아서 뭘 하는지는 관심 없다. 덕분에 Order가 Coupon, Point를 직접 호출하던 의존 관계가 사라진다.

---

## BEFORE_COMMIT vs AFTER_COMMIT

`@TransactionalEventListener`에는 `phase` 옵션이 있다. 이게 핵심이다.

| phase | 실행 시점 | 실패하면? |
|-------|----------|----------|
| `BEFORE_COMMIT` | 메인 트랜잭션 커밋 전 | 메인도 롤백 |
| `AFTER_COMMIT` | 메인 트랜잭션 커밋 후 | 메인은 이미 끝남 |

쉽게 말하면 이렇다.

- `BEFORE_COMMIT`: "같이 죽을 일"
- `AFTER_COMMIT`: "따로 죽어도 되는 일"

쿠폰 차감이 실패했다고 주문까지 롤백되는 게 맞을까? 대부분의 경우 아니다. 주문은 성공시키고, 쿠폰은 나중에 별도로 처리해도 된다. 이런 후속 작업은 `AFTER_COMMIT`으로 분리하면 된다.

---

## 시행착오에서 배운 점

### AFTER_COMMIT에는 REQUIRES_NEW가 필수다

처음에 이렇게 짰다.

```java
@TransactionalEventListener(phase = AFTER_COMMIT)
@Transactional
public void handle(OrderCreatedEvent event) {
    couponService.use(event.getCouponId());
}
```

에러가 터졌다. 왜?

`AFTER_COMMIT`은 메인 트랜잭션이 **이미 커밋된 후**에 실행된다. 그런데 `@Transactional`의 기본값은 `REQUIRED`다. "기존 트랜잭션이 있으면 참여하고, 없으면 새로 만든다"는 뜻이다.

문제는 `AFTER_COMMIT` 시점에 트랜잭션이 "끝났지만 아직 정리 안 된" 상태라는 점이다. `REQUIRED`가 "참여하려고" 시도하다가 터진다.

해결은 간단하다. 새 트랜잭션을 열면 된다.

```java
@TransactionalEventListener(phase = AFTER_COMMIT)
@Transactional(propagation = REQUIRES_NEW)
public void handle(OrderCreatedEvent event) {
    couponService.use(event.getCouponId());
}
```

`REQUIRES_NEW`는 "무조건 새 트랜잭션"이라는 뜻이다. 기존 트랜잭션 상태와 무관하게 독립적으로 시작한다.

### 이벤트 하나는 사실 하나만

결제 성공 후 처리할 일이 많았다. 주문 상태 변경, 재고 차감, 알림 발송 등. 처음에는 하나의 이벤트에서 분기했다.

```java
public void handle(PaymentCompletedEvent event) {
    if (event.getMethod() == CARD) {
        // 카드 결제 후속 처리
    } else if (event.getMethod() == KAKAO_PAY) {
        // 카카오페이 후속 처리
    }
}
```

이렇게 하니까 핸들러가 복잡해졌다. 이벤트 하나가 "여러 의미"를 갖게 된 것이다.

"사실은 사실대로" 이벤트를 쪼개니 깔끔해졌다.

- `PaymentSucceededEvent`: 결제 성공
- `PaymentFailedEvent`: 결제 실패

하나의 이벤트는 하나의 사실만 담는다. 핸들러는 그 사실에 맞는 작업만 수행한다.

---

## 이벤트 기반의 트레이드오프

이벤트로 분리하면 좋은 점만 있을까? 아니다.

### 얻는 것

1. **핵심 로직 보호**: 후속 실패가 메인을 흔들지 않는다.
2. **결합도 감소**: Order가 Coupon을 직접 호출하지 않는다.
3. **확장 용이**: 새 핸들러만 추가하면 기능이 붙는다.

### 잃는 것

1. **즉시 일관성**: 좋아요를 눌러도 카운트가 바로 안 올라갈 수 있다.
2. **디버깅 난이도**: 호출 스택이 끊겨서 흐름 추적이 어렵다.
3. **실패 처리 복잡도**: 재시도, 멱등성 등을 고민해야 한다.

특히 디버깅이 어려워지는 건 진짜다. 이벤트 발행하고 핸들러가 받아서 처리하는 과정이 코드상으로 연결되어 있지 않다. 로그 없이 추적하려면 고생한다. **이벤트를 쓰면 로깅은 필수다.**

---

## 언제 이벤트로 분리할까?

모든 걸 이벤트로 분리할 필요는 없다. 기준은 이거다.

> "후속 로직이 실패해도 메인을 롤백해야 하나?"

- **Yes** → 같은 트랜잭션에 두기 (또는 `BEFORE_COMMIT`)
- **No** → `AFTER_COMMIT`으로 분리

예를 들어:
- 주문 생성 시 재고 차감 → 같이 롤백되어야 함 → 같은 트랜잭션
- 주문 생성 시 알림 발송 → 실패해도 주문은 유효 → `AFTER_COMMIT`

---

## 연습하기

### 주문 생성 → 쿠폰 차감 분리

기존에는 `OrderFacade.createOrder()` 안에서 주문 생성과 쿠폰 차감을 한 트랜잭션에서 처리했다. 쿠폰 서비스가 느려지거나 장애가 나면 주문까지 실패했다.

"쿠폰 차감이 실패해도 주문은 성공해야 하지 않나?" 이 질문에서 시작했다. 답은 Yes였다. 쿠폰은 나중에 별도로 처리하거나, 실패하면 관리자가 수동으로 복구해도 된다. 하지만 주문 자체가 실패하면 사용자는 다시 처음부터 결제해야 한다.

그래서 주문 생성이 커밋된 후 `OrderCreatedEvent`를 발행하고, 쿠폰 차감은 `AFTER_COMMIT` 핸들러에서 처리하도록 바꿨다.

**효과:**
- 쿠폰 서비스 장애가 주문에 영향을 주지 않는다
- 주문 API 응답이 빨라졌다 (쿠폰 처리 시간만큼)
- Order → Coupon 직접 의존이 사라졌다

**단점:**
- 쿠폰 차감이 실패하면 별도로 보상 처리를 해야 한다
- "주문은 됐는데 쿠폰이 안 빠졌어요" 상황이 생길 수 있다

### 결제 완료 → 주문 상태 변경 분리

PG 콜백으로 결제 성공을 확인하면 `PaymentSucceededEvent`를 발행하고, 핸들러에서 주문 상태를 `COMPLETED`로 바꾸도록 했다.

처음에는 `PaymentCompletedEvent` 하나로 성공/실패를 다 담으려 했다. 핸들러에서 `if (event.isSuccess())` 분기가 생겼고, 코드가 복잡해졌다. "이벤트 하나는 사실 하나만"이라는 원칙을 적용해서 `PaymentSucceededEvent`와 `PaymentFailedEvent`로 쪼갰다.

**효과:**
- 핸들러가 단순해졌다 (분기 없이 각자 역할만 수행)
- 새로운 후속 작업 추가가 쉬워졌다 (알림 발송, 포인트 적립 등)

**단점:**
- 이벤트 클래스가 늘어났다
- 어떤 이벤트가 어디서 발행되는지 파악하려면 검색이 필요하다

---

## 마무리

이번 주에 이벤트를 적용하면서 배운 것들을 정리하면:

1. **이벤트는 "이미 발생한 사실"이다** — 명령이 아니라 통지다.
2. **`AFTER_COMMIT`은 메인과 분리된다** — 후속 실패가 메인에 영향 없다.
3. **`REQUIRES_NEW` 없으면 터진다** — 이미 끝난 트랜잭션에 참여하려다 실패한다.
4. **이벤트 하나는 사실 하나만** — if-else 분기가 생기면 이벤트를 쪼개자.
5. **로깅은 필수다** — 호출 스택이 끊기면 추적이 어렵다.

이벤트는 "비동기 기술"이라기보다 **트랜잭션과 책임을 나누는 설계 도구**다. 쓰면 시스템이 느슨해지고 확장하기 쉬워지지만, 그만큼 일관성과 추적 가능성에 대한 책임이 개발자에게 넘어온다.

이번 주의 한 문장:
**"이벤트는 일을 미루는 게 아니라, 책임을 제자리에 돌려놓는 방법이다."**
