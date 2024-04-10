---
title: 로그인 구현 with JWT
categories: project multiboard
tags: [multiboard login jwt]

---


## JWT
### JWT가 뭘까?
[공식홈페이지](https://jwt.io/introduction)에서는 JWT를 `JSON 객체로 안전하게 전송하기 위한 간결하고 독립적인 방법을 정의하는 open standard(RFC 7519)`
라고 소개하고 있습니다. 간단하게 "인증에 필요한 정보를 `토큰`이라는 곳에 담고 `암호화`하여 발급 후 클라이언트와 서버에서 인증을 위해 사용한다" 표현할 수 있겠습니다.


JWT 토큰 정보는 해싱을 활용한 `HMAC 알고리즘`이나 RSA, ECDSA와 같은 `공개키 암호화 알고리즘`으로 디지털 서명되어 있기 때문에 서버는 토큰에 대해 검증하고 신뢰할 수 있습니다.

---
### JWT 구조
`xxxxx.yyyyy.zzzzz`<br/>
JWT 구조는 세가지 구성요소인 `Header`, `Payload`, `Signature`가 dot(`.`)으로 구분되어 있는 구조입니다.

<br/>
1.  먼저, x로 표현된 `Header` 구조를 살펴보겠습니다.
    - 일반적으로 두 부분으로 구성됩니다.
      - 토큰유형(JWT)
      - 서명 알고리즘 (예: HMAC SHA256 or RSA)
          ```json
          {
            "alg": "HS256",
            "typ": "JWT"
          }
          ```

    - header를 나타내는 json은 `Base64Url` 인코딩되어 JWT의 첫 번째 부분을 구성합니다.
    <br/>
2. 다음으로 y로 표현된 `Payload`를 살펴보겠습니다.
  - 토큰에 담을 정보인 클레임이 key-value 형태로 포함되어있습니다.
    - 클레임의 종류는 3가지 종류가 존재합니다 (Registered, Public, Private)
    - 클레임 이름은 JWT를 가볍게하기 위해 3글자만 넣습니다.
    - 아래는 Registered claims을 활용하여 토큰 발행자, 토큰 만료시간, 토큰 제목(식별값), 토큰대상자를 포함시키는 payload입니다.
      ```json
      {
          "sub": "1",
          "iss": "ori",
          "exp": 1636989718,
          "iat": 1636987918
      }
      ```
    - 필요하면 자유롭게 클레임을 추가해도 문제가 없습니다. 
      ```json
      {
        "sub": "1234567890",
        "name": "John Doe",
        "admin": true
      }
      ```
    - payload도 header와 마찬가지로 json이 `Base64Url`로 인코딩되고, JWT의 두 번째 부분을 구성합니다. 꼭 알아둬야 할 점은 암호화 된 것이 아니기 때문에 디코딩을 통해 json 내용을 볼 수 있습니다. 즉, header와 payload에는 비밀번호와 같은 `중요한 정보는 넣으면 안됩니다.`

3. 마지막으로 z로 표현된 `Signature`를 살펴보겠습니다.
- 서명 부분을 만들기 위해서는 인코딩된 헤더, 인코딩된 페이로드, 개인키(secretKey), 헤더에 명시된 알고리즘을 가져와서 서명해야합니다.
```javascript
    HMACSHA256(
      base64UrlEncode(header) + "." +
      base64UrlEncode(payload),
      secret)
```
- 이 서명은 jwt가 악의적인 사용자에 의해 변경되지 않았는지 확인하는 데 사용될 수도 있고 개인 키로 서명된 토큰을 복호화하여 jwt 발신자가 본인이 맞는지 확인 할 수도 있습니다.

<br/>
위에서 살펴본 header, playload, signatur의 각 base64-URL을 합치면 JWT가 되는 것입니다.
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/a971308b-4649-43bb-ad3d-e3b380025863)

---
### 왜 JWT를 사용할까?
JWT의 특징을 살펴보며 사용하면 뭐가 좋을지 살펴보겠습니다.
1. 상태를 저장하지 않는 `Stateless` 인증 
   - `Stateful`한 `Cookie & Session` 인증 방식과 비교하며 장점을 살펴보겠습니다.
   - JWT는 토큰 자체에 필요한 정보(클레임)를 포함하고 있기 때문에 서버에 정보를 저장하지 않고도 인증을 할 수 있습니다.
     -  세션 저장소와 느린 DB접근이 필요없습니다.
   - `Stateful`한 `Cookie & Session` 인증 방식은  `stateful`하기 때문에 `scale-out`시 세션을 옮겨야하는 번거로움이 존재합니다.
     - JWT 토큰은 서버간 공유되지 않고 독립적으로 검증될 수 있습니다. 또한 토큰 생성과 인증 서버를 분리하여 각각 독립적으로 확장가능합니다.
   
2.  웹표준으로 다양한 프로그래밍 언어에서 지원됩니다.
  - 토큰만 유효하다면 여러 플랫폼에서 정상적으로 처리됩니다.
3.  Self-contained - 필요한 모든 정보를 자체적으로 가지고 있습니다.
   - 서버는 토큰을 별도로 저장하거나 데이터베이스에서 조회할 필요 없이 토큰 자체만으로 사용자 정보를 확인할 수 있습니다.
4.  웹 서버의 경우 HTTP 헤더에 넣어서 전달 또는 URL 파라미터로 전달 가능합니다.
   - 주로 Authorization 헤더에 Bearer 토큰으로 전달됩니다.
   <br/>


**JWT는 여러 장점들도 있지만, 아래와 같은 단점도 존재합니다.**
1. base64Url로 header, payload, signature를 인코딩하여 전달하므로 Coockie & Session 인증방식에 비해 상대적으로 전달량이 많습니다. 즉 `네트워크 부하`가 생길 수 있습니다.<br/>
2. JWT이 탈취당하면 만료 때까지 대처가 불가능합니다.
    - 세션은 탈취당하여도 세션저장소에서 값을 제거할 수 있으나 JWT은 Stateless하기 때문에 이와 같은 조치를 할 수 없습니다.
    - 따라서 JWT `만료시간`을 30분, 1시간으로 `짧게` 설정하거나 `RefreshToken`을 함께 발급하여 토큰 만료 시 RefreshToken으로 새로운 Access Token을 발급하도록 보완할 수 있습니다.
      - RefreshToken을 사용할 경우 세션 저장소와 비슷한 `Refresh Token Storage`가 필요하게 됩니다.
      - 하지만 Refresh Token Storage 접근은 access token이 만료되었을 때 필요하기 때문에 매 인증마다 세션저장소에 접근해야하는 세션 방식보다는 부하가 적은 방법입니다.<br/>

---
### JWT는 어떻게 사용할까?
SpringBoot에서 `jjwt` 라이브러리를 사용해서 어떻게 JWT를 생성하고 검증하는지 살펴보겠습니다.

프로젝트 개발범위가 너무 넓어질 수 있고, jwt 인증을 하지 않더라도 게시판을 볼 수 있어야 하기 때문에 
SpringSecurity를 사용하지 않고 간단한 방식으로 jwt를 생성하고 검증해보겠습니다.

우선 jjwt라이브러를 사용하기 위해 `build.gradle`에 dependencies를 추가하겠습니다.
```java
    // JWT Token
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'
```

다음으로 `Controller` 부분입니다.
```java
/**
  * UserController.java
  * 사용자 로그인을 처리하는 메서드입니다.
  *
  * @param userLoginDTO 사용자 로그인 정보
  * @return ResponseEntity<APIResponse> 아이디 패스워드 확인에 따른 API 응답
  */
  @PostMapping("/api/auth/login")
  public ResponseEntity<APIResponse> loginUser(@RequestBody UserLoginDTO userLoginDTO) {

      //아이디, 비밀번호 확인
      boolean isValidUser = (userService.checkUserCredentials(userLoginDTO) == 1);

      if (isValidUser) {
          //JWT 토큰 생성
          String jwtToken = userService.createJwtToken(userLoginDTO.getUserId());
          APIResponse apiResponse = ResponseUtil.SuccessWithData("로그인 성공", jwtToken);
          return ResponseEntity.status(HttpStatus.OK).body(apiResponse);

      } else {
          throw new AppException(ErrorCode.INVALID_AUTH_USER, "아이디, 비밀번호가 틀렸습니다.");
      }
  }
  

```
Controller에서는 요청을 받아 아이디, 비밀번호를 확인합니다.

유효한 사용자라면, `userService.createJwtToken`에 사용자 아이디를 넘겨 토큰 생성을 요청합니다.

다음으로 `Service` 부분입니다.


```java
/**
 * UserService.java
 * 주어진 사용자 ID를 기반으로 JWT 토큰을 생성합니다.
 *
 * @param userId 사용자 ID
 * @return 생성된 JWT 토큰
 */
public String createJwtToken(String userId) {
    return jwtTokenProvider.createToken(userId);
}
```

유저서비스에서는 jwtTokenProvider 클래스에 있는 createToken 메소드를 호출합니다.


`jwtTokenProvider`를 살펴보겠습니다.

```java
/**
 * JWT 토큰 생성 및 검증을 담당하는 클래스입니다.
 */
@Component
public class JwtTokenProvider {

    /**
     * JWT 비밀키
     */
    private String secretKey;
    /**
     * 토큰 유효 기간(밀리초)
     */
    private long validityInMilliseconds;

    /**
     * JwtTokenProvider 생성자입니다.
     *
     * @param secretKey              시크릿 키
     * @param validityInMilliseconds 토큰의 유효 기간(밀리초)
     */
    public JwtTokenProvider(@Value("${SECRET_KEY}") String secretKey,
                            @Value("${JWT_TOKEN_EXPIRE}") long validityInMilliseconds) {
        this.secretKey = Base64.getEncoder().encodeToString(secretKey.getBytes());
        this.validityInMilliseconds = validityInMilliseconds;
    }

    /**
     * 주어진 subject를 기반으로 JWT 토큰을 생성합니다.
     *
     * @param subject 토큰의 subject
     * @return 생성된 JWT 토큰
     */
    public String createToken(String subject) {
        Claims claims = Jwts.claims().setSubject(subject);

        Date now = new Date();
        Date validity = new Date(now.getTime()
                + validityInMilliseconds);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    /**
     * 주어진 토큰에서 subject 값을 추출합니다.
     *
     * @param token 추출할 토큰
     * @return 추출된 subject 값
     */
    public String getSubject(String token) {
        return Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody().getSubject();
    }

    /**
     * 주어진 토큰이 유효한지 확인합니다.
     *
     * @param token 확인할 토큰
     * @return 토큰의 유효성 여부
     */
    public boolean validateToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
            if (claims.getBody().getExpiration().before(new Date())) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```
`application.properties`에서 비밀키 SECRET_KEY와 토큰 유효시간 JWT_TOKEN_EXPIRE을 가져와 사용합니다. 이때 가져온 비밀키는 인코딩하여 사용해야합니다.
- `createToken` 메소드에서는 Subject 클레임에 userId를 담고 토큰 발행시간, 토큰 유효시간, 비밀키와 서명 알고리즘으로 JWT토큰을 만들어 String을 리턴합니다.

- `getSubject` 메소드에서는 파라미터로 전달된 토큰을 praser() 메소드와 비밀키로 토큰에 담긴 유저Id를 꺼내올 수 있습니다.

- `validateToken` 메소드에서는 파라미터로 전달된 토큰을 parse()메소드로 추출하고, getExpiration().before() 메소드로 현재시간과 토큰 만료 유효시간을 비교하는 기능을 합니다.

토큰에서 userId를 추출하거나, 유효한 토큰인지 확인하는 메소드는 클라이언트에서 보낸 Request의 header에 토큰이 `Authorization : Bearer xxx.yyy.zzz` 형태로 전달되기 때문에 Controller에 도달하기 전에 interceptor에서 Request header에서 토큰을 추출하는 과정이 필요합니다.


우선, 인터셉터는 `WebMvcConfiguer` 구현체에 인터셉터를 등록해야합니다.

```java
/**
 * config > WebMvcConfig.java
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
        registry.addInterceptor(bearerAuthInterceptor).addPathPatterns("/api/auth/check");
    }

}
```
 `/api/auth/check` 로 요청이 가야할 경우 `bearerAuthInterceptor` 인터셉터가 실행됩니다.


```java
/**
 * security > BearerAuthInterceptor.java
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
        if (StringUtils.isEmpty(token)) {
            return true;
        }

        //JWT 토큰이 유효하지 않는 경우 예외처리
        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("유효하지 않는 토큰입니다.");
        }

        //추출한 토큰의 사용자 ID를 요청 속성에 저장
        String userId = jwtTokenProvider.getSubject(token);
        request.setAttribute("userId", userId);
        return true;
    }
}
```
`BearerAuthInterceptor`에서는 Request에서 `authExtractor`의 `extract` 메소드로 token을 추출합니다. 

만약 토큰이 빈 토큰일 경우 Request를 바로 컨트롤러 전달하고, 아니라면 토큰 유효기간을 확인합니다. 

토큰이 만료가 되었다면 `IllegalArgumentException`으로 처리하고
아직 만료가 되지 않았다면 토큰에서 userId를 추출하여 Request의 userId에 담아 Request을 컨트롤러에 전달합니다.

```java
/**
 * security > AuthorizationExtractor.java
 * 요청 헤더에서 인증 정보를 추출하는 유틸리티 클래스입니다.
 */
@Component
public class AuthorizationExtractor {
    public static final String AUTHORIZATION = "Authorization";

    /**
     * 요청헤더에서 JWT 토큰을 추출합니다.
     *
     * @param request 요청을 나타내는 HttpServletRequest 객체
     * @param type    액세스 토큰 유형 ("Bearer")
     * @return 추출된 인증 토큰 또는 찾을 수 없을 경우 빈 문자열
     */
    public String extract(HttpServletRequest request, String type) {

        List<String> headers = Collections.list(request.getHeaders(AUTHORIZATION));
        for (String header : headers) {
            //지정된 타입으로 시작하는 헤더일 경우
            if (header.toLowerCase().startsWith(type.toLowerCase())) {
                //type 제외한 나머지 부분을 추출하고, 양쪽 공백을 제거하여 반환
                return header.substring(type.length()).trim();
            }
        }

        return "";
    }
}
```
`AuthorizationExtractor`의 `extract` 함수는 `header`에서 `Bearer`라는 문구가 있다면 토큰을 추출하여 리턴하는 함수입니다.


```java
/**
     * 클라이언트의 JWT 토큰을 추출하고 검증하여 userId를 얻어온 후, 해당 userId를 사용하여 사용자를 조회하는 메서드입니다.
     *
     * @param request HttpServletRequest 객체 (요청 객체)
     * @return APIResponse 객체에 담긴 사용자 정보와 함께 HTTP 응답 엔티티
     */
    @GetMapping("/api/auth/check")
    public ResponseEntity<APIResponse> checkUserToken(HttpServletRequest request) {

        //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
        String userId = (String) request.getAttribute("userId");
        User user = userService.findUserByUserId(userId);

        if (ObjectUtils.isEmpty(user)) {
            throw new AppException(ErrorCode.INVALID_AUTH_TOKEN, "사용자를 찾을 수 없습니다.");
        }

        //TODO : 패스워드 제외 필요, 이름만 전달하여 로그인 시 이름을 보여줄 수 있도록
        APIResponse apiResponse = ResponseUtil.SuccessWithData("유효한 토큰입니다.", user);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
```
Interceptor에서 토큰으로부터 userId를 추출하고, Request에 담아 보내주었기 때문에 Controller에서는 Request에서 사용자 ID를 알 수 있게 됩니다. 
이 userId를 화면에 전달하여 로그인 사용자 아이디를 보여줄 수 있습니다.

---
## 로그인
JWT 개념과 내용을 학습하였으니 프로젝트의 로그인 with JWT 을 구현하겠습니다.

---
###  실행화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/a38bcf62-1899-46f9-bf4c-a086d808cb2c)

아이디와 비밀번호를 입력할 수 있는 폼과 로그인 버튼, 회원가입창으로 돌아갈 수 있는 버튼, 현재 JWT토큰이 유효한지 확인하는 테스트용도의 버튼이 있습니다.

---
###  버튼
```javascript

/**
 * 사용자 로그인을 위한 함수
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<void>}
 */
const loginUser = async (userData) => {
  try {
    const response = await api.post(
      process.env.VUE_APP_API_USER_LOGIN,
      JSON.stringify(userData)
    );
    localStorage.setItem("jwt", response.data.data);
    alert("로그인이 성공하였습니다.");
  } catch (error) {
    const res = error.response.data;
    alert(res.data);
  }
};
```
로그인 버튼을 클릭하면, 아이디와 패스워드를 담은 userData Object가 메소드 파라미터로 전달됩니다.
이 Object는 JSON 문자열로 변환하여 서버에 보내지게 됩니다.
서버에서는 유효한 사용자라면 JWT 토큰을 만들어 응답에 포함시켜주고, 화면에서는 LocalStorage에 `jwt` 라는 이름으로 담아서 만료 전까지 사용합니다.

---
###  Controller
```java
/**
 * 사용자 로그인을 처리하는 메서드입니다.
 *
 * @param userLoginDTO 사용자 로그인 정보
 * @return ResponseEntity<APIResponse> 아이디 패스워드 확인에 따른 API 응답
 */
@PostMapping("/api/auth/login")
public ResponseEntity<APIResponse> loginUser(@RequestBody UserLoginDTO userLoginDTO) {

    //아이디, 비밀번호 확인
    boolean isValidUser = (userService.checkUserCredentials(userLoginDTO) == 1);

    if (isValidUser) {
        //JWT 토큰 생성
        String jwtToken = userService.createJwtToken(userLoginDTO.getUserId());
        APIResponse apiResponse = ResponseUtil.SuccessWithData("로그인 성공", jwtToken);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);

    } else {
        throw new AppException(ErrorCode.INVALID_AUTH_USER, "아이디, 비밀번호가 틀렸습니다.");
    }
}
```
Controller에서는 화면으로 전달받은 아이디와 패스워드로 신원증명을 확인합니다.

만약 유효한 사용자라면, 사용자 ID로 JWT토큰을 만들어 응답에 포함시킵니다.


유효하지 않는 사용자라면, `INVALID_AUTH_USER` 라는 에러코드를 가지고 `AppException`으로 처리합니다.
이프로젝트의 Global Exception Handling 내용은 `회원가입` 포스팅에서 자세히 확인할 수 있습니다.

---
###  DTO
```java

/**
 * 사용자 로그인 정보를 담는 DTO
 */
@AllArgsConstructor
@Getter
public class UserLoginDTO {
    /**
     * 사용자 아이디
     */
    private String userId;

    /**
     * 비밀번호
     */
    private String password;

}
```

유저 아이디와 패스워드를 받을 수 있는 간단한 DTO입니다. 

---
###  Service
```java
/**
   * 주어진 사용자 로그인 정보를 기반으로 사용자 인증을 확인합니다.
   *
   * @param userLoginDTO 사용자 로그인 정보 DTO
   * @return 사용자 인증 결과 (1: 인증 성공, 0: 인증 실패)
   */
  public int checkUserCredentials(UserLoginDTO userLoginDTO) {
      String hashedPassword = AuthUtil.hashPassword(userLoginDTO.getPassword());
      return userRepository.checkUserCredentials(userLoginDTO.getUserId(), hashedPassword);
  }
```

Sevice의 `checkUserCredentials` 메소드는 사용자가 입력한 패스워드를 해시화하고, Repository의 checkUserCredentials 메소드 파라미터로 전달합니다.

```java
/**
 * 인증 관련 유틸리티 클래스입니다.
 */
public class AuthUtil {


    /**
     * 비밀번호를 해싱하는 메서드
     *
     * @param password 비밀번호
     * @return 해시화된 비밀번호
     */
    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hashedPassword = new StringBuilder();
            for (byte hashByte : hashBytes) {
                hashedPassword.append(String.format("%02x", hashByte));
            }
            return hashedPassword.toString();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
    
}
```
`hashPassword` 함수는 SHA-256을 사용하여 비밀번호를 해싱하는 함수입니다.

---
### Repository & Mapper
```java
/**
 * 로그인 메서드
 *
 * @param userId 사용자 아이디
 * @param password 사용자 비밀번호
 * @return 사용자 아이디와 비밀번호와 일치하는 데이터 수
 */
int checkUserCredentials(String userId, String password);
```
```sql
<!-- user_id, password와 일치하는 사용자가 있는지 확인합니다.-->
<select id="checkUserCredentials" parameterType="String" resultType="int">
    SELECT COUNT(*)
    FROM users
    WHERE user_id = #{userId}
      AND password = #{password}
</select>
```

Repository & Mapper 에서는 사용자가 입력한 아이디와 비밀번호를 가진 유저 데이터가 데이터베이스에 존재하는지 확인합니다.

---
### 로그인 실행 결과
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/370b3c89-27bf-4a1e-9f5e-32669a300948)
<br/>
올바른 아이디와 패스워드를 입력할 경우 응답에 JWT토큰이 포함됩니다.

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/2e11746f-fa8f-4237-aeab-5856eec99568)
<br/>
올바르지 않은 아이디와 패스워드를 입력할 경우입니다.

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/91110c28-fd45-4423-9ce6-f0172a1f652f)
<br/>
로그인 성공 시 크롬 개발자도구로 Local Storage에 담긴 jwt 토큰을 확인할 수 있습니다.

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/3af3c81a-91f7-40bd-a392-db69d7c644e9)
<br/>
jwt토큰확인 버튼을 누르면 Local Storage에 담긴 jwt 토큰이 유효한지 확인할 수 있습니다.

---
## 어려웠던 점 
대부분 `Spring Security`와 함께 JWT를 사용하기 때문에 Spring Security를 사용하지 않고 JWT를 생성/검증 하는 방법에 대한 최신 레퍼런스를 찾기가 어려웠습니다.

이 과정에서 `"레퍼런스를 참고하기 위해 Spring Security를 써야하나?"` 라는 생각과 `"Spring Security를 이해하고 적용하려면 로그인에 시간을 너무 많이 쓰는거 같은데?"` 라는 생각이 상충되어 어떤식으로 진행할지 고민이 되었습니다.

고민끝에 Spring Security는 많이 쓰이고, 편리한 기능을 많이 제공하지만 이 프로젝트를 7월안에 끝내고 싶기 때문에 프로젝트 종료 후 추가 학습하기로 결정하였고
JJWT 공식홈페이지와 과거 레퍼런스를 보고 또 봐가면서 JWT를 사용한 간단한 회원가입과 로그인 기능을 구현할 수 있었습니다.


---
## 다음으로 
우선 사용자페이지쪽 게시판 기능부터 빠르게 개발을 진행해보도록 하겠습니다.



---
## 참고 
[JWT 공식홈페이지](https://jwt.io/introduction)<br/>

[JJWT](https://github.com/jwtk/jjwt)<br/>

[JWT 인증방식](https://jinyoungchoi95.tistory.com/39)<br/>

[JWT 생성/검증 without SpringSecurity](https://ocblog.tistory.com/56)<br/>
