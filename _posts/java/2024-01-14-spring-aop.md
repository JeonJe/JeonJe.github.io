---
title: "Spring AOP 완벽 이해: 개념부터 실전 활용까지"
description: "Spring AOP의 핵심 개념, 프록시 기반 동작 원리, 포인트컷 표현식, 어드바이스 유형 및 실무 활용 사례 정리"
categories: java spring
tags: [spring, aop, 관점지향프로그래밍, 프록시, 포인트컷, 어드바이스, 조인포인트, 애스펙트, 트랜잭션관리, 로깅]
---

## Spring AOP
스프링 AOP를 사용하면 로깅, 보안, 트랜잭션 등 공통적인 관심사를 모듈화하여 코드 중복을 낮추고, 유지 보수성을 높힐 수 있다.

> **AOP(Aspect-Oriented Programming)** 은 객체 지향 프로그래밍(OOP)를 보완하는 기술로 메소드나 객체의 기능을 핵심 관심사(Core Concern)와 공통 관심사(Cross-cutting Concern)로 나누어 프로그래밍하는 것을 뜻한다.

여러 클래스에서 반복하는 코드는 모듈화하여 공통 관심사로 분리하여 Aspect로 정의하고, 정의한 Aspect를 적용할 메소드나 클래스에 적용하여 핵심 관심사와 공통 관심사를 분리 시킬 수 있다.

### Spring AOP 주요 용어
![](https://i.imgur.com/aq5WiHQ.png)
- Aspect : 공통적인 기능을 모듈화 한 것
- Advice : Aspect의 기능을 정의한 것, 메소드 실행 전/후/ 예외 처리 발생 시 실행되는 코드를 의미
- Target : Aspect 적용 대상 (메소드, 클래스 등)
- Joint Point : Aspecet가 적용될 수 있는 시점(메소드 실행 전, 후 등)
- Point Cut : Advice를 적용할 메소드의 범위를 지정


### 주요 어노테이션
- `@Aspect` : 해당 클래스를 Apect로 사용 
- `Around` : 타겟 메소드 실행 전 / 후 / 예외 발생 시 Advice 실행 
- `Before` : 타겟 메소드가 실행되기 전에 Advice 실행
- `After` : 타겟 메소드가 실행된 후에 Advice 실행
- `AfterReturning` : 타겟 메소드가 정상적으로 실행되고 반환된 후에 Advice 실행
- `AfterThrowing` : 타겟 메소드에서 예외 발생 시 Advice 실행

### 동작 원리 
우선 스프링 AOP를 이해하기 위해 프록시 팩토리와 빈 후처리기에 대해 알아본다.

### 프록시 팩토리 
클라이언트에서 프록시를 요청하면 JDK 동적 프록시나, CGLIB 동적 프록시를 선택해야한다.
JDK 동적 프록시는 인터페이스 기반이고, CGLIB는 구체 클래스 기반이기 때문에 따로 만들고 중복으로 관리해야 하는 문제점이 있다. 이를 해결하기 위해 프록시 팩토리를 사용한다.
![](https://i.imgur.com/dwvPBPE.png)

프록시 팩토리에서는 인터페이스가 있으면 JDK 동적 프록시를 사용하고, 클래스만 있으면 CGLIB를 사용하도록 선택할 수 있다. 하지만 JDK 동적 프록시의 동작을 정의하는 `InvocationHandler` 와 `MethodInterceptor`는 각각 구현해야하는 문제가 있다. 이 문제를 해결하기 위해 부가 기능을 적용할 때 `Advice`라는 개념을 사용한다.

### Advice 도입

![](https://i.imgur.com/aM2JClg.png)

Advice 개념으로 개발자는 Advice만 구현하면 되고, 구현을 위해 MethodInterceptor 인터페이스를 구현한다.
```java
package org.aopalliance.intercept;
public interface MethodInterceptor extends Interceptor {
    Object invoke(MethodInvocation invocation) throws Throwable;
}
```

- **MethodInterceptor**
	- CGLIB의 프록시 기능을 정의 할 때 사용하는 이름과 동일하지만 패키지가 다르다.
	- MethodInterceptor는 Interceptor를 상속하고, Interceptor는 Advice를 상속한다.
- **MethodInvocation** invocation
	- 다음 메서드를 호출하는 방법, 현재 프록시 객체 인스턴스, 메소드 정보 등이 포함되어 있다.
- **invocation.proceed()**
	- 타겟 클래스의 대상 메소드를 호출하고 결과를 반환받는다.
	- JDK 동적 프록시와 CGLIB를 사용할 때는 인자로 target 과 args를 전달해야 했지만, 프록시 팩토리를 사용하면 프록시를 생성하는 단계에서 target과 args를 전달하기 때문에 invocation이 이미 가지고 있다.


스프링 AOP는 최적화를 위해 하나의 프록시에 여러 Advisor를 사용한다. 즉, 타겟마다 단 한개의 프록시만 생성한다. 

스프링에서 가장 많은 종류의 포인트컷을 제공하고 그 중 aspectJ가 대표적이다.

프록시 팩토리를 사용함으로 써 인터페이스던지, 구체 클래스던지에 관계없이 프록시를 생성 할 수 있지만, 사용에 너무 많은 설정이 필요하다.
만약 스프링 빈이 100개가 있을 때, 프록시를 등록해 부가 기능을 사용하려고 하면, 100개의 동적 프록시 생성 코드를 만들어 프록시를 반환하도록 해야한다. 만약 이 빈들이 컴포넌트 스캔으로 올라간 경우엔 프록시 자체 적용이 불가능한 문제가 생겨나고 이를 위해 **빈 후처리기**를 사용해야 한다.

### 빈 후처리기 
![](https://i.imgur.com/jOHPB1B.png)

스프링이 빈 저장소에 등록하기 위해 생성한 객체를 등록하기 직전에 조작할 때 사용한다.


### **동작과정**
- @Bean 어노테이션으로 빈 대상이 되는 객체를 생성한다.
- 생성된 객체는 빈 저장소에 등록하기 직전에 빈 후처리기에 전달된다.
- 빈 후처리기는 이 빈 객체를 조작하거나 다른 객체로 바꿔칠 수 있다.
- 이제 빈 후처리기는 객체를 빈 저장소에 반환하고 이 객체는 빈 저장소에 저장된다.

이게 프록시와 무슨 상관이 있냐하면, 이 빈 후처리기에서 프록시를 생성해 반환하면 빈 저장소에는 프록시가 빈으로 등록된다. 

스프링이 제공하는 빈 후처리기를 사용하면 
`AnnotationAwareAspectJAutoProxyCreator` 라는 빈 후처리기가 스프링 빈에 자동으로 등록되는데, 이 것이 프록시를 생성해주는 빈 후처리기이고, 스프링 빈으로 등록된 Advisor들을 자동으로 찾아서 프록시를 반환한다. 

빈 후처리기의 동작과정은 아래와 같다.
![](https://i.imgur.com/JqLSg1c.png)

1. `@Bean` 어노테이션으로 스프링 빈 객체를 생성한다.
2. 생성된 객체는 빈 저장소에 등록되기 전에 빈 후처리기에 전달된다.
3. 모든 Advisor 빈을 조회하고, Pointcut을 통해 클래스와 메서드 정보를 매칭하며 프록시에 적용할 타겟인지 체크한다.
4. 모든 Advisor 중 하나의 조건이라도 만족하면, 프록시를 생성하고, 이 프록시를 빈 저장소로 반환한다. 만약 프록시 대상이 아니라면, 생성된 객체를 빈 저장소로 반환한다.
5. 빈 저장소는 객체를 받아서 빈 저장소에 등록한다.

> 여러 Advisor 대상이여도, 프록시는 1개만 만들어서 그 안에 Advisor를 여러개 담는다.


## Pointcut 표현식
### 지시자의 종류 
- execution : 메소드 실행 조인 포인트를 매칭
- within : 특정 타입 내의 조인 포인트를 매칭
- args: 인자로 주어진 타입의 인스턴스의 조인 포인트 
- this : 스프링 빈 객체(스프링 AOP 프록시)를 대상으로 하는 조인 포인트 

등등이 있다.

### execution 문법
![](https://i.imgur.com/exPcAcX.png)

파라미터 매칭 규칙 
- `(String) : 메서드의 파라미터가 정확하게 String 타입의 파라미터이어야  포인트컷 대상`
- `() : 메서드의 파라미터가 없어야 포인트컷 대상`
- `(*) : 메서드의 파라미터 타입은 모든 타입을 허용하지만, 정확히 하나의 파라미터를 가진 메서드가 포인트컷 대상`
- `(*, *) : 메서드의 파라미터 타입은 모든 타입을 허용하지만, 정확히 두 개의 파라미터를 가진 메서드가 포인트컷 대상`
- `(..) : 메서드의 파라미터 수와 무관하게 모든 파라미터, 모든 타입을 허용한다. ( 파라미터가 없어도 된다. )`
- `(String, ..) : 메서드의 첫 번째 파라미터는 String 타입으로 시작해야 하고, 나머지 파라미터 수와 무관하게 모든 파라미터, 모든 타입을 허용한다. ( Ex:// (String) , (String, xxx) , (String, xxx, xxx) 허용 )`


## ASPECT 

`@Aspect` 어노테이션을 사용하면 Advisor를 쉽게 사용할 수 있다.
동작과정은 아래와 같다.
![](https://i.imgur.com/Avk0p74.png)

1. `@Bean` 으로 스프링 빈 대상이 되는 객체를 생성한다.
2. 생성된 객체를 빈 후처리기에 전달한다.
3. 모든 Advisor 빈을 조회한다.
4. @Aspect Advisor 빌더 내부에 저장된 모든 Advisor를 조회한다.
5. 조회된 Advisor가 포함된 포인트컷으로 클래스와 메소드 정보를 매칭하면서 프록시 대상인지 확인한다.
6. 하나라도 포인트컷 조건을 만족한다면, 프록시를 생성하고 빈 저장소로 반환한다.
7. 빈 저장소에 객체를 받아서 빈으로 등록한다.

> @Aspect는 단순히 Advisor를 쉽게 사용할 수록 도와주는 역할이다. 컴포넌트 스캔이 되는 것은 아니기 때문에 반드시 스프링 빈으로 등록을 해줘야한다.
> @Bean으로 등록하거나, @Component로 컴포넌트 스캔을 사용하거나 @Import를 사용한다.


## AOP를 어떻게 활용할 수 있을까?

개발 환경에서 서비스 테스트 시 비지니스 로직에 포함된 문자를 받고싶지 않을 때 문자 발송 관련 메소드에 AOP를 적용하여 문자 발송 ON/OFF 기능을 추가해보았다. 

```java
// Common > aop 

@Component
@Aspect
@Setter
public class IgnoreSmsAspect {

  private final SmsSendingConfiguration smsSendingConfiguration;

  @Autowired
  public IgnoreSmsAspect(SmsSendingConfiguration smsSendingConfiguration) {
    this.smsSendingConfiguration = smsSendingConfiguration;
  }

  @Pointcut(" @annotation(annotation) ")
  private void pointcut(IgnoreSmsCheck annotation) {}

  @Around("pointcut(annotation)")
  public Object methodExecutionTime(ProceedingJoinPoint joinPoint, IgnoreSmsCheck annotation) throws Throwable {

    if (smsSendingConfiguration.isSend()) {
      Object result = joinPoint.proceed();
      logger.debug("[SMS] Sending Enable");
      return result;
    }
    logger.debug("[SMS] Sending Disable");
    return null;
  }
}
```
`IgnoreSmsAspect` 클래스 생성자에 `SmsSendingConfiguration`을 주입한다. `SmsSendingConfiguration`에는 문자 발송에 대한 Flag를 저장하는 `isSend` 멤버 변수가 있다.
`IgnoreSmsAspect`에서는 포인트컷으로 `Advice`가 적용될 위치를 지정할 수 있고, `@IgnoreSmsCheck` 이 붙은 메소드에 적용이 될 수 있도록 작성한다.

`@Around` 어노테이션은 `IgnoreSmsCheck`에서 정의한 포인트컷에 해당하는 모든 메소드를 대상으로 실행 전, 후, 예외처리 시 실행할 수 있도록 할 수 있다.
`ProceedingJoinPoint` 는 AOP 프록시가 타겟 메소드를 감싸는 역할을 하며, 만약 `smsSendingConfiguration`의 flag가 `true`이면, `proceed()` 를 호출하여 `@IgnoreSmsCheck` 어노테이션이 붙은 타겟 메소드를 실행하여 문자를 전송할 수 있도록 한다. 반대로 flag가 false라면 문자를 발송하는 메소드는 실행되지 않도록 한다.


```java


import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
public class SmsSendingConfiguration {
    private boolean isSend = true;

}
```


```java
@RestController
public class SmsController {
    private final SmsSendingConfiguration smsSendingConfiguration;

    @Autowired
    public SmsController(SmsSendingConfiguration smsSendingConfiguration) {
        this.smsSendingConfiguration = smsSendingConfiguration;
    }

    @RequestMapping(value = "${server.api.prefix}/sms/enable", method = RequestMethod.POST)
    public String enableSmsSending(){
        smsSendingConfiguration.setSend(true);
        return "SMS Enable";
    }
    
    @RequestMapping(value = "${server.api.prefix}/sms/disable", method = RequestMethod.POST)
    public String disableSmsSending(){
        smsSendingConfiguration.setSend(false);
        return "SMS Disable";
    }
}
```


## 개선 포인트 
현재는 특정 서버에 curl 요청을 보내 sms을 on/off 하고 있다. 이 구조는 sms을 on/off 해야하는 대상 서버가 많아지면 번거로워질 수 있다. 편의성을 위해 MQ을 통해 on/off 메시지를 다른 서버로 전파하고, 젠킨스에 버튼 형식으로 스크립트를 등록하여 쉽게 on/off 할 수 있도록 구성을 해볼 예정이다.

→ MQ를 사용하여 on/off를 다른 서버에 전파하지 않고 데이터베이스 의 특정 컬럼을 기준으로 on/off 상태를 저장할 수 있도록 변경하였다. 이렇게 변경함으로써 여러 서버에 요청을 보내지 않고도 SMS을 on/off할 수 있게 되었다. 

또한, 젠킨스 버튼이 아닌 관리자 페이지의 토글로 on/off를 직관적으로 표현하였다. off 시엔 confirm alert을 발생 시킴으로써 한번 더 사용자에게 휴먼 에러를 낮출 수 있다.

![](https://i.imgur.com/fCKOXRq.png)

위 방식의 단점은 서버마다 SMS 발송을 컨트롤 할 수 없는 것이다. 또한, SMS 발송 여부를 확인하기 위해 DB 조회가 1회 추가 되었다. 만약 이 DB 조회로 인해 성능 저하가 있다고 판단된다면, 캐시 도입을 고려해볼 것이다.

## 참고 
- [[Java] Spring Boot AOP(Aspect-Oriented Programming) 이해하고 설정하기](https://adjh54.tistory.com/133#:~:text=%2D%20Spring%20AOP%EB%8A%94%20%EC%8A%A4%ED%94%84%EB%A7%81%20%ED%94%84%EB%A0%88%EC%9E%84,%ED%96%A5%EC%83%81%ED%95%98%EB%8A%94%EB%8D%B0%20%EB%8F%84%EC%9B%80%EC%9D%84%20%EC%A4%8D%EB%8B%88%EB%8B%A4.)
- [Spring-AOP 총 정리 ](https://velog.io/@backtony/Spring-AOP-%EC%B4%9D%EC%A0%95%EB%A6%AC)
- [# Spring - 프록시 팩토리와 빈 후처리기](https://velog.io/@backtony/Spring-%ED%94%84%EB%A1%9D%EC%8B%9C-%ED%8C%A9%ED%86%A0%EB%A6%AC%EC%99%80-%EB%B9%88-%ED%9B%84%EC%B2%98%EB%A6%AC%EA%B8%B0)