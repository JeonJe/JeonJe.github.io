---
title: "비관적 락 vs 낙관적 락: 이름부터 알아보며 상황에 맞게 선택하기"
description: "낙관적/비관적 락의 이름 유래부터 동작 방식, 선택 기준까지 정리. 1979년 Kung & Robinson 논문에서 시작된 개념을 바탕으로 포인트 차감과 좋아요 기능 구현 시 어떤 락을 선택했는지 실무 관점에서 공유합니다."
categories:
  - 데이터베이스
tags:
  - 낙관적 락
  - 비관적 락
  - 동시성 제어
  - JPA
  - MySQL
  - InnoDB
toc: true
toc_sticky: true
image: /assets/img/thumbnail/optimistic-vs-pessimistic-lock.png
---

## TL;DR

- 낙관적/비관적이라는 이름은 **충돌에 대한 태도**에서 유래했다.
- 낙관적 락: 충돌은 드물다고 보고 **검증 + 롤백** 비용을 감수하는 방식.
- 비관적 락: 충돌을 전제로 **미리 잠그고 줄 세우는** 방식.
- 선택 기준은 단순히 충돌 빈도뿐 아니라 **실패 허용 여부, 트랜잭션 길이, 재시도 비용**까지 함께 봐야 한다.

---

## 들어가면서

이커머스 시스템에서 재고, 포인트, 좋아요 같은 영역은 동시에 여러 요청이 몰리면서 동시성 문제가 자주 발생한다.

최근 재고 차감과 좋아요 기능을 구현하면서 **"동시에 100개 요청이 들어오면 어떻게 제어하지?"**라는 고민이 생겼다. 비관적 락, 낙관적 락이라는 해결 방법 자체는 대략 알고 있었지만, 어떤 상황에서 어떤 락을 써야 할지 기준이 전혀 없었다. 게다가 두 락을 학습하면서 항상 드는 생각은 **"왜 이름이 이렇지?"**였다.

'낙관적 락', '비관적 락'이라는 용어 자체가 생소했고, 특히 **"낙관적인데 왜 락이지?"** 같은 의문이 들었다.

이런 궁금증에서 시작해서, 이번 글에서는
- 왜 '비관적/낙관적'이라는 이름이 붙었는지
- 비관적 락과 낙관적 락이 각각 어떻게 동작하는지
- 어떤 기준으로 락을 선택하면 좋을지

를 정리해 보았다.


## 낙관적 락과 비관적 락 이름의 유래


낙관적 락, 비관적 락... 솔직히 이름부터 좀 거리감이 느껴지지만, 그래도 백엔드 개발자라면 무조건 알아야 하는 개념이다.
그래서 **누가, 언제, 왜 이런 이름을 붙였는지**부터 살펴보았다.


### 1. 낙관적 락(Optimistic Lock)

**"낙관적 동시성 제어(Optimistic Concurrency Control)"**라는 개념과 용어는 출처가 꽤 명확하다.
1979년, **H. T. Kung(하워드 쿵)**과 **John T. Robinson(존 로빈슨)**이
Very Large Data Bases(VLDB) 학회에서 발표한 논문 *「On Optimistic Methods for Concurrency Control」*에서 처음 등장했다.

이 논문은 데이터베이스 트랜잭션에서 **락(lock)을 최대한 쓰지 않고도 동시성을 제어하려는 두 가지 방법**을 제안하는데,
핵심은 기존의 락 기반(conservative) 방식과 달리:

> **"충돌이 자주 일어나지 않을 거라고 일단 믿고,
> 트랜잭션은 그냥 실행한 뒤,
> 맨 마지막에 한 번에 검증해서 문제가 있으면 그때 되돌리자"**는 접근이다.

논문에서는 이 방식을 왜 *"optimistic(낙관적)"*이라고 부르는지 직접 이렇게 설명한다.

> "These methods are "optimistic" in the sense that they rely for efficiency on the hope that conflicts between transactions will not occur."
> 이 방법들은 **트랜잭션 간의 충돌이 일어나지 않을 것이라는 '희망(hope)'에, 효율성을 의존한다**는 점에서 "낙관적"이다.

정리하면, **"낙관적"**이라는 이름은

> **"충돌은 드물 거라고 믿고(hoping), 락 대신 '검증 + 롤백'에 베팅하는 방식"**

이라는 이 방법론의 철학을 그대로 담고 있다.

이 논문에서 제안한 방식은 이후 데이터베이스/트랜잭션 이론에서
**Optimistic Concurrency Control(OCC)** 라는 이름으로 정리되었고,
애플리케이션 레벨에서는 버전 필드나 상태 컬럼을 활용한
**"낙관적 락(Optimistic Lock)"** 패턴으로 이어졌다.


### 2. 비관적 락(Pessimistic Lock)

반대로 **비관적 락**은 명확한 출처를 찾기 어렵다.

1970년대부터 데이터베이스 세계에서는 이미 **락 기반 동시성 제어**가 표준처럼 쓰이고 있었지만,
당시에는 그냥 "락킹(locking)"이나 "2PL(Two-Phase Locking)"로만 불렀다.

그러다 1979년 Kung & Robinson이 'optimistic'이라는 용어를 도입하면서,
기존 락 기반 방식은 자연스럽게 **pessimistic concurrency control**, **pessimistic locking**이라 불리게 되었다.

즉, 새로 등장한 "낙관적" 방법과 **대비되는 개념**으로서
기존 락 방식에 "비관적"이라는 이름이 붙은 셈이다.


### 3. 이름에서 보이는 동작의 차이

이제 두 락의 차이를 정리해보자.

| 구분                         | 비관적 락 (Pessimistic Lock)                                                                 | 낙관적 락 (Optimistic Lock)                                                                           |
|----------------------------|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 동시성에 대한 가정 | 어차피 충돌 날 거라고 **비관**함 | 트랜잭션 간 충돌은 **드물 거라고 '희망'하며 낙관**함 |
| 기본 전략                   | **먼저 잠그고 나만 쓰겠다**                                                                 | **일단 다 쓰게 두고, 나중에 검증해서 문제 있으면 되돌리겠다**                                       |
| 제어 방식                   | 읽거나 갱신하기 전에 **락을 잡고**, 다른 트랜잭션은 **대기**시킨 뒤 순서대로 처리           | **버전/조건 비교**로 충돌을 감지하고, 충돌 시 **예외 + 재시도**로 복구                              |
| 비용을 지불하는 위치        | **대기 시간**을 감수하고, 대신 충돌·재시도 비용을 줄임                                      | 평소에는 빠르지만, **충돌이 날 때마다 재시도 비용**을 지불                                           |
| 한 줄 요약 | "불안하니까 **미리 잠그고 안전하게 가자**" | "설마 그렇게 자주 부딪히겠어? **충돌이 드물 거라는 희망에 걸고 먼저 실행하고, 걸리면 그때 책임지자**" |

결국 두 락의 이름은
**"충돌이 얼마나 자주 일어날 거라고 보느냐"**,
**"실패와 재시도를 어느 정도까지 감수하겠느냐"**
에 대한 태도를 담고 있다.


## 낙관적 락

이제 낙관적 락이 실제로 어떻게 동작하는지 살펴보자.

### 1. 개념

낙관적 락의 핵심은 **Compare-And-Set(CAS)** 방식이다.
"먼저 잠그고 대기 비용을 낸다"가 아니라,
"일단 실행해 보고, 마지막에 검증해서 충돌하면 되돌린다"는 접근이다.


### 2. 동작 방식

![낙관적 락 실행 흐름](/assets/img/2025-11-21-optimistic-vs-pessimistic-lock/optimistic_lock_flow.png)
이 그림은 트랜잭션이 조회 → 비즈니스 로직 수행 → 커밋 직전 검증 → 충돌 시 롤백/재시도 순서로 진행되는 낙관적 락의 전체 흐름을 보여준다.

![낙관적 락 동작 예시](/assets/img/2025-11-21-optimistic-vs-pessimistic-lock/optimistic_lock_two_transaction.png)
두 요청이 거의 동시에 들어왔을 때, 먼저 커밋한 트랜잭션만 성공하고 나중 트랜잭션은 버전 충돌로 롤백되는 모습을 시나리오 형태로 표현한 그림이다.

#### UPDATE의 경우
- 트랜잭션 시작 시점에 **스냅샷(버전/상태)** 을 읽는다.
- 비즈니스 로직을 수행한다. (중간에는 서로 부딪혀도 신경 안 씀)
- 커밋 직전에:
    - "지금 DB에 있는 값이, 내가 처음 읽은 값과 아직 같은가?"를 확인한다.
    - 같으면 → **업데이트 허용 (성공)**
    - 누군가 이미 바꿨으면 → **충돌로 판단하고 롤백 / 예외 던짐**

#### INSERT의 경우
- CAS만으로는 커버할 수 없다. (읽을 기존 값이 없으니까)
- 이때는 **DB 제약조건(UNIQUE 등)** 을 활용해서 중복을 감지한다.

#### 충돌 감지 시
- JPA/Hibernate: `OptimisticLockException`
- 유니크 제약 위반: `DuplicateKeyException`

예외를 던지고, **애플리케이션이 재시도 / 포기 / 사용자 안내**를 결정한다.

#### 버전 필드 기반 (@Version)

가장 일반적이고 안전한 방식이다. 테이블에 `version` 컬럼을 추가한다.

> **기술 스택**: 이 글에서는 **JPA와 Spring**을 기반으로 설명한다. 다른 기술 스택에서도 동일한 원리를 적용할 수 있다.

**Entity 구현:**

```java
@Entity
@Table(uniqueConstraints = @UniqueConstraint(
    columnNames = {"user_id", "product_id"}
))
public class ProductLike {
    @Id @GeneratedValue
    private Long id;

    @Version  // 낙관적 락을 위한 버전 필드
    private Long version;

    private Long userId;
    private Long productId;
    
    ...


}
```

**Service 구현 (재시도 전략):**

```java
@Service
@RequiredArgsConstructor
public class ProductLikeService {
    private final ProductLikeRepository productLikeRepository;

    @Retryable(
        retryFor = {OptimisticLockException.class, DuplicateKeyException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 100)
    )
    @Transactional
    public void addLike(Long userId, Long productId) {
        ProductLike like = ProductLike.create(userId, productId);
        productLikeRepository.save(like);
        // JPA가 실행하는 SQL (INSERT):
        // INSERT INTO product_like (user_id, product_id, version, created_at, id)
        // VALUES (?, ?, 0, ?, ?)
        // → UNIQUE 제약 위반 시 DuplicateKeyException
        //
        // UPDATE 시에는:
        // UPDATE product_like SET ... WHERE id = ? AND version = ?
        // → version 충돌 시 OptimisticLockException
    }
}
```

#### SQL 동작 원리

```sql
UPDATE orders
SET total = ?, version = version + 1
WHERE id = ? AND version = ?;
```

- `version`이 일치할 때만 업데이트 수행
- 먼저 커밋된 트랜잭션이 `version`을 증가시키면, 나중 트랜잭션은 WHERE 조건 불일치로 실패
- JPA/Hibernate는 이때 `OptimisticLockException`을 던짐

#### 장점
- `@Version` 애너테이션 하나로 적용 가능
- "동일한 버전만 갱신 허용" 규칙이 명확
- 도메인 상태와 동시성 제어가 분리됨


### 3. 주의할 점

#### 충돌과 재시도

낙관적 락은 "충돌은 드물 것"이라는 가정 위에서 성립한다.
충돌이 발생하면 예외를 던지고 재시도하는 것이 설계에 포함된 정상 흐름이다.

따라서 재시도 전략을 미리 설계해야 한다:
- 재시도 횟수와 백오프(대기 시간) 설정
- 계속 실패 시 사용자 안내 또는 후처리 로직

단, 같은 자원에 요청이 집중되면 충돌 → 재시도 루프에 빠질 수 있다.
재시도 자체가 부하가 되어 상황을 악화시키므로,
이런 구간에서는 비관적 락이나 다른 동시성 제어 방식을 고려해야 한다.


## 비관적 락

앞에서 낙관적 락을 봤으니, 이제는 반대 성향인 **비관적 락**을 정리해보자.


### 1. 개념

낙관적 락이 "충돌은 드물 것"이라고 희망하며 나중에 검증하는 방식이라면,
비관적 락은 "어차피 충돌 날 거니까 미리 막자"라는 태도다.
자원을 먼저 선점해서 다른 트랜잭션이 접근하지 못하게 막고, 작업이 끝나면 락을 해제한다.


### 2. 동작 방식
![비관적 락 동작 방식 흐름 ](/assets/img/2025-11-21-optimistic-vs-pessimistic-lock/pessimistic_lock_flow.png)
이 그림은 트랜잭션이 먼저 레코드에 락을 건 뒤 작업을 수행하고, 커밋 시점까지 다른 트랜잭션을 대기시키는 비관적 락의 처리 흐름을 단계별로 보여준다.

![두 트랜잭션이 동시에 요청했을 때 비관적락 동작 ](/assets/img/2025-11-21-optimistic-vs-pessimistic-lock/pessimistic_lock_two_transaction.png)
두 요청이 동시에 같은 자원을 잡으려 할 때, 먼저 락을 획득한 트랜잭션이 끝날 때까지 나머지가 기다렸다가 순서대로 처리되는 비관적 락의 동작 방식을 시나리오 형태로 표현한 그림이다.

#### SQL 레벨 (FOR UPDATE)

```sql
START TRANSACTION;
SELECT * FROM product WHERE id = 1 FOR UPDATE;
```

- `id = 1` 레코드에 **배타 락(Exclusive Lock)**을 건다
- 다른 트랜잭션은 락이 풀릴 때까지 대기
- COMMIT 또는 ROLLBACK 시 락 해제

#### Spring/JPA 구현

```java
// Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}

// Service
@Component
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    @Transactional  // 필수! 트랜잭션 없으면 락이 즉시 해제됨
    public void decreaseStock(Long productId, int quantity) {
        Product product = productRepository.findByIdForUpdate(productId)
            .orElseThrow(...);

        product.decreaseStock(quantity);
        // 트랜잭션 끝날 때까지 다른 트랜잭션은 대기
    }
}
```


#### 락의 범위

비관적 락은 자원을 선점하므로 락이 어느 범위까지 걸리는지 이해하는 것이 중요하다.
핵심은 **"락은 인덱스 기준으로 범위가 정해진다"**는 점이다.

> **더 알아보기**: InnoDB는 Row Lock, Gap Lock, Next-Key Lock을 인덱스 단위로 사용합니다. 이 메커니즘이 궁금하다면 부록의 "InnoDB 락 메커니즘 이해하기"를 참고하거나, 관련 키워드를 학습해보시면 좋을 것 같습니다.


### 3. 주의할 점

#### 트랜잭션 관리

비관적 락은 트랜잭션 범위 = 락 유지 시간이다.
따라서 트랜잭션 경계와 길이를 신경 써야 한다.

- `@Transactional` 없으면 autocommit으로 락이 즉시 해제됨
- 트랜잭션은 최대한 짧게 유지 (조회 + 필수 UPDATE만)
- 외부 API, 알림 등은 트랜잭션 밖으로 (도메인 이벤트, Outbox 패턴)

트랜잭션이 길어지면 뒤따르는 요청들이 줄줄이 대기하고, 데드락 위험도 증가한다.


## 락 선택 기준

처음에는 "충돌이 많으면 비관적, 적으면 낙관적"이라고 단순하게 생각했다.
하지만 어떤 락을 선택할지는 충돌 빈도 외에도 **실패 허용 여부, 트랜잭션 길이, 재시도/대기 비용**을 함께 고려해야 한다.

최근 커머스 과제에서 포인트 차감과 좋아요를 구현했는데, 이 기준들을 적용해 락 방식을 선택했다.

### 1. 포인트 차감 → 비관적 락

- **실패 허용**: 불가. 주문/결제와 엮인 중요 데이터
- **트랜잭션 길이**: 짧음. 조회 + 차감만
- **비용 선택**: 대기 비용 감수 → 재시도 복잡성 회피

포인트는 "일단 해보고 실패하면 다시"로 접근하기엔 리스크가 크다.
재시도 로직이 주문/결제 흐름과 맞물리면 정합성 문제가 생길 수 있어서, 락 대기 시간을 감수하고 한 번에 안전하게 처리하는 쪽을 택했다.

### 2. 좋아요 → 낙관적 락

- **실패 허용**: 가능. 실패해도 다시 누르면 됨
- **트랜잭션 길이**: 짧음. INSERT만
- **비용 선택**: 재시도 비용 감수 (발생 빈도 낮음)

같은 사용자가 동시에 같은 상품에 좋아요를 누를 확률은 거의 없다.
UNIQUE(user_id, product_id) 제약조건으로 중복을 막고, 제약 위반 시 예외로 처리했다.

"일단 해보고, 실패하면 다시하자"는 접근이다.
Hard Delete로 좋아요를 관리하기 때문에 버전 필드 대신 유니크 제약을 검증 수단으로 삼아 드물게 발생하는 충돌만 예외 처리했다.

비관적 락은 불필요하다고 봤다. 충돌이 거의 없는 연산에 매번 락을 잡고 푸는 비용보다는, 가끔 발생하는 충돌을 예외로 처리하는 쪽을 택했다.

---


이렇게 선택해 보니, 두 락의 차이는 결국 **"실패를 어디서 감지하고, 그 실패를 어떻게 다룰 것인가"**에 대한 설계 차이로 보였다. 포인트는 충돌 가능성을 비관적으로 보고 애초에 막는 쪽을 택했고, 좋아요는 일단 시도해 보고 드물게 실패하면 인정하는 쪽을 택했다.

포인트/좋아요 케이스를 구현하고, 낙관적/비관적 락이라는 이름의 유래까지 거슬러 올라가서 정리해 보니, 단순히 "기술 옵션 하나 더 아는 것"이 아니라 설계 선택지를 하나 더 이해했다는 느낌에 가깝다. 동시성 제어를 위한 방법은 이 두 가지 락 외에도 분산 락, 메시지 큐 기반 처리 등 매우 다양하다.

그래서 앞으로는 이런 중요한 개념들을 그냥 "공식"처럼 외우기보다는,
- 어떤 문제를 풀기 위해 등장했는지
- 어떤 상황에서 쓰는 게 적절한지
- 실제 적용할 때 어떤 점을 주의해야 하는지

를 함께 생각하면서 가져가 보려고 한다.

## 부록

### InnoDB 락 메커니즘 이해하기

#### 핵심: 락은 인덱스 키를 대상으로 건다

InnoDB의 락은 **"인덱스 키(또는 키 범위)"** 에 걸린다.
따라서 **어떤 쿼리가 어떤 인덱스를 타느냐**에 따라 락의 범위가 완전히 달라진다.

InnoDB는 세 가지 방식으로 락을 건다:

**1) Row Lock - 특정 키 하나만 잠금**

가장 좁은 범위의 락이다. 인덱스의 **특정 키 하나만** 잠근다.

```sql
-- PK 인덱스: 1, 5, 10, 20, 30
SELECT * FROM product WHERE id = 10 FOR UPDATE;
```

- **락 대상**: `id = 10` 키만
- **효과**: 다른 트랜잭션은 `id = 10` 키를 수정/삭제/잠금 조회할 수 없다
- **범위**: `id = 5`나 `id = 20`은 자유롭게 수정 가능

---

**2) Gap Lock - 키 사이의 빈 구간 잠금**

키와 키 사이의 **빈 공간(갭)** 을 잠근다. 새로운 `INSERT`를 막기 위한 락이다.

```sql
-- 인덱스 키: 10, 20이 있을 때
-- (10, 20) 구간에 갭 락이 걸림
```

- **락 대상**: `10`과 `20` 사이의 빈 구간
- **효과**: `11 ~ 19` 값은 `INSERT`가 차단된다
- **목적**: 범위 조회 시 "읽은 범위에 새 키가 끼어드는 것(팬텀)" 방지
- **주의**: 범위를 넓게 잡으면 많은 `INSERT`가 막힐 수 있다


**3) Next-Key Lock - 키 + 앞 구간을 함께 잠금**

Row Lock과 Gap Lock을 합친 형태다. **"특정 키 + 그 앞 구간"** 까지 한 번에 잠근다.

```sql
-- 인덱스 키: 10, 20이 있을 때
-- Next-Key Lock on 10
```

- **락 대상**: `id = 10` 키 + `(이전 키, 10)` 구간
- **효과**: `id = 10` 키 수정/삭제 차단 + 그 앞 구간의 `INSERT`도 차단
- **목적**: REPEATABLE READ에서 읽기 일관성과 팬텀 방지를 동시에 달성


#### 왜 이게 중요한가?

인덱스가 없거나 잘못된 인덱스를 타면 **의도보다 훨씬 넓은 범위에 락이 걸린다**.

```sql
-- status에 인덱스가 없다면?
SELECT * FROM orders WHERE status = 'PENDING' FOR UPDATE;
```

→ 테이블 전체에 락이 걸릴 수 있다 (풀스캔)
→ 모든 다른 트랜잭션의 `INSERT`/`UPDATE`가 대기하게 된다
→ **비관적 락을 쓸 때는 반드시 인덱스 설계를 함께 고려해야 한다**


## 참고

- [On Optimistic Methods for Concurrency Control (H. T. Kung, J. T. Robinson, VLDB 1979)](https://dl.acm.org/doi/10.1145/319566.319567) - 낙관적 동시성 제어 개념의 최초 제안
- [MySQL 8.x - InnoDB Locking](https://dev.mysql.com/doc/refman/8.2/en/innodb-locking.html) - Row Lock, Gap Lock, Next-Key Lock 동작 방식
- [MySQL 8.x - InnoDB Index Types](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html) - 클러스터링 인덱스 구조 및 B+Tree 설명
- [Wikipedia - Optimistic Concurrency Control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control) - 낙관적 동시성 제어 개념 정리
- [Wikipedia - Concurrency Control](https://en.wikipedia.org/wiki/Concurrency_control) - 동시성 제어 분류 및 개념
- [Mark-Kim 블로그 - MySQL InnoDB Lock](https://mark-kim.blog/mysql_innodb_lock/) - Record Lock, Gap Lock, Next-Key Lock 한글 설명
