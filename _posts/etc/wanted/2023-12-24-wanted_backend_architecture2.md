---
title: 원티드 백엔드 아키텍쳐 설계2 - 사용자 수에 따른 규모를 확장하는 방법(1/2)
categories: architecture
tags: [wanted architecture]
---

> 원티드 프리온보딩 백엔드 챌린지 아키텍쳐 설계을 정리한 내용입니다.



# 1.데이터 베이스 다중화
## 1.1목적
대부분의 어플리케이션은 쓰기보다 읽기 연산이 많기 때문에 성능을 위해 데이터 변경은 주 DB로하고, 읽기 연산은 부 데이터베이스 서버들로 분산한다.

## 1.2개념
![](https://i.imgur.com/VrjSgYA.png)

주 데이터베이스(Master)
- Insert, Update, Delete ( + Select)

부 데이터베이스(Slave)
- Master로부터 사본을 전달 받음
- Select

## 1.3 스프링에서 DB 다중화
하나의 데이터 소스를 사용할 경우엔 아래와 같이 설정파일을 작성하면 스프링에서 자동으로 데이터 소스를 생성한다.
```java
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/kotlin_spring?serverTimezone=UTC
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: 1234
```

두 개 이상의 데이터소스를 사용하는 경우엔 자동으로 데이터 소스를 생성하지 않기 때문에 추가적인 코드가 필요하다.

```java
spring:
  datasource:
    master:
      hikari:
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/multiple-datesource?serverTimezone=UTC
        read-only: false
        username: root
        password: 1234

    slave_1:
      hikari:
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/multiple-datesource?serverTimezone=UTC
        read-only: true
        username: root
        password: 1234

```

등록한 데이터 소스는 수동으로 Bean을 등록해줘야한다.

```java
@Configuration
public class MasterDataSourceConfig {

    @Primary
    @Bean(name = "masterDataSource")
    @ConfigurationProperties(prefix="spring.datasource.master.hikari")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }

}

@Configuration
public class SlaveDataSourceConfig {

    @Bean(name = "slaveDataSource")
    @ConfigurationProperties(prefix="spring.datasource.slave.hikari")
    public DataSource slaveDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }

}
```

다음으로 스프링의 트랜잭션 `readOnly` 옵션에 따라 어떤 데이터 소스를 사용할지 분기 처리가 필요하다.

```java
public class ReplicationRoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        DataSourceType dataSourceType = TransactionSynchronizationManager
          .isCurrentTransactionReadOnly() ? DataSourceType.Slave : DataSourceType.Master;
          
        return dataSourceType;
    }
}

public enum DataSourceType {
    Master, Slave
}
```

관련 코드 추가 내용은 [링크](https://cheese10yun.github.io/spring-transaction/) 참고 한다.

---

AWS의 `Aurora Mysql` + `MariaDB Connector J`를 사용하면 마스터 데이터 소스를 하나만 등록하고, 읽기 트랜잭션만 명시하면 자동으로 요청이 분기 처리 된다.
그러나 최신 버전의 MariaDB Connector에서는 지원하지 않고 있기 때문에 현업에서도 driver 3.0으로 사용하고 있다고 한다.

## 1.4 레플리카 개념 학습 
[테크톡](https://www.youtube.com/watch?v=95bnLnIxyWI&ab_channel=%EC%9A%B0%EC%95%84%ED%95%9C%ED%85%8C%ED%81%AC)을 참고하면 좋다.

# 2.캐시
## 2.1 캐시란
자주 참조되는 데이터를 메모리 안에 두는 저장소이다. 데이터베이스로 부터 데이터를 직접 조회보다 훨씬 빠르고, 데이터베이스의 부하를 줄일 수 있다.

## 2.2 로컬 캐시
![](https://i.imgur.com/rhtbZPv.png)

- `장점`
  - 네트워크 호출이 없고, 서버의 물리 메모리에 직접 접근해서 빠르다
- `단점`
  - 서버가 여러대인 경우 동기화 문제가 있다.
  - 인스턴스 물리 메모리 사이즈 제약이 있다.

## 2.3 글로벌 캐시
![](https://i.imgur.com/ZXbaJTR.png)
- `장점`
  - 서버 동기화 고려하지 않아도 된다.
- `단점`
  - 네트워크 호출이 필요하다.
  - 로컬캐시보다 느리다.
  - 캐시 서버 장애 대비가 필요하다

### 참고
[Java Application 성능개선에 대해 알아보자 - Local Cach](https://dev.gmarket.com/16)

[대규모 환경에서 레디스 캐시 성능 높이기](https://news.hada.io/topic?id=2777)

# 3.CDN
## 3.1 CDN이란
정적 콘텐츠를 전송하는 데 쓰이는 분산된 서버 
사용자와 가까운 곳에서 전송함으로써 빠르게 데이터를 줄 수 있다.

[CDN이란 무엇인가](https://velog.io/@youngblue/CDN%EC%9D%B4%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80)


# 4.트랜잭션
## 4.1 개념
![](https://i.imgur.com/x0ffNgs.png)

어플리케이션에서 1개 이상의 읽기와 쓰기를 하나의 논리적 단위로 묶는 방법이다.

트랜잭션으로 묶인 모든 읽기와 쓰기는 한 연산으로 취급하기 때문에 전체가 성공(`Commit`)하거나 실패(`RollBack`)한다. 

## 4.2 ACID의 의미

**원자성**

멀티쓰레드 프로그래밍에서 A 쓰레드가 원자적 연산을 수행한다면 B쓰레드에서는 A쓰레드의 원자적 연산의 중간 상태는 알 수 없다.

트랜잭션은 Commit / Rollback 만 존재하기 때문에 원자성을 만족한다.

**일관성**

데이터의 일관성이 보장되는 것을 의미한다.
하지만, 데이터베이스가 일관성을 위반하는 데이터 쓰기를 막는 방법은 외래 키 제약 조건 또는 유일성 제약 조건 외 방법뿐이다.

일반적으로 애플리케이션에서 데이터가 유효한지 정의하고 데이터베이스는 단순히 데이터만 저장한다. 

**격리성**

동시에 실행되는 트랜잭션은 서로 격리 되는 것을 의미한다. 동일한 데이터베이스 레코드에 접근하면 동시성 문제가 발생하기 때문에 적절한 격리성 전략을 선택해야한다.

애플리케이션에서 직렬성 격리(Serializable isolation)을 사용하면 전체 데이터베이스에서 하나의 트랜잭션을 사용하는 것처럼 동작 할 수 있다. 하지만, 성능이 떨어지기 때문에 실무에서는 많이 사용되지 않는다.

![](https://i.imgur.com/ZCRuFCL.png)

실무에서는 보통 READ COMMITED를 많이 사용한다고 한다.

**지속성**

트랜잭션이 Commit되었다면, 하드웨어 또는 데이터베이스장애가 발생하더라도 데이터가 남아 있는 것을 뜻한다.

[DB 트랜잭션 격리 개념](https://www.youtube.com/watch?v=poyjLx-LOEU&ab_channel=%EC%B5%9C%EB%B2%94%EA%B7%A0)


# Lock
## 낙관적 락(Optimistic Lock)
트랜잭션이 커밋될 때, 어플리케이션이 격리가 위반되었는지 체크한다. 만약 위반되었다면 해당 트랜잭션을 Rollback한다.

자원에 대한 경쟁이 심하지 않은 상황이면 낙관적 락이 비관적 락보다 성능이 좋다. 

하지만 경쟁이 심하다면 Rollback 비율이 높아져 성능이 떨어진다.

스프링에서 낙관적 락 사용법
```java
@Entity
@OptimisticLocking(type = OptimisticLockType.VERSION)
public class Product {
  
  @Id
  private Long id;

  private String name;
  
  @Version
  private Long version;
}
```


## 비관적 락(Pessimistic Lock)
각각의 트랜잭션은 실행되는 동안 전체 데이터베이스의 독점 잠금을 획득한다. 다른 트랜잭션은 락을 가진 트랜잭션이 락을 풀때까지 기다리는 상태가 된다.

### s Lock
다른 사용자가 레코드를 동시에 읽을 수 있지만, Update, Delete를 방지하는 것을 방지한다.
JPA에서는 `PESSIMISTIC.READ` 로 사용한다.

### x Lock
다른 사용자가 읽기,수정,삭제 하는 것을 방지한다.
JPA에서는 `PESSIMISTIC.WRITE` 로 사용한다.

[# 낙관적 락(Optimistic Lock)과 비관적 락(Pessimistic Lock)](https://sabarada.tistory.com/175)


### 분산락
여러서버에서 공유된 데이터를 제어하기 위해 사용한다. 보통 Redis를 많이 사용하고, Zookepper를 사용하여 구현할 수 있다.
만약 JAVA, Redis 조합을 사용한다면, Redisson을 사용하여 쉽게 분산락을 사용할 수 있다.

[# 레디스와 분산 락(1/2) - 레디스를 활용한 분산 락과 안전하고 빠른 락의 구현](https://hyperconnect.github.io/2019/11/15/redis-distributed-lock-1.html)

[ZooKeeper를 화용한 Redis Cluster 관리](https://d2.naver.com/helloworld/294797)