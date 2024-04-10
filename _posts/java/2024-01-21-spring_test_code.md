---
title: Spring Test code
categories: spring testcode
tags: [spring testcode]
---

> 스프링 테스트 코드를 작성하면서 테스트 관련 어노테이션이 너무 다양하고, 무엇을 위해 쓰는 지 몰라서 원하는 대로 테스트 코드를 작성하기가 어려웠다. 
> 테스트 코드 관련 내용을 차근히 정리할 필요성을 절실히 느끼게 되었다.

## @SpringBootTest(통합 테스트)
애플리케이션 컨텍스트(빈, 설정, 구성 요소 )등을 로드하는 테스트 어노테이션이다. 주의해야 할 점은  컨텍스트 로드를 하기 때문에 실행 시간이 길다.
활용할 수 있는 어노테이션은 `@MockBean` 어노테이션을 사용하면 지정된 클래스의 모의 인스턴스를 스프링 애플리케이션 컨텍스트에 등록한다.

나는 주로 데이터베이스 등으로 실제 값을 저장하고 수정하여 서비스 로직을 확인해보길 원했는데, 이 경우엔 `@SpringBootTest`을 사용해야한다.
테스트 종료 시 생성된 어플리케이션 컨텍스트와 리스소 정리를 정리해준다.

  


## @MockBean

```java

MockMvc mvc;

@MockBean
MemberService memberService;

```
위 테스트 코드를 통해 `@MockBean`에 역할에 대해 좀 더 알아본다.

`@MockBean`으로 `memberService`라는 가짜 객체를 만들어 애플리케이션 컨텍스트에 추가한다. 추가된 memberservice는 실제 행위는 하지 않고 `Mockito`나 `BDDMockito`를 사용하여 원하는 행위를 할 수 있도록 정의 가능하다. 

> Mocktio와 BDDMockito
> `Mockito`는 객체의 행동을 Mock하기 위한 프레임워크로 주로 `when.().thenReturn`을 사용한다.
> `BDDMockito`는 `Behaviour-Driven Development(BDD)` 스타일의 테스팅을 지원하기 위해 Mockito에 추가된 확장 기능으로 주로, `Given-When-Then` 패턴을 사용한다.

```java

AlcoholDetailsDto alcoholDetails = AlcoholDetailsDto.of( alcohol, alcohol.getFileName(), "3", List.of(), List.of(), true);

given(alcoholService.getAlcoholDetails(anyLong(), anyLong())).willReturn(alcoholDetails);

```

만약 위 코드는 `BDDMockito` 스타일의 코드로 행위를 정의한다면 , 위 코드처럼 작성하여 `given`메소드로 `getAlcoholDetails`을 실행 시 `alcoholDetails`을 반환하도록 행위를 정의할 수 있다.

## @MockMvc(슬라이스 테스트)

```java

MockMvc mvc;

@BeforeEach
public void setup() {

    this.mvc = MockMvcBuilders.webAppContextSetup(context)
        .addFilter(new CharacterEncodingFilter("UTF-8", true))
        .alwaysDo(print())
        .build();
}

```
`@MockMvc`는 HTTP에 대해 모의로 테스트할 때 사용한. 객체를 만들 땐 웹 컨텍스트, 인코딩, 출력 설정 등을 할 수 있다.

## Mockito란?

앞서 계속 언급된 Mockito에 대해 알아본다. Mockito란 개발자가 동작을 직접 제어할 수 있는 가짜 객체를 지원하는 테스트 프레임워크이다.

가짜 객체의 의존성 제공하기 위해 크게 3가지 어노테이션을 사용한다.

- `@InjectMocks`: @Mock 또는 @Spy로 생성된 모의 객체를 필드에 자동으로 주입한다

- `@Mock`: 지정된 클래스의 모의 객체를 생성한다. 테스트하고자 하는 클래스의 외부 의존성을 모의로 대체할 때 사용한다.

- `@Spy`: `Stub`하지 않은 메소드들은 원본 메소드 그대로 사용하는 어노테이션이다.

  

예시)

`UserController`에 대한 단위 테스트 작성 시 `UserService`를 사용하고 있다면 `@Mock` 어노테이션을 통해 가짜 `UserService`를 만들고, `@InjectionMocks`를 통해` UseController`에 주입 할 수 있다.

  

## Stub로 결과 처리

의존성이 있는 객체는 가짜 객체를 주입하여 어떤 결과를 반환하라고 정해진 답변을 지정해준다.

- `doReturn()`: 가짜 객체가 특정한 값을 반환해야 하는 경우에 사용한다. `doReturn(value).when(mock).method()`

- `doNothing()`: 가짜 객체가 아무 것도 반환하지 않는 경우(void)에 사용한다. `doNothing().when(mock).method()`

- `doThrow()`: 가짜 객체가 예외를 발생시키는 경우 사용한다.

## Mockito와 Unit의 결합

테스트 클래스에 `@ExtendWidth(MockitoExtension.class)`를 달아줘야 `Mockito`와 `JUnit` 테스팅 프레임워크 결합이 가능해진다.

아래 예제에서는 `@ExtendWidth(MockitoExtension.class)`으로 Mockito와 Junit을 결합하였고, 컨트롤러 테스트 시 HTTP 호출을 Mocking하기 위해 `MockMvc`를 사용하였다. 

테스트 대상인 `userController`는 `@InjectionMocks`로 인스턴스 객체를 생성하고, `@Mock`을 달아주어 `UserSerivce`를 `userController` 필드에 자동으로 넣어주도록 한다.

```java

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

   @InjectMocks
   private UserController userController;

   @Mock
   private UserService userService;
   
   private MockMvc mockMvc;

  

   @BeforeEach
   public void init() {
       mockMvc = MockMvcBuilders.standaloneSetup(userController).build();

  }
  ... 

} 

```

  

## @WebMvcTest(컨트롤러 테스트)

```java

@WebMvcTest(controllers = MemberController.class)
class MemberControllerTest {

```

`@SpringBootTest`는 모든 빈을 로드하기 때문에 컨트롤러 레이어만 테스트하고 싶을 때는 컨트롤러와 관련된 빈만 로드하는 `@WebMvcTest`를 사용하는 것이 좋다.

- @Controller
- @ControllerAdvice
- @JsonComponent
- @WebMvcConfigurer
- @HandlerMethodArgumentResolver
- 등등...

  
## 단위테스트 시 @SpringBootTest보다 @ExtendWith, @InjectionMocks을 사용하자

`@SpringBootTest`는 `@SpringBootApplication`이 붙은 애너테이션을 찾기 위해 하위 모든 빈을 `scan`하기 때문에 작은 단위의 테스트엔 적합하지 않다. 이테스트 프레임워크를 활용하여 필요한 부분을 Mocking하여 단위 테스트에 대해 작성하면 많은 수의 단위 테스트를 빠르게 자주 확인해 볼 수 있다.


## 알아두면 쓸모 있는 테스트 팁 
### @NullAndEmptySource

`null`과 `empty`를 함께 제공해주며 `@ValueSource`와 함께 사용 가능하다.

  

### @EnumSource

```java

@ParameterizedTest @EnumSource(value = TimeUnit.class, names = { "DAYS", "HOURS" }) void testWithEnumSourceInclude(TimeUnit timeUnit) { assertTrue(EnumSet.of(TimeUnit.DAYS, TimeUnit.HOURS).contains(timeUnit)); }

```

`enum` 값들을 테스트 매개변수로 사용할 수 있다.


### resultActions

실행된 요청에 대해, 기대하고 있는 결과 혹은 동작을 적용할 수 있다.  

#### andExpect()
기대하고 있는 내용을 수행할 수 있는 메소드이다. `Chaining Pattern`적용이 가능하고, 여러 조건이 틀릴 경우 가장 먼저 틀린 값을 반환한다.

### andExpectAll()
모든 테스트를 확인한다. 

### JsonPath
json 객체를 탐색하기 위한 표준 방법이다. `SpringBoot-test-starter` 의존성을 사용하면 자동으로 설정된다.

### ListOf
`Arrays.asList()`는 배열을 리스트로 변환하는 메서드이고, `List.of()`는 자바9 부터 지원하는 List 인터페이스의 디폴트 메서드이다.


### Mapper Mocking

`verify` : mock 객체의 원하는 메소드가 특정 조건으로 실행되었는지 검증할 수 있다.

예시)

db에 값이 없으면 insert한다라는 조건이 있을 때 `verfiy`에 메소드가 한번 호출되었는지 확인하여 `assert`를 할 수 있다.

`mybatis`에서 실제로 데이터베이스 호출을 안하고 mapper를 검증하고 싶을 땐, `mapper`를 `mocking`하여 아무런 동작하지 않게 만들고 `verify로` 조건에 맞게 동작하는지 검증할 수도 있다.

### Repository Mocking

서비스를 테스트할 때 `repository`를 `mocking`하여 `repository`를 아무런 동작을 하지 않게 만든다.

아무런 동작을 하지 않으니, repository에 특정 메소드가 호출되었을 때 어떤 값이 리턴될지는 정해줘야한다(Stub). 

다음으로 서비스 비지니스 로직을 실행하고, 결과를 기대한 리턴값이랑 동일한지 비교한다.

### Assert
`assertThat(actual).isEqualTo(expected);`

`actual`이라는 테스트 대상 객체를 받고, `expected`와 같아야 한다. `isEqualTo`는 `actual`값이 `expected`와 같으면 테스트는 통과 시킨다.


```java
assertThat(res)  
.usingRecursiveComparison()  
.isEqualTo(expected);

```

추가로, `usingRecursiveComparison`메소드로 객체 간 `deep comparison`을 수행하여 객체의 필드와 하위 필드까지 재귀적으로 비교해 볼 수 있다.


## 참고

[컨트롤러 테스트](https://mangkyu.tistory.com/145)

[서비스테스트](https://velog.io/@hellonayeon/spring-boot-service-layer-unit-testcode)