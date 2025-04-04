---
title: "MySQL 데드락 발생 프로시저 개선기"
description: "MySQL InnoDB 데드락 발생 원인과 해결 방법: 저장 프로시저의 GROUP BY 문제 분석부터 어플리케이션 로직 전환으로 성능 85% 개선한 경험 공유"
categories: 
  - 데이터베이스
  - 트러블슈팅
tags: 
  - MySQL
  - 데드락
  - InnoDB
  - 트랜잭션
  - 저장프로시저
  - 성능최적화
  - 데이터베이스
toc: true
toc_sticky: true
image: /assets/img/thumnail/mysql-deadlock-improvement.png
---

## 들어가며
> `Deadlock found when trying to get lock; try restarting transaction`

정기 배포 후, 데이터베이스에서 **데드락이 발생했다는 경고 알림**이 떴다.
갑작스러운 데드락 알림에 당황했던 기억이 아직도 생생하다. 이번 글에서는 서비스 로직에서 발생한 데드락의 원인을 분석하고, 이를 해결해 나간 경험을 공유하고자 한다.

### 이 글에서 다루는 내용
이 글에서는 **MySQL 저장 프로시저에서 발생한 데드락 문제**를 분석하고, **어플리케이션 로직으로 전환**하면서 트랜잭션 처리 시간을 **85% 단축**한 과정을 중점적으로 다룬다.

#### 📌 주요 내용
- **데드락 발생 원인 분석**: `GROUP BY` 사용 시 정렬 순서 미지정으로 인한 트랜잭션 잠금 충돌
- **해결 방안 탐색**: `ORDER BY` 추가, `@Transactional` 조정, 어플리케이션 로직 전환 비교
- **비즈니스 로직 개선**: 프로시저의 한계점 분석 및 어플리케이션 코드로 전환
- **성능 개선 결과**: 트랜잭션 처리 시간 `1,395ms → 204ms` (85% 단축)

## 데드락 발생
### 1. 데드락 발생 인식

정기 배포 후 모니터링 중 `APM(Application Performance Monitoring)` 시스템에서 다음과 같은 에러 메시지가 발생했다.

```java
java.sql.SQLTransactionRollbackException: (conn=2900536) Deadlock found when trying to get lock; try restarting transaction
```

이 에러 메시지는 MySQL에서 데드락이 감지되어 트랜잭션이 롤백되었다는 뜻이다. 관련 로그를 추가적으로 확인해보니 계정의 병원별 마케팅 동의 이력을 업데이트 하는 과정에서 데드락이 발생했다는 것을 알 수 있었다.

### 2. 데드락 로그 확인

데드락이 발생한 정확한 원인을 파악하기 위해 MySQL InnoDB 엔진 상태를 조회하는 `SHOW ENGINE INNODB STATUS` 명령어를 실행해보았다.
결과는 최근 데드락 정보가 남아있지 않았다. 왜 최근 데드락 로그 남지 않은 정확한 이유는 찾지 못하였다. 다만 아래와 같은 이유로 데드락 기록이 남지 않은 것으로 보인다.

데드락 발생 당시 DB의 `innodb_deadlock_detect` 설정이 ON 상태였다. 이 설정이 켜져 있으면 MySQL은 데드락을 다음과 같이 처리한다.
1. 잠금 대기 그래프를 검사해서 꼬여있는 트랜잭션들을 찾는다
2. 그중에서 `언두 레코드`가 가장 적은 트랜잭션을 골라서 롤백한다
3. 롤백된 트랜잭션은 자동으로 다시 시도된다

즉, 데드락 발생 당시 다음과 같은 과정으로 인해 최근 데드락 로그가 남지 않은 것으로 추측하고 있다.
1. InnoDB가 데드락을 감지하고 자동으로 롤백을 해 알림이 발생했다.
2. 재시도를 진행하였고 이미 트랜잭션이 성공적으로 끝났다.
3. `SHOW ENGINE INNODB STATUS`에 최근 데드락 기록이 남지 않았다.


> 데드락 감지 관련 설정 알아보기
데드락 감지 기능은 편리하지만 단점도 있다. 동시에 많은 쓰레드가 처리되거나 트랜잭션이 많은 잠금을 가지고 있을 때는 성능에 부담을 줄 수 있다. 이런 경우에는 다른 방법도 고려해볼 수 있다.
- `innodb_deadlock_detect=OFF`로 끄고 `innodb_lock_wait_timeout` 값을 설정해서 일정 시간 내에 잠금을 획득하지 못하면 에러를 반환한다.
- *주의사항: 위 설정을 사용할 경우 기본 타임아웃 값인 50초는 너무 길어서, 더 짧은 시간으로 설정하는 것이 좋다


#### 데드락 모니터링 개선하기
안타깝게도 데드락이 발생한 시점에는  `innodb_print_all_deadlocks`이 비활성화 되어있었다. 어떤 순서로 잠금이 꼬였는지 정확히 알 수 없었다.  그래서 원인 분석에 많은 시간을 소모했다. 이번 경험을 통해 데드락 모니터링 설정의 중요성을 절실히 깨달았다. 데드락 발생 시 정확한 원인을 추적하려면 `innodb_print_all_deadlocks` 설정을 활성화하여 MySQL 에러 로그(`/var/log/mysql/error.log`)에 데드락 정보를 기록해두는 것을 권장한다.

이번 일을 계기로 데드락 로깅 관련 설정을 점검했다.

#### 데드락 모니터링 개선하기

데드락 발생 당시 `innodb_print_all_deadlocks` 설정이 비활성화되어 있어 잠금이 꼬인 정확한 순서와 원인을 파악하기 어려웠다. 이로 인해 문제 분석에 많은 시간을 소모했다. 

이번 경험을 통해 데드락 모니터링 설정의 중요성을 절실히 깨달았다. 데드락이 발생했을 때 신속하게 원인을 파악하려면 `innodb_print_all_deadlocks` 설정을 미리 활성화해두는 것이 좋다:

이 설정이 활성화 MySQL 에러 로그(`/var/log/mysql/error.log`)에 데드락 발생 시점의 트랜잭션 정보, 잠금 상태, SQL 문 등 상세 정보가 기록된다. 이는 문제 해결 시간을 크게 단축시켜 줄 것이다.

이번 데드락 발생을 계기로 개발 및 운영 환경의 데드락 로깅 관련 설정을 점검하고 미비점이 있으면 개선했다.

#### 데드락 로그 활성화하는 방법
```sql
SET GLOBAL innodb_print_all_deadlocks = ON;
```

영구적으로 설정하려면 `my.cnf` 파일에 다음 내용을 추가한다.
```
[mysqld]
innodb_print_all_deadlocks = 1
```

추가로, MySQL 8(특히 8.0.4) 이상에서는 [로그 상세 수준을 높이는 것이 좋다](https://www.percona.com/blog/enable-innodb_print_all_deadlocks-parameter-to-get-all-deadlock-information-in-mysqld-error-log/). 그리고 `log_error_verbosity=3`으로 설정하는 것이 권장된다. 기본값(`log_error_verbosity=2`)을 사용하면 노트 수준의 정보가 기록되지 않아 데드락 로그의 일부만 볼 수 있다.

#### log_error_verbosity 설정 이해하기

`log_error_verbosity`는 MySQL 서버가 에러 로그에 얼마나 자세한 정보를 기록할지 결정하는 설정이다. 값에 따라 기록되는 정보가 달라진다.

- 1 (ERROR): 심각한 에러만 기록
- 2 (WARNING): 에러와 경고 모두 기록 (기본값)
- 3 (NOTE): 에러, 경고, 일반 정보까지 모두 기록

현재 설정을 확인하려면:
```sql
SHOW VARIABLES LIKE 'log_error_verbosity';
```

일시적으로 변경하려면:
```sql
SET GLOBAL log_error_verbosity = 3;
```

영구적으로 변경하려면 `my.cnf` 파일에 추가:
```
[mysqld]
log_error_verbosity = 3
```

#### 데드락 로그 설정 시 주의사항

데드락을 자세히 파악하기 위해 위와 같이 로그 설정을 하는 것도 좋지만, 주의도 필요하다. 데드락이 자주 발생하면 에러 로그 파일이 빠르게 커질 수 있고, 일반 정보 메시지까지 모두 기록되면 정작 중요한 데드락 정보를 찾기 어려워질 수 있다. 운영 환경에서는 이런 점을 고려해서 설정하자.

---

## 데드락 원인 분석

이제 데드락이 발생한 프로시저의 구조를 자세히 살펴보자.

### 기능 개요

우선 데드락이 발생 관련 기능이 무엇을 하는지 간단히 설명하면:
1. 환자가 본인인증 후 로그인하면
2. 환자와 연결된 가족 환자들의 최근 마케팅 동의 이력을 확인해서
3. 병원별로 마케팅 동의 상태를 화면에 보여준다

![Image](https://i.imgur.com/l0CB7hg.png)

예를 들어, green 환자가 안과에서는 마케팅 동의를 거부했고, green의 가족인 blue 환자가 피부과에서는 마케팅 동의를 수락했다면, green 계정으로 로그인했을 때 안과는 'N', 피부과는 'Y'로 표시된다.

바로 이 병원별 마케팅 동의 이력을 계산하는 프로시저에서 데드락이 발생했다.

![Image](https://i.imgur.com/N2nCkFE.png)

### 프로시저 구조 분석

문제가 된 프로시저는 크게 두 단계로 나눌 수 있다:

**1단계: 데이터 조회 및 커서 생성**
- 내 계정과 연관된 병원 환자 목록에서 최근 마케팅 동의 이력을 가져온다
- 병원별 마케팅 동의 상태를 커서에 저장한다

![Image](https://i.imgur.com/5sbSTmM.png)

**2단계: 데이터 처리**
- 커서에서 1개씩 데이터를 가져와서
- 마케팅 약관 동의 테이블에 추가하거나 업데이트한다

![Image](https://i.imgur.com/P50AtUN.png)

### 프로시저 코드 분석

아래는 프로시저의 의사 코드(pseudo code)다:

```sql
CREATE PROCEDURE MARKETING_TERMS_AGREEMENT_UPDATE(IN _계정식별자)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE 병원식별자 INT UNSIGNED;
    DECLARE 동의상태 CHAR(1);
    
    -- 1. 내 계정과 연관된 병원 환자 목록에서 최근 마케팅 동의 이력을 가져와 커서에 저장
    DECLARE _cursor CURSOR FOR
        SELECT 병원식별자,
               계정식별자,
               마지막 동의 이력 상태
        FROM 병원환자주소록
                 LEFT JOIN 환자계정 on ... = ...
                 -- 성능 개선 포인트: 인덱스를 잘 활용할 수 있을까?
                 LEFT JOIN (SELECT MAX(식별자) as 식별자, 
                                  병원환자식별자, 
                                  코드, 버전, 타입, 
                                  약관동의상태(Y/N)
                            FROM 약관동의 
                            WHERE type LIKE '마케팅'
                            GROUP BY 병원환자식별자) 마지막 약관동의이력
                           ON ... = ....
        WHERE 환자계정테이블의 식별자 = _계정식별자
          AND 탈퇴하지 않은 계정
        GROUP BY 병원식별자, 병원환자의 계정식별자  -- 데드락 발생 포인트!

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- 2. 커서에서 1개씩 가져와 마케팅 약관 동의 테이블에 추가/업데이트
    OPEN _cursor;
    my_loop:
    LOOP
        FETCH _cursor
            INTO _병원식별자, _환자계정식별자, _약관동의이력상태;

        IF done THEN
            LEAVE my_loop;
        END IF;
        
        -- 성능 개선 포인트: 꼭 하나씩 처리해야 할까?
        INSERT INTO 마케팅약관동의 (병원식별자, 환자계정식별자, 동의이력상태, ...)
        VALUES (_병원식별자, _환자계정식별자, _약관동의이력상태, ...)
        ON DUPLICATE KEY UPDATE 동의이력상태 = _약관동의이력상태, ... ;
    END LOOP;
    
    CLOSE _cursor;
END;
```

코드에서 `GROUP BY 병원식별자, 병원환자의 계정식별자`이 데드락의 원인이 되었다. 왜 이 부분이 왜 문제가 되었을까?

## 문제 원인 파악 
두 개 이상의 트랜잭션이 동일한 계정식별자에 대해 프로시저를 호출할 때를 살펴보았다.

### 데드락 발생 시나리오

문제의 핵심은 커서에 데이터를 담을 때 `GROUP BY`를 사용하면서 정렬을 지정하지 않았기 때문에, 각 트랜잭션이 서로 다른 순서로 데이터를 처리하게 된다는 점이다. 이로 인해 잠금 획득 순서가 꼬이면서 데드락이 발생할 수 있다.

아래 그림은 두 트랜잭션이 서로 다른 순서로 병원별 마케팅 동의 이력을 처리하는 상황을 보여준다:

![Image](https://i.imgur.com/YuwbI6d.png)

### 데드락 발생 과정

데드락은 다음과 같은 순서로 발생했을 가능성이 높다:

1. **트랜잭션 A**: 안과 마케팅 동의에 대해 잠금을 걸고 'Y'로 업데이트
2. **트랜잭션 B**: 소아과 마케팅 동의에 대해 잠금을 걸고 'Y'로 업데이트
3. **트랜잭션 A**: 피부과 마케팅 동의에 대해 잠금을 걸고 'N'으로 업데이트
4. **트랜잭션 B**: 피부과 마케팅 동의를 업데이트하려고 시도하지만, 트랜잭션 A가 이미 잠금을 보유 중이므로 대기
5. **트랜잭션 A**: 소아과 마케팅 동의를 업데이트하려고 시도하지만, 트랜잭션 B가 이미 잠금을 보유 중이므로 대기

4번과 5번 단계에서:
- 트랜잭션 A는 소아과 마케팅 동의에 대한 잠금을 얻기 위해 트랜잭션 B가 완료되기를 기다림
- 트랜잭션 B는 피부과 마케팅 동의에 대한 잠금을 얻기 위해 트랜잭션 A가 완료되기를 기다림

이렇게 두 트랜잭션이 서로가 보유한 잠금을 기다리는 교착 상태에 빠지면, 어느 쪽도 진행할 수 없게 된다.

## 해결책 탐색

데드락 문제를 해결하기 위해 세 가지 접근법을 검토했다.

### 방안 1: 정렬 순서 지정하기
![Image](https://i.imgur.com/m3ZJuNX.png)

가장 간단한 해결책은 프로시저 내 `GROUP BY` 절에 `ORDER BY`를 추가하는 것이다. 이렇게 하면 모든 트랜잭션이 동일한 순서로 데이터를 처리하므로 잠금 경합이 발생하지 않는다.

```sql
-- 변경 전
GROUP BY 병원식별자, 병원환자의 계정식별자

-- 변경 후
GROUP BY 병원식별자, 병원환자의 계정식별자
ORDER BY 병원식별자, 병원환자의 계정식별자
```

### 방안 2: 트랜잭션 범위 축소
서비스 레이어에서 프로시저 호출 시 사용하는 `@Transactional` 어노테이션을 제거하는 방법이다. 이렇게 하면 각 SQL 문이 자동 커밋되어 잠금 보유 시간이 최소화된다.

```java
// 변경 전
@Transactional
public void updateMarketingAgreements(Long accountId) {
    ...
}

// 변경 후
public void updateMarketingAgreements(Long accountId) {
    ...
}
```

### 방안 3: 어플리케이션 로직으로 전환
프로시저 로직을 자바 코드로 옮기고, 최적화된 쿼리와 일괄 처리 방식을 적용하는 방법이다. 이는 가장 근본적인 해결책이지만, 코드 변경 범위가 크다.

### 각 방안 비교 분석

| 방안 | 장점 | 단점 | 구현 난이도 |
|------|------|------|------------|
| **1. 정렬 순서 지정** | • 기존 프로시저 구조 유지<br>• 빠른 적용 가능<br>• 변경 범위 최소화 | • 정렬 작업으로 인한 성능 부담<br>• 커서 기반 처리의 비효율성 유지<br>• 테스트 자동화 어려움 | 낮음 |
| **2. 트랜잭션 범위 축소** | • 잠금 시간 최소화<br>• 프로시저 코드 변경 불필요<br>• 빠른 적용 가능 | • 트랜잭션 일관성 저하<br>• 근본적 성능 문제 해결 안됨<br>• 오류 발생 시 롤백 어려움 | 매우 낮음 |
| **3. 어플리케이션 로직 전환** | • 대폭적인 성능 개선 가능<br>• 단위 테스트 용이<br>• 코드 가독성/유지보수성 향상<br>• 배치 처리로 효율성 증가 | • 코드 변경 범위가 큼<br>• 기존 프로시저 대체 필요<br>• 초기 개발 시간 소요 | 높음 |

### 최종 결정
세 가지 방안을 비교 분석한 결과, 장기적 관점에서 **방안 3: 어플리케이션 로직으로 전환**을 선택했다. 비록 개발 비용이 가장 크지만, 다음과 같은 이유로 이 방안이 가장 적합하다고 판단했다

1. 커서 기반 처리를 배치 처리로 전환하여 많은 성능 향상이 기대 됐다.
2. 자바 코드로 전환하면 단위 테스트를 통해 코드 안정성을 확보할 수 있다.
3. 프로시저보다 자바 코드가 가독성이 높고 변경이 용이하다고 판단했다.

그럼 이제 문제를 해결해보자. 

## 문제 해결

어플리케이션 단으로 옮긴 로직의 도식화는 다음과 같다.

![Image](https://i.imgur.com/VgZOvVl.png)

개선한 부분을 하나씩 살펴보자. 
### 1. 가족환자의 최근 마케팅 이력 조회 개선
#### 기존 방식 문제점
병원환자별 최근 마케팅 동의 이력을 조회할 때 `GROUP BY`와 `MAX(seq)` 조합으로 Full Table Scan 발생했다. 개발 데이터 기준으로 30만 건 이상의 데이터 스캔이 필요했다.

#### 변경 후

```sql
WITH RankedTerms AS (
    SELECT
        계정식별자,
        병원환자식별자,
        약관동의상태,
        병원식별자,
        ROW_NUMBER() OVER (PARTITION BY 병원환자식별자 ORDER BY 식별자 DESC) AS rnk
    FROM 약관동의 
    LEFT JOIN 병원환자 ON ...
    WHERE 병원환자식별자 IN (...)
      AND type = '마케팅'
)
SELECT *
FROM RankedTerms
WHERE rnk = 1;
```

1. **필터링**: `WHERE 병원환자식별자 IN (...)` - 회원 계정과 관련된 가족 환자 식별자로 필터링을 먼저한다. 약관동의 테이블에 병원환자 식별자가 인덱스로 걸려있어 빠른 조회가 가능하다

2. **파티셔닝**: `PARTITION BY 병원환자식별자` - 필터링된 데이터를 병원환자 식별자별로 그룹화한다.

3. **순위 매기기**: `ORDER BY 식별자 DESC` - 각 파티션 내에서 식별자 기준 내림차순으로 순위를 매긴다. 이렇게 하면, 가장 최근(식별자가 가장 큰) 마케팅 동의 레코드가 1번 순위를 받는다.

4. **최신 기록 선택**: `WHERE rnk = 1` - 각 병원환자별로 가장 최근의 마케팅 동의 이력만 조회한다.

기존 프로시저에서 안에서 계산된 마케팅 약관 동의 상태(Y/N)는 어플리케이션에서 계산하도록하여 책임을 나누고 쿼리의 복잡도를 낮추었다. 개선결과 개발 데이터 기준 **데이터 스캔량을 30만 건 → 4건으로 감소**, 쿼리 실행 시간 **102.6ms → 0.88ms로 99% 개선** 할 수 있었다.

### 2. 단건 업데이트 개선
#### 기존 방식 문제점
프로시저 내에서 커서를 사용하여 개발 데이터 기준 70건 처리 시 **SQL 호출 71회 발생**했다. 즉, N건의 데이터에 대해 N+1번의 SQL 호출이 발생했다. 

각 SQL 호출마다 MySQL 엔진은 다음과 같은 복잡한 처리 과정을 거쳐야 했다:

**MySQL 엔진의 SQL 처리 과정**:
1. **SQL 파서**: SQL 문장 분석 및 토큰화
2. **전처리기**: 테이블/컬럼 메타데이터 확인 및 권한 검사
3. **옵티마이저**: 최적의 실행 계획 수립
4. **쿼리 실행기**: 실행 계획에 따른 쿼리 실행
5. **스토리지 엔진**: 실제 데이터 저장 및 관리

이러한 과정이 매 레코드마다 반복되면서 성능 저하의 주요 원인이 되었다.

#### 해결
어플리케이션 단에서 병원별 마케팅 동의 이력상태를 계산하고, 단일 SQL 실행으로 처리할 수 있도록 개선했다.

한번에 처리하는 데이터 처리 건수는 최대 100건 미만이어서 별도로 `배치 사이즈`를 설정하진 않았다.

```sql
<update id="upsertMarketingTermsAgreements">
     INSERT INTO 마케팅약관동의 (병원식별자, 환자계정식별자, 동의이력상태, ...)
        VALUES 
         <foreach collection="updates" item="update" separator=",">
            (#{update.병원식별자}, #{update.환자계정식별자}, #{update.동의이력상태}, ...)
        </foreach> 
        ON DUPLICATE KEY UPDATE 동의이력상태 = VALUES(동의이력상태), ... ;
</update>
```

## 결과 
프로시저를 어플리케이션 로직으로 전환한 결과는 유의미했다. 트랜잭션 처리 시간이 **1,395ms**에서 **204ms**로 **85%** 단축됐고, 개선 후 한 달 이상 모니터링했지만 더 이상 데드락이 발생하지 않았다.

성능 개선뿐만 아니라 코드 품질도 크게 향상됐다. 비즈니스 로직을 테스트할 수 있게 되어 병원별 마케팅 동의 상태 설정이 정확한지, 중복된 병원식별자를 올바르게 처리하는지 등 다양한 엣지 케이스를 검증할 수 있게 됐다. 기존 프로시저에서는 불가능했던 부분이다.

### 성능 개선 요약
![Image](https://i.imgur.com/SeditGy.png)

## 끝으로

이번 데드락 문제를 해결하는 과정에서 많은 것을 배웠다. 해결책을 찾는 동안 계속해서 **“왜?”**라는 질문을 던졌다.
- 왜 이 기능을 프로시저로 구현했을까?
- 왜 데드락 로그가 남지 않았을까?
- 왜 데드락이 발생했을까?
- 왜 프로시저 로직을 어플리케이션에서 처리하는 것이 더 나았을까?

이런 질문을 스스로 던지고 답을 찾아가는 과정에서 MySQL의 트랜잭션과 잠금 과정에 대해 더 깊이 이해하게 됐다.또한, innodb_deadlock_detect와 innodb_print_all_deadlocks 같은 설정이 운영 환경에서 문제를 해결하는 데 얼마나 중요한지 직접 체감했다. 무엇보다, 문제가 발생했을 때 원인을 빠르게 파악할 수 있는 로깅 설정과 모니터링 체계가 필수적이라는 점을 다시 한번 깨달았다.

프로시저에서 어플리케이션 코드로 옮기면서 테스트가 쉬워지고 유지보수도 편해졌다. 더불어 데이터 조회도 개선하고 일괄 처리를 도입해서 성능도 높이고 안정성도 확보했다. 


모든 질문에 대해 완벽한 답을 찾은 것은 아니다. 하지만 답을 찾아가는 과정 자체가 큰 배움이었고, 이를 통해 더 나은 해결책을 고민할 수 있었다. 앞으로도 문제에 직면할 때마다 **“왜?”**라는 질문을 던지고, 근본 원인을 파악하며, 장기적인 관점에서 최선의 해결책을 찾아나가는 접근 방식을 계속 적용해보려고 한다.

## 참고 자료

### 공식 문서
- [MySQL 공식 문서: InnoDB 데드락](https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlocks.html) - 데드락의 원인과 해결 방법에 대한 공식 가이드
- [MySQL 8.0 새로운 기본 설정](https://dev.mysql.com/blog-archive/new-defaults-in-mysql-8-0/) - MySQL 8.0의 verbosity 기본값 변경 사항

### 블로그 및 기술 문서
- [Percona Blog: innodb_print_all_deadlocks 파라미터 활성화](https://www.percona.com/blog/enable-innodb_print_all_deadlocks-parameter-to-get-all-deadlock-information-in-mysqld-error-log/) - 데드락 정보를 MySQL 에러 로그에 기록하는 방법

### 서적
- Real MySQL 8.0 - MySQL 내부 구조와 동작 원리에 대한 상세 설명
