---
title: "Spring MVC 요청 처리 과정: Filter, Dispatcher Servlet, Interceptor 이해"
description: "Spring MVC 요청 생명주기에서 Filter, Dispatcher Servlet, Interceptor의 역할과 차이점, 구현 방법 및 활용 방식 정리"
categories: Java spring
tags: [Spring, filter, dispatcher-servlet, interceptor, spring-mvc, 요청처리, 웹개발, 스프링구조, 미들웨어]

---

## Spring MVC Request LifeCycle
Spring MVC Request LifeCycle에서 Filter, Dispatcher Servlet, Interceptor의 개념과 차이점에 살펴보겠습니다.

<img width="493" alt="image" src="https://github.com/JeonJe/Free_Board/assets/43032391/5db9d363-98c6-4701-91c2-7e89b2fd894b">



## 필터(Filter)
필터는 사용자가 설정한 URI 패턴에 대한 요청들에 대해 필터링(CORS, 인코딩 변환) 등의 필터링 역할을 수행합니다.
필터의 위치는 Request가 Dispatcher Servlet에 도달하기 전과 Dispatcher Servlet에서 나온 Response에 대해 적용 될 수 있습니다.

필터는 스프링 컨텍스트(Dispatcher Servlet, Interceptor, Controller)가 아니고, WAS내의 `ApplicationContext`에서 등록된 필터를 실행합니다. 스프링 컨텍스트가 아니기 때문에 Filter는 `Spring Framework`가 아니여도 사용이 가능합니다.

### 필터 메소드
필터를 사용하기 위해서는 `javax.servlet`의 `Filter`인터페이스를 구현해야하며 아래와 같은 메소드를 가집니다.
```java
public interface Filter {
 
    public default void init(FilterConfig filterConfig) throws ServletException {}

    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException;

    public default void destroy() {}
```
**init**

필터 객체를 초기화하고 서비스에 추가합니다. 초기화 후 요청들은 `doFilter` 메소드로 처리됩니다.

**doFilter**

사용자가 설정한 url 패턴에 대응되는 `HTTP` 요청이 `Dispatcher Servlet`에 전달되기 전에 웹 컨테이너에 의해
실행되는 메소드입니다. 

파라미터인 `FilterChain`의 `doFilter` 메소드를 통해 다음 필터로 요청을 전달 할 수 있으며 필터에서 필요한 작업은 `chain.doFilter` 전/후에 작성합니다.

**destory**

필터 객체를 제거/반환 하는 메소드입니다. WAS가 종료될 때 실행됩니다.

필터를 등록하는 방법은 크게 4가지가 있는데 `@WebFilter` 어노테이션을 이용한 등록방법에 대해 살펴보겠습니다.
```java
package com.example.springstudy.filter;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import java.io.IOException;

//Component-scan 시 Spring Bean으로 등록 됩니다.
@Component
//Filter등록에 필요한 Interface를 제공합니다.
@WebFilter(
        description = "테스트 필터입니다.",
        urlPatterns = "/*",
        filterName = "Test-Filter"
)

// @Component 어노테이션 사용 시 Order Interface 사용이 가능합니다.
// Filter chain에 대한 순서를 지정 할 수 있습니다
@Order(2)
public class TestFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        System.out.println("start testFilter");
        filterChain.doFilter(servletRequest, servletResponse);
        System.out.println("finish testFilter");
    }

    @Override
    public void destroy() {

    }
}
```

## Interceptor

요청을 Dispatcher Servlet으로부터 Controller로 전달 하는 사이와 응답을 Controller으로부터 Dispatcher Servlet으로 전달하는 사이에 인터셉터가 요청/응답을 가공할 수 있습니다.

Dispatcher Servlet이 핸들러 맵핑 과정을 통해 컨트롤러를 찾도록 요청하고 결과로 `HandlerExecutionChain` 을 돌려줍니다. 이 결과에 1개 이상의 체인이 등록되어 있다면 순차적으로 실행되며, 등록된 체인이 없다면 바로 컨트롤러를 실행합니다.

인터셉터를 사용하기 위해서 `org.springframework.web.servlet`의 `HandlerInterceptor` 인터페이스를 구현해야합니다.
```java
public interface HandlerInterceptor {
 
	default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
 
		return true;
	}
 
	default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable ModelAndView modelAndView) throws Exception {
	}
 
	default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
			@Nullable Exception ex) throws Exception {
	}
```

**preHandle**

컨트롤러가 호출되기 전에 전처리 작업 / 요청 정보를 바꾸거나 추가할 때 사용합니다.

**postHandle**

컨트롤러가 호출된 후와 `View`가 렌더링 되기 전에 후처리 작업을 위해 사용합니다.
컨트롤러에서 반환하는 `ModelAndView` 가 제공되나 JSON 형태로 데이터를 제공하는 RESTful API 기반의 컨트롤러(`@RestController`)를 만들면서 자주 사용되지 않습니다.

**afterCompletion**

`View` 렌더링을 포함한 모든 작업이 완료된 후에 실행됩니다.
요청을 처리하면서 사용한 리소스를 반환하는 경우 호출될 수 있습니다.

인터셉터를 사용하는 대신, 컨트롤러에 적용할려는 부가 기능들을 어드바이스 형태로 만들어 AOP 적용을 할 수도 있을 것입니다.
하지만, 타입이 일정하지 않고 호출 패턴도 딱히 정해져 있지 않다면 컨트롤러에 AOP를 적용하기 번거로울 수 있으니
컨트롤러 호출 전/후 부가 기능들은 인터셉터를 사용하는 편이 낫습니다.

아래는 interceptor에서 jwt토큰이 포함된 요청으로부터 jwt토큰을 추출하여 예외처리하거나 컨트롤러로 넘기는 예제입니다.

```java
package ebrain.board.config;

import ebrain.board.security.BearerAuthInterceptor;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.validation.beanvalidation.MethodValidationPostProcessor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvc 동작을 커스텀하기 위한 설정 클래스입니다.
 */
@Configuration
@AllArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 헤더에서 JWT 토큰을 추출하기 위한 인터셉터
     */
    private final BearerAuthInterceptor bearerAuthInterceptor;

    /**
     * 애플리케이션의 InterceptorRegistry에 사용자 정의 인터셉터를 추가합니다.
     * 인터셉터는 들어오는 요청과 나가는 응답을 처리하는 데 사용됩니다.
     * 이 설정에서는 BearerAuthInterceptor를 특정 URL의 JWT 토큰 확인을 위해 등록합니다.
     *
     * @param registry BearerAuthInterceptor가 추가될 InterceptorRegistry 인스턴스
     */
    public void addInterceptors(InterceptorRegistry registry) {
        //JWT 토큰 확인을 위한 인터셉터 등록
        registry.addInterceptor(bearerAuthInterceptor)
                .addPathPatterns("/api/auth/check")
                .addPathPatterns("/api/auth/status")
                .addPathPatterns("/api/auth/boards/**")
                .addPathPatterns("/api/boards/**")
                ;
    }

    
}

/**
 * 인증 토큰을 확인하는 인터셉터 클래스입니다.
 */
@Component
@AllArgsConstructor
public class BearerAuthInterceptor implements HandlerInterceptor {
    /**
     * 요청 헤더에서 인증 정보를 추출
     */
    private AuthorizationExtractor authExtractor;
    /**
     * jwtToken 관련 유틸리티
     */
    private JwtTokenProvider jwtTokenProvider;

    /**
     * Pre-handle 메서드는 요청이 컨트롤러에 도달하기 전에 실행되는 메서드입니다.
     * 이 메서드에서는 요청 헤더에서 JWT 토큰을 추출하고 유효성을 검사한 후,
     * 추출한 토큰의 사용자 ID를 요청 속성에 저장합니다.
     *
     * @param request  현재 요청 객체 (HttpServletRequest)
     * @param response 현재 응답 객체 (HttpServletResponse)
     * @param handler  현재 처리기 객체 (Object)
     * @return 요청 처리 여부 (true: 계속 진행, false: 중단)
     * @throws IllegalArgumentException 토큰이 유효하지 않을 경우 발생하는 예외
     */
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response, Object handler) {

        //헤더에서 JWT 토큰 추출
        String token = authExtractor.extract(request, "Bearer");

        //빈 토큰 일 경우 다음으로 이동
        if (StringUtils.isEmpty(token) || "null".equals(token)) {
            return true;
        }

        //JWT 토큰이 유효하지 않는 경우 예외처리
        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("요청이 정상적으로 실행되지 않았습니다. 유효하지 않는 토큰입니다.");
        }

        /**
         * TODO : AOP, Resolver, @RequestHeader 어노테이션 사용 등 다른방식으로 jwt 토큰을 확인하는 것이 좋습니다.
         */
        String seqId = jwtTokenProvider.getSubject(token);
        request.setAttribute("seqId", seqId);
        }
}
        
```

## 필터와 인터셉터 차이 

### 다른 Request / Response 객체로 바꿀 수 있는가?

필터는 Request / Response를 다른 Request / Response로 바꿀 수 있지만, 인터셉터는 그렇지 못합니다.
위에서 살펴본 필터와 인터셉터 코드를 비교해보겠습니다.
```java

@Override
public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
    System.out.println("start testFilter");
    filterChain.doFilter(servletRequest, servletResponse);
    System.out.println("finish testFilter");
}

@Override
public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response, Object handler) {

    //헤더에서 JWT 토큰 추출
    String token = authExtractor.extract(request, "Bearer");

    //빈 토큰 일 경우 다음으로 이동
    if (StringUtils.isEmpty(token) || "null".equals(token)) {
        return true;
    }

}
```
필터의 경우엔 `doFilter`의 인자에 다른 Request / Response를 넣어 다음 체인으로 전달할 수 있습니다.

하지만, 인터셉터의 `preHandle`는 **true (컨트롤러로 전달) / false (요청 중단)** 으로 반환되기 때문에
다른 Request / Response 로 객체를 전달할 수 없습니다.

### 용도의 차이 
필터는 웹 컨테이너에 의해 관리가 되기 때문에 스프링과 무관하게 전역적으로 처리하는 작업을 처리 할 수 있습니다.
- 이미지 압축 / 인코딩
- 공통된 보안 / 인증 / 인가
- 스프링과 분리되어야 하는 기능

그에 반해 인터셉터는 클라이언트의 요청과 관련되어 전역적으로 처리되어야 하는 작업들을 처리합니다.
- 특정 그룹의 사용자들만 사용하지 못하는 기능 들 처리 
- API 호출에 대한 로깅 / 검사
- JWT 토큰 파싱과 같이 컨트롤러로 넘겨주는 정보 가공에 용이 

## Dispatcher Servlet
[egovframe에서 Dispatcher Servlet는 아래와 같이 설명하고 있습니다.](https://www.egovframe.go.kr/wiki/doku.php?id=egovframework:rte:ptl:dispatcherservlet)

**Spring MVC Framework의 유일한 Front Controller인 DispatcherServlet은 Spring MVC의 핵심 요소이다.
DispatcherServlet은 Controller로 향하는 모든 웹요청의 진입점이며, 웹요청을 처리하며, 결과 데이터를 Client에게 응답 한다.**

위 Dispatcher Servlet 설명에서 `Front Controller` 용어는 Servlet 컨테이너 제일 앞단에 위치하여 클라이언트의 모든 요청을 먼저 받는 컨트롤러를 뜻합니다. 각 컨트롤러마다 있는 공통 로직을 프론트 컨트롤러에 적용하면 좋겠죠?


### 정적 자원의 처리
Dispatcher Servlet은 이미지, HTML, Javascript 등 정적파일에 대한 요청도 모두 가로채기 때문에 정적자원을 불러오지 못하는 상황도 발생할 수 있습니다.
이 문제를 해결하기 위해 2가지 방법이 있습니다.
1. 정적 자원 요청과 애플리케이션 요청을 분리
   - `/apps` 의 URL로 접근하면 Dispatcher Servlet이 담당한다.
   - `/resources` 의 URL로 접근하면 Dispatcher Servlet이 컨트롤할 수 없으므로 담당하지 않는다.
   - 코드가 지저분해지며 모든 요청에 대해 URL을 붙여줘야해서 한계점이 있습니다.
2. 애플리케이션 요청을 탐색하고 없으면 정적 자원 요청으로 처리 
   - Dispatcher Servlet이 요청을 처리할 컨트롤러를 찾고, 요청에 대한 컨트롤러를 찾을 수 없는 경우에 2차적으로 설정된 자원 경로를 탐색하는 방법입니다.

### Dispatcher Servlet 동작과정 

![image](https://github.com/JeonJe/Free_Board/assets/43032391/b985dd69-0ac7-4c1c-a2c1-707743b1a1ab)

동작과정을 요약하자면 아래처럼 표현할 수 있습니다.

`dispatcher servlet` 이 요청을 처리할 컨트롤러를 찾아서 위임하고 그 결과를 받아온다


**Dispatcher Servlet의 세부 동작과정은 아래와 같습니다.**
1. 클라이언트의 요청을 `dispatcher servlet` 받습니다.
2. 요청 정보를 통해 요청을 위임할 `controller`를 찾습니다.
3. 요청을 `controller`로 위임할 `handler adapter`를 찾아서 전달합니다.
4. `handler adapter`가 `controller`로 요청을 위임합니다.
5. 비지니스 로직을 처리합니다.
6. `controller`가 값을 반환합니다.
7. `handler adapter`가 반환값을 처리합니다.
8. 서버의 응답을 클라이언트로 반환합니다.




## 참고 
- [[Spring] 필터(Filter)와 인터셉터(Interceptor)의 개념 및 차이](https://dev-coco.tistory.com/173)
- [[Spring] Filter와 Inteceptor 란 무엇일까?](https://devlog-wjdrbs96.tistory.com/352)
- [Spring Filter와 Interceptor](https://jaehun2841.github.io/2018/08/25/2018-08-18-spring-filter-interceptor/#%EB%93%A4%EC%96%B4%EA%B0%80%EB%A9%B0)
- [Filter 와 Interceptor 의 차이](https://algopoolja.tistory.com/110)
- [[Spring] Dispatcher-Servlet(디스패처 서블릿)이란? 디스패처 서블릿의 개념과 동작 과정](https://mangkyu.tistory.com/18)
