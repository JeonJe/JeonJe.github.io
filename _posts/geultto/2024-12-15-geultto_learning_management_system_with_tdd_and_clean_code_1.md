---
title: "서비스 계층 다이어트: Thin Service와 템플릿 패턴으로 수강신청 시스템 개선하기"
description: "비대한 서비스 계층을 도메인 객체에 책임 위임하고 템플릿 메서드 패턴을 적용해 코드 품질과 테스트 용이성을 높인 실전 리팩토링 경험"
categories: 글또 객체지향설계
tags: [TDD, 객체지향, 리팩토링, spring, 도메인 설계, Thin Service, 템플릿 메서드 패턴, 책임 분리, 테스트 용이성]
---

## 요약
- Next-step의 "TDD, 클린 코드 with Java" 과정 중 수강신청 관리시스템 1단계, 2단계 미션을 통해 `thin service`와 `도메인 모델 설계`에 대해 배운 내용을 작성하였습니다.

---

## 이 글의 목적
- 객체지향 프로그래밍과 클린 코드에 관심이 생긴 2년 차 개발자로서, 제 코드가 어떻게 변화하는지 다루고자 합니다.
- 이 글을 통해 스스로 개선된 부분을 인식하는 것이 첫 번째 목표이며, 이 경험을 공유하는 것이 두 번째 목표입니다.

---
## 들어가며
서비스 계층에 비즈니스 로직이 집중되어 있고 각 객체들이 자신의 책임을 제대로 수행하지 못하는 코드는 테스트가 어렵고 중요한 검증 로직이 누락되기 쉽습니다. 이번 글에서는 수강신청 관리시스템 미션을 통해 이러한 문제들을 어떻게 개선할 수 있는지, 그리고 객체지향적인 설계가 주는 이점에 대해 다루어보겠습니다.

## 1단계 - 레거시 코드 리팩토링

### 1) 미션 요구사항 개발
1단계 미션의 목표는 단위 테스트하기 어려운 레거시 코드를 개선하는 것입니다.

리팩토링 시 지켜야 할 주요 원칙은 다음과 같습니다
- `getter/setter` 사용을 지양하고 객체에 메시지를 보내는 방식으로 구현
- 컬렉션은 일급 컬렉션으로 래핑하여 관련 책임을 위임
- 인스턴스 변수는 최소한으로 유지하여 객체의 상태 복잡도를 낮춤

먼저 리팩토링 대상인 `QnAService`의 `deleteQuestion` 메소드를 살펴보겠습니다.
```java
public class QnAService {
    public void deleteQuestion(NsUser loginUser, long questionId) throws CannotDeleteException {
        Question question = questionRepository.findById(questionId).orElseThrow(NotFoundException::new);
        //개선 포인트 1. Question 객체에게 권한 검증 책임을 위임
        if (!question.isOwner(loginUser)) {
            throw new CannotDeleteException("질문을 삭제할 권한이 없습니다.");
        }

        //개선 포인트 2. 일급 컬렉션 적용 
        List<Answer> answers = question.getAnswers();
        for (Answer answer : answers) {
            if (!answer.isOwner(loginUser)) {
                throw new CannotDeleteException("다른 사람이 쓴 답변이 있어 삭제할 수 없습니다.");
            }
        }
        //개선 포인트 3. 일급 컬렉션 적용 
        List<DeleteHistory> deleteHistories = new ArrayList<>();
        question.setDeleted(true);
        deleteHistories.add(new DeleteHistory(ContentType.QUESTION, questionId, question.getWriter(), LocalDateTime.now()));
        for (Answer answer : answers) {
            answer.setDeleted(true);
            deleteHistories.add(new DeleteHistory(ContentType.ANSWER, answer.getId(), answer.getWriter(), LocalDateTime.now()));
        }
        deleteHistoryService.saveAll(deleteHistories);
    }
}
```
위와 같은 메소드를 테스트하기 어렵다고 느끼는 이유는 데이터베이스 조회와 같은 **외부 의존성이 섞여** 있기 때문입니다.

이를 개선하기 위해서는 테스트가 필요한 비즈니스 로직과 테스트하기 어려운 외부 의존성을 분리하고, 비즈니스 로직은 각 객체에게 적절히 위임하여 서비스 계층을 `thin`하게 만들어야 합니다.

`thin service`란 비즈니스 로직을 도메인 객체에게 위임하고 객체 간의 흐름 제어에만 집중하는 서비스를 의미합니다. 이를 통해 다음과 같은 장점을 얻을 수 있습니다

1. 객체 단위의 테스트가 쉬워집니다.
  - 각 객체는 자신의 책임만 가지고 있어 단위 테스트가 쉬워집니다
  - 외부 의존성 없이 순수한 비즈니스 로직만 테스트할 수 있습니다

2. 서비스 계층의 복잡도가 낮아집니다
  - 서비스는 단순히 비즈니스 흐름만 제어하므로 이해하기 쉬워집니다
  - 새로운 요구사항이 추가되어도 도메인 객체만 수정하면 됩니다


이번 1단계 미션에서 진행한 주요 개선 사항은 다음과 같습니다

1. `List<Question>` 객체를 포장하여 Answers 일급 컬렉션으로 변경
  - 답변 관련 로직을 Answers 클래스로 위임하여 응집도를 높임
  - 답변 삭제 권한 검증도 Answers 클래스에서 담당하도록 개선

2. `List<DeleteHistory>` 객체를 포장하여 DeleteHistories 일급 컬렉션으로 변경
  - 삭제 이력 생성 및 관리 책임을 `DeleteHistories`로 위임
  - 삭제 시간의 일관성을 보장하도록 개선

3. `QnAService`의 역할 축소
  - `Question`이 자신의 삭제 권한을 검증하도록 개선
  - `Answers`가 답변들의 삭제 권한을 검증하도록 개선
  - 서비스는 객체 간의 흐름 제어에만 집중하도록 변경

### 2) 개선하기
첫 번째로, `List<DeleteHistory>`를 일급 컬렉션으로 만들어 삭제 이력 관리 책임을 서비스로부터 분리했습니다.

```java
public class DeleteHistories {
    private final List<DeleteHistory> deleteHistories;

    public DeleteHistories() {
        deleteHistories = new ArrayList<>();
    }

    public DeleteHistories(List<DeleteHistory> deleteHistories) {
        this.deleteHistories = deleteHistories;
    }

    public void add(DeleteHistory deleteHistory) {
        deleteHistories.add(deleteHistory);
    }

    public void add(List<Answer> answers) {
        answers.stream()
                .map(answer -> DeleteHistory.answerOf(answer, LocalDateTime.now()))
                .forEach(deleteHistories::add);
    }

    public List<DeleteHistory> getDeleteHistories() {
        return Collections.unmodifiableList(deleteHistories);
    }
```

일급 컬렉션으로 분리함으로써 삭제 관련 비즈니스 로직을 독립적으로 테스트할 수 있게 되었습니다.
</br>
아래는 `DeleteHistories` 클래스의 단위 테스트 예시입니다.
```java
//DeleteHistoriesTest.java

@DisplayName("삭제 히스토리를 추가할 수 있다.")
@Test
void add() {
    DeleteHistories deleteHistories = new DeleteHistories();

    deleteHistories.add(new DeleteHistory(ContentType.QUESTION, Q1.getId(), Q1.getWriter(), LocalDateTime.of(2024, 10, 10, 11, 0)));

    assertThat(deleteHistories).isEqualTo(new DeleteHistories(List.of(new DeleteHistory(ContentType.QUESTION, Q1.getId(), Q1.getWriter(), LocalDateTime.of(2024, 10, 10, 11, 0)))));
}

```

기존 `deleteQuestion` 메소드는 `Question` 객체의 삭제 권한 검증을 외부에서 수행했습니다. 여기에는 두 가지 문제점이 있습니다.

1. 다른 서비스에서 `Question`의 `delete` 메소드를 호출할 때 권한 검증을 누락할 수 있음
2. `isOwner` 메소드를 중복 호출하게 됨

이를 개선하기 위해 권한 검증 로직을 `Question`의 `delete` 메소드 내부로 이동하여 아래와 같은 이점을 얻을 수 있었습니다.

1. 캡슐화 강화: 삭제 권한 검증이 `Question` 객체 내부에서 처리됨
2. 실수 방지: 다른 개발자가 권한 검증을 누락할 위험이 없어짐
3. 중복 제거: 권한 검증 로직이 한 곳에서 관리되어 코드 중복이 방지됨

```java

//기존 QnAService의 deleteQuestion 메소드
//
// if (!question.isOwner(loginUser)) {
//     throw new CannotDeleteException("질문을 삭제할 권한이 없습니다.");
// }

//Question.java
public DeleteHistories delete(NsUser user) throws CannotDeleteException {
    if (isNotOwner(user)) {
        throw new CannotDeleteException("질문을 삭제할 권한이 없습니다.");
    }
    //추가 개선 포인트
    answers.validateOnwer(user);

    deleted = true;
    List<Answer> deletedAnswers = answers.deleteAll();

    DeleteHistories deleteHistories = new DeleteHistories();
    deleteHistories.add(DeleteHistory.questionOf(id, writer, LocalDateTime.now()));
    deleteHistories.add(deletedAnswers);

    return deleteHistories;
  }
```
`List<Answer>`를 일급 컬렉션 `Answers`로 변경하면서 `Question` 객체의 `delete` 메소드의 책임이 줄어들고 있습니다. 하지만 여전히 개선이 필요한 부분이 있습니다.

현재 코드에서는 댓글들의 삭제 권한 검증이 `deleteAll()` 메소드 외부에서 이루어지고 있습니다. 이는 `Question` 객체의 `delete` 권한을 외부에서 검증했을 때와 동일한 문제점들을 가지고 있습니다.
이 문제를 해결하기 위해서는 댓글의 삭제 권한 검증도 마찬가지로 `deleteAll()` 메소드 내부로 이동시켜야 합니다.

다음으로 삭제 히스토리 생성 부분도 개선했습니다.

```java
// 변경전 삭제 히스토리 추가 로직
// public void add(List<Answer> answers) {
//     answers.stream()
//             .map(answer -> DeleteHistory.answerOf(answer, LocalDateTime.now()))
//             .forEach(deleteHistories::add);
// }
public List<DeleteHistory> toDeleteHistories() {
    List<DeleteHistory> deleteHistories = new ArrayList<>();

    LocalDateTime createDate = LocalDateTime.now();
    answers.forEach(answer -> deleteHistories.add(answer.toDeleteHistory(createDate)));

    return deleteHistories;
}

```

| 구분 | 기존 문제점 | 개선 사항 |
|------|------------|-----------|
| 삭제 처리 | `deleteHistories` 객체가 댓글 목록을 직접 받아 처리 | `Question`, `Answer`가 자신의 `DeleteHistory`를 직접 생성하도록 변경 |
| 시간 일관성 | 각 댓글의 삭제 시간이 서로 다를 수 있음 | 삭제 시간을 외부에서 주입받아 동일한 삭제 시간 사용 |
| 책임 분리 | `DeleteHistory` 생성 책임이 `DeleteHistories`에 있어 응집도가 낮음 | `DeleteHistories`는 단순히 `DeleteHistory`를 추가하는 역할만 수행 |

### 3) 개선 전/후 비교
개선 후 `QnAService`의 `deleteQuestion` 메소드를 살펴보면 다음과 같은 책임만을 가지고 있습니다:

1. 데이터베이스로부터 게시글을 조회
2. Question 객체에게 삭제를 요청 (권한 확인까지 위임)
3. Question 객체에게 삭제 히스토리 생성을 요청
4. 삭제 히스토리를 데이터베이스에 저장

앞서 살펴본 `thin service`의 역할과 동일하게 이제 서비스 계층은 단순히 도메인 객체들의 협력을 조정하고, 트랜잭션을 관리하는 역할만 수행합니다.

물론 필요한 경우 실제 데이터베이스나 목(mock)을 활용하여 통합 테스트로 전체 흐름을 검증할 수도 있습니다.

```java
//개선 후 QnAService의 deleteQuestion 메소드
@Transactional
public void deleteQuestion(NsUser loginUser, long questionId) throws CannotDeleteException {
    Question question = questionRepository.findById(questionId)
                                          .orElseThrow(NotFoundException::new);
    question.delete(loginUser);
    List<DeleteHistory> deleteHistroires = question.toDeleteHistories();
    deleteHistoryService.saveAll(deleteHistroires);
}
```

Question 객체는 삭제 권한 검증을 delete 메소드 내부에서 처리하여 검증 로직의 중복을 제거하고 안정성을 높였습니다.

```java
//개선 후 Question의 delete 메소드
public void delete(NsUser user) throws CannotDeleteException {
      if (isNotOwner(user)) {
          throw new CannotDeleteException("질문을 삭제할 권한이 없습니다.");
      }

      deleted = true;
      answers.deleteAll(user);
  }
```
---

## 2단계 - 도메인 모델 추가

### 1) 미션 요구사항 개발

다음 2번째 미션은 수강신청 시스템의 도메인 모델을 설계하는 것입니다. 도메인 모델을 설계할 때는 데이터베이스 테이블을 먼저 고려하지 않고, 객체 간의 관계와 책임을 중심으로 설계하는 것이 중요합니다.

데이터베이스 테이블을 먼저 설계하면 객체가 테이블과 1:1로 매핑되도록 설계하게 되는데, 이는 다음과 같은 문제가 있습니다

1. 객체의 책임이 불명확해집니다
  - 테이블 중심 설계는 데이터를 담는 역할에만 집중하게 됩니다
  - 객체가 해야 할 행동이 서비스 계층으로 흩어지게 됩니다

   예를 들어, 수강신청 시스템에서 `Session` 객체를 테이블 중심으로 설계할 때 두 가지 방식이 있습니다

   ```java
   // 1. 테이블 중심 설계 - 데이터만 가지고 있음
   public class Session {
       private Long id;
       private String title;
       private int capacity;
       private int currentCount;
       
       // getter/setter만 존재
   }
   
   // 2. 객체 지향적 설계 - 비즈니스 로직을 객체가 포함
   public class Session {
       private Long id;
       private String title;
       private int capacity;
       private int currentCount;
       
       public void register(User user) {
           if (currentCount >= capacity) {
               throw new IllegalStateException("수강인원 초과");
           }
           currentCount++;
       }
   }
   ```

   테이블 중심으로 설계하면 자연스럽게 1번처럼 데이터만 가진 객체를 만들게 되고, 비즈니스 로직은 서비스 계층에 구현하게 됩니다. 이는 객체가 자신의 책임을 다하지 못하고 데이터 저장소의 역할만 하게 되는 문제를 가지게 합니다.

2. 요구사항 변경에 대응하기 어렵습니다
  - 테이블 구조가 이미 정해져 있어 객체 설계의 자유도가 떨어집니다
  - 새로운 요구사항이 추가될 때마다 테이블 구조를 변경해야 할 수 있습니다

따라서 도메인 모델을 먼저 설계하고 개발을 진행한 후에 데이터베이스 테이블과 매핑하는 것이 더 유연한 설계를 가능하게 합니다. 이렇게 하면 객체의 책임과 역할에 집중하여 설계할 수 있고, 나중에 데이터베이스 구조를 결정할 때도 더 많은 자유도를 가질 수 있습니다.

이번 미션의 주요 요구사항은 다음과 같습니다
- 과정(Course)은 기수 단위로 운영하며, 여러 개의 강의(Session)를 가질 수 있다.
- 강의는 강의 커버 이미지 정보를 가진다.
- 강의는 무료 강의와 유료 강의로 나뉜다.
  - 무료 강의는 수강 인원 제한이 없다.
  - 유료 강의는 수강 인원과 결제 금액에 대한 제약조건이 있다.
- 강의 상태는 준비중, 모집중, 종료 3가지 상태를 가진다.
- 강의 수강신청은 강의 상태가 모집중일 때만 가능하다.
- 유료 강의의 결제는 이미 완료된 것으로 가정하고 구현한다.

객체의 책임을 적절히 분리하고 응집도를 높이기 위해 인스턴스 변수를 최소화하여 도메인을 설계했습니다. 그 결과 아래와 같은 클래스 다이어그램 구조가 되었습니다.

![객체 다이어그램](/assets/img/2024-12-15-geultto_learning_management_system_with_tdd_and_clean_code_1/mermaid-diagram-2024-12-15-161526.png)
1. Course (과정)
  - CourseMetadata: 과정의 식별자와 기본 정보를 캡슐화
    - id: 과정 식별자
    - title: 과정명
    - creatorId: 생성자 ID
  - Generation: 과정의 기수 정보 관리
  - BaseTime: 생성/수정 시간 관리
  - Sessions: 과정에 포함된 세션들을 일급 컬렉션으로 관리

2. Session (세션)
  - DefaultSession: 세션의 공통 속성과 행위를 정의한 추상 클래스
    - FreeSession: 무료 세션 구현체
    - PaidSession: 유료 세션 구현체

3. PaidSession 관련 값 객체들
  - Money: 세션의 수강료 관리 (불변)
  - SessionCapacity: 수강 인원 관리
    - maxCapacity: 최대 수강 인원
    - currentCount: 현재 수강 인원

4. CoverImage (커버 이미지)
  - ImageFile: 파일 정보 관리
    - name: 파일명
    - size: 파일 크기
  - ImageType: 이미지 타입 관리 (확장자 검증)
  - ImageSize: 이미지 크기 제약조건 관리
    - width: 너비
    - height: 높이

### 2) 개선하기

강의는 유료와 무료로 구분되며, 이를 각각 `PaidSession`과 `FreeSession` 클래스로 구현했습니다. 두 클래스는 `DefaultSession`이라는 추상 클래스를 상속받아 세션의 상태, 기간, 커버 이미지와 같은 공통 속성과 수강신청 검증 로직을 재사용합니다. 이를 통해 중복 코드를 제거하고 각 세션 타입의 고유한 비즈니스 로직에만 집중할 수 있도록 했습니다.

강의 수강 신청은 강의 상태가 **모집중**일 때만 가능해야 합니다. 이를 위해 `validateRegisterStatus()` 메소드를 추상 클래스에 정의하고, 각 구현체의 register() 메소드에서 이를 호출하여 상태를 검증하도록 했습니다.

```java
public abstract class DefaultSession {
    protected final SessionStatus status;
    protected final SessionPeriod period;
    protected final CoverImage coverImage;

    protected DefaultSession(SessionStatus status, SessionPeriod period, CoverImage coverImage) {
        this.status = status;
        this.period = period;
        this.coverImage = coverImage;
    }

    protected abstract void register(Payment payment);

    protected void validateRegisterStatus() {
        if(status.isOpen()){
            return;
        }
        throw new IllegalArgumentException("강의 상태가 모집 중일때만 수강신청이 가능합니다.");
    }
}
```

무료 강의는 수강 인원 제한과 결제 검증이 불필요하므로, 강의 모집 상태만 확인합니다.
```java
public class FreeSession extends DefaultSession {

    public FreeSession(SessionStatus status, SessionPeriod period, CoverImage coverImage) {
        super(status, period, coverImage);
    }

    @Override
    protected void register(Payment payment) {
        validateRegisterStatus();
    }
}
```             


유료 강의는 강의 상태 검증 외에도 수강 인원과 결제 금액을 검증해야 합니다.
```java
public class PaidSession extends DefaultSession {
    private final Money courseFee;
    private SessionCapacity capacity;

    public PaidSession(SessionStatus sessionStatus, SessionPeriod period, SessionCapacity capacity, Money courseFee, CoverImage coverImage) {
        super(sessionStatus, period, coverImage);
        this.capacity = capacity;
        this.courseFee = courseFee;
    }

    @Override
    protected void register(Payment payment) {
        validateRegisterStatus();
        validateCapacity();
        validatePayment(payment);

        capacity = capacity.increase();
    }

    private void validateCapacity() {
        if (capacity.isFull()) {
            throw new IllegalArgumentException("수강 인원이 꽉 찼습니다.");
        }
    }

    private void validatePayment(Payment payment) {
        if (payment == null) {
            throw new IllegalArgumentException("결제 정보가 없습니다.");
        }
        if (courseFee.isDifferent(new Money(payment))) {
            throw new IllegalArgumentException("결제 금액이 수강료와 일치하지 않습니다");
        }
    }
}
``` 

현재 구조는 1단계 미션과 동일하게 수강 신청 검증 로직이 누락될 수 있는 문제가 있었습니다.

이를 해결하기 위해 템플릿 메소드 패턴을 적용했습니다
1. register() 메소드를 public으로 두고 검증과 등록의 순서를 강제합니다
2. 하위 클래스는 validate()와 doRegister() 메소드를 구현해야 합니다
3. 각 구현체는 자신에게 필요한 검증 로직만 작성하면 됩니다

개선 후에는 검증 로직이 누락되는 것을 원천적으로 방지하고, 검증 후 수강등록을 하는 순서를 보장할 수 있었습니다.

개선된 코드를 살펴보겠습니다.

```java
public abstract class DefaultSession {

    ...

    public void register(Payment payment) {
        validate(payment);
        doRegister(payment);
    }

    protected abstract void doRegister(Payment payment);
    protected abstract void validate(Payment payment);

    protected void validateSessionStatus() {
        if(status.isOpen()){
            return;
        }
        throw new IllegalArgumentException("강의 상태가 모집 중일때만 수강신청이 가능합니다.");
    }
}
```

무료 강의 신청 시 `DefaultSession`의 `register` 메소드가 호출됩니다. `register` 메소드는 내부적으로 `validate`를 통한 검증과 `doRegister`를 통한 수강신청 처리를 수행합니다.

무료 강의의 경우 수강 인원 제한이 없으므로, `validate`에서는 강의 모집 상태만 확인하고 `doRegister`는 별도 처리가 필요하지 않습니다.
```java
public class FreeSession extends DefaultSession {

    ...
    @Override
    protected void validate(Payment payment) {
        validateSessionStatus();
    }

    @Override
    protected void doRegister(Payment payment) {
        //무료 세선은 수강신청 제한이 없음
    }
}
```

유료 강의는 수강 모집 중 상태 확인 외에도 수강 인원과 결제 금액에 대한 추가 검증이 필요합니다. 수강 인원이 정원을 초과하지 않았는지, 결제된 금액이 수강료와 일치하는지 확인해야 합니다. `DefaultSession` 클래스를 상속받아 구현하는 개발자는 `register` 메소드를 사용할 때 반드시 `validate` 메소드를 구현해야 하므로, 필수 검증 로직이 누락되는 것을 방지할 수 있습니다.

```java
public class PaidSession extends DefaultSession {

    ...
    //강의 유형에 맞는 검증 로직을 구현
    @Override
    protected void validate(Payment payment) {
        validateSessionStatus();
        validateCapacity();
        validatePayment(payment);
    }
    //강의 유형에 맞는 수강신청 구현
    @Override
    protected void doRegister(Payment payment) {
        capacity = capacity.increase();
    }

    private void validateCapacity() {
        if (capacity.isFull()) {
            throw new IllegalArgumentException("수강 인원이 꽉 찼습니다.");
        }
    }

    private void validatePayment(Payment payment) {
        if (payment == null) {
            throw new IllegalArgumentException("결제 정보가 없습니다.");
        }
        if (courseFee.isDifferent(new Money(payment))) {
            throw new IllegalArgumentException("결제 금액이 수강료와 일치하지 않습니다");
        }
    }
}

```
### 3) 개선 전/후 비교

템플릿 메소드 패턴을 활용하여 강의 유형별로 필요한 검증 로직을 강제하였습니다. 무료 강의와 유료 강의는 각각 다른 검증이 필요한데, 무료 강의는 상태 검증만 하면 되지만 유료 강의는 수강 인원과 결제 금액까지 검증해야 합니다. 이러한 차이를 각 타입별 `validate()` 메소드에서 명확하게 구현하도록 함으로써, 각 강의 유형에 맞는 필수 검증을 누락 없이 수행할 수 있게 되었습니다.


## 느낀 점

- 이번 미션을 진행하면서 평소에 작성하던 코드의 문제점을 발견할 수 있었습니다. 검증 메소드를 분리하고 외부에서 호출하는 방식은 코드 재사용성을 높일 수 있지만, 검증 로직이 누락될 수 있는 위험한 구조였습니다. 이는 다른 개발자가 실수로 검증을 누락하여 시스템의 안정성을 해칠 수 있다는 점을 깨달았습니다.

- 이번 미션에서는 템플릿 메소드 패턴을 사용해 무료/유료 강의의 수강신청 로직을 구현했는데, 토비의 스프링 스터디를 통해 전략 패턴이 더 나은 선택이었을 것이라는 점을 깨달았습니다. 전략 패턴을 활용했다면 더 유연하고 확장 가능한 설계가 되었을 것 같습니다.

현재  템플릿 메소드 패턴은 사용한 구조는 아래와 같은 한계점 갖고 있습니다.
1. 상속을 통한 기능 확장으로 인해 유연성이 떨어집니다
  - 런타임에 검증 로직을 변경하기 어렵습니다. 예를 들어 무료 강의였다가 유료로 전환되는 경우, 상속 구조에서는 객체를 새로 생성해야 하지만 전략 패턴에서는 단순히 전략만 교체하면 됩니다.

2. 상위 클래스와 하위 클래스가 강하게 결합됩니다
  - 상위 클래스의 변경이 모든 하위 클래스에 영향을 미칩니다. 예를 들어 `DefaultSession`에 새로운 필드나 메소드가 추가되면 모든 하위 클래스를 수정해야 할 수 있습니다.
  - 하위 클래스가 상위 클래스의 내부 구조에 종속적입니다. 예를 들어 `validateRegisterStatus()` 메소드의 구현이 변경되면 이를 사용하는 모든 하위 클래스의 동작이 영향을 받게 됩니다.


전략 패턴을 사용하면 다음과 같은 장점이 있습니다:
1. 유연한 확장이 가능합니다
  - 새로운 강의 유형은 새로운 전략을 구현하기만 하면 됩니다
  - 런타임에 다른 전략으로 변경할 수 있습니다
2. 객체 간의 결합도가 낮아집니다
  - `Session` 클래스는 `RegisterStrategy` 인터페이스에만 의존합니다
  - 각 전략은 독립적으로 변경할 수 있습니다.

```java
public interface RegisterStrategy {
    void validate(Payment payment);
    void register(Payment payment);
}

public class Session {
    private final RegisterStrategy registerStrategy;
    
    public Session(RegisterStrategy registerStrategy) {
        this.registerStrategy = registerStrategy;
    }
    
    public void register(Payment payment) {
        registerStrategy.validate(payment);
        registerStrategy.register(payment);
    }
}

public class FreeSessionStrategy implements RegisterStrategy {
    @Override
    public void validate(Payment payment) {
        // 무료 강의 검증 로직
    }
    
    @Override
    public void register(Payment payment) {
        // 무료 강의 등록 로직
    }
}
```

전략 패턴을 적용헀다면 훨씬 더 유연하고 확장 가능했을텐데 라는 아쉬움이 남지만 이번 경험을 통해 템플릿 메소드 패턴과 전략 패턴의 장단점을 깊이 이해할 수 있었습니다.

---
## 다음으로

이번 글에서는 수강신청 시스템 구현을 통해 다음과 같은 내용을 다루었습니다
1. 레거시 service를 thin service로 개선하고 장점을 파악
2. 새로운 요구사항에 대한 도메인 모델 설계

다음 글에서는 수강신청 시스템의 3단계, 4단계 미션을 통해 아래 내용을 다룰 예정입니다
1. 도메인 모델과 데이터베이스 테이블 매핑
2. 새로운 요구사항에 대한 점진적인 코드 개선
