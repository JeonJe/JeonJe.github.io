---
title: "루퍼스 1주차 WIL — CS의 중요성, 추상화된 개념 학습, 그리고 마인드셋"
description: "루퍼스 1주차에서 배운 내용과 얻은 인사이트를 정리했습니다."
categories:
  - 루퍼스
  - WIL
tags:
  - 도메인주도설계
  - 헥사고날아키텍처
  - 클린코드
  - 코드리뷰
  - 테스트코드
  - 운영체제
  - Spring
series: loopers-ecommerce
series_order: 1
toc: true
toc_sticky: true
image: /assets/img/thumbnail/loopers-week1-WIL.png
---

# 📚 루퍼스 1주차 WIL

## 🎯 이번 주 핵심 인사이트

- **CS 공부를 깊이있게, 남에게 설명할 정도로**
  - ex) CPU가 100%가 되면 Context Switching 지옥 → 캐시 미스 → Thermal Throttling
  - ex) 메모리가 100%가 되면 Page Cache 제거 → Swap → Thrashing → OOM Killer
- **추상화된 개념을 먼저 학습하자**
  - ex) `@BeforeEach` 사용법보다 **Test Hook**이라는 개념 학습 → 두 번 공부 안 함
  - ex) `@Repository`보다 **Data Access Layer** 개념 이해 → 프레임워크 바뀌어도 적용
- **잘하는 사람을 따라잡으려고 하지말자**
  - 1등을 따라잡으려고 애쓰다 지친다. 나보다 못하는 사람을 도와주면서 갭을 유지시키자!

---
## 📝 1주차 핵심 학습 내용

### 1️⃣ 코드리뷰로 배운 도메인 순수성

#### HTTP Status Code가 도메인에 있으면 안 되는 이유

**피드백 내용**: 도메인 로직에서 HTTP Status Code를 직접 사용하고 있었다. 도메인은 웹 프레임워크와 독립적이어야 배치나 CLI 환경에서도 재사용할 수 있다.

```java
// ❌ Before - 도메인이 HTTP Status Code를 알고 있음
public class Point {
    public void charge(Long amount) {
        if (amount <= 0) {
            throw new CoreException(ErrorType.BAD_REQUEST, "충전 금액은 0보다 커야 합니다");
        }
    }
}

// ✅ After - 도메인은 순수하게
public class Point {
    public void charge(Long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("충전 금액은 0보다 커야 합니다");
        }
    }
}
```

**이유**: 도메인이 웹 계층 개념 모르면 배치/CLI에서도 재사용 가능, 순수 단위테스트 가능

#### 공통 상수 관리

**피드백 내용**: 여러 컨트롤러에서 동일한 헤더 상수를 중복 정의하고 있었다. 공통 상수는 한 곳에서 관리해야 변경에 유연하고 오타로 인한 버그를 방지할 수 있다.

```java
// ❌ 모든 컨트롤러마다 중복 정의
public class UserController {
    private static final String USER_ID_HEADER = "X-USER-ID";
}

// ✅ 공통 상수 클래스
public class ApiHeaders {
    public static final String USER_ID = "X-USER-ID";
}
```

#### 테스트 검증의 정확성

**피드백 내용**: `any()`로 검증하면 테스트는 통과하지만, 실제로 원하는 값이 저장되는지는 알 수 없다. `argThat()`으로 구체적인 필드 값까지 검증해야 한다.

```java
// ❌ 대충 검증
verify(repository).save(any(User.class));

// ✅ 정확히 검증
verify(repository).save(argThat(user ->
    userId.equals(user.getUserId()) &&
    email.equals(user.getEmail())
));
```

#### Clock 주입으로 시간 검증

**피드백 내용**: 처음에는 테스트를 위해 `LocalDate currentDate`를 파라미터로 외부에서 받았다. 이를 `Clock`을 의존성을 주입하여 도메인이 시간을 직접 통제 가능하도록 개선했다.

```java
// Clock으로 도메인이 시간을 직접 통제
public static User of(String userId, LocalDate birth, Gender gender, Clock clock) {
    if (birth.isAfter(LocalDate.now(clock))) {
        throw new IllegalArgumentException("생년월일은 미래일 수 없습니다");
    }
    return new User(userId, birth, gender);
}
```

#### 캡슐화 - @Getter 남용 방지

**피드백 내용**: 편의성 때문에 클래스 레벨 `@Getter`를 사용했지만, 이는 불필요한 데이터까지 모두 노출시킨다. 필요한 정보만 제공하는 편의 메서드를 만들어 캡슐화를 유지하자.

```java
// ❌ 클래스 레벨 @Getter로 모든 필드 노출
@Getter
public class Point {
    private User user;
    private PointAmount amount;
}

// ✅ 편의 메서드로 필요한 정보만 제공
public class Point {
    private User user;  // getter 없음

    public String getUserId() {
        return user.getUserId();
    }
}
```

---

### 2️⃣ 시스템 리소스 100% - 실제로 무슨 일이 일어나는가에 대해 고민해본적이 있나?

#### CPU 100%
```
1. Run Queue 폭발 → Context Switching 과다
2. 캐시 미스 급증 → L1/L2 캐시 무용지물
3. Thermal Throttling → CPU 클럭 자동 감소
결과: CPU 100% ≠ 최고 성능
```

#### Memory 100%
```
1단계: Page Cache 제거
2단계: Swap 시작 (디스크 I/O)
3단계: Thrashing (Swap In/Out 무한반복)
4단계: OOM Killer (프로세스 강제 종료)
```

#### 시스템 병목 우선순위

|순위|리소스|위험도|모니터링|
|---|---|---|---|
|1|디스크|치명적 (즉시 서비스 중단)|`df -h`, `iostat`|
|2|메모리|매우위험 (OOM = 프로세스 죽음)|`free -m`, swap|
|3|CPU|상대적 여유 (성능 저하지만 동작)|`load average`|

---

### 3️⃣ 헥사고날 아키텍처 실습

```java
// 헥사고날 - 책임 분리
@Component
public class PointFacade {  // 조율만
    public void chargePoint(String userId, Long amount) {
        User user = userReader.read(userId);
        Point point = pointService.charge(user, amount);  // 순수 비즈니스
        pointWriter.write(point);
    }
}
```

#### Spring 어노테이션 선택 기준

```java
@Repository  // DataAccessException 자동 변환 - 이점 없으면 불필요
@Component   // 단순 빈 관리, 역할은 네이밍으로 명확히
```

**결론**: DataAccessException 변환이 필요 없다면 `@Component` + 명확한 네이밍 추천

---

### 4️⃣ QnA

#### Value Object 도입 시점

- 처음부터 VO ❌ → 검증 누락 위험 생길 때 ✅
- "돌아가는 코드부터 만들고, 필요할 때 리팩토링"

#### Mock vs Fake

|구분|학습용|실무|
|---|---|---|
|Fake Repository|✅ (동작 이해)|❌ (복잡도 증가)|
|Mockito|△|✅ (효율적)|

#### Repository 메서드 네이밍

```java
Optional<User> findUser();  // 이것만 추천
User getUser();             // JPA 에러 통제 어려움
Boolean exists();           // 사용 빈도 낮음
```

#### PR 작성 원칙

- Reference: 관련 이슈/문서
- Content: 문제 → 해결 → 주의사항
- Definition of Done: 완료 체크리스트

#### 커밋 전략 - 리뷰어를 위한 배려

```bash
# 작업 흐름대로 커밋 ❌
git commit -m "WIP: 유저 서비스 작성"
git commit -m "테스트 추가"
git commit -m "버그 수정"

# 의미 단위로 재구성 ✅
# 기능 + 테스트 묶어서 커밋
git commit -m "feat: 포인트 충전 기능 구현 (테스트 포함)"

# 어려우면 다 개발 후 interactive rebase로 정리
git rebase -i HEAD~n
```

**핵심**: 리뷰어가 커밋 단위로 기능을 이해할 수 있게 구성

#### 추천 도서

1. 디자인 패턴
2. 대규모 시스템 설계 (1,2권)
3. 최범균 - 주니어 백엔드 개발자 지식
