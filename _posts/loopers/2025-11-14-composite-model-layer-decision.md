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

- 처음엔 `ProductDetail`을 도메인 객체로 두고, `Product + Brand + Like`를 한 번에 조합했다.
- 그런데 product 도메인에서 brand/like 도메인까지 직접 알아야 해서, 도메인 경계가 애매해졌다.
- 결국 `ProductDetail`을 **Application 레이어의 조회용 모델**로 올리는 쪽이 더 자연하다고 판단했다.

---

## 들어가며

도메인 주도 설계(DDD)를 처음 적용하다 보면, "이 객체는 어느 레이어에 두어야 할까?"라는 고민을 자주 하게 된다.

특히 여러 도메인의 데이터를 조합해서 화면에 보여주는 경우, 그 조합 객체를 도메인 레이어에 둘지, 애플리케이션 레이어에 둘지 애매한 순간이 많다.

이번 글에서는 상품 상세 정보를 조합하는 `ProductDetail` 객체를 두고 고민했던 과정과, 최종적으로 어떤 기준으로 레이어를 결정했는지 정리해보려 한다.

---

## 1. 문제의 출발점 – "상품 상세를 어디서 조합할까?"

요구사항은 단순했다.

> 상품 상세 화면에서 **상품 정보 + 브랜드 정보 + 좋아요 여부/갯수**를 함께 내려주고 싶다.

처음엔 이걸 전형적인 도메인 개념처럼 봤다.

- "상품 상세(ProductDetail)"라는 이름도 도메인 같고
- `Product`, `Brand`, `ProductLike`를 한 번에 묶는 객체가 있으면 쓰기도 편하다

그래서 자연스럽게 `domain.product.detail` 패키지에 `ProductDetail`이라는 도메인 객체를 만들었다.

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

  // 각종 getter들: getProductId(), getBrandName(), getLikeCount() ...
}
```

그리고 `ProductDetailDomainService`에서 `Products`, `Brands`, `ProductLikeStatuses`를 받아 `ProductDetail` 리스트를 만들어주는 구조로 가져갔다.

장점은 분명했다.

- Facade 입장에서는 `ProductDetailDomainService.create(...)` 한 번이면 상품 상세 도메인 모델을 얻을 수 있고
- 컨트롤러에서는 `ProductDetail`만 응답으로 변환하면 됐다

겉으로 보기엔 "도메인 주도"인 것처럼 보였다.

---

## 2. 이상한 느낌: 도메인 객체가 조회 모델이 되어버렸다

이 구조로 조금 써보다가, 리뷰에서 이런 코멘트를 받았다.

> product 도메인에서 brand 도메인을 알아도 괜찮을까요?

곱씹어보니 몇 가지가 걸렸다.

- `ProductDetail`은 `Product + Brand + Like`를 모두 알고 있다.
- 위치는 `domain.product.detail`인데, 하는 일은 거의 "여러 도메인의 값을 모아서 펼쳐주는 조회 모델"에 가깝다.
- `ProductDetailDomainService` 역시 비즈니스 규칙보다는 도메인 값들을 조합해서 projection 만드는 매퍼 역할에 가깝다.

즉, 도메인 레이어 안에서:

- product 쪽에서 brand/like를 직접 의존하고 있고
- 도메인 모델이 조회용 DTO 역할까지 떠안고 있는 상태였다.

"이건 진짜 도메인 규칙을 캡슐화하는 객체인가?"
"아니면 그냥 뷰/응답에 맞춘 데이터 조합용 모델인가?"

라는 고민이 생겼다.

---

## 3. 결정 – ProductDetail을 Application 레이어로 올리기

선택지는 두 가지 정도 있었다.

1. **도메인에 새로운 카탈로그 도메인/서비스를 만들어** 계속 Domain 안에서 해결한다.
2. **ProductDetail을 Application 레이어로 올리고**, 조회용 모델로 명확히 정의한다.

이번 구조에서는 `ProductDetail`이:

- 재고 검증 같은 규칙을 갖고 있지도 않고
- 애그리거트의 일관성을 책임지지도 않고
- 단순히 **여러 도메인의 데이터를 한 번에 묶어서 응답에 맞게 평탄화하는 역할**이었다.

그래서 2번을 선택했다.
`ProductDetail`을 `application.product` 패키지로 올리고, `record` + 팩토리 메서드 형태로 정리했다.

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

`ProductFacade`에서는 이제 이렇게 조합한다.

```java
public Page<ProductDetail> searchProductDetails(Long brandId, Long userId, Pageable pageable) {
  Page<Product> productPage = productService.findProducts(brandId, pageable);

  Products products = Products.from(productPage.getContent());
  Brands brands = Brands.from(brandService.findByIdIn(products.getBrandIds()));
  ProductLikeStatuses likeStatuses = userId != null
      ? productLikeService.findLikeStatusByUser(userId, products.getProductIds())
      : ProductLikeStatuses.empty();

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

## 4. 마무리 – 앞으로의 기준

이번에 정리하면서, 나름 기준을 하나 잡았다.

- **여러 도메인의 데이터를 조합해서 "뷰/응답에 딱 맞는 모양"을 만드는 객체라면**, 일단 Application 레이어 후보로 본다.
- 도메인에 둘지 고민될 때는,
  - "이 객체가 도메인 규칙/불변식을 책임지나?"
  - "이게 없어지면 도메인 모델이 깨지나, 아니면 조회만 불편해지나?"를 같이 생각해 본다.

처음에는 "도메인스러운 이름"에 끌려서 Domain에 넣었지만,
결국은 **"이 객체의 실제 역할이 무엇인가?"**를 기준으로 레이어를 옮기게 됐다.

이번엔 `ProductDetail`이었지만,
비슷한 고민이 또 나올 때 한 번 더 떠올려 볼 수 있을 것 같다.

> "이건 진짜 도메인인가, 아니면 조회용 조합 모델인가?"