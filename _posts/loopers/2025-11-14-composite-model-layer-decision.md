---
title: "여러 도메인을 조합하는 객체, 어느 레이어에 둘 것인가"
description: "여러 도메인을 조합하는 객체를 Domain 레이어에 두었다가 Application 레이어로 옮긴 과정. 도메인 객체와 조회 모델의 경계를 구분하고, 레이어 간 책임을 명확히 분리하는 설계 기준을 정리했습니다."
categories:
  - Java
  - DDD
tags:
  - Domain
  - Application
  - Layer
  - 조합모델
  - 레이어설계
  - 도메인주도설계
toc: true
toc_sticky: true
---

## TL;DR

- 이커머스 시스템에서 "상품 정보 + 부가 정보(브랜드, 좋아요 등)"를 한 번에 내려주는 **조합 조회 기능**을 설계했다.
- 처음에는 이 조합을 담당하는 도메인 객체(예: 상품 상세를 표현하는 `ProductDetail`)를 Domain 레이어에 두고 처리했다.
- 하지만 하나의 도메인에서 다른 도메인의 상세까지 직접 알아야 해서 경계가 흐려져, 결국 이 조합 객체를 **Application 레이어의 조회용 모델**로 올리는 쪽이 더 자연하다고 판단했다.

---

## 들어가며

도메인 주도 설계(DDD)를 처음 적용하다 보면, "이 객체는 어느 레이어에 두어야 할까?"라는 고민을 자주 하게 된다.

특히 여러 도메인의 데이터를 조합해서 화면에 보여주는 경우, 그 조합 객체를 도메인 레이어에 둘지, 애플리케이션 레이어에 둘지 애매한 순간이 많다.

이번 글에서는 상품과 관련된 여러 도메인 정보를 조합해 내리는 조회 모델(이 글에서는 `ProductDetail`로 구현)을 두고 고민했던 과정과, 최종적으로 어떤 기준으로 레이어를 결정했는지 정리해보려 한다.

---

## 1. 문제의 출발점 – "상품 상세를 어디서 조합할까?"

요구사항은 단순했다.

> 상품 상세 화면에서 **상품 정보 + 브랜드 정보 + 좋아요 여부/개수**를 함께 내려주고 싶다.

처음엔 이걸 전형적인 도메인 개념처럼 봤다.

- "상품 상세"라는 이름 자체가 도메인 개념처럼 느껴졌고
- 상품, 브랜드, 좋아요 상태처럼 **여러 도메인의 엔티티를 한 번에 조합해서 다루는 전용 모델**이 있으면 쓰기 편하다고 생각했다

그래서 자연스럽게 `domain.product.detail` 패키지에, 상품 상세를 표현하는 도메인 객체인 `ProductDetail`을 만들었다.

```java
// domain.product.detail.ProductDetail

public class ProductDetail {

  private final Product product;
  private final Brand brand;
  private final boolean isLiked;

  private ProductDetail(Product product, Brand brand, boolean isLiked) {
    if (product == null) throw ...;
    if (brand == null) throw ...;
    this.product = product;
    this.brand = brand;
    this.isLiked = isLiked;
  }

  public static ProductDetail of(Product product, Brand brand, boolean isLiked) {
    return new ProductDetail(product, brand, isLiked);
  }
  
  ...

}
```

그리고 `ProductDetailDomainService`에서 `Products`, `Brands`, `ProductLikeStatuses`를 받아 `ProductDetail` 리스트를 만들어주는 구조로 가져갔다.

여기서,

- `ProductDetailDomainService`는 단일 도메인 객체로 처리하기 애매한 **조합 책임을 모아 둔 도메인 서비스**(순수 객체)이고,
- `Products`, `Brands`는 각각 `Product`, `Brand` 집합을 다루는 **일급 컬렉션**이며,
- `ProductLikeStatuses`는 특정 사용자가 어떤 상품을 좋아요 눌렀는지를 표현하는 **도메인 모델**이다.
- `ProductDetailDomainService` 역시 비즈니스 규칙을 처리한다기보다, 여러 도메인 값들을 조합해서 **화면/응답에 맞는 조회용 모델(필요한 필드만 뽑아 새로 만든 구조)**을 만들어 주는 매퍼 역할에 더 가깝다.

즉, 여러 도메인에서 조회한 값들을 한 번에 모아서 `ProductDetail` 목록으로 변환하는 조합용 도메인 서비스를 두고 있었던 셈이다.

장점은 분명했다.

- Facade 입장에서는 `ProductDetailDomainService.create(...)` 한 번이면 상품 상세 도메인 모델을 얻을 수 있고
- 컨트롤러에서는 `ProductDetail`만 응답으로 변환하면 됐다

겉으로 보기엔 "도메인 주도"인 것처럼 보였다.

---

## 2. 이상한 느낌: 도메인 객체가 조회 모델이 되어버렸다

코드 리뷰를 요청드렸을 때, 아래와 같은 피드백을 받았다.

> product 도메인에서 brand 도메인을 알아도 괜찮을까요?

이 한 문장을 곱씹어 보니, 몇 가지가 마음에 걸렸다.

- 조합 모델인 `ProductDetail`은 상품, 브랜드, 좋아요 상태 등 여러 도메인의 데이터를 모두 알고 있다.
- 위치는 `domain.product.detail`인데, 하는 일은 거의 "여러 도메인의 값을 모아서 펼쳐주는 조회용 모델"에 가깝다.
- `ProductDetailDomainService` 역시 비즈니스 규칙을 처리한다기보다, 여러 도메인 값들을 조합해서 
- **화면/응답에 맞는 조회용 모델(필요한 필드만 뽑아 새로 만든 구조)**을 만들어 주는 매퍼 역할에 더 가깝다.

즉, 도메인 레이어 안에서:

- product 쪽에서 brand/like를 직접 의존하고 있고
- 도메인 모델이 조회용 DTO 역할까지 떠안고 있는 상태였다.

"이게 진짜 도메인 규칙을 캡슐화하는 객체인가?"
"아니면 그냥 뷰/응답에 맞춘 데이터 조합용 모델인가?"

라는 고민이 생겼다.

---

## 3. Domain 레이어와 Application 레이어 정리

결정을 내리기 전에, 이 글에서 말하는 **Domain 레이어**와 **Application 레이어**, 그리고 그 안에 등장하는 서비스들의 역할을 한 번 정리해보았다.


### 3-1. 레이어 역할

**Domain 레이어**
- 비즈니스 규칙과 불변식(예: 유효한 상태, 가능한 상태 전이)을 담는 영역
- Entity, Value Object, Aggregate, Domain Service 등이 위치
- 도메인 객체의 상태가 유효한지, 어떤 상태 전이가 허용되는지를 결정하는 곳
- DB, 메시지 브로커 등 인프라에는 직접 의존하지 않고, `Repository` 같은 추상화(인터페이스)를 통해 접근
  - DIP(Dependency Inversion Principle, 의존성 역전 원칙)

**Application 레이어**
- 유즈케이스를 조합하고 흐름을 orchestration 하는 영역
- Facade, Application Service 등이 위치
- "언제 어떤 도메인 기능을 어떻게 호출할 것인가?"를 결정하는 곳
- 트랜잭션 경계, 권한 체크, 로깅, DTO 변환 등도 여기서 담당하는 경우가 많다

*여기서 말하는 Facade와 Application Service는 실무에서 거의 비슷한 의미로 쓰이는 경우가 많다. 다만 팀에 따라 Facade는 "외부에서 진입하는 진입점(예: API 단위 유즈케이스)"에 더 가깝게, Application Service는 그 내부에서 유즈케이스를 세분화한 서비스로 나누어 쓰기도 한다. 이 글에서는 둘 다 "Application 레이어에서 유즈케이스를 orchestration 하는 서비스"라는 넓은 의미로 사용한다.*

### 3-2. Domain Service vs Application Service/Facade

이 글에서 등장하는 두 가지 유형의 서비스도 구분해 볼 수 있다.

| 구분                             | Domain Service                                                | Application Service / Facade                                      |
|----------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------|
| 목적                             | 하나의 도메인 객체로 담기 애매한 **비즈니스 규칙** 캡슐화      | 여러 도메인과 인프라를 엮어 **유즈케이스를 완성**                |
| 다루는 타입                      | 도메인 타입(Entity, VO, 일급 컬렉션 등)                       | 도메인 타입 + ID, DTO, 요청/응답 모델                            |
| 예시                             | 가격 계산, 재고 검증, 특정 규칙에 따른 상태 전이              | "상품 상세 조회", "주문 생성", "환불 처리" 같은 애플리케이션 기능 |
| 메서드 이름 스타일               | 도메인 용어/상태 변화를 직접 표현 (withdraw, deposit, transferTo) | 유즈케이스/시나리오를 표현 (sendMoney, requestRefund, placeOrder) |
| 인프라 의존                      | 가급적 없음 (Repository 인터페이스 정도에 의존)               | DB, 메시지, 외부 API, 다른 시스템 등과 직접 통합                 |
| 위치                             | Domain 레이어                                                 | Application 레이어                                                |

정리하면:
- **Domain Service**는 "규칙"에 가깝고,
- **Application Service/Facade**는 "시나리오(유즈케이스)"에 가깝다.

이번 글에서 고민한 조합/조회 모델은,
- 도메인 규칙을 새로 정의하기보다는
- 여러 도메인의 값을 모아서 "화면/응답에 맞는 구조"로 바꾸는 역할이었기 때문에
어느 레이어에 두는 게 더 자연스러운지 다시 생각해 볼 필요가 있었다.

---

## 4. 결정 – 조합/조회 모델을 Application 레이어로 올리기

선택지는 두 가지 정도 있었다.

1. **여러 도메인 조합을 담당하는 모델을 그대로 Domain 레이어에 두고**, 카탈로그 도메인/서비스 등의 형태로 계속 Domain 안에서 해결한다.
   - 예를 들어, 상품/브랜드/카테고리 등을 하나의 "상품 카탈로그" 도메인으로 보고, 이 도메인에 속한 도메인 서비스가 목록 조회, 정렬, 필터링, 상세 조합 같은 규칙을 책임지도록 설계하는 방식이다.
2. **이 조합/조회 모델(이 글에서는 `ProductDetail`)을 Application 레이어로 올리고**, 조회용 모델로 명확히 정의한다.

이번 구조에서 이 조합/조회 모델(`ProductDetail`)은:

- 재고 검증 같은 규칙을 갖고 있지도 않고
- 애그리거트의 일관성을 책임지지도 않고
- 단순히 **여러 도메인의 데이터를 한 번에 묶어서 응답에 맞게 평탄화하는 역할**이었다.

그래서 2번을 선택했다.
이 조합/조회 모델을 Application 레이어(`application.product`)로 올리고, 조회용 모델을 표현하는 `ProductDetail` record + 팩토리 메서드 형태로 구현했다.

```java
// application.product.ProductDetail

public record ProductDetail(
    Long productId,
    String productName,
    Long price,
    String description,
    Long stock,
    Long brandId,
    String brandName,
    Long likeCount,
    boolean liked
) {
  public static ProductDetail of(Product product, Brand brand, boolean liked) {
    if (product == null) throw ...;
    if (brand == null) throw ...;

    return new ProductDetail(
        product.getId(),
        product.getName(),
        product.getPriceValue(),
        product.getDescription(),
        product.getStockValue(),
        brand.getId(),
        brand.getName(),
        product.getLikeCount(),
        liked
    );
  }
}
```

Application 레이어 `ProductFacade`에서는 이제 이렇게 조합한다.

```java
// application.product.ProductFacade (중요 부분 발췌)

public Page<ProductDetail> searchProductDetails(Long brandId, Long userId, Pageable pageable) {
  Page<Product> productPage = productService.findProducts(brandId, pageable);

  // 앞에서 products, brands, likeStatuses 를 준비한 뒤,
  // Application 레이어에서 조합/조회 모델로 변환한다.
  Map<Long, ProductDetail> resultMap = products.toList().stream()
      .collect(toMap(
          Product::getId,
          product -> ProductDetail.of(
              product,
              brands.getBrandById(product.getBrandId()),
              likeStatuses.isLiked(product.getId())
          )
      ));

  return productPage.map(product -> resultMap.get(product.getId()));
}
```

이제 역할이 분리된다.

- **Domain**
  - `Product`, `Brand`, `ProductLike` 각각의 규칙/상태만 책임진다.
- **Application**
  - 여러 도메인에서 데이터를 가져와
  - 특정 use-case(API 응답)에 맞는 **조회 모델(ProductDetail)**로 조합한다.

의존성도 자연스럽다.

- Application → Domain (O)
- Domain → Application (X)

---

## 5. 마무리 – 앞으로의 기준

이번에 정리하면서, 나름 기준을 하나 잡았다.

- **여러 도메인의 데이터를 조합해서 "뷰/응답에 딱 맞는 모양"을 만드는 객체라면**, 일단 Application 레이어 후보로 본다. (이 글에서 다룬 `ProductDetail`처럼, 상품 + 부가 정보를 한 번에 담는 조회 모델이 대표적인 예다.)
- 도메인에 둘지 고민될 때는,
  - "이 객체가 도메인 규칙/불변식을 책임지나?"
  - "이게 없어지면 도메인 모델이 깨지나, 아니면 조회만 불편해지나?"를 같이 생각해 본다.

처음에는 "도메인스러운 이름"에 끌려서 Domain에 넣었지만,
결국은 **"이 객체의 실제 역할이 무엇인가?"**를 기준으로 레이어를 나누는 쪽이 더 자연하다고 느꼈다.
이번엔 `ProductDetail`이었지만, 비슷한 고민이 또 나올 때 한 번 더 떠올려 볼 수 있을 것 같다.
