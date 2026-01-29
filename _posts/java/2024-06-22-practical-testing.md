---
title: "실용적인 테스트 코드 작성법: 스프링 애플리케이션 테스트 전략"
description: "스프링 애플리케이션에서 효과적인 테스트 코드 작성 방법, 계층별 테스트 전략, 테스트 픽스처 관리, 테스트 가독성 향상 기법"
categories: Java 테스트
tags: [Java, Spring, 테스트코드, 단위테스트, 통합테스트, 테스트전략, 테스트픽스처, 가독성, 유지보수성, 테스트설계]
---

> 박우빈님의 [Practical Testing: 실용적인 테스트 가이드](https://www.inflearn.com/course/practical-testing-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B0%80%EC%9D%B4%EB%93%9C) 를 정리한 내용입니다.



# 테스트는 왜 필요할까

테스트 코드를 작성하지 않고 수동으로 테스트를 하면 아래와 같은 단점들이 있다.

- 테스트에 누락이 있을 수 있다.
- 경험과 감에 의존한다.
- 피드백이 늦다
- 소프트웨어의 신뢰도가 낮아진다

테스트 코드 작성도 중요하지만 테스트를 복잡하지 않고 명확하게 잘 짜는 것도 중요하다.

만약 테스트 코드가 복잡하면 유지보수가 어렵고 새로운 짐이 될 수 있다. 또한 잘못된 검증이 이루어질 가능성이 생길 수 있다.

# 단위 테스트

**작은** 코드 단위를 **독립적**으로 검증하는 메소드

- 작은 단위 : 클래스 or 메서드
- 독립적 : 외부 상황에 의존하지 않음

단위 테스트의 장점은 속도가 빠르고 안정적이다.

의존성  `spring-boot-starter-test`에 `Junit`과 `assertJ` 이 함께 포함되어 있다

# 테스트 케이스 세분화 하기

- 해피 케이스
- 예외 케이스
  - 예외 케이스는 암묵적인 요구사항(예외)을 제대로 커버하고 있는가를 확인한다.

테스트는 경계값 테스트가 중요하다 여기서 경계값이란 범위(이상, 이하, 초과, 미만), 구간, 날짜 등을 의미한다

예로 조건 3 이상에서 기능이 동작한다면 해피케이스 3과 예외 케이스 2로 테스트 케이스를 작성한다.

# 테스트하기 어려운 영역을 분리하기

메소드 안에서 주문 생성 시간( `LocalDateTime.now()`)과 같은 시간을 선언하여 사용한다면, 테스트 코드를 작성하기 어렵다. 그 이유는 실행하는 시간에 따라 테스트의 결과가 달라지기 때문이다. 이런 경우엔 주문을 하는 메소드에 **시간을 인자로 넘겨 사용할 수 있도록 구조를 변경한다**. 즉 테스트가 불가능한 영역을 외부로 분리를 하여 테스트 할 수 있도록 설계를 변경하는 것이 좋다

테스트하기 어려운 영역이 있다.

- 관측할 때 마다 다른 값에 의존하는 코드
  - 현재 날짜/시간, 랜던 값, 전역 함수/변수, 사용자 입력 등
- 외부에 영향을 주는 코드
  - 표준 출력, 메시지 발송, 데이터베이스 기록 등

반대로 테스트 하기 쉬운 함수는 아래와 같은 특징이 있다.

- 외부와 단절 (Pure function)
- 같은 입력에는 항상 같은 결과를 반환

Lombok 사용 팁

- `@Data` , `@Setter` , `@AllArgsConstructor` 사용을 최대한 피한다.
- 양방향 연관관계 시 `@ToString` 순환 참조 문제 고려해야한다

# TDD

프로덕션 코드보다 테스트 코드를 먼저 작성하여 테스트가 구현 과정을 주도하도록 하는 개발 방법론이다

아래와 같은 순서로 개발을 진행한다.

1. 우선 실패하는 테스트를 작성한다. 구현 코드가 없기 때문에 당연히 테스트는 실패한다.
2. 테스트를 통과하도록만 코드를 작성한다.  엉터리여도 상관없다.
3. 테스트를 계속 통과 시키면서 코드를 리팩토링한다.

이 TDD의 가장 큰 장점은 피드백이 빠르다는 것이다.

보통의 경우엔 기능을 먼저 구현할 텐데 이 경우엔 아래와 같은 문제점이 발생 할 수 있다.

- 테스트 코드 자체가 없다.
- 특정 테스트 케이스만 작성한다(ex 해피케이스만 작성)
- 잘못된 구현을 늦게 발견한다.

먼저 테스트를 작성 한 뒤 기능을 구현하면 아래와 같은 장점들이 생겨난다.

- 복잡도가 낮은 테스트 가능한 코드로 구현을 할 수 있게 된다.
  - 유연하며 유지보수가 쉬운 코드를 작성하게 된다.
- 쉽게 발견하기 어려운 엣지 케이스를 놓치지 않게 해준다
- 구현에 대한 빠른 피드백을 받을 수 있다
- 과감한 리팩토링이 가능해진다

# 테스트는 문서다

- 테스트 코드는 프로덕션 기능을 설명한다
- 테스트 코드는 다양한 테스트 케이스를 통해 프로덕션 코드를 이해하는 시각과 관점을 보완한다
- 어느 한 사람이 과거에 경험한 고민의 결과물을 팀 차원으로 올려 모두의 자산으로 공유할 수 있다

# DisplayName을 섬세하게 작성한다

- 명사의 나열보다 **문장형태로 나타낸다.**
- **"~~ 테스트"** 라는 이름을 피한다
- 테스트 행위에 대한 결과까지 작성한다
- 도메인 용어를 사용하여 더 추상화된 내용을 담는다 (ex 특정 시간 → 가게 영업 시간)
  - 이름을 메소드가 아닌 **도메인 정책에 관점으로 작성**한다
  - 테스트 현상을 중점으로 기술하지 않는다.
    - 성공한다, 실패한다 라는 이름은 피한다

BDD 스타일로 작성하기

- TDD에서 파생된 개발 방법
- 함수 단위의 테스트보다 **시나리오 기반의 테스트케이스 자체에 집중하여 테스트**한다
- 개발자가 아닌 사람도 이해할 수 있을 정도로 추상화를 권장한다

아래 given-when-then 패턴 활용한다.

given - 시나리오 진행을 준비하는 모든 준비 과정

when - 시나리오 행동 진행

then - 시나리오 진행에 대한 결과 명시, 검증

이 스타일로 작성하면 **DisplayName**을 명확하게 잘성 할 수 있다.

given - 어떤 환경에서

when - 어떤 행동을 진행했을 때

then - 어떤 상태가 변화가 일어난다

Displayname → **어떤 환경에서 어떤 행동을 진행했을 때 어떤 상태가 변화가 일어난다**

# [실습] 레이어드 아키텍처 테스트

## application.yml 작성은 환경 분리가 중요하다

- local에서는 ddl-auto create를 해도 되지만 운영 none으로 사용한다
- local에서는 data.sql 데이터를 하이버네이트 초기화 후 실행하고 싶으면 아래 코드를 추가한다.

  `defer-datasource-initialization: *true # (2.5~) Hibernate 초기화 이후 data.sql 실행*`


## 레포지토리 테스트의 이유

- 작성한 쿼리가 정상 동작하는지 보장하기 위함이다.
- 미래에 변경에 대한 대비할 수 있다.

## @DataJpaTest

Jpa 관련된 빈들만 주입해주어 스프링부트 서버를 띄우기 때문에 @SpringBootTest 보다 가볍다

## 리스트 테스트

리스트에서 특정 필드만 추출해서 원하는 값이 포함되어있는지 테스트가 가능하다

```java
  assertThat(products).hasSize(2)
                .extracting("productNumber", "name", "sellingStatus")
                .containsExactlyInAnyOrder(
                        tuple("001", "아메리카노", ProductSellingStatus.SELLING),
                        tuple("002", "카페라떼", ProductSellingStatus.HOLD)
                );
```

## Persistence Layer

Data Access의 역할을한다. 비지니스 가공 로직이 포함되어서는 안되고, Data에 대한 CRUD에만 집중한 레이어이다.

## Business Layer

비지니스 로직을 구현하는 역할을한다. **`트랜잭션`**을 보장하며 Persistence Layer와의 상호작용을 통해 비지니스 로직을 실행한다

### 주의점

서비스 테스트 클래스 상단에 @Transactional을 달아주면 서비스에 트랜잭션이 달리지 않아도 테스트 상에서 변경감지를 하여 업데이트 쿼리가 나가기 때문에 실패해야할 테스트가 성공할 수 있다. 이런 부작용을 잘 알고 @Transactional을 사용 해야한다.

## 이넘 값 자체 비교

이넘 값 자체 비교는 `isEqualByComparingTo` 를 사용하여 테스트할 수 있다.

# [실습] Presentation Layer 테스트

- 외부 세계의 요청을 가장 먼저 받는 계층으로 파라미터에 대한 최소한의 검증을 수행한다
- persistenceLayer와 BusinessLayer는 Mocking으로 처리한다

## Transactional(read=only)

명령과 쿼리를 나누는 것이 중요하다. (CQRS)

성능 향상

- jpa에서는 스냅샷 저장, 변경 감지 X
- 읽기 전용 db, 읽기 쓰기 db로 구분이 가능

서비스 메소드 상단에 readonly = true 트랜잭션을 추가하고, CUD 메소드엔 트랜잭션을 추가로 명시해준다.

## MockMvc

Mock 객체를 사용해 스프링 MVC 동작을 재현할 수 있는 테스트 프레임워크

```java

@WebMvcTest(controllers = ProductController.class)
```

### MockBean

컨테이너에 Mock으로 만든 빈을 넣어주는 어노테이션

```java
@WebMvcTest(controllers = ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper; //Object <-> Json 직렬화, 역직렬화

    @MockBean
    private ProductService productService;

    @DisplayName("신규 상품을 등록한다.")
    @Test
    void createProduct() throws Exception {
    	// given
        ProductCreateRequest request = ProductCreateRequest.builder()
                .type(ProductType.HANDMADE)
                .sellingStatus(ProductSellingStatus.SELLING)
                .name("아메리카노")
                .price(4000)
                .build();

        //when & then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/products/new")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON)
                )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
```

직렬화된 값을 역직렬화 할때 (ProductCreateRequest 에 맵핑) ObjectMapper가 기본 생성자를 사용하기 때문에 ProductCreateRequest에 @NoArgsConstructor가 필요하다.

```java
@NoArgsConstructor
public class ProductCreateRequest {
```

### start-validation

Enum일경우 @NotNuull

String은 @NotBlank

Integer는 @Positive

등으로 체크 가능하다.

```java
@Getter
@NoArgsConstructor
public class ProductCreateRequest {

    @NotNull(message = "상품 타입은 필수입니다.")
    private ProductType type;

    @NotNull(message = "상품 판매상태는 필수입니다.")
    private ProductSellingStatus sellingStatus;

    @NotBlank(message = "상품 이름은 필수입니다.")
    private String name;

    @Positive(message = "상품 가격은 양수여야 합니다.")
    private int price;
```

오브젝트 앞에 @Valid 를 추가해줘야 한다.

```java
    public ProductResponse createProduct(@**Valid** @RequestBody ProductCreateRequest request) {
```

### Response의 형식

```java
    @PostMapping("/api/v1/products/new")
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return ApiResponse.ok(productService.createProduct(request));
    }
```

response data를 제네릭타입으로 받고 제네릭 메소드를 사용하여 http request의 응답과 데이터를 반환하도록한다.

```java

@Getter 
public class ApiResponse<T> {

    private int code;
    private HttpStatus status;
    private String message;
    private T data;

    public ApiResponse(HttpStatus status, String message, T data) {
        this.code = status.value();
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> of(HttpStatus httpStatus, String message, T data) {
        return new ApiResponse<>(httpStatus, message, data);
    }

    public static <T> ApiResponse<T> of(HttpStatus httpStatus, T data) {
        return of(httpStatus, httpStatus.name(), data);
    }

    public static <T> ApiResponse<T> ok(T data) {
        return of(HttpStatus.OK, data);
    }
}

```

테스트에서 jsonPath를 사용하려면 Getter가 있어야한다

### validation 예외

```java
@RestControllerAdvice
public class ApiControllerAdvice {

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(BindException.class)
    public ApiResponse<Object> bindException(BindException e) {
        return ApiResponse.of(
                HttpStatus.BAD_REQUEST,
                e.getBindingResult().getAllErrors().get(0).getDefaultMessage(),
                null
        );
    }
}

```

여러가지 바인딩 에러중 첫번째 에러 메시지를 400에러로 반환하도록 작성한다.

```java
    @DisplayName("신규 상품을 등록할 때 상품 타입은 필수값이다")
    @Test
    void createProductWithoutType() throws Exception {
        // given
        ProductCreateRequest request = ProductCreateRequest.builder()
                .sellingStatus(ProductSellingStatus.SELLING)
                .name("아메리카노")
                .price(4000)
                .build();

        //when & then
        mockMvc.perform(post("/api/v1/products/new")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON)
                )
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.status").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("상품 타입은 필수입니다."))
                .andExpect(jsonPath("$.data").isEmpty());
    }
```

만약 상품이름이 20자로 제한된다. 같은 제한 세세한 도메인 정책은 컨트롤러보다는 서비스 레이어나 도메인 객체(생성자)에서 하는 것이 적절하다.

## Controller의 DTO를 Service에서 파라미터로 받을 경우 두 계층 간 의존관계가 생겨버린다.

controller에서 OrderCreateRequest를 service의 메소드에 전달 할 경우 두 계층간 의존이 생긴다. 따라서 서비스용 request DTO를 만들어주는 것을 권장한다.

```java
    @PostMapping("/api/v1/orders/new")
    public ApiResponse<OrderResponse>  createOrder(@Valid @RequestBody OrderCreateRequest request) {
        LocalDateTime registeredDateTime = LocalDateTime.now();
        return ApiResponse.ok(orderService.createOrder(request.toServiceRequest(), registeredDateTime));
    }
```

```java
@Getter
@NoArgsConstructor
public class OrderCreateRequest {

    @NotEmpty(message = "상품 번호 리스트는 필수입니다")
    private List<String> productNumbers;

    @Builder
    private OrderCreateRequest(List<String> productNumbers) {
        this.productNumbers = productNumbers;
    }

    public OrderCreateServiceRequest toServiceRequest() {
        return OrderCreateServiceRequest.builder()
                .productNumbers(productNumbers)
                .build();
    }
}
```

이렇게 구분을 해주면 특정 컨트롤러의 DTO에 의존하고 있지 않기 때문에 다른 컨트롤러에서 해당 서비스를 사용 할 때 쉽게 사용이 가능하다.

# Mock을 마주하는 자세

## Mockito로 Stubbing하기

```java
when(mailSendClient.sendMail(any(String.class), any(String.class),any(String.class),any(String.class))
.thenReturn(true);
```

네트워크 작업 등이 필요한 서비스에는 서비스 단에 트랜잭션을 걸지 않는 것이 좋다.

## Test Double

Dummy : 아무것도 하지 않는 깡통 객체

Fake : 단순한 형태로 동일한 기능을 수행하나, 프로덕션에서 쓰기는 부족한 객체 (FakeRepository)

Stub : 테스트에서 요청한 것에 대해 미리 준비한 결과를 제공하는 개체

Spy : Stub이면서 호출된 내용을 기록하여 보여줄 수 있는 객체, 일부는 실제 객체처럼 동작시키고 일부만 Stubbing할 수 있다

Mock : 행위에 대한 기대를 명세하고, 그에 따라 동작하도록 만들어진 객체

- stub은 상태를 검증하고 Mock은 행위를 검증하는 것(예로 1번 메소드가 호출되었다)이 큰 차이점이다.
- @Spy는 doReturn 으로 시작하는 문법을 사용한다.

## BddMockito

given에서 mocktio의 when 을 셋팅하는게 이상해 보여서 탄생하였다

```java
BDDMockito.given(  ~~~ )
```

BDDMockito는 내부에 Mockito를 상속하고 있기 때문에 동작은 동일하다.



# 더 나은 테스트를 작성하기 위한 구체적 조언

## 한 문단에 한 주제

하나의 테스트 안에 반복 or 분기가 생기지 않도록 하는 것이 좋다. 만약 다양한 케이스에 대해 테스트를 해보고 싶다면 `@parameterized` 를 사용한다.

## 완벽하게 제어하기

현재 시간, 생성 시간 랜덤값, 외부시스템과 연동 등은 **외부로 분리 또는 모킹** 등으로 제어하여 테스트할 수 있도록 해야한다.

만약 `LocalDateTime.now()`를 사용하여 테스트를 통과 시킬 수 있더라도 완벽히 제어할 수 없는 현재 시간 `LocalDateTime.now()`의 사용은 되도록 피하고 고정된 시간을 사용한다.

## 테스트 환경의 독립성을 보장하기

예로 given절에 상품을 2개 생성하고 1개를 차감하는 테스트 코드가 있을 때, 만약 상품을 1개가 아닌 3개를 차감한다면 given절에서 테스트 실패가 발생하게 된다.

즉 given절에서 상품 재고가 충분할 경우, 아닌 경우에 따라 테스트 결과가 바뀌게 되고 이는 테스트에 논리적인 구조가 들어가게 되는 것이기 때문에 given절에서는 순수한 생성자나 빌더를 사용하는 것이 좋다. (특정 목적을 갖고 객체를 생성하는 팩토리 메소드도 사용을 피하는 편이 좋음)

## 테스트 간 독립성을 보장하기

static 변수 등으로 자원을 공유하여 테스트하면 테스트의 순서에 따라 결과가 달라질 수도 있다. 테스트의 결과는 항상 동일해야하기 때문에 공유 자원을 사용하지 않도록 한다.

## 한눈에 들어오는 텍스트 픽스쳐 구성하기

텍스트 픽스처는 테스트를 위해 원하는 상태로 고정시킨 일련의 객체, 즉 given절에서 생성한 모든 객체들을 뜻한다.

테스트 코드에서 `@BeforeAll`, `@BeforEach` 에서 텍스트 픽스처를 작성하는 것을 피하는 것이 좋다. 중복된 텍스트 픽스처 작성을 피할 수 있다는 장점이 있지만, 텍스트 픽스처가 모든 테스트와 연관되어버리기 때문에 수정을 할 경우 모든 테스트에 영향을 끼치게 된다.  또한 setUp에 텍스처 픽스처가 있으면 테스트 코드 메소드에서 한 눈에 테스트를 파악하기 어려운 단점이 있다.

setUp는 작성되는 내용은 각 테스트에서 몰라도 되고, 수정이 되어도 영향이 없는 코드만 작성하도록 한다.

위와 같이 작성하게 되면 given이 길어지는 단점이 있다. 이 부분은 테스트에 필요한 부분만 정적 팩토리 메소드에 전달하는 식으로 변경하여 코드를 줄일 수 있다.

## 테스트 픽스처 클렌징

텍스트픽스처를 지울 때 deleteAll과 deleteAllInBatch를 사용할 수 있다.

**deleteAllInBatch**

delete From을 통해 테이블 전체 데이터를 삭제할 수 있지만, 순서를 고려 해줘야 한다.

ex) 다대다 연관관계의 중간 연결 맵핑 테이블을 먼저 지워야 한다. 만약 중간 맵핑 테이블이 아닌 다른 테이블을 먼저 지운다면 외래키가 참조하고 있다는 에러 메시지가 발생한다.

**deleteAll**

전체 테이블을 조회하여 하나씩 제거한다. 순서를 고려할 필요가 없어지지만, 쿼리가 많아진다.

ex) 오더를 지우면서 오더와 맵핑된 오더프로덕트도 지워준다. 하지만 맵핑된 테이블을 조회하고 지우는 쿼리가 추가적으로 발생한다.

사이드 이펙트를 잘 고려할 수 있는 상황이라면 `@Transactional로` 롤백하는 것이 가장 간단하다.

## @ParameterizedTest

하나의 테스트에 값을 바꾸어 보고 싶을 때 사용한다.

```java
@CsvSource("param1-1,param1-2","param2-1,param2-2")
@ParameterizedTest
```

보통 테스트 위에다 바로 명시를 한다. 더 많은 source는 junit 공식문서에서 확인이 가능하다.

## @DynamicTest

환경을 설정하고 시나리오 기반으로 환경에 변화를 주면서 중간마다 검증이 필요한 경우 사용한다.

```java
@TestFactory
Collection<DynamicTest> dynamicTest() {

	//given
	return List.of(
		DynamicTest.dynamicTest("재고를 차감할 수 있다.", () -> {
			//given
			//when
			//1개차감
			//then
		}),
		DynamicTest.dynamicTest("재고보다 많이 차감할 경우 예외가 발생한다.", () -> {
			//given
			//when
			//3개차감
			//then
		
		})
	);
}
```

## 테스트 수행도 비용이다. 환경 통합하기

Tip gradle 탭을 단축키에 등록해놓으면 편하다

전체 테스트 수행 방법 : gradle > tasks > verification > test

전체 테스트 실행 후 로그에서 `Spring Boot` 를 검색하면 스프링 부트 서버가 총 몇회 실행되었는지 확인이 가능하다. 스프링 부트 실행 횟수가 많으면 좋지 않은데 매번 컨텍스트 로드를 같이 수행하기 때문에 전체 테스트의 시간이 길어때문이다.

스프링부트 서버가 여러번 실행되는 이유는 1.테스트 프로파일 환경이 다른 경우, 2. `@MockBean`을 사용하는 경우이다. 스프링 부트가 여러번 실행되는 것을 방지하기 위해 1. 하나의 공통 클래스를 만들어 프로파일과 `@MockBean`을 모두 셋팅하거나 2. Mocking을 처리한 환경과 Mocking이 필요없는 환경을 나누는 방식으로 사용할 수 있다.

```java
@ActiveProfiles("test")
@SpringBootTest
public abstract class IntegrationTestSupport {

    @MockBean
    protected MailSendClient mailSendClient;

}
```

레포지토리 테스트할 때 보통 `@DataJpaTest` 을 사용하고, 서비스 테스트는 `@SpringBootTest` 를 사용하게 되는데 이 경우엔 스프링부트 서버가 새로 실행된다. 만약 `@DataJpaTest`을  `@SpringBootTest` 으로변경한다면 레포지토리 테스트 자체의 시간은 더 길어지겠지만, 전체 테스트 실행 때는 새로 스프링부트 서버를 띄우지 않게 되어 전체 테스트 시간이 단축된다.

```java
@Transactional
class ProductRepositoryTest extends IntegrationTestSupport {
```

WebMvcTest는 SpringBootTest 환경과 성격이 다르기 때문에 별도의 공통 환경을 만들어 사용한다.

```java

@WebMvcTest(controllers = {
    OrderController.class,
    ProductController.class
})
public abstract class ControllerTestSupport {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @MockBean
    protected OrderService orderService;

    @MockBean
    protected ProductService productService;

}
```

## Private 메서드 테스트는?

할 필요가 없다. 클라이언트 입장에서는 공개된(public) 메소드만 알면 된다.

private 메소드는 관련된 public 메소드를 테스트하다보면 자연스럽게 같이 테스트가 된다.

만약 private 메소드 테스트 필요성이 느껴진다면 객체를 분리할 시점인가? 라는 고민을 해야한다.

private메서드를 다른 객체로 분리하여 책임을 분리하고, 해당 메소드를 public으로 변경하여 테스트를 진행한다.

## 테스트에서만 필요한 메서드가 생겼을 때는?

미래에 충분이 가질만한 메소드는 만들어도 되지만, 최대한 만들지 않도록 보수적으로 접근하는 편이 좋다.

## 학습 테스트

잘 모르는 기능, 라이브러리, 프레임등을 학습하기 위한 테스트 코드이다.

여러 테이스 케이스를 스스로 정의하고 검증하는 과정을 통해서 구체적인 동작과 기능을 학습하는 것이 목적이다.
