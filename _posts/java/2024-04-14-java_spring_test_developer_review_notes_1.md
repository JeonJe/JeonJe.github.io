---
title: Java Spring 테스트를 추가하고 싶은 개발자들의 오답노트
categories: spring test
tags: [spring test]
---



> 김우근님의 [Java/Spring 테스트를 추가하고 싶은 개발자들의 오답노트](https://www.inflearn.com/course/%EC%9E%90%EB%B0%94-%EC%8A%A4%ED%94%84%EB%A7%81-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B0%9C%EB%B0%9C%EC%9E%90-%EC%98%A4%EB%8B%B5%EB%85%B8%ED%8A%B8/dashboard) 를 정리한 내용입니다.



# 왜 TDD에 실패할까?

테스트는 품질을 올리는 행위이고, 업무에 적용하고, 보고하기 위해서는 가시적인 성과가 필요하게 된다. 결국 커버리지를 찾게 되는데 테스트 커버러지가 테스트의 목적이 되면 안된다.

## 테스트의 어려운 점
대표적으로 아래와 같은 이유들이 테스트를 어렵게 만든다.
1. 외부나 DB 연동테스트는 어떻게하지? 
2. 테스트를 위해 준비과정이 너무 많을땐?
3. 100개 넘는 테스트에 2분이 넘게 걸리면?
4. 테스트 결과가 일관적이지 않을 땐?

## 테스트의 목적
1. 회귀 버그 방지
2. 유연한 설계로 개선
	1. 테스트를 쉽게 만든다
	2. 테스트를 결정적이게 만든다.

> 회귀버그란 잘 동작하는 기능이 배포로 인해 다시 동작을 안하는 시절로 회귀하는 버그이다.

레거시에 테스트를 넣는 과정은 필히 코드 개선을 하면서 진행해야하고, TDD를 논하기 전에 우선 코드를 테스트가 가능한 구조로 변경이 되더야 한다.

TIP : 스프링에서 커버리지 확인은 테스트 패키지 우클릭 > 그 외 실행 / 디버기 > “커버리지로 테스트 실행”을 클릭한다.

![](https://i.imgur.com/hbogwFf.png)


# 테스트대한 개요와 개발자가 해야할 고민 

## TDD
1. 깨지는 테스트를 먼저 작성한다. (RED)
2. 깨지는 테스트를 성공시킨다. (GREEN)
3. 리팩토링한다. (BLUE)

### 장점
- 구현체보다 인터페이스를 먼저 만드는 것이 강제된다.
- 장기적인 관점에서 개발 비용 감소된다.



### 단점

- 초기 개발 비용 (스타트업)이 크다
- 난이도가 높다

## 개발자의 고민
모든 메소드를 테스트한다기보다 **중요한 로직을 구분해서 해당 코드를 테스트**한다.
느리고 쉽게 깨지는 테스트, 테스트 불가한 코드는 개선을 해야한다.


# 테스트 3분류
- API 테스트
- 통합 테스트
- 단위 테스트

위 분류는 정의가 모호하다. 구글에서는 테스트를 대형 , 중형, 소형으로 분류한다.

- **소형 테스트**
	- 단일 서버
	- 단일 프로세스
	- 단일 스레드
	- 디스크 I/O 사용 X
	- blocking call 허용 X
	- 결과가 항상 같다(결정적이다)
- **중형 테스트**
	- 단일 서버
	- 멀티 프로세스
	- 멀티 스레드
	- **h2같은 테스트 db를 사용** (h2 동작에 따라 결과가 달라짐)
- **대형 테스트**
	- 멀티 서버
	- end to end 테스트


# 테스트에 필요한 개념
## SUT
`System under test` : 테스트 대상

## BDD
`Behaviour driven development` (given - when - then)
어떤 상황 → 행동 → 결과 로 테스트를 표현한다.

## 상호작용 테스트
메소드가 호출되는지 검증하는 기법, 메소드를 감시하여 캡슐화를 위반하는 의견도 존재한다.

## 상태 검증 vs 행위 검증
상태 : 값을 넣고 나오는 결과를 기대한다
행위 : 어떤 메소드를 호출하는가를 판단한다

> 행위기반 검증이 BDD를 의미하는 것은 아니다

## 텍스트 픽스처
테스트에 필요한 자원을 생성하는 것이다.
코드 중복이 있지 않는 한 비 선호된다.

## 비욘세 규칙
유지하고 싶은 상태가 있다면 전부 테스트로 작성한다. 그게 곧 정책이 된다.

## Testability
테스트 가능성. 소프트웨어가 테스트 가능한 구조인가?

## Test double
테스트 대역
- `Dummy` : 아무런동작하지 않고, 그저 코드가 정상적으로 돌아가기 위한 전달 객체
- `Fake` : Local에서 사용하거나 테스트에서 사용하기 위해 만들어진 **가짜 객체, 자체적인 로직이 있는 것**이 특징
- `Stub` : 미리 **준비된 값을 출력**하는 객체 
- `Mock` : **메소드 호출을 확인**하기 위한 객체, 자가 검증 능력을 갖춤. 사실상 테스트 더블과 동일한 의미로 사용 
- `Spy` : 메소드 **호출을 전부 기록했다가 나중에 확인하기 위한 객체** 



# 의존성과 Testability

A는 B를 사용하기만 해도 A는 B에 의존한다고 할 수 있다.

## 의존성 주입
의존성 주입은 의존성을 약화시키는 테크닉이지 의존성을 자체를 완전히 없앨 수는 없다 
인스턴스를 만드는 것보다 의존성을 주입을 받는 것이 좋은 이유는 인스턴스를 만드는 `new` 키워드는 사실상 하드 코딩이기 때문이다.

## 의존성 역전
의존성 역전은 `DIP`로 부른다.

아래 원칙들을 지켜야 한다.
1. **상위 모듈은 하위 모듈에 의존하면 안되고, 상위 모듈과 하위 모듈 모두 `추상화`에 의존해야한다.** (Chef와 Beef가 Meat에 의존)
2. 추상화는 세부 사항에 의존해서는 안된다. **세부사항이 추상화에 의존**해야한다. (Beef가 Meat에 의존 )


![](https://i.imgur.com/XKm9U2f.png)

왜 의존성 역전이라고 부를까?
위 그림에서 화살표는 의존성을 뜻하는데 Beef입장에서는 화살표가 들어오는 방향에서, 나가는 방향으로 역전이 되어 의존성 역전이라고 표현한다.



## 의존성이 숨겨져 있으면 좋지 않은 코드

아래는 유저의 마지막 로그인 시간을 테스트 하는 예제이다.



**유저 객체**

```java
class User {
	private long lastLoginTimeStamp;
	public void login() {
		this.lastLoginTimeStamp = Clock.systemUTC().millis();
	}
}
```



**유저 객체 테스트 코드** 

```java
class UserTest {
	@Test
	public void login_테스트() {
		User user = new User();
		user.login();
		assertThat(user.getLastLoginTimeStamp()).isEqualsTo(**???**); //비교할 수 있는 시간을 넣을 수 없다
	}
}
```

위 테스트의 문제점은 **마지막 로그인 시간을 비교할 수 없다.**
시간을 강제로 `stub`할 순 있지만 라이브러리 없이 테스트가 불가한 것은 좋지 않은 코드이다.



해결 방법 중 하나는 외부에서 시간을 주입하는 것이다.

```java
class User {
	private long lastLoginTimeStamp;
	public void login(Clock clock) {
		this.lastLoginTimeStamp = clock.millis();
	}
}

class UserTest {
	@Test
	public void login_테스트() {
		User user = new User();
		Clock clock = Clock.fixed(Instant.parse("2000-01-01-t00:00:00.00z")); 
		
		user.login(clock); //마지막 로그인 시간을 주입한다.
		assertThat(user.,getLastLoginTimeStamp()).isEqualsTo(946684800000); // 주입한 시간과 동일한지 확인한다.
	}
}

```

숨겨진 의존성은 테스트를 어렵게 한다.

위 코드도 문제점이 있는데 시간을 주입받도록 코드를 변경하였지만, 서비스단에서 `login` 메소드에는 똑같이 Clock이 숨겨져 있는 상태이다. 
물론 이 Clock도 한번 더 의존성 주입을 하도록 변경할 수 있지만, 유저 서비스를 사용하는 코드에서도 똑같이 Clock이 숨겨질 것이다.
결국 의존성 주입만으로는 폭탄 돌리기를 하는 셈이다.

이를 해결하기 위해서는 의존성 역전을 같이 활용 해야한다.



의존성 역전을 위한 `ClockHolder` 인터페이스

```java
interface ClockHolder {
	long getMillis();
}
```



서비스에서는 `private final ClockHolder clockHolder;` 를 주입받아 사용한다.

```java
class User {
	private long lastLoginTimestamp;
	public void login(ClockHolder clockHolder) {
		this.lastLoginTimestamp = clockHolder.getMillis();
	}
}

@Service
@RequiredArgsConsturctor
class UserService {
	private final ClockHolder clockHolder;
	public void login(User user) {
		...
		user.login(clockHolder);
	}
}
```

![](https://i.imgur.com/ncyWiku.png)

`SystemClockHolder`는 시스템의 현재 시간을 반환하고 `TestClockHolder`는 주입받은 시간의 타임스탬프를 반환하도록 구현한다.

이렇게 인터페이스와 구현체를 나누어 작성하므로써 테스트는 깨지지 않을 수 있고 배포환경의 코드는 스프링이 현재 시간을 주입 해 줄 수 있게 되었다.

> 의존성 역전은 `Port-Adapter` 패턴이라고 부른다.



## Testability

`Testability` 는 얼마나 쉽게 input을 변경하고, output을 쉽게 검증할 수 있는가?를 뜻한다.
Testability가 낮은 경우를 살펴보자
- 의존성이 감춰진 경우 
	- ![](https://i.imgur.com/KnFATsf.png)
	- 외부 호출자가 결국 내부를 들어와서 로직을 본 뒤 `authToken`을 확인해야하고, 심지어 random 만들어지기 때문에 테스트 코드에서 `UUID`가 잘 만들어져있는지 테스트 하기가 어렵다.
	- 이 부분도 앞서 배운 의존성 역전으로 해결 가능하다.

- 파일에 의존하는 경우 
- 하드 코딩된 외부 시스템과 연동되는 경우 
- 외부에서 결과를 볼 수 없는 경우 



# [실습] 패키지 구조 개선

 post, user, common이라는 도메인으로 나누고 각 하위에 `controller`, `domain`, `service`, `infrastructre` 패키지로 구조를 나눈다.

![](https://i.imgur.com/iOUSVTM.png)

- `controller`
	- 도메인 컨트롤러 역할과 request와 response 패키지를 두어 관련 dto도 저장한다.
-  `domain`
	- 기존 model 패키지를 domain으로 변경한다.
	- 서비스 패키지에서 사용하는 dto를 둔다.
- `infrastructure`
	- 기존에 사용한 `repository` 패키지 이름을 `infrastructure`로 변경한다.
- `service`
	- 기존에 사용하는 서비스 레이어
	- service에는 외부 연동을 담당하는 port 패키지를 만들고 서비스에서 사용하는 인터페이스를 둔다.
	- UserRepository는 위치가 infrastruct에 두면 상위모듈인 서비스에서 infrastructre 패키지를 의존하는 모습이 되기 때문에 Service 패키지 하위로 옮긴다. 
		



## 의존성 역전하기

서비스에서 `Repository`와 `JavaMailSender`와 같은 외부 연동들의 의존성을 사용하고 있는 것은 테스트하기 안좋은 구조이기 때문에 의존성 역전을 활용하여 구조를 개선한다.
우선, 기존의 사용하던 Repository의 이름을 명확성을 높이기 위해 `JpaRepository`로 변경한다.
다음으로 의존성 역전을 위해 인터페이스와 구현체를 만든다.



**의존성 역전을 위한 인터페이스 추가**

```java
public interface PostRepository {  
    Optional<PostEntity> findById(long id);  
    PostEntity save(PostEntity postEntity);  
}
```



**인터페이스를 구현한 구현체**

```java
@Repository  
@RequiredArgsConstructor  
public class PostRepositoryImpl implements PostRepository {  
  
    private final PostJpaRepository postJpaRepository;  // 여기에 jpaRepository를 주입받아 사용한다.
  
    @Override  
    public Optional<PostEntity> findById(long id) {  
        return postJpaRepository.findById(id);  
    }  
  
    @Override  
    public PostEntity save(PostEntity postEntity) {  
        return postJpaRepository.save(postEntity);  
    }  
}
```



서비스에서 사용하고 있던 `JpaRepository`를 port 패키지에 선언한 `Repotisory` 인터페이스를 통해 참조하도록 변경하여 의존성을 역전한다.

```java
@Service  
@RequiredArgsConstructor  
public class PostService {  
  
    private final PostRepository postRepository;
    ...
}
```



유저에게 이메일을 발송하는 외부연동 `JavaMailSender`도 `CertificationService`라는 서비스로 정의하여 사용하도록 변경한다.

```java
@Service  
@RequiredArgsConstructor  
public class CertificationService {  
    private final MailSender mailSender;  
  
    public void send(String email, long userId, String certificationCode) {  
        String certificationUrl = generateCertificationUrl(userId, certificationCode);  
        String title = "Please certify your email address";  
        String content = "Please click the following link to certify your email address: " + certificationUrl;  
        mailSender.send(email, title, content);  
    }  
  
    public String generateCertificationUrl(long userId, String certificationCode) {  
        return "http://localhost:8080/api/users/" + userId + "/verify?certificationCode=" + certificationCode;  
    }  
  
}
```



`CertificationService` 에 주입받는 `MaileSender` 인터페이스 (port 패키지 하위에 위치한다)

```java
public interface MailSender {  
    void send(String email, String title, String content);  
}
```



`MailSenderImpl`(infrastructure 패키지 하위에 위치한다)

```java
@Component  
@RequiredArgsConstructor  
public class MailSenderImpl implements MailSender {  
    private final JavaMailSender javaMailSender;  //특정 MailSender를 주입받아 send 메소드를 구현한다.
    @Override  
    public void send(String email, String title, String content) {  
  
        SimpleMailMessage message = new SimpleMailMessage();  
        message.setTo(email);  
        message.setSubject(title);  
        message.setText(content);  
        javaMailSender.send(message);  
    }  
}
```

구현체 `MailSenderImpl` 에 `@Component`를 달아주어 스프링의 빈으로 등록이 되었기 때문에 스프링에서 DI 메커니즘을 통해 관리 될 수 있다.
즉, `CertificationService`에서 `MailSender` 의 send만 호출하더라도 스프링이 구현체인 MailSenderImpl의 send 메소드를 찾아서 실행해준다.

만약 구현체가 여러개라면, `@Qualifier` 어노테이션이나 `@Primary `어노테이션으로 주입하는 빈을 지정해줄 수 있다.



**`@Qualifier` 사용 시**

동일 타입의 빈이 여러개 있을 때 식별자를 지정해 줄 수 있다

```java
@Component
@Qualifier("smtpMailSender")
public class SmtpMailSender implements MailSender {
	...
}

@Component
@Qualifier("mockMailSender")
public class MockMailSender implements MailSender {
	...
}

@Service
@RequiredArgsConstructor
public class CertificationService {
    private final MailSender mailSender;

    public CertificationService(@Qualifier("smtpMailSender") MailSender mailSender) { // 식별자를 지정하여 해당 빈을 사용하는 것을 명시한다
        this.mailSender = mailSender;
    }
}

```



**`@Primary` 사용 시**

 기존적으로 PrimaryMailSender을 사용한다. 만약 SecondaryMailSender을 사용하고 싶다면 `@Qualifier("secondaryMailSender")` 을 멤버 필드 위에 달아준다.

```java
@Component
@Primary
public class PrimaryMailSender implements MailSender {
	...
}

@Component
public class SecondaryMailSender implements MailSender {
	...
}

```

****

**`@Configuration`으로 주입할 구현체를 직접 선택도 가능하다.** 

```java
@Configuration
public class AppConfig {
    @Bean
    public MailSender smtpMailSender() {
        return new SmtpMailSender();
    }

    @Bean
    public CertificationService certificationService() {
        return new CertificationService(smtpMailSender());
    }
}

```



이제 `CertificationService` 라는 새로운 서비스가 만들어졌기 때문에 테스트 코드도 추가가 되어야 한다.

```java

class CertificationServiceTest {  
  
    @Test  
    public void 이메일과_컨텐츠가_제대로_만들어지는지_확인한다(){  
        //given  
        FakeMailSender fakeMailSender = new FakeMailSender();  
        CertificationService certificationService = new CertificationService(fakeMailSender);  
        //when  
        certificationService.send("whssodi@gmail.com", 1, "aaaaaa-aaa-aa");  
        //then  
        assertThat(fakeMailSender.email).isEqualTo("whssodi@gmail.com");  
        assertThat(fakeMailSender.title).isEqualTo("Please certify your email address");  
        assertThat(fakeMailSender.content).isEqualTo("Please click the following link to certify your email address: http://localhost:8080/api/users/1/verify?certificationCode=aaaaaa-aaa-aa");  
  
    }  
  
}
```



테스트 코드에서는 `Mock`을 위해 `FakeMailSender` 를 생성한다.
이제 `CertificationService`의 `mailSender`엔 `fakeMailSender`가 담길 것이고 send메소드를 통해 입력한 데이터가 FakeMailSender의 멤버필드로 들어갈 것이다.

```java
public class FakeMailSender implements MailSender {  
    public String email;  
    public String title;  
    public String content;  
  
    @Override  
    public void send(String email, String title, String content) {  
        this.email = email;  
        this.title = title;  
        this.content = content;  
    }  
}
```



# [실습] 도메인과 영속성 객체 구분하기 

엔티티를 도메인 객체로 만들어 사용하면 비지니스 로직과 데이터 액세스 계층이 독립적으로 유지될 수 있고, 각 도메인 객체가 하나의 책임만 가지도록 하여 코드복잡성이 낮아진다. 또한, 도메인 모델을 별도로 테스트 할 수 있기 때문에 비지니스 로직 검증에 용이하다.

우선 도메인과 영속성 객체를 구분하기 위해서는 변환 메소드가 필요하다.

도메인은 인프라 레이어의 정보를 모르는 것이 좋기 때문에 User 객체에서 `toEntity` 메소드를 구현한 것보다 `UserEntity`에서 `fromModel` 메소드로 만드는 것이 좋다

우선, 도메인의 정보로 엔티티를 만들기 위한 `fromModel` 메소드는 아래와 같다

```java
public static UserEntity fromModel(User user) {  
    UserEntity userEntity = new UserEntity();  
    userEntity.id = user.getId();  
    userEntity.email = user.getEmail();  
    userEntity.nickname = user.getNickname();  
    userEntity.address = user.getAddress();  
    userEntity.certificationCode = user.getCertificationCode();  
    userEntity.status = user.getStatus();  
    userEntity.lastLoginAt = user.getLastLoginAt();  
    return userEntity;  
}
```



이제 save메소드의 파라미터와 리턴은 엔티티가 아닌 `도메인` 객체를 사용하고 엔티티는 `Repository`에서만 사용된다.

```java
@Override  
public User save(User user) {  
    return userJpaRepository.save(UserEntity.fromModel(user)).toModel();  
}
```



엔티티에서 도메인 객체를 만드는 메소드 `toModel`로 만들어준다.

```java
public User toModel() {  
    return User.builder()  
            .id(id)  
            .email(email)  
            .nickname(nickname)  
            .address(address)  
            .certificationCode(certificationCode)  
            .status(status)  
            .lastLoginAt(lastLoginAt)  
            .build();  
}
```



이제 조회 메소드도 엔티티가 아닌 도메인으로 변환하여 리턴한다.

```java
@Override  
public Optional<User> findById(long id) {  
    return userJpaRepository.findById(id).map(UserEntity::toModel);  
}
```

이렇게 Repostiory 구현체가 변경되었으니 인터페이스와 관련 서비스 및 테스트 코드도 변경이 되어야한다.



**UserService의 변화**
![](https://i.imgur.com/74vGTN4.png)

주의할 점은 엔티티가 아닌 도메인을 사용하기 때문에 `@Transactional`이 걸려있어도 영속성 컨텍스트 변경감지를 활용하지 못하게 되었다. 그렇기 때문에 `login`, `update`, `verifyEmail` 메소드는 마지막에 repository를 통해 변경된 객체를 save해야 한다.

이제  도메인 객체를 생성하고 책임을 부여했으므로 관련 테스트 코드도 필요해졌다.



**User 객체**

```java
  
@Getter  
public class User {  
    private final Long id;  
    private final String email;  
    private final String nickname;  
    private final String address;  
    private final String certificationCode;  
    private final UserStatus status;  
    private final Long lastLoginAt;  
  
    @Builder  
    public User(Long id, String email, String nickname, String address, String certificationCode, UserStatus status, Long lastLoginAt) {  
        this.id = id;  
        this.email = email;  
        this.nickname = nickname;  
        this.address = address;  
        this.certificationCode = certificationCode;  
        this.status = status;  
        this.lastLoginAt = lastLoginAt;  
    }  
    //도메인에 책임이 생기면서 대응하는 테스트 코드 필요  
    public static User from(UserCreate userCreate) {  
        return User.builder()  
                .email(userCreate.getEmail())  
                .nickname(userCreate.getNickname())  
                .address(userCreate.getAddress())  
                .status(UserStatus.PENDING)  
                .certificationCode(UUID.randomUUID().toString())  
                .build();  
    }  
  
    public User update(UserUpdate userUpdate) {  
        //불편 객체의 변경 결과는 새로우 인스턴스 반환  
        return User.builder()  
                .id(id)  
                .email(email)  
                .nickname(userUpdate.getNickname())  
                .address(userUpdate.getAddress())  
                .certificationCode(certificationCode)  
                .status(status)  
                .lastLoginAt(lastLoginAt)  
                .build();  
    }  
  
    public User login() {  
        return User.builder()  
                .id(id)  
                .email(email)  
                .nickname(nickname)  
                .address(address)  
                .certificationCode(certificationCode)  
                .status(status)  
                .lastLoginAt(Clock.systemUTC().millis())  
                .build();  
    }  
  
    public User certificate(String certificationCode) {  
        if (!this.certificationCode.equals(certificationCode)) {  
            throw new CertificationCodeNotMatchedException();  
        }  
  
        return User.builder()  
                .id(id)  
                .email(email)  
                .nickname(nickname)  
                .address(address)  
                .certificationCode(this.certificationCode)  
                .status(UserStatus.ACTIVE)  
                .lastLoginAt(lastLoginAt)  
                .build();  
    }  
  
}
```



**User 객체 테스트코드** (추후에 작성 예정)

```java
public class UserTest {  
  
    @Test  
    public void User는_UserCreate_객체로_생성할_수_있다() {  
        //given  
        //when        //then    }  
    ...
  
}
```



**UserCreateController**

기존 UserCreateController는 userController에 의존하여 엔티티를 response객체로 변환하고 있었다. UserResponse 객체에 변환을 위임하여 컨트롤러간 의존성을 분리하는 것이 좋다.
![](https://i.imgur.com/RZz8DXl.png)

 

컨트롤러간 의존성을 분리하기 위해 `UserResponse` 객체 내 변환 메소드 `from`을 구현한다.

```java
@Getter  
@Setter  
@Builder  
public class MyProfileResponse {  
  
    private Long id;  
    private String email;  
    private String nickname;  
    private String address;  
    private UserStatus status;  
    private Long lastLoginAt;  
  
    public static MyProfileResponse from(User user){  
        return MyProfileResponse.builder()  
                .id(user.getId())  
                .email(user.getEmail())  
                .nickname(user.getNickname())  
                .address(user.getAddress())  
                .status(user.getStatus())  
                .lastLoginAt(user.getLastLoginAt())  
                .build();  
    }  
  
}
```



이제 Reponse를 반환하기 위해 컨트롤러 메소드가 아닌 객체의 변환 메소드를 사용한다.
![](https://i.imgur.com/4YNhIfn.png)



컨트롤러에서 사용중인 response변환 메소드를 각 객체에게 위임하여 코드를 변화시켜주었다. 컨트롤러가 깔끔해졌고, 컨트롤러 간 의존성이 없어졌다.
![](https://i.imgur.com/bQyeX8T.png)



# [실습] 도메인에 테스트 코드 추가하기

엔티티를 도메인으로 변경했기 때문에 자연스럽게 테스트 코드도 변경이 필요하다.

아래는 PostEntity에 대응되는 Post 객체이다.

```java
@Getter  
public class Post {  
    private final Long id;  
    private final String content;  
    private final Long createdAt;  
    private final Long modifiedAt;  
    private final User writer;  
  
    @Builder  
    public Post(Long id, String content, Long createdAt, Long modifiedAt, User writer) {  
        this.id = id;  
        this.content = content;  
        this.createdAt = createdAt;  
        this.modifiedAt = modifiedAt;  
        this.writer = writer;  
    }
```



**Post객체의 테스트코드**

```java
public class PostTest {  
  
    @Test  
    public void PostCreate로_게시물을_만들_수_있다() {  
        //given  
        PostCreate postCreate = PostCreate.builder()  
                .writerId(1)  
                .content("hello")  
                .build();  
  
        User writer = User.builder()  
                .email("whssodi@gmail.com")  
                .nickname("whssodi")  
                .address("seoul")  
                .certificationCode("aaaaaaaaa-aaaaaaaaa-aaaaaaaaa")  
                .status(UserStatus.ACTIVE)  
                .build();  

        //when  
        Post post = Post.from(writer, postCreate);  
  
        //then  
        assertThat(post.getContent()).isEqualTo("hello");  
        assertThat(post.getWriter().getEmail()).isEqualTo("whssodi@gmail.com");  
        assertThat(post.getWriter().getNickname()).isEqualTo("whssodi");  
        assertThat(post.getWriter().getAddress()).isEqualTo("seoul");  
        assertThat(post.getWriter().getStatus()).isEqualTo(UserStatus.ACTIVE);  
        assertThat(post.getWriter().getCertificationCode()).isEqualTo("aaaaaaaaa-aaaaaaaaa-aaaaaaaaa");  
    }  
}
```