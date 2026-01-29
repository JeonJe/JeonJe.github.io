---
title: "스프링 핵심 원리: IoC, DI, 컴포넌트 스캔, 빈 생명주기"
description: "객체 지향 프로그래밍의 SOLID 원칙, 스프링 컨테이너와 빈 관리, 의존관계 주입 방법, 싱글톤 패턴, 컴포넌트 스캔, 빈 스코프에 대한 이해"
categories: spring 원리
tags: [Spring, IoC, DI, 스프링컨테이너, 싱글톤, 컴포넌트스캔, 빈생명주기, SOLID, 의존관계주입, 빈스코프]
---

>   [김영한님의 스프링 핵심 원리 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)에서 학습한 내용을 정리한 글입니다.

# 스프링 기본 원리 - 기본편
# 좋은 객체 지향 프로그래밍이란?

## 객체 지향 특징

- 추상화
- 캡슐화
- 상속
- 다형성
  - 유연하고 변경이 용이하다
    - 레고 블럭 조립하듯 키보드, 마우스 갈아 끼우듯이 개발한다
    - 컴포넌트를 쉽고 유연하게 변경하면서 개발할 수 있는 방법
    - 역할과 구현으로 구분한다.
      - 클라이언트는 대상의 역할(인터페이스)만 알면 됨
      - 클라이언트는 구현 대상의 내부 구조를 몰라도 됨
      - 클라이언트는 구현 대상의 내부 구조가 변경되어도 영향을 받지 않음
      - 클라이언트는 구현 대상 자체를 변경해도 영향을 받지 않음
    - 자바 언어
      - 역할 = 인터페이스
      - 구현 = 인터페이스를 구현한 클래스, 구현 객체
      - 객체를 설계할 때 역할과 구현을 명확히 분리
      - 객체 설계시 역할(인터페이스)을 먼저 부여하고, 그 역할을 수행하는 구현 객체 만들기
      - 다형성
        - 다형성으로 인터페이스를 구현한 객체를 실행 시점에 유연하게 변경할 수 있음
        - 물론 클래스 상속 관계도 다형성, 오버라이딩 적용 가능
  - 한계점
    - **역할(인터페이스)자체가 변하면, 클라이언트, 서버 모두에 큰 변경이 발생**
    - 인터페이스를 안정적으로 잘 설계하는 것이 중요 (가장 변화가 없는 방식으로)
  - 스프링과 객체 지향
    - 스프링은 다형성을 극대화해서 이용할 수 있게 도와줌
    - 스프링에서 이야기하는 제어의 역전(IoC), 의존관계 주입(DI)은 **다형성을 활용해서 역할과 구현을 편리하게 다룰 수 있도록 지원**
    - 스프링을 사용하면 마치 레고 블럭을 조립하듯이 구현을 편리하게 변경할 수 있다.

## **좋은 객체 지향 설계의 5가지 원칙(SOLID)**

1. **SRP 단일 책임 원칙(Single Responsibility Principle)**
  - 한 클래스는 하나의 책임만 가져야 한다
  - 하나의 책임이라는 것은 모호
    - 클 수도 있고, 작을 수도 있음
    - 문맥과 상황에 따라 다르다.
  - **중요한 기준은 변경이다. 변경이 있을 때 파급효과가 적으면 단일 책임 원칙을 잘 따른 것**
  - 예 UI 변경, 객체의 생성과 사용을 분리
2. OCP 개방-폐쇠 원칙(Open/Closed principle)
  - 소프트웨어 요소는 확장에는 열려 있으나 변경에는 닫혀 있어야 함
  - 다형성을 활용
    - 인터페이스를 구현한 새로운 클래스를 하나 만들어서 새로운 기능을 구현
3. LSP 리스코프 치환 원칙(**Liskov substitution principle)**
  - 프로그램의 객체는 프로그램의 정확성을 깨트리지 않으면서 하위 타입의 인스턴스로 바꿀 수 있어야 한다
  - **다형성에서 하위 클래스는 인터페이스 규약을 다 지켜야 한다는 것**, 다형성을 지원하기 위한 원칙, 인터페이스를 구현한 구현체를 믿고 사용하려면 이 원칙이 필요함
  - 즉, 자동차 인터페이스에서 엑셀은 앞으로 가라는 기능이지 뒤로 가게 구현하면 LSP 위반하는 것임. 느리더라도 앞으로 가면 충족
4. ISP 인터페이스 분리 원칙(**Interface segregation principle)**
  - 특정 클라이언트를 위한 인터페이스 여러 개가 범용 인터페이스 하나보다 낫다
  - 자동차 인터페이스 → 운전 인터페이스, 정비 인터페이스로 분리
  - 사용자 클라이언트 → 운전자 클라이언트, 정비사 클라이언트로 분리
  - 분리하면 정비 인터페이스 자체가 변해도 운전자 클라이언트에 영향을 주지 않음
  - 인터페이스가 명확해지고, 대체 가능성이 높아짐
5. DIP 의존관계 역전 원칙(Dependency Inversion Principle)
  - 프로그래머는 “추상화에 의존해야지, 구체화에 의존하면 안된다" 의존성 주입은 이 원칙을 따르는 방법 중 하나
  - 쉽게 이야기해서 구현 클래스에 의존하지 말고, 인터페이스에 의존하라는 뜻
  - 앞서 이야기한 역할에 의존하게 해야한다는 것과 동일

- 객체 지향의 핵심은 다형성임. 하지만
  - 다형성만으로는 쉽게 부품을 깔아 끼우듯이 개발할 수 없음
  - 다형성만으로는 구현 객체를 변경할 때 클라이언트 코드도 함께 변경
  - **다형성 만으로는 OCP, DIP를 지킬 수없음**

스프링 이야기에 객체 지향 이야기가 많이 나오는 이유는 무엇일까? 스프링은 다음 기술로`다형성 + OCP + DIP`를 가능하게 지원해준다.

1. DI(Dependency Injection) : 의존관계, 의존성 주입
2. DI 컨테이너 지원

## IoC, DI, Container

- 프로그램의 제어 흐름을 직접 제어하는 것이 아니라, 외부에서 관리하는 것을 제어의 역전(IoC)라고 한다.

**프레임워크 vs 라이브러리**

- 프레임워크 : 개발자가 작성한 코드를 제어하고, 대신 실행(JUnit)
- 라이브러리 : 개발자가 작성한 코드가 직접 제어의 흐름을 담당

## 스프링을 사용한 DI

1. AppConfig에 설정을 구성한다는 뜻의 `@Configuration` 을 붙인다.
2. 각 메서드에 `@Bean` 을 붙여 스프링 컨테이너에 스프링 빈으로 등록한다.

# 스프링 컨테이너와 스프링 빈

## 스프링 컨테이너 생성

- `ApplicationContext`를 **스프링 컨테이너**라고 하고, 인터페이스이기 때문에 다형성이 적용되어 있다.
- 주의할 점은 빈 이름은 항상 다른 이름으로 부여 해야하며 실무에서는 단순 명확하게 이름을 지어야 한다.
- **스프링은 빈을 생성하고, 의존관계를 주입하는 단계가 나누어져 있다. 하지만** 자바 코드로 스프링 빈을 등록하면 생성자를 호출하면서 의존관계 주입도 한번에 처리된다.

## 빈 조회

- 스프링 컨테이너에서 스프링 빈을 찾는 가장 기본적인 조회방법은`ac.getBean(빈이름,타입)`, `ac.getBean(타입)`으로 찾을 수 있다.
- **동일한 타입이 둘 이상이 있으면 스프링이 어떤 것을 선택할지 모르기 때문에 오류가 발생한다.** 이때는 빈 이름을 지정해줘야 한다.
- 부모 타입으로 조회하면 자식 타입도 함께 조회된다.

### `BeanFactory`

- 스프링 컨테이너의 최상위 인터페이스
- **스프링 빈을 관리하고 조회하는 역할**을 담당 (getBean())
- 위에서 사용한 대부분의 기능은 BeanFactory가 제공하는 기능

### `ApplicationContext`

- BeanFactory 기능을 모두 상속받아 제공
- BeanFactory와의 차이는 **관리 조회 및 부가 기능을 더 제공**

# 싱글톤 컨테이너

- 클래스 인스턴스가 딱 1개만 생성되는 것을 보장하는 디자인 패턴
- private 생성자를 사용해서 외부에서 임의로 **new키워드를 사용하지 못하도록 막아한다.**

## 싱글턴 패턴의 문제

1. 구현하는 코드 자체가 많이 들어간다.
2. 의존관계상 클라이언트가 구체 클래스에 의존하기 때문에 DIP를 위반한다.
3. 클라이언트가 구체 클래스에 의존해서 OCP 원칙을 위반할 가능성이 높다.
4. 테스트하기 어렵다.
5. 내부 속성을 변경하거나 초기화하기 어렵다.
6. private 생성자로 자식 클래스를 만들기 어렵다.
7. 유연성이 떨어집니다.

**스프링 빈이 싱글톤으로 관리 되는데 스프링 컨테이너는 위와같은 싱글톤 패턴의 문제점을 없애주면서 싱글톤 패턴으로 객체를 관리하도록 도와준다.**

## 싱글톤 방식의 주의점

여러 클라이언트가 하나의 같은 객체 인스턴스를 공유하기 때문에 싱글톤 객체는 상태를 유지(stateful)하게 설계하면 안된다. **항상 무상태(stateless)로 설계해야한다.**

## Configuration과 바이트코드 조작

- 스프링 빈이 싱글톤이 되도록 스프링이 보장해주어야 하는데, 자바 코드까지 조작하기는 어렵다.
- 싱글톤 적용을 위해 스프링은 **클래스의 바이트코드를 조작하는 라이브러리**를 사용한다.
- 생성한 객체가 아닌 `appConfig@CGLIB` 클래스가 싱글톤이 되도록 보장한다.
- Bean이 붙은 메서드 마다 이미 스프링 빈이 존재하면 존재하는 빈을 반환하고, 스프링 빈이 없으면 생성해서 스프링 빈으로 등록하고 반환하는 코드가 동적으로 만들어진다
- @Configraution을 사용하지않고 @Bean만 적용할 경우 순수 빈으로 등록되고, 싱글톤은 보장되지 않는다.
- **스프링 설정 정보는 항상 @Configuration을 사용해야한다.**

# 컴포넌트 스캔

## 컴포넌트 스캔과 의존관계 자동 주입 시작하기

- 스프링은 설정 정보가 없어도 자동으로 스프링 빈을 등록하는 컴포넌트 스캔과 의존관계를 자동으로 주입하는 `@Autowired` 기능을 제공한다.
- 컴포넌트 스캔을 사용하려면 클래스에 `@ComponentScan`을 붙여야 한다. 스캔의 대상은 `@Component` 가 붙은 클래스이다.

## 컴포넌트 스캔과 자동 의존관계 주입의 동작 순서

- `@ComponentScan` 은 `@Component` 가 붙은 모든 클래스를 스프링 빈으로 등록한다.
  - 빈의 기본 이름은 클래스명을 맨 앞 글자를 소문자로 변경하여 사용한다.
  - 이름을 지정하고 싶으면 `@Component(”이름”)`
- `@Autowired` 은 스프링 컨테이너가 자동으로 해당 스프링 빈을 찾아서 생성자에  주입한다.
  - 생성자를 모두 찾아 주입해준다.
  - 기본 조회 전략은 타입이 같은 빈을 찾아서 주입한다
- 탐색위치 지정 시 basePackages를 사용한다.
- 권장 사용 방법
  - **패키지 위치를 지정하지 않고, 설정 정보 클래스의 위치를 프로젝트 최상단에 둔다.**

## 컴포넌트 스캔 기본 대상

- @Component : 컴포넌트 스캔에서 사용
- @Controller : 스프링 MVC 컨트롤러에서 사용
- @Service : 스프링 비지니스 로직에서 사용
  - 비지니스 계층 인식에 도움
- @Repository : 스프링 데이터 접근 계층에서 사용
  - 데이터 계층의 예외를 스프링 예외로 변환
- @Configuration : 스프링 설정 정보에서 사용
  - 스프링 빈이 싱글톤을 유지하도록 추가 처리

## 필터

- `includeFilters` : 컴포넌트 스캔 대상을 추가로 지정한다.
- `excludeFilters` : 컴포넌트 스캔에서 제외할 대상을 지정한다.

## 중복 등록과 충돌

### 자동 빈 등록 vs 자동 빈 등록

- `ConflictingBeanDefinitionException` 예외가 발생한다.

### 자동 빈 등록 vs 수동 빈 등록

- 수동 빈 등록이 우선권을 가져 자동 빈을 오버라이딩하면서 로그를 남긴다.

```
Overriding bean definition for bean 'memoryMemberRepository' with a different
 definition: replacing
```

- 위 같은 경우엔 버그를 찾기가 어려워지기 때문에 최근 스프링 부트는 자동 빈 등록과 수동 빈 등록 시 충돌이 나면 오류가 발생하도록 기본 값을 변경하였다.

# 의존관계 자동 주입

## 다양한 의존관계 주입 방법

의존자 주입은 크게 4가지 방법이 있다

- 생성자 주입
- 수정자 주입(setter)
- 필드 주입
- 일반 메서드 주입

### 생성자 주입

- 생성자 호출시점에만 호출되기 때문에 불편 ,필수 의존관계에서 사용한다
- **생성자가 딱 1개가 있을 경우 `@Autowired`를 생략해도 자동주입된다. (스프링 빈에 등록되어있는 경우)**

### 수정자 주입

- 필드의 값을 변경하는 수정자 메서드를 이용하여 의존관계를 주입한다.
- 선택, 변경 가능성이 있는 의존관계에 사용한다.

### 필드 주입

- 필드에 바로 주입한다
- 코드가 간결하지만 외부에서 변경이 불가능해서 테스트하기가 어렵다. DI 프레임워크가 없으면 아무것도 할 수 없기 때문에 사용을 하지 않는 것을 권장한다.
- 테스트 코드나 `@Configuration` 같은 곳에서만 특별한 용도로 사용한다.

### 일반 메서드 주입

- 일반 메서드를 통해서 주입 받을 수 있다. 한 번에 여러 필드를 주입 받을 수 있으나 일반적으로 잘 사용하지 않는다.

### 옵션 처리

- `@Autowired(required=false)` : 자동 주입할 대상이 없으면 수정자 메서드 자체가 호출 안된다.
- `org.springframework.lang.@Nullable` : 자동 주입할 대상이 없으면 null이 입력된다.
- `Optional<>` : 자동 주입할 대상이 없으면 `Optional.empty` 가 입력된다.

### 생성자 주입을 권장

아래와 같은 이유로 생성자 주입을 권장한다

- 불변
  - 대부분은 애플리케이션 종료시까지 의존관계를 변경할 일이 없다.
- 누락
  - 생성자 주입을 사용하면 주입 데이터를 누락 했을 때 컴파일 오류가 발생하여 빠르게 오류를 인지 할 수 있다.
- final
  - 생성자 주입 사용 시 필드에 final 키워드를 사용하여 값이 설정되지 않은 경우를 방어할 수 있다.
  - 다른 주입 방식은 final 사용이 불가하다.

## 롬복과 최신 트랜드

롬복 라이브러리를 사용하면 생성자 주입을 필드 주입처럼 편하게 사용할 수 있다.

`@RequiredArgsConstructor` 기능을 사용하면 final이 붙은 필드를 모아서 생성자를 자동으로 만들어준다.

## 조회 빈이 2개 이상일 경우

`@Autowired` 는 타입으로 조회를 하는데 선택된 빈이 2개 이상이면 `NoUniqueBeanDefinitionException` 가 발생한다.

## @Autowired 필드명, @Qualifier, @Primary

조회 대상 빈이 2개 이상일 때 해결 방법은 크게 3가지이다.

- **@Autowired 필드 명 매칭**
  - 여러 빈이 있으면 필드 이름, 파라미터 이름으로 빈 이름을 추가 매칭할 수 있다

    ```java
     @Autowired
     private DiscountPolicy **rateDiscountPolicy**
    
    ```

- **@Qualifier → @Qualifier끼리 매칭 → 빈 이름 매칭**
  - `@Qualifier` 는 추가 구분자를 붙여주는 방법이다. 빈 이름을 변경 하는 것은 아니고 추가적인 방법을 제공하는 것이다.

    ```java
    @Component
    @Qualifier("mainDiscountPolicy")
    public class RateDiscountPolicy implements DiscountPolicy {}
    ```

  생성자 주입시

    ```java
     @Autowired
     public OrderServiceImpl(MemberRepository memberRepository,
                             @Qualifier("mainDiscountPolicy") DiscountPolicy
     discountPolicy) {
         this.memberRepository = memberRepository;
         this.discountPolicy = discountPolicy;
    }

    ```
    
    Qualifier(”이름”) 을 못찾을 경우 Autowired와 비슷하게 “이름”으로 스프링 빈을 추가로 찾는다. Qualifier는 Qualifier를 찾는 용도로만 사용하는게 명확하게 사용할 수 있다.
    
- **@Primary 사용**
  - 우선순위를 정하는 방법이다. Autowired시 `@Parmary`가 우선권을 갖는다.

    ```java
    @Component
     @Primary
     public class RateDiscountPolicy implements DiscountPolicy {}
     @Component
     public class FixDiscountPolicy implements DiscountPolicy {}
    ```

- 메인은 @Primary를 사용하고 서브는 @Qualifier를 사용하면 깔끔하게 코드를 유지할 수 있다.
- Primary보다는 Qualifier가 더 상세하기 때문에 더 우선순위가 높다

## 어노테이션 직접 만들기

`@Qualifier("mainDiscountPolicy")` 라고 사용할 경우 이름이 문자이기 때문에 컴파일 시 타입 체크가 안된다. 이럴 경우 어노테이션을 만들어 보완할 수 있다.

```java
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER,
 ElementType.TYPE, ElementType.ANNOTATION_TYPE})
 @Retention(RetentionPolicy.RUNTIME)
 @Documented
 @Qualifier("mainDiscountPolicy")
 public @interface MainDiscountPolicy {
}
```

## 조회한 빈이 모두 필요 할 때 List, Map 사용하기

조회한 빈이 모두 필요한 경우가 있다. Map을 사용하면 전략 패턴을 쉽게 구현할 수 있다.

```java
 @Test
    void findAllBean() {
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AutoAppConfig.class, DiscountService.class);

        DiscountService discountService = ac.getBean(DiscountService.class);
        Member member = new Member(1L, "userA", Grade.VIP);
        int discountPrice = discountService.discount(member, 1000, "fixDiscountPolicy");
        assertThat(discountService).isInstanceOf(DiscountService.class);
        assertThat(discountPrice).isEqualTo(1000);
    }

    static class DiscountService {
        private final Map<String, DiscountPolicy> policyMap;
        private final List<DiscountPolicy> policies;

        @Autowired
        public DiscountService(Map<String, DiscountPolicy> policyMap, List<DiscountPolicy> policies) {
            this.policyMap = policyMap;
            this.policies = policies;
        }

        public int discount(Member member, int price, String discountCode) {
            DiscountPolicy discountPolicy = policyMap.get(discountCode);
            return discountPolicy.discount(member, price);
        }
```

## 자동, 수동의 올바른 실무 운영 기준

- 편리한 자동 기능을 기본으로 사용하자
- 수동 빈 등록은 언제 사용하는게 좋을까?
  - 애플리케이션에 광범위하게 영향을 미치는 기술 지원 객체(AOP, DB 연결, 로그등)는 수동 빈으로 등록해서 설정 정보에 바로 나타나게 하는 것이 유지보수에 좋다.
  - 비지니스 로직에서 다형성을 적극활용하면 자동 등록은 다른 개발자가 한 눈에 파악하기 어렵기 때문에 수동으로 빈을 등록하거나 자동 등록 사용 시 특정 패키지에 같이 묶어두는 것이 좋다.

# 빈 생명주기 콜백

## 빈 생명주기 콜백 시작

- 스프링 빈은 1.객체 생성 다음에 2. 의존관계 주입을 한다. (생성자 주입은 예외)
- 스프링은 의존관계 주입이 완료되면 스프링 빈에게 **콜백 메서드**를 통해 초기화 시점을 알려주는 기능을 제공한다.
- 또한, 스프링 컨테이너가 종료되기 직전에 소멸 콜백을 준다.

## 스프링 빈 이벤트 라이프 사이클

1. 스프링 컨테이너 생성
2. 스프링 빈 생성
3. 의존관계 주입
4. **초기화 콜백**
5. 사용
6. **소멸 전 콜백**
7. 스프링 종료

객체의 생성과 초기화는 분리하는 것이 좋다.

- 생성자는 필수 정보를 받고, 메모리를 할당해서 객체를 생성하는 책임을 가진다.
- 초기화는 생성된 값으로 외부 커넥션 등 무거운 동작을 수행한다.

**만약 초기화가 내부 값만 변경하는 단순작업일 경우엔 생성자에서 한 번에 처리하고, 그 외 무거운 초기화는 생성자와 분리하여 진행하는 것이 유지보수에 유리하다.**

## @PostConstruct, @PreDestroy

스프링에서 권고하는 초기화 소멸 방법이다.

```java
    @PostConstruct
    public void init() {
        System.out.println("init");
        connect();
        call("초기화 연결 메시지");
    }
    @PreDestroy
    public void close(){
        System.out.println("close");
        disconnect();
    }

```

- 자바 표준으로 스프링이 아닌 다른 컨테이너에서도 사용이 가능하다.
- 단점은 외부 라이브러리에는 적용을 하지 못한다. 만약 외부 라이브러리에 적용이 필요하면 `initMethod`, `destroyMethod`를 사용하면 된다.

# 빈 스코프

## 빈 스코프란

빈이 존재할 수 있는 범위를 뜻한다

스프링은 아래 빈 스코프를 지원한다.

- 싱글톤 : 기본 스코프로 스프링 컨테이너의 시작과 종료까지 유지된다
- 프로토타입 : 스프링 컨테이너는 프로토 타입 빈의 생성과 의존관계 주입만 관여한다. 매우 짧은 범위이다
- 웹 스코프
  - request : 웹 요청이 들어오고 나갈 때 까지 유지되는 스코프이다
  - session : 웹 세션이 생성되고 종료 될 때까지 유지되는 스코프이다
  - application : 웹 서블릿 컨텍스트와 같은 범위로 유지되는 스코프이다.

## 프로토타입 스코프

싱글톤 스코프의 빈을 조회하면 스프링 컨테이너는 항상 같은 인스턴스의 스프링 빈을 반환한다. 반면, 프로토타입 스코프는 항상 새로운 인스턴스를 생성해서 반환한다.

스프링 컨테이너는 프로토타입 스코프의 빈을 생성, 의존관계 주입, 초기화까지만 담당한다. 이후의 관리는 클라이언트에서 해줘야한다. 따라서 `@PreDestory` 같은 종료 메서드가 호출되지 않는다.

### 싱글톤 빈과 함께 사용 시 문제점

- 싱글톤에서 프로토타입 빈을 사용할 경우 **생성 시점에 프로토 타입을 주입한다.**
- 단 싱글톤 빈에 주입된 프로토타입 빈을 “사용”할 경우엔 새로운 프로토타입 빈이 아닌 주입된 동일 프로토타입 빈을 사용한다.

### 싱글톤 빈과 함께 사용시 Provider 사용

- 지정한 빈을 컨테이너 대신 찾아주는 Dependency Lookup(DL) 서비스인 `ObjectProvider`를 사용한다.

## 웹 스코프

웹 환경에서 동작하고, 스프링이 해당 스코프의 종료시점까지 관리 해준다. 따라서 종료 메서드가 호출된다.

### Request 스코프

각 HTTP 요청 마다 별도의 빈 인스턴스가 생성 및 관리된다.

### 스코프와 Provider

스프링을 구동하는 시점에서 Request 스코프를 주입하게 되면 Request 스코프 시작은 HTTP 요청이 시작될 때이기 때문에 오류가 발생하게 된다. 이럴 때 Provider를 사용한다. ObjectProvider는 `ObjectProvider.getObject`를 호출하는 시점까지 request 빈의 생성을 지연 시킬 수 있다.

## 스코프와 프록시

```java
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
```

- 적용 대상이 클래스이면 TAGEST_CLASS, 적용 대상이 인터페이스면 INTERFACES로 프록시 모드를 설정한다.
- 이 설정을 사용하면 CGLIB 라이브러리로 타겟을 상속받은 가짜 프록세 객체를 만들어 주입한다.  가짜 프록시 객체에는 요청이 들어오면 해당 시점에서 진짜 빈을 요청하는 위임 로직이 들어있다.

프로바이더와 프록시에 중요 개념은 진짜 객체 조회를 꼭 필요한 시점까지 지연 처리 하는 것이다.
