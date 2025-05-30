---
title: "스트랭글러 패턴으로 레거시 코드 점진적 개선하기: 수강신청 시스템 미션과 실무적용"
description: "실무에서 발생한 CPU 100% 문제 해결을 위해 스트랭글러 패턴을 적용한 경험, 점진적 리팩토링 방법, 테스트 코드 활용 사례"
categories: 글또 리팩토링
tags: [spring, 객체지향, 리팩토링, TDD, 스트랭글러 패턴, 레거시 코드, 점진적 개선, 성능 최적화, java]
---

## 요약
- Next-step의 "TDD, 클린 코드 with Java" 과정 중 수강신청 관리시스템 3단계, 4단계 미션을 통해 점진적으로 코드 개선하는 방법을 배우고 실무에 적용해본 경험을 작성하였습니다.

## 이 글의 목적
- 객체지향 프로그래밍과 클린 코드에 관심이 생긴 2년 차 개발자로서, 제 코드가 어떻게 변화하는지 다루고자 합니다.
- 이 글을 통해 스스로 개선된 부분을 인식하는 것이 첫 번째 목표이며, 이 경험을 공유하는 것이 두 번째 목표입니다.

---

## 들어가며
이전 글 [수강신청 관리시스템 리팩토링 (thin service와 template method pattern의 적용)](https://jeonje.github.io/posts/geultto-learning-management-system-with-tdd-and-clean-code-1/) 에서는 ThinServiceLayer와 템플릿 메소드 패턴을 집중적으로 알아보았습니다. 이번 수강 신청 관리 시스템 3단계, 4단계 미션에서는 아래와 같은 내용을 중점적으로 배우고 경험하였습니다.

- 3단계 미션: 도메인 모델을 DB 테이블과 맵핑
- 4단계 미션: 기능 요구사항이 바뀌거나 문제가 생겼을 때, 코드를 점진적으로 리팩토링하는 방법


## 3단계 미션: 수강신청(DB 적용)
3단계 미션의 목표는 **"도메인 모델을 최대한 유지하면서 데이터베이스 테이블에 매핑"**하는 것입니다.

데이터 중심 설계는 테이블을 먼저 설계하고 그에 대응하는 도메인을 만들지만, 이번 미션처럼 객체 중심으로 접근하면 기능 요구사항에 맞춰 도메인을 설계한 뒤 필요한 테이블을 생성하는 흐름을 따르게 됩니다.

### 왜 먼저 도메인을 만들고 테이블을 나중에 만들까?
개발 초기의 잦은 요구사항들을 빠르게 대응하기 위해서입니다.

만약 테이블 구조를 먼저 설계한다면, 테이블 구조뿐 아니라 도메인까지 계속 변경해야 해 개발 부담이 큽니다.

반면, 도메인 객체와 ORM을 활용하면, 테이블 구조를 상대적으로 간단히 수정할 수 있어 변경 사항에 유연하게 대응할 수 있습니다.

### 외래키(Foreign Key) 제약 조건에 대한 고민
3단계 미션에서 테이블 간 외래키를 적용했는데, 이 과정에서 외래키 제약조건의 장단점에 대해 리뷰어님과 함께 고민해볼 기회가 있었습니다.

| 구분 | 내용 |
|------|------|
| 장점 | • 데이터 무결성 보장<br>• 삭제·갱신 시 참조 무결성을 DB 차원에서 처리 가능 |
| 단점 | • 연관된 데이터가 많으면 삭제 시 복잡도가 증가<br>&nbsp;&nbsp;(연쇄적으로 먼저 지워야 할 데이터가 너무 많음)<br>• 테스트 픽스처가 거대해짐<br>&nbsp;&nbsp;(관련 테이블 데이터까지 전부 세팅/삭제해야 함) |

외래키 제약 조건을 꼭 써야할까? 라는 리뷰어님의 물음을 통해 그동안 깊은 고민없이 외래키 제약 조건을 사용해왔다는 것을 깨닫게 되었습니다.

사실 사내 테이블은 대부분 외래키를 사용하고 있어 외래키 제약 조건 사용이 너무 당연해서, 데이터를 제거할 때 외래키 제약 조건이 개발 생산성을 저하해도 그려러니 넘어갔었습니다.

이런 외래키 제약 조건 사용에 대한 고민을 팀원들에게 공유를 하였고, 팀원들과 논의 끝에 새로운 테이블을 만들 때 외래키 제약 조건은 필요한 경우에만 추가하도록 결정하였습니다.


## 4단계 미션: 스트랭글러 패턴(점진적 코드 리팩토링)
4단계 미션은 기능 요구사항 변경이 발생하거나 문제가 생겼을 때, 스트랭글러 패턴을 이용해 코드를 점진적으로 리팩토링하는 과제였습니다.

### 스트랭글러 패턴이란?
- 기존 시스템(레거시 코드)을 한 번에 전부 교체하지 않고, 새 코드와 공존시키면서 점진적으로 대체해나가는 방식
- 레거시 코드 일부를 새 코드로 바꾸고, 모든 기능이 새 코드로 옮겨지면 최종적으로 레거시 코드를 제거
- 작은 단위(예: 메서드)부터 큰 단위(예: 클래스, 모듈, API)까지 폭넓게 적용 가능

- ![Image](https://i.imgur.com/aoHkJkq.png)

참고 : [마이크로소프트-스트랭글러 패턴](https://learn.microsoft.com/ko-kr/azure/architecture/patterns/strangler-fig)


### 스트랭글러 패턴을 실무에 적용해본다면?
운영 환경에서 **파드의 CPU 사용률이 100%**에 도달해 계속 스케일 아웃이 일어나는 문제가 있었습니다.

쓰레드 덤프를 분석하니, 아래와 같은 예약 슬롯 생성 메소드에서 무한루프가 발생하고 있었습니다.

```java
private void 예약슬롯생성(int 근무단위시간) {
    LocalTime start = LocalTime.of(근무시작 시, 근무시작 분);
    LocalTime end = LocalTime.of(근무종료 시, 근무종료 분);

    while (start.isBefore(end)) {
        doSomething();
        start = start.plusMinutes(근무단위시간);
    }
}
```

#### 무한 루프 원인은?
1. 근무단위시간이 0인 경우
2.start가 end보다 계속 작아지는 케이스
  - 예: 근무 종료가 23시 45분, 근무단위 30분 일때, start=23:30에서 30분 더하면 00:00, 날짜는 바뀌지 않아 isBefore(end)가 계속 true가 되어 무한 루프에 빠짐

첫 번째 원인은 근무 단위시간이 0인 경우에 대한 조건문으로 간단히 처리할 수 있었습니다.

두 번째 원인은 위 메소드 안에서 `LocalDate`를 `LocalDateTime`으로 변경하는 것으로 문제를 해결 할 수는 있었습니다. 

하지만 예약 슬롯 생성 로직의 다른 곳에서 근무 시간을 `String`, `LocalDate`으로 변환하여 사용 중이여서 코드의 일관성이 없는 상태였습니다. 

이 상태에서 `LocalDateTime`로 변환하기 보다, 스트랭글러패턴을 활용하여 `String`과 `LocalDate`로 시간을 변환하는 코드를 점진적으로 `LocalDateTime`으로 변경해보기로 하였습니다.


### 점진적 리팩토링(스트랭글러 패턴) 적용
간단한 예시를 통해 스트랭글러 패턴을 어떤식으로 적용했는지 알아보겠습니다.

#### 1. 문제 원인이 된 메소드 복사
개선이 필요한 메소드를 복사하였습니다. 이름은 식별하기 쉽도록 숫자 2를 붙여주었습니다.

```java
private void 예약슬롯생성(int 근무단위시간) {
    LocalTime start = LocalTime.of(근무시작 시, 근무시작 분);
    LocalTime end = LocalTime.of(근무종료 시, 근무종료 분);

    while (start.isBefore(end)) {
        doSomething();
        start = start.plusMinutes(근무단위시간);
    }
}

private void 예약슬롯생성2(int 근무단위시간) {
    LocalTime start = LocalTime.of(근무시작 시, 근무시작 분);
    LocalTime end = LocalTime.of(근무종료 시, 근무종료 분);

    while (start.isBefore(end)) {
        doSomething();
        start = start.plusMinutes(근무단위시간);
    }
}
```


#### 2. 코드 개선
복사한 메소드에서 `LocalDate`를 `LocalDateTime`으로 변경하였습니다.

`LocalDateTime`은 날짜와 시간모두 표현할 수 있기 때문에 23시 30분에서 30분을 더해 0시 0분이 되더라도 날짜가 다음날로 변경되었기 때문에 `isBefore` 메소드가 더 이상 무한루프에 빠지지 않습니다.

```java
private void 예약슬롯생성2(int 근무단위시간) {
    LocalDateTime start = LocalDateTime.of(근무시작 일, 근무시작 시, 근무시작 분);
    LocalDateTime end = LocalDateTime.of(근무종료 일, 근무종료 시, 근무종료 분);

    while (start.isBefore(end)) {
        doSomething();
        start = start.plusMinutes(근무단위시간);
    }
}
```
#### 3. 호출부 변경
이제 예약슬롯생성 메소드를 호출하는 곳을 찾아가서 예약슬롯생성2 메소드를 호출하도록 변경합니다.

#### 4. 기능 확인
하나씩 점진적으로 코드를 변경합니다. 컴파일 에러가 없음을 확인하고 기능을 바로 테스트 해 볼 수 있습니다.

#### 5.기존 메소드 제거
모든 호출부를 변경하고 정상 동작을 확인했다면, 더 이상 사용하지 않는 기존 메소드를 제거합니다.

#### 6. 새 메소드 이름 변경
새로운 메소드 이름을 원래 메소드 이름으로 변경합니다.

스트랭글러 패턴의 장점을 다시 살펴보면 아래와 같습니다.

| 접근 방식 | 장점 | 단점 |
|-----------|------|------|
| 기존 메서드 직접 수정 | • 코드베이스 크기 유지<br>• 즉각적인 변경 가능 | • 호출 범위 파악이 어려움<br>• 부작용 발생 시 롤백이 어려움 |
| 스트랭글러 패턴 적용 | • 컴파일/테스트 상태 유지하며 검증 가능<br>• 문제 발생 시 쉽게 롤백 가능<br>• 점진적 변경으로 리스크 감소 | • 일시적으로 중복 코드 발생<br>• 완료까지 더 많은 시간 소요 |

스트랭글러 패턴은 메서드 단위뿐 아니라, 클래스 변경, API 분리, 마이크로서비스 전환 등에서도 똑같이 적용 가능합니다.


## 이번 미션을 통해 느낀점
스트랭글러 패턴을 활용할 때 TDD, 객체지향 설계, 클린 코드의 도움으로 더 안전하게 코드를 바꿀 수 있었습니다.
- TDD를 통한 안전한 리팩토링
  - 점진적 변경 과정에서 기능이 깨지지 않았음을 계속 확인 가능

- 객체지향 설계
  - 책임이 잘 분리된 객체들은 변경의 영향 범위가 제한적
  - 인터페이스를 통한 의존성 관리로 새로운 구현체로의 변경이 쉬움

- 클린 코드
  - 작은 함수들은 변경이 쉽고, 읽기 쉬움
  - 명확한 네이밍으로 변경이 필요한 부분을 쉽게 식별

## 넥스트 스텝을 마무리하면서 
### 넥스트 스텝 과정을 통해 성장했을까?
2개월이 지난 지금, 실무에서 코드를 작성하며 많은 변화가 있음을 느꼈습니다.

#### 1. 코드 품질에 대한 관점 변화
- 객체지향 생활체조 원칙을 자연스럽게 고려하며 코드를 작성합니다.
- "동작하는 코드"를 넘어 "유지보수하기 좋은 코드"를 고민합니다.
- 팀 코드 리뷰에서 더 본질적인 문제를 발견하고 의견을 제시합니다.

#### 2. 테스트 작성 능력 향상
- Mocking 없이도 테스트할 수 있는 순수한 단위 테스트 설계합니다.
- 경계값과 엣지 케이스를 꼼꼼히 고려한 테스트 시나리오 작성합니다.
- 테스트하기 어려운 코드를 발견하면 설계 개선의 신호로 인식합니다.

#### 3. 설계 능력의 발전
- Service 계층을 얇게 유지하여 비즈니스 로직의 응집도 향상 시킵니다.
- 불변 객체를 적극 활용하여 버그 발생 가능성 감소 시킵니다.
- 연관된 속성들을 객체로 묶어 캡슐화 수준 향상 시킵니다.

이런 변화들은 배움을 넘어, 실제 코드 품질 향상으로 이어졌습니다. 팀 내 코드 리뷰에서도 깊이 있는 피드백을 할 수 있게 된 점이 가장 큰 성과라고 생각합니다.

그리고 이 교육과정을 글로 기록하면서도 중요한 2가지를 느꼈습니다.

#### 기록의 중요성
미션을 통해 배운 것과 고민한 것을 글로 기록하면서
- 무엇을 모르고 있었고, 어떤 것을 배웠는지를 확실히 알 수 있었습니다. 이런 과정이 변화를 느낄 수 있는 계기가 되었습니다.
- 실제 업무에서 비슷한 상황에 처했을 때 참고할 수 있는 자료가 되었습니다.

#### 투자의 가치
처음에는 부담스러웠던 교육 비용이었지만, 결과적으로 좋은 투자였다고 생각합니다. 
- 코드 품질에 대한 높은 기준을 경험할 수 있었습니다.
- 실무에서 바로 적용할 수 있는 실질적인 기술들을 배웠습니다.
- 비용에 대한 부담감이 오히려 더 열심히 학습하는 동기가 되었습니다.

도전을 시작 하기 전 "내가 과연 잘 할 수 있을까?" "안해도 문제 없는데 하지 말까?" 등 이런 저런 고민이 많았었습니다.

역시 고민될 땐 결과가 어떻든 직접 해보는 게 가장 좋은 선택이라는 걸 다시 한 번 느끼는 시간이였습니다.👍👍
