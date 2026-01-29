---
title: "멀티보드 회원가입 기능 구현: 유효성 검증과 예외 처리"
description: "Spring Boot와 Vue.js를 활용한 회원가입 기능 구현, 사용자 입력 유효성 검증, 전역 예외 처리 방법과 데이터베이스 설계"
categories: project multiboard
tags: [multiboard, signup, 회원가입, Spring, Vue, 유효성검증, 예외처리, 데이터베이스, 보안, 비밀번호해싱]

---

## DB Schema & table 생성


이제 지난번에 설계한 ERD을 토대로 테이블을 생성하고 기능 구현을 진행해보겠습니다.
![multiboard v1](https://github.com/JeonJe/Free_Board/assets/43032391/b7b20347-b954-41d2-827e-520ad07c2b8a)


## 회웝가입 
### 클라이언트 화면 
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/4abd7a54-f3cb-49cc-90a3-50707db42880)

회원가입 화면은 간단하게 아이디, 패스워드, 패스워드 확인, 이름을 작성할 수 있는 `폼`과 중복확인, 회원가입, 취소 `버튼`이 있습니다.
화면 스타일은 모든 기능 구현을 완료한 뒤 진행하겠습니다.

---
### 중복확인 버튼 
```javascript
/**
 * JSON 콘텐츠를 위한 서버 URL과 헤더를 사용하여 axios 인스턴스 생성합니다.
 */
const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 중복된 ID 체크를 위한 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<void>}
 */
const checkDuplicateId = async (userId) => {
  try {
    const URL = process.env.VUE_APP_API_CHECK_DUPLICATED_ID + userId;
    await api.get(URL);
    alert("사용 가능한 ID입니다.");
  } catch (error) {
    const res = error.response.data;
    alert(res.data);
  }
};
```
서버로 데이터를 요청하는 함수들은 관리의 편의성을 위해 service > service.js에서 작성하고 필요한 vue 파일에서 import를 사용하는 방식으로 구성하였습니다.

위 중복 확인 메소드는 서버의 "/api/auth/check/{userId}" 로 GET 요청합니다.

---
### 중복확인 Controller
```java
 /**
 * 특정 사용자 ID가 중복되는지 확인하는 메서드입니다.
 *
 * @param userId 사용자 ID
 * @return 중복 여부에 따른 API 응답 객체 (ResponseEntity<APIResponse>)
 * @throws AppException 중복된 ID일 경우 발생하는 예외 (ErrorCode.DUPLICATE_USERID)
 */
  @GetMapping("/api/auth/check/{userId}")
  public ResponseEntity<APIResponse>
  checkDuplicateId(@PathVariable
                    @NotEmpty(message = "ID는 필수 항목입니다")
                    @Size(min = 4, max = 11, message = "ID는 4자 이상 11자 이하로 입력해야 합니다")
                    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "ID는 영문자, 숫자, '-', '_'만 사용할 수 있습니다") String userId) {

      User user = userService.findUserByUserId(userId);
      if (!ObjectUtils.isEmpty(user)) {
          throw new AppException(ErrorCode.DUPLICATE_USERID, user.getUserId() + "는 이미 가입된 아이디입니다.");
      }

      APIResponse apiResponse = ResponseUtil.SuccessWithoutData("사용할 수 있는 아이디입니다");
      return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
  }
```
서버 `userController`에서는 `pathVariable`에서 userId를 추출하여 데이터베이스에 userId와 동일한 아이디가 존재하는지 확인합니다.
- 만약 user가 존재한다면, `Exception` (HTTP status code 409) 상태와 에러 메시지를 반환하도록 구성하였습니다.
- 만약 user가 존재하지 않는다면, 사용할 수 있다는 안내문구를 `apiResponse`에 담아 `ResponseEntity`를 리턴합니다.


만약 위 코드처럼 PathVariable에서도 유효성 검사를 하고 싶은 경우에는 
아래 코드와 같이 Controller에 `@Validated` 어노테이션을 추가하고, `MethodValidationPostProcessor bean`을 추가해야합니다.

```java
/**
 * Controller
 */
@Validated
@RestController
@CrossOrigin(origins = "http://localhost:8082")
public class UserController {
  
```


```java

/**
 * config > WebMvcConfig.java
 * WebMvc 동작을 커스텀하기 위한 설정 클래스입니다.
 */
@Configuration
@AllArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 메소드 수준의 유효성 검증을 활성화하기 위한 MethodValidationPostProcessor를 생성합니다.
     *
     * @return MethodValidationPostProcessor 인스턴스
     */
    @Bean
    public MethodValidationPostProcessor methodValidationPostProcessor() {
        return new MethodValidationPostProcessor();
    }
}
```

PathVariable에 대한 유효성이 만족하지 않는 경우엔 `MethodArgumentNotValidException` 이 발생합니다.
이 프로젝트에서는 코드 가독성 향상을 위해 try-catch를 사용하지 않고 `@RestControllerAdvice`을 사용하여 `@Contoller`에 대한 `Global Exception`을 처리하였습니다.
```java

/**
 * exception > ExceptionManager.java
 * ExceptionManager 클래스
 * 전역 예외 처리를 담당하는 @RestControllerAdvice 클래스입니다.
 */
@RestControllerAdvice
public class ExceptionManager {

  /**
   * MethodArgumentNotValidException이 발생했을 때 호출되어 유효성 검사 실패 메시지를 반환합니다.
   *
   * @param e MethodArgumentNotValidException 예외 객체
   * @return APIResponse 객체
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<APIResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
      BindingResult bindingResult = e.getBindingResult();
      List<FieldError> fieldErrors = bindingResult.getFieldErrors();

      List<String> errorMessages = fieldErrors.stream()
              .map(FieldError::getDefaultMessage)
              .collect(Collectors.toList());

      APIResponse apiResponse = ResponseUtil.ErrorWithData("잘못된 요청입니다", errorMessages);

      return ResponseEntity.badRequest().body(apiResponse);
  }
  ....
}
```
예외가 발생하면 예외메시지들을 리스트에담고, Response 반환 형태의 일관성을 위해 작성한 커스텀 클래스 apiResponse의 `data`에 담아 화면으로 전달합니다.
앞으로 계속 사용하게 될 `APIResponse`는 아래와 같은 구조로 사용 중입니다.

```java

/**
 * API 응답을 나타내는 클래스입니다.
 */
@Builder
@Data
public class APIResponse {
    /**
     * 정상(success), 예외(error), 오류(fail) 중 하나의 값을 가집니다.
     */
    private String status;

    /**
     * status에 따른 메시지를 나타냅니다.
     */
    private String message;

    /**
     * 정상(success)의 경우 실제 전송될 데이터를 나타냅니다.
     */
    private Object data;
}

```


---
### 중복확인 Service

```java
   /**
     * 사용자 아이디로 사용자 정보 조회 메서드
     *
     * @param userId 사용자 아이디
     * @return 사용자 객체
     */
    public User findUserByUserId(String userId) {
        return userRepository.findUserByUserId(userId);
    }
```
userService.findUserByUserId는 `Repository`의 `findUserByUserId`을 호출 하도록 작성하였습니다.

---
### 중복확인 Repository & Mapper
```java
  @Mapper
  public interface UserRepository {
  /**
     * 사용자 아이디로 사용자 정보 조회 메서드
     *
     * @param userId 사용자 아이디
     * @return 사용자 객체
     */
    User findUserByUserId(String userId);
    
    ...
  }
```
userRepository에서는 `Mapper`어노테이션을 사용하여 아래 `Mybatis`의 쿼리와 맵핑하였습니다.

```sql
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<!--
    유저 매퍼
    UserRepository 인터페이스와 연결
-->
<mapper namespace="board.mapper.UserRepository">

    <!-- user_id로 사용자 정보를 조회 -->
    <select id="findUserByUserId" parameterType="String" resultType="User">
        SELECT *
        FROM users
        WHERE user_id = #{userId}
    </select>

</mapper>
```
SQL 쿼리는 `userId와` 일치하는 `user_id` 컬럼을 가진 데이터를 `User` 객체로 맵핑하여 반환할 수 있도록 작성하였습니다.
만약 userId를 가진 사용자가 없다면, null이 됩니다.

---
### 중복확인버튼 실행화면
![SCR-20230704-ppzv](https://github.com/JeonJe/Multi_Board/assets/43032391/41dce838-0fbf-4edf-a44b-7b56c1c57d7c)
<br/>데이터베이스에 이미 존재하는 아이디는 위와 같은 안내메시지가 나타납니다.

![SCR-20230704-pqbp](https://github.com/JeonJe/Multi_Board/assets/43032391/177af305-f26e-4bc5-bc22-30e6795450e4)
<br/>버튼 클릭 시 데이터베이스에 존재하지 않는 아이디는 위와 같은 안내메시지가 나타납니다.


---
### 회원가입 버튼

```javascript
/**
 * 사용자 회원가입을 위한 함수
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<void>}
 */
const signupUser = async (userData) => {
  try {
    const response = await api.post(
      process.env.VUE_APP_API_USER_SIGNUP,
      JSON.stringify(userData)
    );
    localStorage.setItem("jwt", response.data.data);
    alert(response.data);
    this.$router.push({ path: process.env.VUE_APP_USER_LOGIN_PAGE });
  } catch (error) {
    const res = error.response.data;
    alert(res.data[0]);
  }
};

```
폼에 회원가입정보를 입력하고 `회원가입` 버튼을 누르면 Object 형태의 userData가 메소드에 전달됩니다.<br/>
메소드 내에서는 서버의 "/api/auth/login"로 POST요청을 합니다. Body에 담기는 회원가입 정보는 Object 형태를 `JSON 문자열`로 변환시켜 전달하였습니다.
정상적으로 회원가입이 성공하였을 경우, 서버 응답에 JWT토큰이 생성되어 전달됩니다.<br/> JWT토큰은 클라이언트가 서버에 인증할 때 사용되기 때문에 
브라우저의 `localStorage`에 저장 해 놓겠습니다.

> JWT 토큰생성, 검증은 내용이 많아 로그인과 같이 포스팅하겠습니다.

---
### 회원가입 Controller
```java
/**
     * 사용자 회원 가입
     *
     * @param userSignupDTO 사용자 회원 가입 정보를 담고 있는 DTO입니다.
     * @return 회원 가입 처리 결과를 담은 APIResponse를 포함하는 ResponseEntity입니다.
     */
    @PostMapping("/api/auth/signup")
    public ResponseEntity<APIResponse> signupUser(@Valid @RequestBody UserSignupDTO userSignupDTO) {

        userService.saveUser(userSignupDTO);

        //회원가입 성공 후 JWT 토큰발행
        String jwtToken = userService.createJwtToken(userSignupDTO.getUserId());
        APIResponse apiResponse = ResponseUtil.SuccessWithData("회원가입에 성공하였습니다", jwtToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }
```

컨트롤러에서는 `@Valid` 사용하여 `UserSignupDTO`와 맵핑될 값에 대해 유효성검증을 진행합니다. validation을 사용하기 위해서는 `build.gradle > dependencies`에 
`spring-boot-starter-validation` 을 추가해야합니다.
```java
  //validation을 위해 추가
  implementation 'org.springframework.boot:spring-boot-starter-validation'
```

---
### 회원가입 DTO
```java
/**
 * 사용자 회원 가입 정보를 담는 DTO
 */
@AllArgsConstructor
@Getter
public class UserSignupDTO {
    /**
     * 사용자 ID
     */
    @NotEmpty(message = "ID는 필수 항목입니다")
    @Size(min = 4, max = 11, message = "ID는 4자 이상 11자 이하로 입력해야 합니다")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "ID는 영문자, 숫자, '-', '_'만 사용할 수 있습니다")
    private String userId;

    /**
     * 사용자 비밀번호
     */
    @NotEmpty(message = "비밀번호는 필수 항목입니다")
    @Size(min = 4, max = 11, message = "비밀번호는 4자 이상 11자 이하로 입력해야 합니다")
    @Pattern(regexp = "^(?!.*([A-Za-z0-9#?!@$%^&*-])\\1{2})[A-Za-z0-9#?!@$%^&*-]+$", message = "비밀번호는 영어 소문자, 대문자, 숫자, 특수문자 중 3개 이상 연속된 문자를 포함할 수 없습니다")
    private String password;

    /**
     * 사용자 비밀번호 확인
     */
    @NotEmpty(message = "비밀번호 확인은 필수 항목입니다")
    @Size(min = 4, max = 11, message = "비밀번호 확인은 4자 이상 11자 이하로 입력해야 합니다")
    @Pattern(regexp = "^(?!.*([A-Za-z0-9#?!@$%^&*-])\\1{2})[A-Za-z0-9#?!@$%^&*-]+$", message = "비밀번호는 영어 소문자, 대문자, 숫자, 특수문자 중 3개 이상 연속된 문자를 포함할 수 없습니다")
    private String confirmPassword;

    /**
     * 사용자 이름
     */
    @NotEmpty(message = "이름은 필수 항목입니다")
    @Size(min = 2, max = 4, message = "이름은 2자 이상 4자 이하로 입력해야 합니다")
    private String name;

    /**
     * ID와 비밀번호가 동일한지 확인하는 메서드입니다.
     *
     * @return ID와 비밀번호가 동일한 경우 true, 그렇지 않은 경우 false를 반환합니다.
     */
    @AssertFalse(message = "아이디와 같은 비밀번호는 사용할 수 없습니다.")
    public boolean isIdPasswordSame() {
        return userId.equals(password);
    }
    /**
     * isPasswordSame 메서드
     * 비밀번호와 확인용 비밀번호가 동일한지 확인하는 메서드입니다.
     *
     * @return 비밀번호와 확인용 비밀번호가 동일한 경우 true, 그렇지 않은 경우 false를 반환합니다.
     */
    @AssertTrue(message = "비밀번호와 비밀번호 확인이 동일하지 않습니다.")
    public boolean isPasswordSame() {
        return password.equals(confirmPassword);
    }

}
```
유효성 검증에 실패시엔 `MethodArgumentNotValidException` 이 발생하게 됩니다.앞으로 발생하는 모든 예외는 앞서 설명한 `ExceptionManager에서` 처리할 예정입니다.
<br/> 
만약, 더 복잡한 유효성 검증이 필요하면 `ConstraintValidator`의 구현체를 만들어서 사용할 수 있습니다.

---
### 회원가입 Service
```java
/**
     * 사용자 정보 저장 메서드
     *
     * @param userSignupDTO 사용자 회원가입 정보를 담은 UserSignupDTO 객체
     * @throws AppException 회원가입 과정에서 발생하는 예외
     */
    public void saveUser(UserSignupDTO userSignupDTO) {

        //아이디 중복 확인
        User user = userRepository.findUserByUserId(userSignupDTO.getUserId());
        if (user != null) {
            throw new AppException(ErrorCode.DUPLICATE_USERID, user.getUserId() + "는 이미 가입된 아이디입니다.");
        }

        String hashedPassword = AuthUtil.hashPassword(userSignupDTO.getPassword());
        User newUser = User.builder()
                .userId(userSignupDTO.getUserId())
                .password(hashedPassword)
                .name(userSignupDTO.getName())
                .build();

        userRepository.saveUser(newUser);

    }
```
먼저, 데이터베이스에 중복된 아이디가 있는지 확인합니다. 

만약 중복된 아이디가 존재한다면, Custom Exception인 AppException을 발생 시킵니다.
적절하게 예외처리만 잘하면 아래 AppException은 사용하지 않아도 무방합니다.

```java
/**
 * exception > AppException
 * AppException 클래스
 * 애플리케이션에서 발생하는 예외를 나타내는 클래스입니다.
 */
@AllArgsConstructor
@Getter
public class AppException extends RuntimeException {
  /**
   * 오류코드
   */
  private ErrorCode errorCode;
  /**
   * 예외 메시지
   */
  private String message;
}


/**
 * exception > ErrorCode
 * ErrorCode 열거형
 * 애플리케이션에서 사용되는 오류 코드를 정의한 열거형입니다.
 */
@AllArgsConstructor
@Getter
public enum ErrorCode {

  // 401 UNAUTHORIZED : 인증되지 않은 사용자
  INVALID_AUTH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않는 토큰입니다"),
  INVALID_AUTH_USER(HttpStatus.UNAUTHORIZED, "아이디, 비밀번호가 틀렸습니다."),

  // 404 NOT_FOUND : Resource 를 찾을 수 없음
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 유저 정보를 찾을 수 없습니다"),

  // 409 CONFLICT : Resource 의 현재 상태와 충돌
  DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "데이터가 이미 존재합니다"),
  DUPLICATE_USERID(HttpStatus.CONFLICT, "이미 회원가입된 아이디입니다."),
  ;
  /**
   * HTTP 상태 코드
   */
  private HttpStatus httpStatus;
  /**
   * 오류 메시지
   */
  private String message;
}

  /**
  * exception > ExceptionManager
  * AppException이 발생했을 때 호출되어 예외 메시지를 반환합니다.
  *
  * @param e AppException 예외 객체
  * @return ResponseEntity 객체
  */
@ExceptionHandler(AppException.class)
public ResponseEntity<APIResponse> handleAppException(AppException e) {

    APIResponse apiResponse = ResponseUtil.ErrorWithData("에러가 발생하였습니다", e.getMessage());
    return ResponseEntity.status(e.getErrorCode().getHttpStatus()).body(apiResponse);

}
```

---
### 회원가입 Repository & Mapper
```java
    /**
     * 사용자 아이디로 사용자 정보 조회 메서드
     *
     * @param userId 사용자 아이디
     * @return 사용자 객체
     */
    User findUserByUserId(String userId);
```
```sql
<!-- 회원가입 정보를 users 테이블에 저장 -->
    <insert id="saveUser" parameterType="User">
        INSERT INTO users (user_id, password, name)
        VALUES (#{userId}, #{password}, #{name})
    </insert>
```
Repository와 Mapper는 간단하게 작성하였습니다.

---
### 회원가입 결과
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/1493faf3-ce5c-4154-9e6a-f3d14fa54c2b)
<br/>
중복 아이디 미존재 + 유효성검증 성공 시 정상적으로 회원가입이 됩니다. data에는 jwt 토큰이 만들어져 담겨옵니다.

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/d6ed3730-2ebc-40d6-b97e-d77859cd2add)
<br/>
만약 중복된 아이디가 존재한다면 위와 같은 형태로 에러메시지를 반환합니다.

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/2104ad82-3555-44fd-a657-b60ca7e721f2)
<br/>
만약 유효성 검증에 실패한다면 위와 같은 형태로 에러메시지를 반환합니다.

---
## 발생한 이슈들


### 스키마 생성 권한 문제 
스키마를 새로 생성 시 아래와 같은 오류가 발생하였습니다.

```sql
Operation failed: There was an error while applying the SQL script to the database.
Executing:
CREATE SCHEMA `multi_board` ;

ERROR 1044: Access denied for user 'id'@'localhost' to database 'multi_board'
SQL Statement:
CREATE SCHEMA `multi_board`

```
권한이 없어 발생한 오류로 mysql에 접속하여 아이디에 대해 권한을 추가하였습니다.
```shell
grant all privileges on *.* to id@localhost
```
권한 추가 후 SQL을 재시작합니다(MAC OS 기준)
```shell
mysql.server restart
```

---
### Vue.js `.env` 사용

![SCR-20230704-otwr](https://github.com/JeonJe/Multi_Board/assets/43032391/2e04d898-f860-4eef-9322-ca477bc2399a)

`URL` 관리의 효율성을 위해 위 이미지처럼 `.env`에서 URL을 가져오는 방식으로 사용하고 있습니다. 그러나 `process.env."이름"` 으로 URL을 사용하려고 하면
`undefined`가 발생하였습니다.

원인을 찾기 위해 삽질을 진행하였습니다.
1. .env 폴더 위치 
   - root 폴더에 위치하였기 때문에 문제 원인이 아니였습니다.
2. VUE_APP 접두어 
   - vue.cli 3.X부터는 `VUE_APP_` 접두사가 붙은 변수는 자동 로드가 됩니다. 이름을 변경하였지만 역시 실패하였습니다.
3. dotenv 설치 
   - 마지막으로 시도한 방법은 dotenv-webpack을 설치하는 것입니다.[stackoverflow : Vue-cli 3 Environment Variables all undefined](https://stackoverflow.com/questions/55510326/vue-cli-3-environment-variables-all-undefined)
   - dotenv-webopack을 설치 후 vue.config.module에서 Dotenv 관련 설정을 아래와 추가하였습니다. 이후에 정상적으로 값을 가져오는 것을 확인할 수 있었습니다.
    ```javascript
        const { defineConfig } = require("@vue/cli-service");
        const Dotenv = require("dotenv-webpack");
   
        module.exports = defineConfig({
          transpileDependencies: true,
          configureWebpack: {
            plugins: [new Dotenv()],
          },
        });
    ```

---
## 참고 
- [스프링부트 / JWT 방식으로 로그인 구현하기](https://ocblog.tistory.com/56)
- [RestControllerAdivce](https://velog.io/@banjjoknim/RestControllerAdvice)       
- [PathVariables 유효성검사](https://recordsoflife.tistory.com/369)