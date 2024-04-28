---
title: Java Spring 테스트를 추가하고 싶은 개발자들의 오답노트2
categories: spring test
tags: [spring test]
---



> 김우근님의 [Java/Spring 테스트를 추가하고 싶은 개발자들의 오답노트](https://www.inflearn.com/course/%EC%9E%90%EB%B0%94-%EC%8A%A4%ED%94%84%EB%A7%81-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B0%9C%EB%B0%9C%EC%9E%90-%EC%98%A4%EB%8B%B5%EB%85%B8%ED%8A%B8/dashboard) 를 정리한 내용입니다.

# [실습] 도메인 테스트 추가

```java
@Test  
public void User는_UserCreate_객체로_생성할_수_있다() {  
    //given  
    UserCreate userCreate = UserCreate.builder()  
            .email("whssodi@gmail.com")  
            .address("Seoul")  
            .nickname("whssodi")  
            .build();  
    //when  
    User user = User.from(userCreate);  
    //then  
    assertThat(user.getId()).isEqualTo(0L);  
    assertThat(user.getAddress()).isEqualTo("Seoul");  
    assertThat(user.getNickname()).isEqualTo("whssodi");  
    assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING);  
    assertThat(user.getCertificationCode()).isEqualTo(??);  //테스트코드로 검증할 인증코드를 알 수 없다.
}  
@Test
```

위 테스트 코드에서 문제점이 있다.  `from` 메소드에서 `User` 객체를 만드는 시점에 랜덤으로 생성되기 때문에 테스트 코드에서 User가 가지고 있는 **인증코드**를 알 수 없다.

```java
public static User from(UserCreate userCreate) {  
    return User.builder()  
            .email(userCreate.getEmail())  
            .nickname(userCreate.getNickname())  
            .address(userCreate.getAddress())  
            .status(UserStatus.PENDING)  
            .certificationCode(UUID.randomUUID().toString()) //이 부분을 의존성 역전과 의존성 주입으로 변경한다.
            .build();  
}
```

의존성 역전으로 이 문제를 해결 할 수 있다.
먼저 common > service 패키지 하위에 `UuidHolder`와 나중에 사용 할 `ClockHolder`를 생성한다

> 강의 내용 UUidHolder와 CLockHolder의 위치를 common의 service에 두었지만 User클래스가 ApplicationLayer에 의존하면 안되므로 `common/domain` 에 위치하는 것이 적합하다고 정정한다.
> 또한 패키지 이름을 service라도 적어둔 것은 application 레이어를 뜻하는 application으로 변경하는 것이 더 적합하다


**UuidHolder 인터페이스**
```java
public interface UuidHolder {  
    String random();  
}
```

**ClockHolder 인터페이스**
```java
public interface ClockHolder {  
    long millis();  
}

```

위 인터페이스의 구현체는  service와 의존성을 분리하기 위해 service 패키지가 아닌 `infrastructure` 패키지 하위에 생성한다.
**SystemClockHolder 클래스**
```java  
@Component  
public class SystemClockHolder implements ClockHolder {  
    @Override  
    public long millis() {  
        return Clock.systemUTC().millis();  
    }  
}
```

**SystemUuidHolder 클래스**
```java
@Component  
public class SystemUuidHolder implements UuidHolder {  
    @Override  
    public String random() {  
        return UUID.randomUUID().toString();
	}
}
```

의존성 역전을 위해 앞서 예제에서 살펴본 코드에서 User 객체의 `from` 메소드에서 파라미터로 `UuidHolder`를 주입받고,  주입받은 개체의 `random` 함수를 실행하여 User객체의 `certifiactionCode`를 지정하도록 수정한다
```java
 
//도메인에 책임이 생기면서 대응하는 테스트 코드 필요  
public static User from(UserCreate userCreate, UuidHolder uuidHolder) {  
    return User.builder()  
            .email(userCreate.getEmail())  
            .nickname(userCreate.getNickname())  
            .address(userCreate.getAddress())  
            .status(UserStatus.PENDING)  
            .certificationCode(uuidHolder.random())  
            .build();
```

자연스럽게 from 메소드를 사용하는 `UserService`에서도 변경이 필요하다.
`UuidHolder` 인터페이스의 구현체인 `SystemUuidHolder`에 `@Component` 어노테이션을 달아주었기 때문에 스프링 빈으로 자동 관리가 된다. 즉 서비스에서 인터페이스를 주입하면 스프링이 알아서 구현체를 찾아 주입해 줄 것이다.
```java
@Service  
@RequiredArgsConstructor  
public class UserService {  
  
    private final UserRepository userRepository;  
    private final CertificationService certificationService;  
    private final UuidHolder uuidHolder;  
 
    @Transactional  
    public User create(UserCreate userCreate) {  
        User user = User.from(userCreate, uuidHolder);   // uuidHolder를 입력받도록 코드가 변경되었다.
        user = userRepository.save(user);  
        certificationService.send(userCreate.getEmail(), user.getId(), user.getCertificationCode());  
        return user;  
    }
```

테스트 코드를 위한 `UuidHolder`,` ClockHolder` 구현체도 필요하다.테스트 패키지 하위에 `mock` 패키지를 생성하고 구현체를 생성한다.

**TestUuidHolder**
`@RequiredArgsConstructor` 를 사용하였으니 `final`로 선언된 `uuid`를 초기화 하는 생성자를 `Lombok`이 자동적으로 만들어준다.
```java  
@RequiredArgsConstructor  
public class TestUuidHolder implements UuidHolder {  
    private final String uuid;  
    @Override  
    public String random() {  
        return uuid;  
    }  
}
```

**TestClockHolder**
`TestUuidHolder와` 동일하게 `TestClockHolder`생성 시점에 주입받은 시간을 담고 있도록 `TestClockHolder` 구현체를 작성한다.
```java
  
@RequiredArgsConstructor  
public class TestClockHolder implements ClockHolder {  
    private final long millis;  
    @Override  
    public long millis() {  
        return millis;  
    }  
  
}
```

이제 변경된 테스트 코드를 살펴보자.
`from` 메소드는 첫 번째 파라미터로 `UserCreate`, 두 번째 파라미터로 `UuidHolder` 인터페이스를 전달 받도록 변경되었다.

두 번째 파라미터로 `new TestUuidHolder("aaaa-aaa")`를 전달하면 `from` 메소드 내부에서 `uuidHolder.random()`을 호출할 때 TestUuidHolder 구현체를  스프링이 알아서 찾아 random 메소드를 실행한다. 즉 생성자 시점에 주입받은 “aaaa-aaa” 인증코드가 반환되어 유저 객체에 대입된다.

이제테스트 코드에서 주입받는 Uuid값을 지정할 수 있게 되었으니 검증도 가능해졌다.
```java
@Test  
public void User는_UserCreate_객체로_생성할_수_있다() {  
    //given  
    UserCreate userCreate = UserCreate.builder()  
            .email("whssodi@gmail.com")  
            .address("Seoul")  
            .nickname("whssodi")  
            .build();  
    //when  
    User user = User.from(userCreate, new TestUuidHolder("aaaa-aaa"));  //고정된 aaaa-aaa를 사용할 수 있게 된다.
    
    //then  
    assertThat(user.getId()).isNull();  
    assertThat(user.getAddress()).isEqualTo("Seoul");  
    assertThat(user.getNickname()).isEqualTo("whssodi");  
    assertThat(user.getStatus()).isEqualTo(UserStatus.PENDING);  
    assertThat(user.getCertificationCode()).isEqualTo("aaaa-aaa");  //값 검증이 가능해진다.
}
```
위 구조를 활용하면 마지막 로그인 시간도 테스트가 가능해진다.

> Tip : 예외를 확인하는 테스트 코드는 assertThatThrownBy를 사용한다.

```java
@Test  
public void User_는_잘못된_인증_코드로_계정을_활성화_시도하면_에러를_던진다() {  
    //given  
    User user = User.builder()  
            .id(1L)  
            .email("whssodi@gmail.com")  
            .nickname("whssodi")  
            .address("Seoul")  
            .certificationCode("aaaaaaaaa-aaaaaaaaa-aaaaaaaaa")  
            .lastLoginAt(100L)  
            .status(UserStatus.PENDING)  
            .build();  
    //when  
    assertThatThrownBy(() ->  
        user.certificate("bb")  
    ).isInstanceOf(CertificationCodeNotMatchedException.class);  
}
```

# [실습] 서비스를 소형 테스트로 만들기

서비스를 테스트하기 위해 우선 `Fake Repository` 클래스를 생성한다.

**FakeUserRepository**
실제 `Repository`를 사용하지 않기 때문에 Fake에서 save 메소드를 호출 시 Fake로 id 값을 증가시키는 멤버필드(ex : autoGeneratedId)와 데이터를 저장할 `List` 자료 구조(ex : data)가 필요하다.

>Junit은 싱글 스레드로 동작하기 때문에 병렬 처리는 고려하지 않아도 된다.

```java
public class FakeUserRepository implements UserRepository {  
    //자동으로 증가하는 id 값  
    private final AtomicLong autoGeneratedId = new AtomicLong(0);  
    private final List<User> data = new ArrayList<>();  
  
    @Override  
    public Optional<User> findById(long id) {  
        return data.stream().filter(item -> item.getId().equals(id)).findAny();  
    }  
  
    @Override  
    public Optional<User> findByIdAndStatus(long id, UserStatus userStatus) {  
        return  data.stream().filter(item -> item.getId().equals(id) && item.getStatus() == userStatus).findAny();  
    }  
  
    @Override  
    public Optional<User> findByEmailAndStatus(String email, UserStatus userStatus) {  
        return  data.stream().filter(item -> item.getEmail().equals(email) && item.getStatus() == userStatus).findAny();  
    }  
  
    @Override  
    public User save(User user) {  
        if (user.getId() == 0) {  
             User newUser = User.builder()  
                    .id(autoGeneratedId.incrementAndGet())  
                    .email(user.getEmail())  
                    .nickname(user.getNickname())  
                    .address(user.getAddress())  
                    .certificationCode(user.getCertificationCode())  
                    .status(user.getStatus())  
                    .lastLoginAt(user.getLastLoginAt())  
                    .build();  
            data.add(newUser);  
            return newUser;  
        } else {  
            data.removeIf(item -> Objects.equals(item.getId(), user.getId()));  
            data.add(user);  
            return user;  
        }  
    }  
}
```

**FakePostRepository**
```java
public class FakePostRepository implements PostRepository {  
    private final AtomicLong autoGeneratedId = new AtomicLong(0);  
    private final List<Post> data = new ArrayList<>();  
    @Override  
    public Optional<Post> findById(long id) {  
        return data.stream().filter(item -> item.getId().equals(id)).findAny();  
    }  
  
    @Override  
    public Post save(Post post) {  
        if (post.getId() == 0) {  
            Post newPost = Post.builder()  
                    .id(autoGeneratedId.incrementAndGet())  
                    .content(post.getContent())  
                    .createdAt(post.getCreatedAt())  
                    .modifiedAt(post.getModifiedAt())  
                    .writer(post.getWriter())  
                    .build();  
            data.add(newPost);  
            return newPost;  
        } else {  
            data.removeIf(item -> Objects.equals(item.getId(), post.getId()));  
            data.add(post);  
            return post;  
        }  
    }  
}
```

기존 서비스 테스트는 데이터베이스를 사용하므로 중형 테스트였다. 이를 앞서 준비한 `FakeRepositoy`를 사용하면 중형 테스트를 소형 테스트로 바꿀 수 있고 테스트 속도를 향상 시킬 수 있다.

**기존의 중형 테스트 코드**
```java
@SpringBootTest
@TestPropertySource("classpath:test-application.properties")
@SqlGroup({
        @Sql(value = "/sql/user-service-test-data.sql", executionPhase =  Sql.ExecutionPhase.BEFORE_TEST_METHOD),
        @Sql(value = "/sql/delete-all-data.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)

})
class UserServiceTest {
    @Autowired
    private UserService userService;
    @MockBean
    private JavaMailSender javaMailSender;

```


**중형 테스트**에서 변경된 **소형 테스트**
TextFixture를 `SQL`에서 `FakeRepository`로 변경한다.
```java
class UserServiceTest {  
    private UserService userService;  
  
    //TestFixture  
    @BeforeEach  
    void init() {  
        FakeMailSender fakeMailSender = new FakeMailSender();  
        FakeUserRepository fakeUserRepository = new FakeUserRepository();  
  
        this.userService = UserService.builder()  
                .uuidHolder(new TestUuidHolder("aaa-aa-a")) //고정된 값만 내려주는 stub으로 대체  
                .clockHolder(new TestClockHolder(1678530673958L)) /고정된 값만 내려주는 stub으로 대체   
                .userRepository(fakeUserRepository)  
                .certificationService(new CertificationService(fakeMailSender)) //의존 관계 서비스 설정  
                .build();  
  
        fakeUserRepository.save(User.builder()  
                .id(1L)  
                .email("whssodi@gmail.com")  
                .nickname("whssodi")  
                .address("Seoul")  
                .certificationCode("aaaaaa-aaa-aa")  
                .status(UserStatus.ACTIVE)  
                .lastLoginAt(0L)  
                .build()  
        );  
  
        fakeUserRepository.save(User.builder()  
                .id(2L)  
                .email("'whssodi2@gmail.com'")  
                .nickname("whssodi2")  
                .address("Seoul")  
                .certificationCode("aaaaaa-aaa-aa")  
                .status(UserStatus.PENDING)  
                .lastLoginAt(0L)  
                .build()  
        );  
    }
```

FakeRepository를 사용하도록 변경이 되었으니 Mockito, h2, SpringBootTest 가 필요 없어졌다.
`BDDMockito.doNothing().when(javaMailSender).send(any(SimpleMailMessage.class));` 와 같은 코드도 제거한다.



# [실습] Controller With Fake
컨트롤러에 서비스를 추가하기 전 서비스를 먼저 추상화한다.

기존 서비스 클래스 이름을 `Impl` 추가하여 변경하고, 상위 패키지인 컨트롤러 패키지에 서비스 인터페이스를 추가한다.
다음으로 구현체가 인터페이스를 상속하도록 추가해준다.

```java
@Service  
@Builder  
@RequiredArgsConstructor  
public class UserServiceImpl implements UserService {  
  
    private final UserRepository userRepository;  
    //private final CertificationServiceImpl certificationService;  
    private final CertificationService certificationService;  
    private final UuidHolder uuidHolder;  
    private final ClockHolder clockHolder;
```

서비스 내에서 다른 서비스 구현체에 의존하던 코드는 추상화를 의존하도록 변경한다.
컨트롤러에서는 **구현체가 아닌 추상화 서비스에 의존하도록 변경**하고 기존에 작성한 테스트 코드에서는 SpringBootTest, mockMvc 관련 코드를 모두 제거하고 의존성을 없애 준다.

유저 컨트롤러 테스트는 유저 서비스 주입이 필요한데, 유저 서비스를 mock이나 페이크로 구현하는 것은 너무 어렵고 특정 유저의 정보만 가져오는 `get` 메소드만 필요하기 때문에 유저 서비스에서 UserReadService, UserUpdateService 등으로 분리하여 필요한 서비스만 주입 받아 사용할 수 있도록 개선할 수 있다.
![](https://i.imgur.com/EjPnsJy.png)


이렇게 분리함에 따라 유저 서비스 구현체는 여러 개의 서비스를 구현하고 있는 형태로 변하게 된다.
```java
@Service  
@Builder  
@RequiredArgsConstructor  
public class UserServiceImpl implements UserCreateService, UserReadService, UserUpdateService, AuthenticationService {  
  
    private final UserRepository userRepository;  
    private final CertificationService certificationService;  
    private final UuidHolder uuidHolder;  
    private final ClockHolder clockHolder;
```

이제 컨트롤러에서 하나의 UserService가 아니라 분리된 여러개의 User 관련 Service를 주입 받도록 구조가 개선 되었다.
 ```java
 @Tag(name = "유저(users)")  
@RestController  
@RequestMapping("/api/users")  
@Builder  
@RequiredArgsConstructor  
public class UserController {  
  
    private final UserReadService userReadService;  
    private final UserCreateService userCreateService;  
    private final UserUpdateService userUpdateService;  
    private final AuthenticationService authenticationService;  
  
    @ResponseStatus  
    @GetMapping("/{id}")  
    public ResponseEntity<UserResponse> getUserById(@PathVariable long id) {  
        return ResponseEntity  
            .ok()  
            .body(UserResponse.from(userReadService.getById(id)));  
    }  
  
    @GetMapping("/{id}/verify")  
    public ResponseEntity<Void> verifyEmail(  
        @PathVariable long id,  
        @RequestParam String certificationCode) {  
        authenticationService.verifyEmail(id, certificationCode);  
        return ResponseEntity.status(HttpStatus.FOUND)  
            .location(URI.create("http://localhost:3000"))  
            .build();  
    }  
  
    @GetMapping("/me")  
    public ResponseEntity<MyProfileResponse> getMyInfo(  
        @Parameter(name = "EMAIL", in = ParameterIn.HEADER)  
        @RequestHeader("EMAIL") String email // 일반적으로 스프링 시큐리티를 사용한다면 UserPrincipal 에서 가져옵니다.  
    ) {  
        User user = userReadService.getByEmail(email);  
        authenticationService.login(user.getId());  
        return ResponseEntity  
            .ok()  
            .body(MyProfileResponse.from(user));  
    }  
  
    @PutMapping("/me")  
    @Parameter(in = ParameterIn.HEADER, name = "EMAIL")  
    public ResponseEntity<MyProfileResponse> updateMyInfo(  
        @Parameter(name = "EMAIL", in = ParameterIn.HEADER)  
        @RequestHeader("EMAIL") String email, // 일반적으로 스프링 시큐리티를 사용한다면 UserPrincipal 에서 가져옵니다.  
        @RequestBody UserUpdate userUpdate  
    ) {  
        User user = userReadService.getByEmail(email);  
        user = userUpdateService.update(user.getId(), userUpdate);  
        return ResponseEntity  
            .ok()  
            .body(MyProfileResponse.from(user));  
    }  
  
}
```

컨트롤러에서 의존하는 서비스가 여러개로 세분화됨에 따라 테스트코드에서도 자연스럽게 필요한 서비스만 주입 받고 필요한 메소드만 재정의해준다.
```java
@Test  
void 사용자는_특정_유저의_개인정보가_없는_정보를_찾을_수_있다() throws Exception {  
    //given  
    UserController userController = UserController.builder()  
            .userReadService(new UserReadService() {  
                @Override  
                public User getByEmail(String email) {  
                    return null;  
                }  
  
                @Override  
                public User getById(long id) {  
                    return User.builder()  
                            .email("whssodi@gmail.com")  
                            .nickname("whssodi")  
                            .address("seoul")  
                            .certificationCode("aaaaaaaaa-aaaaaaaaa-aaaaaaaaa")  
                            .status(UserStatus.ACTIVE)  
                            .build();  
                }  
            })  
            .build();  
    //when  
    ResponseEntity<UserResponse> result = userController.getUserById(1);  

    //then  
    assertThat(result.getStatusCode()).isEqualTo(HttpStatusCode.valueOf(200));  
    assertThat(result.getBody()).isNotNull();  
    assertThat((result.getBody().getId())).isEqualTo("whssodi@gmail.com");  
    assertThat((result.getBody().getEmail())).isEqualTo("whssodi@gmail.com");  
    assertThat((result.getBody().getNickname())).isEqualTo("whssodi");  
    assertThat((result.getBody().getStatus())).isEqualTo(UserStatus.ACTIVE);  
}  
  
@Test  
void 존재하지_않는_유저ID로_api호출하면_404응답을_받는다() throws Exception {  
    //given  
    UserController userController = UserController.builder()  
            .userReadService(new UserReadService() {  
                @Override  
                public User getByEmail(String email) {  
                    return null;  
                }  
  
                @Override  
                public User getById(long id) {  
                    throw new ResourceNotFoundException("Users", id);  
                }  
            })  
            .build();  
    //when  
    //then    assertThatThrownBy(() -> {  
        userController.getUserById(12345687);  
    }).isInstanceOf(ResourceNotFoundException.class);  
  
}
```

위 코드처럼 구현을 강제하는 stub을 사용할 수도 있지만,  책임을 위임하고 구현을 맡기는 것과는 거리가 멀기 때문에 스프링의 IoC 컨테이너를 흉내내는 TestContainer를 만들어 앞서 구현한 Fake들을 주입 해 주는 방식을 사용 할 수 도 있다.
```java
@Builder  
public TestContainer(ClockHolder clockHolder, UuidHolder uuidHolder) {  
  
    this.mailSender = new FakeMailSender();  
    this.userRepository = new FakeUserRepository();  
    this.postRepository = new FakePostRepository();  
    this.postService = PostServiceImpl.builder()  
            .postRepository(this.postRepository)  
            .userRepository(this.userRepository)  
            .clockHolder(clockHolder)  
            .build();  
  
    this.certificationService = new CertificationService(this.mailSender);  
  
    UserServiceImpl userService = UserServiceImpl.builder()  
            .uuidHolder(new TestUuidHolder("aaa-aa-a")) //고정된 값만 내려주는 stub으로 대체  
            .clockHolder(clockHolder) //고정된 값을  
            .uuidHolder(uuidHolder)  
            .userRepository(this.userRepository)  
            .certificationService(this.certificationService) //의존 관게  
            .build();  
    this.userCreateService = userService;  
    this.userReadService = userService;  
    this.userUpdateService = userService;  
    this.authenticationService = userService;  
  
}
```

컨트롤러 테스트 코드의 given절에는 stub 값이 아닌 원하는 값을 넣어 테스트 할 수 있게 개선되었다.
```java
public class UserControllerTest {  
  
    @Test  
    void 사용자는_특정_유저의_개인정보가_없는_정보를_찾을_수_있다() throws Exception {  
        //given  
        TestContainer testContainer = TestContainer.builder()  
                .build();  
        testContainer.userRepository.save(User.builder()  
                .id(1L)  
                .email("whssodi@gmail.com")  
                .nickname("whssodi")  
                .address("Seoul")  
                .certificationCode("aaaaaaaaa-aaaaaaaaa-aaaaaaaaa")  
                .lastLoginAt(100L)  
                .status(UserStatus.ACTIVE)  
                .build());  
        //when  
        ResponseEntity<UserResponse> result = UserController.builder()  
                .userReadService(testContainer.userReadService)  
                .build().getUserById(1);  
  
        //then  
        assertThat(result.getStatusCode()).isEqualTo(HttpStatusCode.valueOf(200));  
        assertThat(result.getBody()).isNotNull();  
        assertThat((result.getBody().getId())).isEqualTo("whssodi@gmail.com");  
        assertThat((result.getBody().getEmail())).isEqualTo("whssodi@gmail.com");  
        assertThat((result.getBody().getNickname())).isEqualTo("whssodi");  
        assertThat((result.getBody().getStatus())).isEqualTo(UserStatus.ACTIVE);  
  
    }
```

위 방식과 유사하게 UserCreate, PostCreate, PostController 를 개선 시킬 수 있다.

# 마지막 리팩토링

추가적으로 리팩토링을 할 수 있는 부분을 살펴본다.


앞선 실습에서 `TestContainer`을 사용하도록 구조가 개선되어서 UserCreateSEervice, UserReadService, UserUpdateService, AuthentificationService로 분리한 구조가 큰 이점이 없어졌기 때문에 다시 하나의 서비스로 합쳐준다.

다음으로 UserUpdate 도메인이 사용자에게 노출되어 있으니 컨트롤러에 `request` 패키지를 만들어 http 요청만 처리하는 `UserUpdateRequest`를 만든다.
```java
@Getter  
public class UserUpdateRequest {  
  
    private final String nickname;  
    private final String address;  
  
    @Builder  
    public UserUpdateRequest(  
            @JsonProperty("nickname") String nickname,  
            @JsonProperty("address") String address) {  
        this.nickname = nickname;  
        this.address = address;  
    }  
    public UserUpdate to() {  
        return ...  
    }  
}
```
다만 이 부분은 토이 프로젝트에서는 위 과정이 과하다고 느낄 수 있어서 생략 가능하다

fromModel 메소드 명도 from으로 간략하게 수정한다.

반환 타입에서 반환받는 객체를 유추 할 수 있으니 `getPostById` 메소드를 `getById`로 리팩토링 할 수 있겠다.



# 헥사고날 아키텍쳐
테스트는 품질보증뿐만 아니라 설계를 위한 도구이다. 설계를 위한 도구로 온전히 활용하기 위해서는 `Testability`를 높히도록 설계를 해야한다.

> 테스트를 하기 쉬운 코드는 좋은 확률일 확률이 높다. 개발하다보면 어떤 방식으로 개발하는 것이 더 좋을지 모를 때가 있는데 판단 기준을 테스트가 쉬운 코드로 잡아도 좋다. 만약 판단하려는 방법 모두 테스트가 쉽다면 아무거나 선택하자!

## 아키텍처
아키텍처는 어떤 비지니스 문제를 해결하기 위해 준수해야하는 제약을 넣은 과정이라고 볼 수 있겠다.
아키텍처는 종착지가 아니라 여정에 가깝다.

## 의존성 역전
Port-Adapter 패턴이라고도 불린다.
- 인터페이스를 통해 명령을 입력하는 쪽 : Input-port 와 Input- Adapter
- 인터페이스의 명령을 수행하는 쪽 : Output-port와 Output-Adapter

### 레이어드 아키텍처 to 헥사고날 아키텍처
레이어드 아키텍처에 의존성 역전을 위해 `Service`와 `Repository`에 경계를 추가한다
![](https://i.imgur.com/ZF0URMi.png)

더 이상 계층의 의미가 없어졌기 때문에 그림에서 점선을 지운다.
![](https://i.imgur.com/laibpxR.png)

위 구조를 길게 펼쳐보면 아래와 나타낼 수 있다.
![](https://i.imgur.com/j4zUjWZ.png)

이제 서비스 영역을 조금 내리고, 도메인 영역을 고립시키면 헥사고날 아키텍쳐 모양이 나타난다.
![](https://i.imgur.com/joieCMG.png)

이 구조를 대칭으로 나타내면 아래와 같이 나타낼 수 있다.
![](https://i.imgur.com/LFWOINq.png)

헥사고날 아키텍쳐의 장점
- 외부에서 도메인으로 향하는 방향은 단방향이다 (ServiceImpl → Domain)
  - 도메인은 고립되고 순수해진다.
- 소프트웨어는 오직 도메인에 충실해진다.
  - 스프링이던 JPA던 Apdater는 관심이 없다
- 테스트에 유리해진다

## 레이어드 아키텍처 문제점
- 특정 기술 중심의 사고를 하게 된다
  - 하향식으로 생각하면 프레임워크(컨트롤러), 상향식으로 생각하면 JPA를 먼저 고려하게 된다

헥사고날에서는 도메인에 집중하여 상향식으로 개발하면 된다
![](https://i.imgur.com/s2L5oYO.png)

헥사고날 아키텍처에서는 도메인을 잘 설계하는 것이 훨씬 중요해지게 되었다.

## Input 어댑터의 역할
웹의 경우 Input 어댑터는 컨트롤러
- HTTP 요청을 자바 객체로 맵핑 → 스프링
- 권한 검사 → 스프링 시큐리티
- 입력 유효성 검증 → @Valid
- **입력을 useCase 입력 모델로 맵핑**
- **useCase 호출**
- **useCase 출력을 HTTP 로 맵핑**
- HTTP 응답 반환 → 스프링

## OUT 어댑터의 역할
Repository 구현체의 역할
- 입력을 받는다
- 입력을 데이터베이스 포맷으로 맵핑한다
- 입력을 데이터베이스로 보낸다
- 데이터베이스 출력을 애플리케이션 포맷으로 맵핑한다
- 출력을 반환한다

## UseCase란
헥사고날 아키텍처에서는` input port`라고 불리며 서비스 인터페이스라고도 부른다.


## 모델은?
도메인 객체와 영속성 객체를 구분할 필요가 있냐? 라는 물음이 있다. 여기에는 다양한 의견이 있지만 도메인과 영속성 객체를 분리했을 때 분명한 이점이 있다.

아래처럼 도메인과 엔티티를 분리하지 않으면 **DB에 종속되고 ORM과 결합**이 생기게 된다
![](https://i.imgur.com/s6V5OkZ.png)

영속성 객체로 도메인 엔티티를 만들면 **도메인에 테이블 이름이 들어가고, Column이 들어가고, jpa 로딩 전략**이 명시되어야 한다

위 구조를 개선 해보자.
컨트롤러에서는 호출 응답을 전달하는 DTO와 useCase, GateWay에서는 파라미터를 나열하지 않고 데이터를 전달하기 위해 사용하는 DTO를 사용해 주고 서비스는 다른 계층과 데이터를 전달하는 DTO와 도메인을 사용해주도록 한다.

이렇게 구조를 바꿀 경우아래와 같이  웹모델 / input 포트 모델 / 도메인 모델 / output 포트 모델 / 영속성 모델로 구분된다.
![](https://i.imgur.com/s3Eoij2.png)

위 처럼 세분화 하는 것이 원칙이지만 편의성과 빠른 개발에서는 위 구조는 과하다.
모델을 어디까지 세분화할 것인지 정답은 없지만 최소 도메인 만큼은 순수하게 가져가는 것이 좋다.

# JPA를 다루는 방식
- JPARepository를 Repository 인터페이스에 직접 사용하는 방식
  ![](https://i.imgur.com/5feibEM.png)
  레이어드 아키텍처에서 사용하는 방식이다.
  Fake를 이용해서 서비스를 소형 테스트를 만들 순 있지만 Jpa레포지토리를 Fake로 구현할 경우 불필요한 메소드를 추가로 구현해야한다. 또한 JpaRepository의 응답이 영속성 객체이므로 도메인 객체와 영속성 객체가 구분되어야 한다면 from, to와 같은 맵핑 메소드가 서비스에 필요하게 되고 결과적으로 서비스가 영속성 객체에 의존하게 된다.

- JpaRepository 를 Repository 인터페이스의 구현체로 쓰는 방식
  ![](https://i.imgur.com/qE2aFn5.png)
  이 구조에서는 Fake 시 필요한 메소드만 구현해도 된다. 그러나 도메인과 영속성 객체를 분리하는 것은 아직 어려운 구조이다.

- JpaRepository를 Repository 구현체의 멤버 변수로 쓰는 방식
  ![](https://i.imgur.com/kJey613.png)
  도메인과 영속성 객체가 분리 되었기 때문에 DB에 종속되지 않는 구조가 되었다.

## 서비스 레이어
서비스 레이어는 추상화 되어야 하는가?
경험적으로 컨트롤러에 상당 부분은 테스트가 필요하지 않다(ex 모델별 맵핑 코드는 모델별 테스트를 통해서 확인이 가능하다)
그래서 굳이 useCase를 제대로 호출하기 위해 추상화는 할 필요가 없다는 의견이 있다 즉, 서비스를 추상화하는게 꼭 필요하진 않지만 만약 이렇게 구성할 경우 헥사고날 아키텍쳐는 아니게 된다


## DDD와 클린 아키텍처
비지니스를 집중하는 법 : DDD
비지니스를 잘 짜는 방법 : 테스트
비지니스와 기술을 분리하는 방법 : 클린 아키텍처
비지니스와 기술을 분리하는 구체적인 방법 : 헥사고날 아키텍처



# 테스트 범위
커버리지는 중요한게 아니다. 테스트 코드로 릴리즈 할 때 코드에 확신을 갖는 것이 중요하다.

자바와 JUnit을 활용한 실용주의 단위 테스트책에서는 테스트 범위를 `Right-BICEP`로 표현한다.
## Right
**Are we building the product right?**
제품이 기능적으로 정확한지? 정해진 요구사항을 충족하는지 확인한다

## B - Boundary Conditions
코너 케이스(시스템 내/외부 조건에 의해 발생하는 특별한 케이스 (네트워크 단절 등)) 에서도 잘 처리하는가?
![](https://i.imgur.com/uxZOscm.png)

## I - Inverison RelationShop
계산의 역 관계를 테스트할 수 있는가? (예: A를 B로 변환한 후 다시 B를 A로 변환)
## C - Cross Check
다른 수단을 사용하여 결과를 교차 검증했는가? (예: 두 개의 다른 알고리즘을 사용하여 같은 결과가 나오는지 확인)
## Error Conditions
오류 조건을 적절히 처리하고 있는가? 시스템이 예상치 못한 입력이나 상황에서 안정적으로 동작하는가?
## P - Performance Characteristics
성능 조건은 기준에 부합하는가?


# 테스트 팁
## `@ParameterizedTest` + `@MethodSource`(“메소드명)
`@ParameterizedTest` : 동일 로직을 여러번 돌리고 싶을 때 사용한다
`@MethodSource`: 파라미터에 사용할 Source 메소드 지정 할 수 있다
```java



    static Stream<Arguments> stringProvider() {
        return Stream.of(
            Arguments.of("apple", 5),
            Arguments.of("banana", 6),
            Arguments.of("", 0)
        );
    }

    @ParameterizedTest
    @MethodSource("stringProvider")
    void testLength(String input, int expectedLength) {
        assertEquals(expectedLength, utils.length(input));
    }

```
## `assertAll`
중간에 실패해도 모든 검증을 확인하는 방식이다
```java

class UserTest {

    @Test
    void userPropertiesTest() {
        User user = new User("John", "Doe", 30);

        assertAll("user properties",
            () -> assertEquals("John", user.getFirstName()),
            () -> assertEquals("Doe", user.getLastName()),
            () -> assertEquals(30, user.getAge())
        );
    }
}

```
## 한 개의 테스트는 한개만 테스트 한다
when - then 여러개를 쓰지 않는다.
그러나 한개의 assert를 하라는 말이 아니다. assert을 여러번 사용하는 것이 가독성이 더 좋다면 사용해도 된다.

## 테스트 시 thread.sleep을 사용하지 말아라.
자바 비동기 테스트를 위해 `thread.sleep`을 사용할 경우 개별 데스크탑 성능에 따라 결과가 달라진다
`Awaitility`와 같은 라이브러리를 사용하는 것이 대안이 될 수 있다.

```java
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicBoolean;

class AsyncTest {
    @Test
    void testAsyncMethod() {
        AtomicBoolean condition = new AtomicBoolean(false);

        // 비동기로 상태를 변경하는 스레드 시작
        new Thread(() -> {
            try {
                Thread.sleep(2000); // 2초 동안 대기
                condition.set(true); // 상태 변경
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        // Awaitility를 사용하여 조건이 true가 될 때까지 최대 5초간 기다림
        Awaitility.await().atMost(5000, TimeUnit.MILLISECONDS).untilTrue(condition);
    }
}

```




