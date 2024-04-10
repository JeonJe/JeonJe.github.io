---
tags: [JPA]
title: 자바 ORM 표준 JPA 프로그래밍 - 기본편(1)
keywords: JPA 
sidebar: mydoc_sidebar
permalink: jpa_basic_1.html
folder: jpa 
last_updated: 2024-03-17
---

김영한님의 [자바 ORM 표준 JPA 프로그래밍](https://www.inflearn.com/course/ORM-JPA-Basic)을 정리한 내용입니다.

## SQL 중심적인 개발의 문제점
sql에 의존적인 개발을 피하기 어렵다.

### 객체와 관계형 데이터베이스의 괴리감
- 상속
    - 객체가 상속관계에 있을 때 SQL으로는 각각의 객체를 생성하고 테이블에 따른 조인 SQL 등 해줘야 할 게 많다. 그렇기 때문에 DB에 저장할 객체는 상속관계를 쓰지 않는다.
- 연관관계
    - 객체는 참조를 사용하지만, 테이블은 외래 키를 사용해 조인해야 한다.
- 데이터 타입
- 데이터 식별 방법

JPA는 객체를 자바 컬렉션에 저장 하듯이 DB에 저장하고 싶어 탄생한 기술이다.

## JPA
`Java Persistence API`의 약자로 자바 진영의 ORM 기술 표준이다. 여기서 ORM은 `Object-relational mapping` 의 약자로 ORM 프레임워크가 자바와 DB사이에서 **객체와 테이블을 맵핑해주는 역할**을 한다.

**JPA 저장 동작 원리**
![](https://i.imgur.com/dlY8TLX.png)


**JPA 조회 동작 원리**
![](https://i.imgur.com/Kf8QRWg.png)


### JPA는 인터페이스 모음
JPA2.1 표준 명세를 구현한 3가지 구현체가 있다.
- `Hibernate`
- EclipseLink
- DataNucleus

JPA는 오픈소스 하이버네이트를 자바 표준으로 발전시킨 것이기 때문에 대부분 하이버네이트를 많이 사용한다.


### JPA의 장점
- SQL중심적인 개발에서 **객체 중심**으로 개발을 할 수 있게 도와준다.
- 직접 SQL을 작성하지 않으므로 생상선이 좋다
    - persist, find, setName, remove로 crud가 가능하다
- 유지보수가 좋다
    - SQL은 테이블 컬럼이 추가 되면 모든 SQL이 수정되어야 한다
- 패러다임의 불일치를 해결한다.
    - 동일한 트랜잭션에서 조회한 엔티티는 같음을 보장한다
    -
- 성능
    - **1차 캐시**와 **동일성**을 보장한다.
        - 같은 트랜잭션 안에서는 같은 엔티티를 반환하여 약간의 조회 성능이 향상된 효과가 있다
        - DB 격리 레벨이 Read Commit이여도 어플리케이션에서 Repeatable Read를 보장한다
    - 트랜잭션을 지원하는 **쓰기 지연**이 있다.
        - 트랜잭션을 커밋할 때까지 Insert SQL을 모으고 JDBC Batch SQL 기능을 사용해서 한번에 SQL을 전송할 수 있다.
        - transaction.begin(), transaction.commit()
        - update, delete로 인한 row락 시간을 최소화한다.
            - 트랜잭션 커밋 시 update, delete SQL을 실행하고 바로 커밋한다.
    - **지연로딩**이 가능하다
        - 지연 로딩은 객체가 실제 사용될 때 까지 로딩을 지연시키는 것이다.
        - ![](https://i.imgur.com/aw6rnF1.png)

- 인터페이스를 활용하기 때문에 데이터 접근 추상화와 벤더 독립성을 가지게 된다.


## JPA 시작
JPA의 설정파일은 `/META-INF/persistence.xml` 에 작성한다.

### JPA 구동방식
JPA는 1. 설정 정보 조회, 2. Persistence에서 `EntityManagerFactory` 생성 3. EntityManagerFactory에서 `EntityManager` 생성 순으로 구동한다.

객체 클래스에 `@Entity` 어노테이션을 달아주면 JPA가 관리할 객체로 인식한다. 데이터베이스 PK와 맵핑할 멤버 필드는 `@Id` 어노테이션을 추가한다.

> 엔티티 매니저 팩토리는 하나만 생성해서 어플리케이션 전체에서 공유해야한다.

>엔티티 매니저는 쓰레드간 공유하면 안된다. 사용하고 바로 버린다.

> 중요!! JPA의 모든 데이터 변경은 **트랜잭션 안에서 실행**되어야 한다.

### JPQL
복잡한 조회 쿼리를 위해 SQL을 추상화한 `JPQL`이라는 객체 지향 쿼리 언어를 제공한다. JPQL은 테이블에 종속적이지 않고 객체를 대상으로 검색을 한다.


## 영속성 컨텍스트
![](https://i.imgur.com/yUiGIk3.png)
영속성 컨텍스트는 **엔티티를 영구 저장하는 환경** 이라는 뜻이다.
엔티티 매니저의 `persist` 메소드는 DB에 직접 저장하는게 아니라 엔티티를 영속성 컨텍스트에 저장한다. 영속성 컨텍스트에는 엔티티 매니저를 통해서 접근 할 수 있다. `EntityManger.persist(entity);`

### 엔티티의 생명주기
- 비영속(new/transient)
    - 영속성 컨텍스트와 전혀 관계가 없는 새로운 상태
- 영속(managed)
    - 영속성 컨텍스트에 관리되는 상태
- 준영속(detached)
    - 영속성 컨텍스트에 저장되었다가 분리된 상태
- 삭제 (removed)
    - 삭제된 상태
### 영속성 컨텍스트의 장점
어플리케이션과 DB사이의 중간 계층에 영속성 컨텍스트가 있기 때문에 캐시, 지연쓰기, 지연 로딩 등의 장점이 생긴다.

#### 1차 캐시
![](https://i.imgur.com/I7hE4AO.png)
영속성 컨텍스트에 persist 메소드로 객체가 1차 캐시에 저장되면, 다음 조회 시 1차 캐시에서 객체를 바로 조회할 수 있다.

![](https://i.imgur.com/6woR1ML.png)
만약 1차 캐시에 등록되지 않은 객체를 조회한다면, 1차 캐시를 확인 후 DB베이스에서 해당 객체를 조회한다. 다음으로 가져온 객체를 1차 캐시에 저장을 한 후 반환환다.

> 엔티티 매니저는 데이터베이스 트랜잭션 단위로 만들고, 종료 후 지워지기 때문에 아주 찰나에만 캐시가 존재하므로 큰 성능 이점은 기대하기 어렵다.

#### 영속 엔티티의 동일성 보장
1차 캐시로 `REPEATABLE READ` 등급의 트랜잭션 격리 수준을 DB가 아닌 어플리케이션 단에서 제공이 가능하다. (== 비교를 보장)

#### 엔티티 등록
트랜잭션 안의 쿼리들은 쓰기 지연 SQL 저장소에 있다가 트랜잭션을 커밋하는 순간에 DB에 전송된다.
![](https://i.imgur.com/7A0gH3Q.png)

![](https://i.imgur.com/wooRSny.png)

> jpa는 리플렉션 등 동적으로 객체를 생성해야하기 때문에 기본 생성자가 있어야 한다. (기본 생성자 - 클래스명으로만 이루어진 생성자)

#### 변경 감지 (Dirty Checking)
데이터를 찾아온다음 객체의 값을 변경하면 트랜잭션 커밋 시 udpate 쿼리가 자동적으로 수행된다.
![](https://i.imgur.com/Gk28puL.png)
커밋 시점에 내부적으로 플러쉬가 호출된다. 1차 캐시에서는 엔티티와 읽어온 최초 시점의 스냅샷을 비교하고 값이 변경되었으면 업데이트 SQL을 생성하여 쓰기 지연 SQL 저장소에 만든다. 다음으로 이 업데이트 쿼리를 데이터베이스에 보내고 커밋을 반영한다.

#### 플러시
영속성 컨텍스트의 변경 내용을 데이터베이스에 반영하는 것이다. 플러시가 발생하면 아래와 같은 일이 발생한다.
1. 변경 감지(Dirty Checking)
2. 수정된 엔티티를 쓰기 지연 SQL 저장소에 등록
3. 쓰기 지연 SQL 저장소의 쿼리를 데이터베이스에 전송(등록, 수정, 삭제 쿼리)

플러시 하는 방법은 크게 3가지 이다.
- 직접 호출 - `em.flush`
```sql
Member member = new Member(200L, "member200");  
em.persist(member);  
em.flush(); // 강제로 쿼리 실행
```

> 플러시를 해도 1차 캐시의 내용은 남아있는다.

- 자동 호출 - 트랜잭션 커밋, JPQL 쿼리 실행

플러시는 영속성 컨텍스트의 변경 내용을 데이터베이스에 동기화하는게 주 목적이다. 트랜잭션이라는 작업 단위가 중요하기 때문에 커밋 직전에만 데이터베이스 변경 내용을 전달하여 동기화를 하면 된다.

### 준영속 상태
영속 상태의 엔티티가 영속성 컨텍스트에서 분리된 상태이다. 영속성 컨텍스트가 제공하는 기능(캐시, 변경 감지)등을 제공 받지 못한다

```java
Member member = em.find(Member.class, 150L); // 영속 상태  
member.setName("AAAA"); // 변경 감지  
  
em.detach(member); // jpa에서 관리 안하는 준영속 상태(커밋이 안됨)
```

준영속 상태를 만드는 메소드는 `detach` 외에도 `clear`(영속성 컨텍스트를 완전히 초기화), `close`(영속성 컨텍스트 종료) 가 있다.


## 엔티티 맵핑
### 객체와 테이블 맵핑
- 객체와 테이블 맵핑 : `@Entity`, `@Table`
- 필드와 컬럼 맵핑 : `@Column`
- 기본 키 맵핑 : `@Id`
- 연관관계 맵핑 : `@ManyToOne`, `@JoinColumn`

`@Entity`
JPA가 관리하는 엔티티를 명시한다. JPA를 사용해서 테이블과 맵핑할 클래스에 필수로 달아주어야 한다.
기본 생성자(파라미터가 없는 public, protected 생성자)는 필수이고, `fianl`, `enum`, `interface`, `inner` 클래스에는 사용이 불가하다.

또한 저장할 필드에는 `final` 사용이 불가하다. Entity의 옵션으로 `name`을 추가할 수 있는데 디폴트 값은 달려있는 클래스 명을 사용한다.
테이블 이름이 다르게하고 싶으면 `@Table(name = "")`  을 사용할 수 있다. `catalog`, `schema`의 이름 설정도 가능하다
### 데이터베이스 스키마 자동 생성
- DDL을 애플리케이션 실행 시점에서 자동 생성이 가능하다. 따라서 테이블 중심에서 객체 중심으로 개발을 할 수 있다.
- 데이터베이스에 맞는 적절한 DDL을 알아서 생성해준다.
- 이런 DDL은 개발에서만 사용하도록 하자.

자동 설정을 위해 META-INF의 persistence.xml에 `hibernate.hbm2ddl.auto` 설정을 추가한다.

**hibernate.hbm2ddl options**
![](https://i.imgur.com/CWoA0x4.png)

> 데이터베이스에 매번 컬럼을 추가할 필요 없이 바로 새로운 컬럼 적용이 가능하다.

> update 에서는 지우는 건 불가하다.

**운영 환경에서는 create, create-drop, update를 사용하면 위험하기 때문에 validate 나 none 을 사용하도록 한다.**

DDL 생성 기능에 제약조건도 추가가 가능하다.
회원 이름은 필수이고, 10자 이하라면
**@Column(nullable = false, length = 10)** 으로 작성한다.

유니크 제약 조건을 추가하려면 `@Table(uniqueConstraints = {@UniqueConstraint( name = "NAME_AGE_UNIQUE",  columnNames = {"NAME", "AGE"} )})` 처럼 `uniqueConstraints` 옵션을 활용하여 작성한다.

이런 생성 기능들은 DDL 자동 생성할 때만 영향이 있고, JPA 실행 로직에는 영향을 전혀 주지 않는다.

### 필드와 컬럼 매핑


| 어노테이션       | 설명                        |
| ----------- | ------------------------- |
| @Column     | 컬럼 매핑                     |
| @Temporal   | 날짜 타입 매핑                  |
| @Enumerated | enum 타입 매핑                |
| @Lob        | BLOB, CLOB 매핑             |
| @Transient  | 특정 필드를 컬럼에 매핑하지 않음(매핑 무시) |

- `@Enumerated`을 사용할 때 주의 해야 할 부분 있다.
    - 기본 옵션인 `ORDINAL`을 사용하게 되면 enum **순서**를 데이터베이스에 저장하기 때문에 서버에서 enum에서 순서가 바뀔 경우 위험할 수 있다.그래서 꼭 `EnumType.String`으로 enum **이름**을 데이터베이스에 저장해야한다.
- `@Temporal` 은 LocalDate, LocalDateTime을 사용할 때는 생략이 가능하다.
- `@Lob`은 필드타입이 문자면 CLOB, 그 외에는 BLOB으로 맵핑이 된다.

> h2에서는 enum은 varchar랑 맵핑된다

| 속성                     | 설명                                                                                                                                                             | 기본값                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| name                   | 필드와 매핑할 테이블의 컬럼 이름                                                                                                                                             | 객체의 필드 이름              |
| insertable, updatable  | 등록, 변경 가능 여부                                                                                                                                                   | TRUE                   |
| **nullable(DDL)**      | null 값의 허용 여부를 설정한다. false로 설정하면 DDL 생성 시에 not null 제약조건이 붙는다.                                                                                                 |                        |
| unique(DDL)            | @Table의 uniqueConstraints와 같지만 한 컬럼에 간단히 유니크 제 약조건을 걸 때 사용한다.→ 유니크 키 이름이 랜덤하게 생성되기 때문에 잘 사용하지 않는다. 보통 테이블에서 유니크를 걸 때 이름을 설정하여 사용한다.                            |                        |
| columnDefinition (DDL) | 데이터베이스 컬럼 정보를 직접 줄 수 있다.   ex) varchar(100) default ‘EMPTY'                                                                                                    | 필드의 자바 타입과 방언 정보를 사용해  |
| length(DDL)            | 문자 길이 제약조건, String 타입에만 사용한다.                                                                                                                                  | 서 적절한 컬럼 타입<br><br>255 |
| precision, scale(DDL)  | BigDecimal 타입에서 사용한다(BigInteger도 사용할 수 있다). precision은 소수점을 포함한 전체 자 릿수를, scale은 소수의 자릿수 다. 참고로 double, float 타입에는 적용되지 않는다. 아주 큰 숫자나 정 밀한 소수를 다루어야 할 때만 사용한다. | precision=19, scale=2  |


### 기본 키 맵핑
기본 키를 직접 할당 할 때는 `@Id`만 사용한다.

기본 키를 자동으로 생성하는 경우에는 `@GeneratedValue` 도 사용 해야하는데 자동 생성에는 몇 가지 전략이 있다.

- **IDENTITY**: 데이터베이스에 위임, 주로 MYSQL에서 사용한다.
    - 주의점 : JPA는 보통 트랜잭션 커밋 시점에 INSERT SQL을 실행한다. 하지만 AUTO_INCREMENT는 데이터베이스에 INSERT를 SQL을 실행한 이후에 ID 값을 알 수 있다. 따라서 `IDENTITY` 전략은 `em.persist()` 시점에 쿼리를 Insert하여 DB에서 식별자를 조회한다.
    - em.persist() 시점에 즉시 INSERT SQL 실행 하고 DB에서 식별자를 조회
- **SEQUENCE**: 데이터베이스 시퀀스 오브젝트 사용한다. ORACLE의 경우 `@SequenceGenerator` 가 필요하다.
- **TABLE**: 키 생성용 테이블 사용, 모든 DB에서 사용@TableGenerator 필요
    - 키 생성 전용 테이블을 만들어서 데이터베이스 시퀀스를 흉내낸다. 모든 데이터베이스에 적용이 가능하지만 성능이 좋지 않다.
- **AUTO**: 방언에 따라 자동 지정, 기본값


> seq값은 `Long`을 쓰는 것을 권장한다.  Integer와 Long 타입캐스팅 성능은 별로 소모가 안되고, 값이 10억을 넘어갈 때 Integer를 Long으로 바꾸는 리스크가 크기 때문이다.

**권장하는 식별자 전략**
- 기본 키 제약 조건은 null 이 아니고, 유일하며 변하면 안된다.
- 미래까지 이 조건을 만족하는 자연키는 찾기 어렵기 때문에 대리키(대체키)를 사용하도록 한다.
- 예로 주민등록번호도 기본 키로 사용하기 적절하지않다.
- 권장은 **Long형의 대체 키이며 키 생성 전략**을 사용한다.


### 실습 :  주문 설계
- 회원은 여러번 주문 가능(일 대 다)
- 주문을 할 때 여러 상품을 선택할 수 있다. 반대로 같은 상품이 여러 번 주문 될 수 있다. (다 대 다)

**1차 설계**
![](https://i.imgur.com/HYx8oMg.png)

> 강의에서 새로운 데이터베이스에 연결을 하는데 jpashop이라는 데이터베이스에 새로 연결하고 싶으면 jpashop.mv.db 파일을 새로 생성해야 한다.
[참고](https://nyximos.tistory.com/73)

- 엔티티에 인덱스, 유니크 제약조건, 길이 제약조건 등을 추가 해두면 데이터베이스를 보지 않아도 엔티티를 보고 알 수 있는 장점이 있다.
- 하이버네이트에서는 기본적으로 자바 멤버 필드 카멜케이스를 db 스네이크 컬럼명으로 바꾼다. 만약 바꾸고싶다면 column에 이름을 지정한다.
- 위 테이블 설계의 문제점은 테이블의 외래키를 객체에 그대로 가져왔기 때문에 객체 그래프 탐색이 불가능하고, 참조가 없어 UML도 잘못되었다. 즉, 객체지향스럽게 코드를 작성하려면 Order에 memberId가 아니라 Member 객체가 있어야 할 것이다.

## 연관관계 맵핑 기초

### 연관관계가 필요한 이유
객체를 테이블에 따라 데이터 중심으로 모델링할 시 협력 관계를 만들 수 없다. 테이블은 외래 키로 조인을을 사용해 연관 테이블을 찾고, 객체는 참조를 사용해서 연관된 객체를 찾는다.  이런 차이를 줄이기 위해 연관관계가 필요하다.

### 단방향 연관관계

![](https://i.imgur.com/r3gYfuy.png)

```java
@Entity  
public class Member {  
  
    @Id @GeneratedValue  
    private Long id;  
    @Column(name = "USERNAME")  
    private String name;  
  
    private int age;  
    @Column(name = "TEAM_ID")  
    private Long teamId;  
    @ManyToOne  
    @JoinColumn(name = "TEAM_ID")  
    private Team team;
```

Member 입장에서는 Many고 Team은 하나이기 때문에 ToOne이된다. 즉, `@ManyToOne`   을 사용하고 Team과 팀 테이블 외래키와 연결을 해야하기 때문에 `@JoinColumn(name = "TEAM_ID")` 을 명시해준다.

ManyToOne에서 `@ManyToOne(fetch = FetchType.LAZY)`로하면 member와 team 쿼리가 분리되서 실행된다.

> 트랜잭션 중간에 `em.flush()` , `em.clear()`를 차례대로 명시해주면 flush 메소드에서 영속성 컨텍스트를 db에 모두 저장하고, clear 메소드에서 영속성 컨텍스트를 모두 초기화하기 때문에 이후 find메소드는 영속성 컨텍스트가 아닌 DB로부터 가져올 수 있다.

### 양방향 연관관계와 연관관계의 주인
- 객체 양방향 연관관계는 관리 주인이 필요하다.

![](https://i.imgur.com/E9lavh7.png)

테이블 연관관계는 차이가 없지만 팀에 member List가 생성되었다.


```java
@OneToMany(mappedBy = "team")  
private List<Member> members = new ArrayList<>();
```

1개 Team에서는 Member가 여러명일 수 있기 때문에 `@OneToMany`를 사용하고 연결된 Member의 team 멤버 필드와 연관되어 있다는 것을 `mappedBy = “team”` 으로 명시해준다.


**객체와 테이블이 관계를 맺는 차이**
객체 양방향 맵핑은 사실 단방향 2개로 이루어져 있다
1. 회원 → 팀 연관관계 1개
2.  팀 → 회원 연관관계 1개

하지만 테이블 연관관계는 외래키로 양방향 연관관계 1개를 만들 수 있다.

객체의 연관관계에서 단방향 2개를 사용했기 때문에 만약 멤버가 팀을 바꾸려고 한다면, 멤버의 팀을 바꿔야할지 팀에서 멤버 리스트에서 바꿔줘야 할지 딜레마에 빠지게 된다. **즉, 둘 중 어느 것이 주인인지 알 수 있도록 규칙이 필요하다.**

![](https://i.imgur.com/Bs2t5vD.png)

**양방향 맵핑 규칙**
- 객체의 두 관계 중 하나를 연관관계의 주인으로 설정한다.
- 연관관계 주인만 외래키를 등록하고 수정한다.
- 주인이 아니면 읽기만 가능하다.
- **주인이 아니면 mappedBy 속성을 사용하여 주인을 지정한다.**

그럼 누구를 주인으로 할 것인가? 라는 물음이 생긴다.
**중요 >>> 간단하게  외래 키가 있는 곳을 주인으로 설정한다. 비지니스 로직을 기준으로 연관관계 주인을 선택하면 안된다!!!**
#### 양방향 맵핑 시 가장 많이 하는 실수
가장 많이 하는 실수는 연관관계의 주인에 값을 입력하지 않는 것이다.

```java
Member member = new Member();  
member.setName("member1");  
em.persist(member);  
  
Team team = new Team();  
team.setName("TeamA");  
team.getMembers().add(member);  
em.persist(member);
```
위와 같이 데이터를 insert하면 TEAM_ID에 값이 들어가지 않은 것을 확인 할 수 이있다.
![](https://i.imgur.com/6kBiz6z.png)


아래와 같이 양방향 맵핑 시 연관관계의 주인에 값을 입력해야 한다. 주인이 아닌 쪽에 값을 넣어주지 않아도 조회는 되지만 가급적이면 순수한 객체 관계를 고려하면 항상 양쪽 모두 값을 입력 하는 것이 좋다.

그 이유는 2가지 문제점이 발생할 수 있기 때문이다. 커밋 전에 `flush ,clear`를 안 해주면 **주인에만 값을 넣을 경우 1차 캐시에 주인쪽에만 값이 저장된 상태**이기 때문에 주인이 아닌 쪽의 값을 조회하면 값이 나오지 않은 문제가 발생 할 수 있다.

또 하나의 문제점은 테스트 시 jpa가 없이 순수 자바 코드 상태로 테스트하는 경우에도 값을 가져오지 못 할 수 있다. **따라서 그냥 양방향 모두 값을 넣어주는 것이 좋다.**

```java
Team team = new Team();  
team.setName("TeamA");  
em.persist(team);  
  
Member member = new Member();  
member.setName("member1");  
member.setTeam(team);  
em.persist(member);  
  
team.getMembers().add(member);
```

![](https://i.imgur.com/DhOrqTg.png)


추천하는 방법은 연관관계 메소드를 생성하는 것을 추천한다.
주인에 값을 넣을 때  상대방쪽에도 연관관계를 같이 넣어준다.
```java
public void changeTeam(Team team) {  
    this.team = team;  
    team.getMembers().add(this);  
}
```

양방향 맵핑 시 or 연관 관계 편의 메소드가 양쪽 모두에 있는 경우에는 무한 루프가 발생 할 수 있으니 주의를 해야 한다.
- 무한 루프는 toString, lombok, JSON 생성 라이브러리 등에서 발생할 수 있다.
    - team toString → member 호출 → member toString → team 호출 → …. → 스택 오버플로우 발생
    - **lombok에서 toString은 되도록 쓰지 말고, Response에는 절대 엔티티를 반환하지 말자**

처음 설계 시 단방향 맵핑으로만 설계가 끝나야 한다.양방향 맵핑은 단지, 객체 그래프 탐색을 위해서 설정하는 것 뿐이다.
따라서 양방향 맵핑은 테이블에 영향을 주지 않고, 필요할 때 추가만 해주어도 된다.  (JPQL에서 역방향으로 탐색할 일이 많긴하다.)