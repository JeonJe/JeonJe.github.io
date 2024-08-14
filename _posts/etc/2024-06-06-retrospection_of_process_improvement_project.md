---
title: 진료 프로세스 개선 회고
categories: retrospection
tags: [retrospection project]

---

모비닥은 환자 본인 뿐만 아니라 가족 구성원과 함께 병원 진료 신청 할 수 있는 “함께 진료” 기능이 있습니다. 하지만 이 “함께 진료” 는 여러 환자를 하나의 그룹으로 묶어 처리하기 때문에 몇 가지 문제점이 있었습니다.

가장 큰 문제점은 하나의 증상 & 문진표만 작성한 구조입니다. 만약 자녀A는 타박상, 자녀B는 기침 증상이 있는 경우 대표 증상만 작성하거나 “함께 진료” 가 아닌 개별 신청을 해야합니다.

또 다른 문제점은 환자마다 진료 상태를 나타낼 수 없는 부분입니다. 환자A는 진료는 이미 진료가 종료되었고 환자 B는 아직 진료 중인 경우, “함께 진료”의 종료 시점을 두 환자 중 한 환자의 종료 시점에 맞춰 임의로 진료 종료처리를 해야합니다.

<br/>
이런 불편함 때문에 함께 진료를 신청해도 환자마다 진료 카드를 가질 수 있도록 프로세스 개선을 진행하게 되었습니다.
<br/>

앞서 소개드린 모비닥은 크게 세 부분으로 나눌 수 있습니다.

1. 환자가 사용하는 클라이언트

2. 병원에서 사용하는 클라이언트

3. 관리자 & 배치

이번 프로젝트에서는 병원에서 사용하는 통합 클라이언트의 진료 프로세스 변경과 개선을 담당하였습니다.

## 1. 테이블

팀원들과 가장 먼저 테이블 구조를 분석하고 변경하였습니다. 진료 그룹 단위를 변경하는 것이기 때문에 기존 진료 그룹 테이블과 진료 테이블 컬럼을 조합하여 새로운 테이블을 설계하며 진행하였습니다.

## 2. 객체 및 쿼리 분리

기존에 사용 중인 진료와 관련된 메소드, 쿼리들은 환자 클라이언트, 병원 클라이언트, 관리자에서 함께 사용하고 있었습니다. 이로인해 코드 변경 시 영향도 파악이 어려웠고, 쿼리가 길고 조인 테이블이 많아 속도가 느리고 가독성이 좋지 않았습니다.추가로 진료 프로세스 변경과 함께 각 도메인용 객체와 쿼리로 나누면 좋을 것 같다는 의견이 있어 비지니스 로직 변경과 함께 이 부분도 같이 개선을 진행하였습니다.

**객체의 수와 메소드의 수가 많이 늘어나긴 했지만 각 메소드 기능 범위가 작아졌고, 쿼리에서는 불필요한 컬럼 조회와 JOIN을 제거할 수 있었습니다.** 또한, Mybatis의 SQL snippet을 사용하여 중복되는 코드를 줄이고 refId로 명확한 코드 의미를 나타내도록 변경하였습니다.

```sql
 <sql id="somethingSubQueryColumn">
        ,
        (SELECT seq
         FROM sometable
         WHERE column1 = 조건
         ORDER BY seq DESC
         LIMIT 1)
        AS some_seq
    </sql>
    
  <select id="someId" resultType="SomeObject">
	  SELECT sometable.*
	  <include refid="somethingSubQueryColumn"/>
	  <include refid="paymentSubQueryColumn"/>
	  <include refid="deliverySubQueryColumn"/>
	  ...
  <select/>
```

## 3. FacadePattern 적용

통합 컨트롤러에는 Facade 패턴을 도입하여 컨트롤러의 역할을 요청 및 응답 전달만으로 최소화하였고 컨트롤러에서 의존하고 있는 많은 서비스들을 Facade 서비스로 이동하여 서비스 간 결합을 줄일 수 있었습니다.

```java
@AuthChecking
@PutMapping(value = "/")
public APIResponse changeSomething(@PathVariable("seq") int seq,
                                    @RequestBody Object.Update item) {
    facadeService.changeSomething(seq, item);
    return apiResponseBuilderFactory.success().build();
}
```

## 4. 프로세스 변경

모비닥은 전략 패턴으로 각 진료 타입에 따른 진료 상태를 처리하고 있습니다. 인터페이스가 진료 그룹 객체와 연관되어 있어 인터페이스와 구현체 모두 변경이 필요하였습니다. 특정 객체를 전달받지 않고 DTO 전달하도록 변경하여 인터페이스와 구현체 변경을 최대한 피하고자 하였습니다.

프로세스 변경을 진행하면서 막막함을 많이 느꼈습니다.

기존의 복잡한 비지니스 로직을 이해하고 요구사항에 맞게 변경하는 것도 어렵게 느껴졌지만 **“옳게 코드를 변경하고 있는 건가?”** 를 확인할 수 없어 쉽게 코드를 작성할 수 없었습니다. 테스트 코드 작성을 통해 의도대로 코드가 동작 하는지 확인하며 진행하고 싶었으나 1. 테스트코드 작성이 익숙하지 않았고 2. 일정 안에 30개 이상 API와 화면을 수정을 하는 것만으로 시간이 빠듯할 것이다. 라고 판단하여 테스트 코드 작성을 포기하였습니다.

대신 포스트맨으로 코드가 구현 될 때마다 원하는 응답이 오는 지 확인하는 방식으로 빠르게 개발을 진행하였습니다. 서버 로직과 프론트엔드 변경이 어느정도 되고나서야 요구사항에 맞게 기능이 동작하는 것을 활 수 있었습니다.

# KPT

## Keep

### **심플하게 코드 작성하기**

서버 코드는 최대한 **심플**하게 작성하려고 하였습니다.

개선 전에는 진료 데이터에 대한 유효성 검증을 여러 곳에서 하고 있어 중복된 검증 조건이 존재하였습니다. 이를 가장 먼저 하나의 메소드 안에서 모두 처리 될 수 있도록 개선하였습니다.

<br/>
**메소드명을 명확하게 작성**하여 비지니스 로직을 쉽게 파악할 수 있도록 코드를 작성하고 싶었습니다.

기존에는 환자 도메인과 의사 도메인이 함께 메소드를 사용하고 있었고, 중복된 메소드를 최소화하기 위해 포괄적인 메소드명 사용하고 있었습니다.

예로 의사 변경을 위해 데이터를 조회할 때 `findConsultGroup` 이라는 메소드를 사용하고 있었는데, 이 메소드이름만으로는 어떤 데이터가 필요해 조회하는 지를 파악하기 어려웠습니다. 이 메소드 이름을 `findConsultDetailAndDoctorInfoBySeq` 로 변경하여 진료 상세 정보와 의사 정보가 필요하다는 것을 나타내주었습니다.  또한, 개선 프로젝트를 진행하면서 도메인 별 객체와, 메소드 수가 증가하였기 때문에 메소드 이름이 명확하지 않으면 비슷한 기능의 메소드가 중복되어 만들어질 수 있었습니다. 따라서 메소드 이름은 길어지더라도 명확하게 작성하고자 하였습니다.

### **코드 가독성 챙기기**
 
로버트 C.마틴의 “클린코드”를 참고하며 내용을 적용할 수 있는 부분을 찾아 프로젝트에 적용하고 싶었습니다.

예로 아래 코드는 진료를 요청한 도메인과 진료 단계에 따라 어떤 메소드를 실행할지 판단하는 코드입니다.

```java

if (기존.getStatus().equals(예약신청))
        && 타입.equals((의사))) {
    메소드1(변경, 기존);

} else if (기존.getStatus().equals(예약접수))
        && 타입.equals((의사))) { 
     메소드2(변경, 기존);

} else if (기존.getStatus().equals(진료신청))
        && 타입.equals((의사)) {
     메소드3(변경, 기존);

} else if (기존.getStatus().equals(예약신청) || 기존.getStatus().equals(예약접수))
        && 타입.equals((환자)) {
     메소드4(변경, 기존);
}
```

기존 코드는 if 조건문이 길어 한 눈에 파악하기 어려웠습니다. 이 코드를 아래와 같이 신청 도메인과 진료 상태를 조합한 키를 만들어 if문의 조건만 읽어도 어떤 메소드가 실행 될 지 예측 가능하도록 개선해보았습니다.

```java
  String 의사예약신청 = getKeyOfConsultType(의사, 예약신청);
  String 의사예약접수 = getKeyOfConsultType(의사, 예약접수);
  String 의사진료신청 = getKeyOfConsultType(의사, 진료신청);
  String 환자예약신청 = getKeyOfConsultType(환자 ,예약신청);
  String 환자예약접수 = getKeyOfConsultType(환자, 예약접수);

  if (의사예약신청.equals(key)) {
      메소드1(변경, 기존);
  } else if (의사예약접수.equals(key)) {
       메소드2(변경, 기존);
  } else if (의사진료신청.equals(key)) {
       메소드3(변경, 기존);
  } else if (환자예약신청.equals(key) || 환자예약접수.equals(key)) {
       메소드4(target, update);
  }
```

변경 전에는 1089자, 변경 후에는 1153자로 오히려 코드의 양은 늘었지만, if 조건문 안이 깔끔해져서 코드가 더 읽기 편해졌습니다.

그 외에도 `List<Integer> seqList`  처럼 List 라는 키워드를 중복으로 표현하는 부분도 `List<Integer> seqs`  처럼 작성하였습니다.

클린코드 책뿐만아니라 김영한님의 스프링 강의에서도 “프로젝트에 적용하면 좋을 것 같은데?” 라는 부분들을 적용해보았습니다. 예로 RequestMapping을 아래와 같이 변경하였습니다.

이와 같은 변경은 팀원분들께 혼란을 줄 수 있어 내용을 공유하고 논의 후 적용하였습니다.

**변경 전**

```java

@AuthChecking
@RequestMapping(value = "${server.api.prefix}/abc/{seq}/def", method = RequestMethod.PUT )
public APIResponse changeSomething(@PathVariable("seq") int seq,
                                    @RequestBody Object.Update item) {
    facadeService.changeSomething(seq, item);
    return apiResponseBuilderFactory.success().build();
}
```

**변경 후**

```java
@RequestMapping("${server.api.prefix}")
public class ConsultV2Controller { 

@AuthChecking
@PutMapping(value = "/")
public APIResponse changeSomething(@PathVariable("seq") int seq,
                                    @RequestBody Object.Update item) {
    facadeService.changeSomething(seq, item);
    return apiResponseBuilderFactory.success().build();
}
```

### 성능 개선하기

진료 그룹을 각 진료로 분리함에 따라 가장 많이 사용하는 테이블의 레코드 수와 진료 관련 API 요청 수가 증가하였습니다. 쿼리의 속도가 느릴 수록 사용자가 불편함을 느끼기 쉽기 때문에 프로젝트 배포 후 실행시간이 1초가 넘어가는 슬로우쿼리를 가장 먼저 개선하였습니다.

슬로우쿼리 개선기 : https://jeonje.github.io/posts/project_slow_query_improvement/

프로젝트를 위해 인덱스와 실행계획에 대해 공부하고 개선 포인트를 찾아 개선 시키는 과정이 재미있었습니다.

## Problem

### 코드가 불안정하다.

2주간의 QA 후 배포를 하였지만 버그는 계속 발생하였습니다. 이 과정에서 아래와 같은 문제가 있다는 것을 확인하였습니다.

- 기존 코드의 동작을 정확하게 이해하지 못한 채 코드를 변경하여 의도치 않게 동작한 기능이 존재
- 버그를 고칠 때 영향도를 제대로 파악하지 못해 기존 기능이 동작하지 않음
- 담당하지 않는 서비스의 버그 트러블 슈팅이 미흡함

### 테스트 코드
테스트와 관련된 아래 문제들도 있었습니다.
- 테스트 코드를 작성하지 못하였기 때문에 테스터를 통해 QA를 진행하였습니다. 이 과정에서 시간과 리소스가 많이 들었고, 버그를 놓치는 부분도 있었습니다.
- 코드에 대한 스스로 자신을 할 수 없었고,변경 코드에 대한 회귀방지를 못 했습니다.
- 팀원 간 코드를 수정할 때 비지니스 로직 파악 시간이 길었고, 버그가 발생하였습니다. 만약 테스트 코드가 있었다면 담당 외 코드의 엣지 케이스도 빠르게 파악 할 수 있고, 변경 후 기능이 잘 작동하는 지 확인할 수 있기 때문에 자신감 있게 코드를 변경 할 수 있었을 것 같습니다.

## Try

### 서비스 이해도를 높히자

아직 서비스에 대해 모르는 부분이 많다는 것을 느꼈습니다. 프로젝트에서 담당한 부분은 문서화를 하고, 담당하지 않는 부분은 틈틈히 정리하며 문제가 생겼을 땐 먼저 대응함으로써 서비스 이해도를 높혀 나가고자 합니다.

- 문서화
  - ~~원격진료 프로세스~~
  - ~~환자 클라이언트 진료 접수~~
  - ~~통합클라이언트 결제 프로세스 정리~~

### 테스트 코드 작성을 연습하자

이번 프로젝트를 통해 테스트 코드의 중요성을 많이 느끼게 되었습니다. 테스트 코드를 깊게 공부하고 앞으로의 프로젝트에 적용하여 안정적인 서비스를 개발하는 것이 목표입니다.

- 테스트 코드 학습
  - ~~강의 - [https://www.inflearn.com/course/자바-스프링-테스트-개발자-오답노트/dashboard](https://www.inflearn.com/course/%EC%9E%90%EB%B0%94-%EC%8A%A4%ED%94%84%EB%A7%81-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B0%9C%EB%B0%9C%EC%9E%90-%EC%98%A4%EB%8B%B5%EB%85%B8%ED%8A%B8/dashboard)~~
  - ~~강의 - [https://www.inflearn.com/course/practical-testing-실용적인-테스트-가이드/dashboard](https://www.inflearn.com/course/practical-testing-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B0%80%EC%9D%B4%EB%93%9C/dashboard)~~
  - 강의 - https://www.inflearn.com/course/the-java-application-test#reviews
  - 도서 - 유닛 테스트(진행 중 ~24.08.14)
- 테스트 코드 적용
  - ~~EMR 연동 프로젝트~~
  - ~~사이드 프로젝트~~
  - 모비닥 (진행중 ~24.08..14)
