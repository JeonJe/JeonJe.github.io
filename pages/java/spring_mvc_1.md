---
tags: [JAVA]
title: Spring MVC 1
keywords: Spring MVC
sidebar: mydoc_sidebar
permalink: spring_mvc_1.html
folder: java
last_updated: 2024-02-04
---


> 김영한님의 [Spring MVC 1편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-mvc-1)을 정리한 내용입니다.


## 서블릿
### @ServletComponentScan
스프링 부트는 서블릿을 직접 등록해서 사용할 수 있도록 어노테이션을 지원한다

### @WebServlet
서블릿 어노테이션
-  `name` : 서블릿 이름
- `urlPatterns` : URL 맵핑

### HttpServletRequest
서블릿은 개발자가 HTTP 요청 메시지를 편리하게 사용할 수 있도록 파싱을 대신한다.
응답도 마찬가지로 편리하게 사용할 수 있도록 `HttpServeltResponse`를 제공한다

`startline`,` header` 등을 쉽게 데이터를 꺼낼 수 있도록 기본 기능들도 제공된다.


### HTTP 요청 데이터 
HTTP 요청 메시지를 통해 클라이언트에서 서버로 데이터를 전달하는 주요 3가지 방법은 아래와 같다.

- GET - 쿼리 파라미터
	- `/url?username=hello&age=20`
	- 메시지 바디 없이, URL의 쿼리 파라미터에 데이터를 포함해서 전달 예) 검색, 필터, 페이징등에서 많이 사용하는 방식

- POST - HTML Form
	- `content-type: application/x-www-form-urlencoded  `
	- 메시지 바디에 쿼리 파리미터 형식으로 전달 username=hello&age=20 
	- 예) 회원 가입, 상품 주문, HTML Form 사용

- **HTTP message body**에 데이터를 직접 담아서 요청 
	- HTTP API에서 주로 사용, JSON, XML, TEXT
	- 데이터 형식은 주로 JSON 사용 
		- POST, PUT, PATCH

#### 복수 파라미터에서 단일 파라미터 조회?
**username=hello&username=kim**

`request.getParameter()`는 하나의 파라미터 이름에 대해서 단 하나의 값만 있을 때 사용해야 하기 때문에 위와 같은 경우는 `request.getParameterValues()`를 사용한다. 
2개 이상일 때 `getParameter`를 사용하면 `getParameterValues`의 첫 번째 값만 반환한다.

#### JSON 결과를 Object에 맵핑
> JSON 결과를 파싱해서 사용할 수 있는 자바 객체로 변환하려면 Jackson, Gson 등 JSON 변환 라이브러리 추가해서 사용해야 한다. 스프링 부트 + `Spring MVC`를 사용할 경우엔 Jackson 라이브러리 `ObjectMapper`를 함께 제공한다.

## 서블릿, JSP, MVC 패턴

동적인 응답을 만들기 위해 서블릿으로 자바코드와 HTML을 섞어 사용하여 코드를 작성하는 것은 복잡하고 비효율적이다. 

동적으로 변하는 부분만 자바코드를 넣어 더 편리하게 사용하고자 템플릿 엔진이 탄생하였다. 템플릿 엔진을 사용하면 HTML에서 필요한 곳만 코드를 적용해 동적으로 변경할 수 있다.
템플릿 엔진의 종류로는 JSP, Thymeleaf 등이 있다.

> 참고 : JSP는 성능과 기능면에서 다른 템플릿 엔진에 밀려 안쓰는 추세이다. 스프링과 잘 통합되는 Thymeleaf를 많이 사용한다.

템플릿 엔진인 JSP 코드도 파일 내에 비지니스 로직과 결과를 보여주기 위한 HTML 로직이 섞여 있는 복잡한 구조이다. 코드가 길어질 수록 유지보수는 어려우며, 화면을 변경하기 위해 서비스 로직 포함되어 있는 파일을 수정해야하는 문제가 남아 있다.

이 문제를 해결하기 위해 비지니스 로직과 화면을 그리는 부분을 나누는 `MVC` 패턴이 등장했다.
- 모델 : 뷰에 출력할 데이터를 담는다.
- 뷰 : 모델에 담겨 있는 데이터를 화면에 그린다 (HTML 생성)
- 컨트롤러 : HTTP 요청을 받아 파라미터를 검증하고, 뷰에 전달할 결과 데이터를 조회해 모델에 담는다

> 참고 : 컨트롤러에 비지니스 로직을 담아 둘 수는 있지만, 역할이 커지기 때문에 비지니스 로직은 서비스 계층을 만들어서 처리한다.

컨트롤러에서 다른 서블릿이나 JSP로 이동할 수 있는 `dispatcher.foward()` 를 활용한다. `/WEB-INF` 경로안에 JSP파일을 두어 외부에서 직접 호출하지 못하도록 막고, 항상 컨트롤러를 통해 JSP 호출하도록 한다.

이런 MVC 패턴에도 **한계**가 존재한다.

컨트롤러 마다 뷰로 `이동`하는 코드나 `Path`를 지정하는 중복된 코드가 많기 때문이다.
또한, 기능이 추가될 수록 컨트롤러에서 `공통으로 처리해야하는 부분`이 점점 증가하는데 이런 부분을 메소드로 뽑아도 되지만 메소드를 항상 호출해야하고, 실수로 호출하지 않으면 문제가 발생할 수 있는 가능성도 존재하게 된다. 또한, 메소드를 호출하는 것 자체도 중복이다.

이런 문제를 해결하기 위해 컨트롤러 호출 전 공통 기능을 처리하는 `프론트 컨트롤러 패턴`이 생겨났고, 프론트 컨트롤러 패턴을 적용하게 된다면 스프링 MVC 와 유사한 구조가 된다.


##  MVC 프레임워크 만들기 
스프링 웹 MVC의 핵심인 `DispatcherServlet`이 `FrontController` 패턴으로 구현되어 있다
![](https://i.imgur.com/v9jrDOe.png)

프론트 컨트롤러 패턴은 아래와 같은 특징을 가지고 있다.
1. 프론트 컨트롤러 서블릿 하나로만 클라이언트의 요청을 받는다
2. 요청에 맞는 컨트롤러를 찾아서 호출한다
3. 이런 구조를 가지므로써 **공통적으로 필요한 로직을 처리**할 수 있게 된다.
4. 프론트 컨트롤러를 제외한 **나머지 컨트롤러는 서블릿을 사용할 필요가 없어**지게 된다.

강의에서는 v1부터 v5 버전까지 프론트 컨트롤러를 구현해보면서 Spring MVC와 유사한 프론트 컨트롤러를 만들어 나간다.
- **v1: 프론트 컨트롤러를 도입**  
	- 기존 구조를 최대한 유지하면서 프론트 컨트롤러를 도입
- **v2: View 분류** 
	- 단순 반복 되는 뷰 로직 분리
- **v3: Model 추가**  
	- 서블릿 종속성 제거
	- 뷰 이름 중복 제거
- **v4: 단순하고 실용적인 컨트롤러** 
	- 구현 입장에서 ModelView를 직접 생성해서 반환하지 않도록 편리한 인터페이스 제공 
- **v5: 유연한 컨트롤러**
	- 어댑터 도입  
	- 어댑터를 추가해서 프레임워크를 유연하고 확장성 있게 설계

Spring MVC와 유사한 구조의 프론트 컨트롤러 구조는 아래처럼 생겼다.
![](https://i.imgur.com/AxDEuBz.png)
위 구조에서 핸들러 어댑터는  다양한 종류의 어댑터 목록에서 핸들러를 처리할 수 있는 핸들러 어댑터가 무엇인지를 찾는 역할을 수행한다. 

다음은 ControllerV3 버전을 지원하는 어댑터를 구현한 코드이다. 
```java
public class ControllerV3HandlerAdapter implements MyHandlerAdapter {

     @Override     
     public boolean supports(Object handler) {
         return (handler instanceof ControllerV3);
     }

@Override
 public ModelView handle(HttpServletRequest request, HttpServletResponse
 response, Object handler) {
 ControllerV3 controller = (ControllerV3) handler;
         Map<String, String> paramMap = createParamMap(request);
         ModelView mv = controller.process(paramMap);
		return mv; 
	}

     private Map<String, String> createParamMap(HttpServletRequest request) {
         Map<String, String> paramMap = new HashMap<>();
         request.getParameterNames().asIterator()
		 .forEachRemaining(paramName -> paramMap.put(paramName,
 request.getParameter(paramName)));

         return paramMap;
     }

}
```

support 메소드는 객체의 타입이 `controllerV3`이면 true를 반환한다.

`handle` 메소드에서는 `V3`로 `handler`를 타입 캐스팅하고,` ControllerV3` 버전은 `ModelView`를 사용하므로 `ModelView`를 반환해 준다.

이번에는 프론트컨트롤러 V5에 대해 살펴본다.
```java
@WebServlet(name = "frontControllerServletV5", urlPatterns = "/front-controller/v5/*")
public class FrontControllerServletV5 extends HttpServlet {
    private final Map<String, Object> handlerMappingMap = new HashMap<>();
    private final List<MyHandlerAdapter> handlerAdapters = new ArrayList<>();
    public FrontControllerServletV5() {
        initHandlerMappingMap();
        initHandlerAdapters();
} 
    private void initHandlerMappingMap() {
        handlerMappingMap.put("/front-controller/v5/v3/members/new-form", new
MemberFormControllerV3());
        handlerMappingMap.put("/front-controller/v5/v3/members/save", new
MemberSaveControllerV3());
        handlerMappingMap.put("/front-controller/v5/v3/members", new
MemberListControllerV3());
    }
    private void initHandlerAdapters() {
        handlerAdapters.add(new ControllerV3HandlerAdapter());
} 


@Override 
     protected void service(HttpServletRequest request, HttpServletResponse
 response)
             throws ServletException, IOException {
         Object handler = getHandler(request);
         if (handler == null) {
             response.setStatus(HttpServletResponse.SC_NOT_FOUND);
return; } 
         MyHandlerAdapter adapter = getHandlerAdapter(handler);
         ModelView mv = adapter.handle(request, response, handler);
         MyView view = viewResolver(mv.getViewName());
         view.render(mv.getModel(), request, response);
     }
     private Object getHandler(HttpServletRequest request) {
         String requestURI = request.getRequestURI();
         return handlerMappingMap.get(requestURI);
} 
     private MyHandlerAdapter getHandlerAdapter(Object handler) {
         for (MyHandlerAdapter adapter : handlerAdapters) {
             if (adapter.supports(handler)) {
                 return adapter;
} } 
throw new IllegalArgumentException("handler adapter를 찾을 수 없습니다. handler=" + handler); 
} 
     private MyView viewResolver(String viewName) {
         return new MyView("/WEB-INF/views/" + viewName + ".jsp");
} } 


```

컨트롤러 뿐만 아니라 어댑터가 지원하면 어떤 것이라도 URL 맵핑을 하여 사용할 수 있기 때문에 어댑터 라는 이름으로 변경해준다.

생성자에서는 핸들러 매핑과 어댑터를 초기화한다.

맵핑 정보는 ControllerV3, ControllerV4 와 같은 인터페이스에서 아무 값이나 모두 받을 수 있는 `Object`로 변경한다.
``private final Map<String, Object> handlerMappingMap = new HashMap<>();``

핸들러 맵핑은 `handlerMappingMap`에서 URL에 맵핑된 핸들러 객체를 찾아서 반환하는 역할을 수행한다.
```java
Object handler = getHandler(request)

 private Object getHandler(HttpServletRequest request) {
     String requestURI = request.getRequestURI();
     return handlerMappingMap.get(requestURI);

}```

`getHandlerAdapter` 메소드는 핸들러를 처리할 수 있는 어댑터를 조회하는 메소드이다.

이제 어댑터 핸들러에서 handle 메소드를 실행하여 실제 어댑터를 호출한다.
`ModelView mv = adapter.handle(request, response, handler);`

다음으로 V4 컨트롤러도 사용할 수 있도록 FrontControllerServletV5에 추가한다.
```java
 private void initHandlerMappingMap() {
     handlerMappingMap.put("/front-controller/v5/v3/members/new-form", new

 MemberFormControllerV3());
     handlerMappingMap.put("/front-controller/v5/v3/members/save", new

 MemberSaveControllerV3());
     handlerMappingMap.put("/front-controller/v5/v3/members", new

 MemberListControllerV3());

//V4 추가

     handlerMappingMap.put("/front-controller/v5/v4/members/new-form", new
 MemberFormControllerV4());

     handlerMappingMap.put("/front-controller/v5/v4/members/save", new
 MemberSaveControllerV4());

     handlerMappingMap.put("/front-controller/v5/v4/members", new
 MemberListControllerV4());
 }
 
private void initHandlerAdapters() {  
	handlerAdapters.add(new ControllerV3HandlerAdapter()); 
	handlerAdapters.add(new ControllerV4HandlerAdapter()); //V4 추가
}
```

이제 `ControllerV4HandlerAdapter`를 작성한다.
```java
 public class ControllerV4HandlerAdapter implements MyHandlerAdapter {
     @Override
     public boolean supports(Object handler) {
         return (handler instanceof ControllerV4);
     }
@Override
     public ModelView handle(HttpServletRequest request, HttpServletResponse
 response, Object handler) {
         ControllerV4 controller = (ControllerV4) handler;
         Map<String, String> paramMap = createParamMap(request);
         Map<String, Object> model = new HashMap<>();
         String viewName = controller.process(paramMap, model);
         ModelView mv = new ModelView(viewName);
         mv.setModel(model);
         return mv;
}
     private Map<String, String> createParamMap(HttpServletRequest request) {
         Map<String, String> paramMap = new HashMap<>();
         request.getParameterNames().asIterator()
                 .forEachRemaining(paramName -> paramMap.put(paramName,
 request.getParameter(paramName)));
         return paramMap;
     }
} 
```

중요한 부분이 있는데 handle 메소드에서 어댑터 뷰의 이름이 아닌 `ModelView`를 반환한다. 왜냐하면 형식에 맞추어서 반환해야하기 때문이다.