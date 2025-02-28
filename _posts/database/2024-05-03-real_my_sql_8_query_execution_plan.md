---
title: "MySQL 실행 계획 읽는 법: 쿼리 성능 분석의 핵심"
description: "Real MySQL 8.0 학습 내용 - EXPLAIN 명령어 활용법, 실행 계획의 각 컬럼 의미와 해석 방법, 쿼리 최적화를 위한 실행 계획 분석 가이드"
categories: database
tags: [database, MySQL, 실행계획, 쿼리최적화, EXPLAIN, 인덱스, 통계정보]

---

> Real MySQL 8.0 10장 실행계획을 학습한 내용입니다.

# 실행계획

# 1.통계정보

MySQL 8.0부터는 인덱스되지 않는 칼럼들에 대해서도 데이터 분포도를 수집하고 저장하는 히스토그램 정보가 도입되었다.

### 테이블 및 인덱스 통계 정보

MySQL 5.6 버전부터 InnoDB 스토리지 엔진을 사용하는 테이블에 대한 통계 정보를 영구적으로 관리할 수 있게 되었다. 즉, 통계 정보를 테이블로 관리함으로써 MySQL 서버가 재시작돼도 기존의 통계 정보를 유지한다.

통계정보는 mysql 데이터베이스의 `innodb_index_status` 테이블과 `innodb_table_status` 에서 관리된다.

```sql
show tables like '%_status%';
```

테이블을 생성할 때 영구적으로 통계를 저장할지 말지를 선택할 수 있다.

```sql
CREATE TABLE test (fd1 INT, fd2 VARCHAR(20), PRIMARY KEY(fd1))
ENIGNE=innoDB
STATS_PERSISTENT = { default | 0 | 1 }
```

`0` : 통계 정보를 MySQL 5.5 이전 방식대로 관리하며 innodb_index_status 테이블과 innodb_table_status에 통계정보를 저장하지 않는다.

`1` : 테이블의 통계정보를 innodb_index_status 테이블과 innodb_table_status에 젖아한다

`default` : 테이블 생성 시 STATS_PERSISTENT 옵션을 설정하지 않는 경우 영구 저장 여부를 innodb_status_persistent 시스템 변수의 값으로 결정한다.

# 2. 실행계획

MySQL 8.0 버전부터는 `EXPLAIN` 명령어를 사용하여 실행 계획을 확인할 수 있다.

MySQL 8.0.18 버전부터는 쿼리의 실행 계획과 단계별 소요된 시간 정보를 확인 할 수 있는 `EXPLAIN ANALYZE` 기능이 추가 되었다. 명령의 결과에는 단계별로 실제 소요된 시간과 처리한 레코드 건수, 반복횟수가 표시된다.

ANALYZE명령은 실제 쿼리를 실행하고 사용된 실행 계획과 소요시간을 보여주기 때문에 시간이 오래 걸리는 쿼리는 실행 계획을 먼저 확인해서 선 튜닝 후 분석 명령을 실행 하는 편이 좋다.

## 실행 계획 분석

**표 형태의 경우**

표의 각 라인은 쿼리 문장에서 사용된 테이블의 개수만큼 출력된다. 실행 순서는 위에서 아래 순서로 표시되는데 UNION이나 상관 서브 쿼리와 같은 경우 순서대로 표시 되지 않을 수 있다.

위쪽에 출력된 결과 (id가 더 작을 수록) 쿼리의 Outer 부분이거나 먼저 접근한 테이블이고, 아래쪽에 출력된 결과 일 수록(id가 클 수록) 쿼리의 Inner 부분 또는 나중에 접근한 테이블이다.

## 2.1 id 컬럼

하나의 select는 1개 이상의 하위 select를 포함할 수 있다. select 키워드 단위로 구분한 것을 단위 쿼리라고 하면 id 컬럼은 단위 쿼리별로 부여되는 식별자 값이다.

하나의 select 에서 join 테이블이 여러개라면 계획 레코드는 여러개이지만 같은 id 값을 가진다.

<aside>
💡 id 칼럼이 테이블의 접근 순서를 의미하는 것은 아니다

</aside>

## 2.2 select_type 컬럼

각 단위 select 쿼리가 어떤 타입의 쿼리인지 표시한다.

### **simple**

union 또는 서브쿼리를 사용하지 않는 단순 select 쿼리인 경우이다. 일반적으로 제일 바깥 select 쿼리가 simple 로 표현된다.

### **primary**

union 또는 서브쿼리를 가지는 select 쿼리의 실행 계획에서 가장 바깥쪽(outer)에 있는 단위 쿼리는 primary로 표시된다. pirmary 단위 쿼리는 하나만 존재한다.

### **union**

union으로 결합하는 단위 select 쿼리 가운데 첫 번째를 제외한 단위 쿼리들은 union으로 표시된다. 첫 번째 단위 select는 union되는 쿼리 결과들을 모아서 저장하는 임시 테이블(DERIVED)로 표시된다.

### **dependent union**

union이나 union all로 집합을 결합하는 쿼리에 표시된다. 여기서 dependent는 union이나 union all로 결합된  단위 쿼리가 외부 쿼리에 의해 영향을 받는 것을 의미한다.

```sql
SELECT *
FROM employees e1 WHERE e1.emp_no IN (
	SELECT e2.emp_no FROM employees e2 WHERE e2.first_name = 'Matt'
	UNION
		SELECT e3.emp_no FROM employees e3 WHERE e3.last_name = 'Matt'
);
```

위 커리는 MySQL 옵티마이저가 IN 내부의 서브쿼리를 먼저 처리하지 않고 외부 employees 테이블을 먼저 읽은 후 서브쿼리를 실행하기 때문에 employees 테이블의 컬럼값이 서브 쿼리에 영향을 준다. 이렇게 내부 쿼리가 외부의 값을 참조할 때 select_type에 dependent 키워드가 표시된다.

<aside>
💡 내부적으로 union이 사용된 select 쿼리의 where 조건에는 e2.emp_no = e1.emp_no 와 e3.emp_no=e1.emp_no 조건이 자동으로 추가되어 실행한다.

</aside>

### **dependent union**

union이나 union all로 집합을 결합하는 쿼리에서 표시된다. 여기서 dependent는 union이나 union all로 결합된 단위 쿼리가 외부 쿼리에 의해 영향을 받은 것을 의미한다.

### **dependent subquery**

아래 쿼리의 경우 MyrSQL 옵티마이저는 외부 employees 테이블을 먼저 읽고 IN 내부의 서브쿼리를 실행하는데 이때 먼저 실행한 employees 테이블의 컬럼값이 서브쿼리에 영향을 준다. 따라서 내부 쿼리가 외부의 쿼리를 참조해서 처리하기 될 때 select_type에 dependent 키워드가 표시된다 (내부적으로 union에 사용된 select 쿼리의 where 조건에는 `e2.emp_no = e1.emp_no` 와 `e3.emp_no =  e1.emp_no` 라는 조건이 자동적으로 추가)

```sql
SELECT *
FROM employees e1 WHERE e1.emp_no IN (
	SELECT e2.emp_no FROM employees e2 WHERE e2.first_name = 'Matt'
	UNION
		SELECT e3.emp_no FROM employees e3 WHERE e3.last_name = 'Matt'
);
```

### **union result**

union result는 union 결과를 담아두는 테이블을 의미한다. 만약 union all을 사용하면 MySQL 서버는 임시 테이블을 버퍼링하지 않아 union result 라인이 필요하지 않게 된다.

### **subquery**

select_type에서는 from 절 이외에서 사용되는 서브쿼리만을 의미한다. (from 절에서는 derived 로 표시)

서브쿼리는 사용하는 위치에 따라 각 이름이 다르다

Nested Query : select 되는 컬럼에 사용된 서브쿼리

Subquery : where절에 사용된 경우

derived table : From 절에서 사용된 서브쿼리, 일반적으로 RDBMS에서는 Inline View 또는 Sub Select라고 부름

### **dependent subquery**

서브쿼리가 Outer select 쿼리에서 정의된 칼럼을 사용하는 경우에 표시된다.

```sql
SELECT e.first_name, 
	(SELECT COUNT(*)
		FROM dept_emp de, dept_manger dm
			WHERE dm.dept_no=de.dept_no AND de.emp_no=e.emp_no) AS cnt
FROM employees e
WHERE e.first_name = 'Matt';
```

### **derived**

단위 select 쿼리의 실행 결과로 메모리나 디스크에 임시 테이블을 생성하는 것을 의미한다. MySQL 서버는 조인 쿼리에 대한 최적화가 많이 이루어졌기 때문에 가능하다면 **derived 형태의 실행계획을 조인으로 해결할 수 있게 바꾸는 것이 좋다.**

### **dependent derived**

MySQL 8.0버전부터는 LATERAL JOIN 기능이 추가되면서 FROM절의 서브쿼리에서도 외부 칼럼을 참조할 수 있게 되었다. **dependent derived는** 해당 테이블이 레터럴 조인으로 사용된 것을 의미한다.

### **uncacheable subquery**

서브 쿼리에 포함된 요소에 의해 캐시 자체가 불가능할 수 있는데 이 경우 **uncacheable subquery**로 표시된다.

캐시를 사용하지 못하는 요소는 다음과 같다.

- 사용자 변수가 서브쿼리에 사용된 경우
- NOT_DETERMINISTIC 속성의 스토어드 루틴이 서브쿼리 내에 사용된 경우
- UUID, RAND와 같이 결과값이 호출할 때마다 달라지는 함수가 서브쿼리에 사용된 경우

### **materialized**

주로 From절이나 In 형태의 쿼리에 사용된 서브쿼리의 최적화를 위해 사용된다

## 2.3 table 컬럼

실행계획은 테이블 기준으로 표시된다. 만약 테이블 이름에 별칭이 부여된 경우엔 별칭이 표시된다. 별도의 테이블을 사용하지 않다면 null이 표시된다. (dual 테이블 사용)

"`<>`" 로 둘러싸인 이름은 임시 테이블을 의미하고, 숫자가 표시 되었다면 select 쿼리의 id 값을 뜻한다.

## 2.4 partitions 컬럼

튜닝을 위해서 파티션을 참조하는 쿼리(파티션 키 컬럼을 Where 조건으로 가진)인 경우 옵티마이저가 쿼리 처리를 위해 필요한 파티션 목록을 partitions 컬럼에 표시한다.

## 2.5 type 컬럼

각 테이블의 접근 방법으로 해석한다

### **system**

레코드가 1건만 존재하는 테이블이나 한 건도 존재하지 않는 테이블을 참조하는 형태의 접근을 뜻한다.

### **const**

테이블의 레코드 건수와 관계없이 쿼리가 프라이머리 키나 유니크 키 컬럼을 이용한 where 조건을 가지고 있으며 반드시 1건을 반환하는 쿼리 처리 방식을 뜻한다. 다른 DBMS에서는 유니크 인덱스 스캔이라고도 부른다.

다중 컬럼으로 구성된 프라이머리 키나 유니크 키중에서 인덱스의 일부 컬럼만 조건으로 사용되는 경우엔 const 타입의 접근방법은 불가하다. 프라이머리 키의 일부만 조건으로 사용된다면 타입이 `ref`로 표시된다

<aside>
💡 const 실행 계획은 MySQL 옵티마이저가 쿼리 최적화 단계에서 쿼리를 먼저 실행해서 통째로 상수화한다

</aside>

### **eq_ref**

여러 테이블이 조인되는 쿼리의 실행 계획에서만 표시된다. 조인에서 처음 읽은 테이블의 컬럼 값을 그 다음 읽어야 할 테이블의 프라이머리 키나 유니크 키 컬럼의 검색 조건에 사용할 때를 가리킨다. 두 번째 이후에 읽는 테이블의 type 컬럼은 eq_ref 가 표시되며 유니크 인덱스는 NOT NULL이어야 한다.

만약 다중 컬럼으로 만들어진 프라이머리 키나 유니크 인덱스라면 인덱스의 모든 컬럼이 사용되어야만 한다.

### **ref**

eq_ref와 다르게 조인의 순서와 관계없이 사용되며 프라이머리 키나 유니크 키 등 제약조건이 없다.

인덱스 종류와 관계없이 동등 조건으로 검색한다면 ref 접근 방법이 사용된다. 반환 되는 레코드가 반드시 1건이라는 보장이 없기 때문에 const나 eq_ref보다 느리지만 동등조건으로 비교하기 때문에 빠른 레코드 조회 방법 중 하나이다.

### **fulltext**

MySQL의 전문 검색 인덱스를 사용해 레코드를 읽는 접근방법이다. 전문 검색 인덱스는 통계 정보가 관리되지 않으며, 전문 검색 인덱스를 사용하려면 Match AGAINST 구문과 같은 다른 SQL 문법을 사용해야한다.

전문 검색 조건은 우선순위는 const, eq_ref, ref가 아니면 일반적으로 MySQL은 전문 인덱스를 사용하는 조건을 선택해서 처리한다.

### **ref_or_null**

ref 접근 방법과 같고 NULL 비교가 추가된 형태이다.

### **unique_subquery**

Where 조건절에서 사용될 수 있는 IN (subquery)형태의 쿼리를 위한 접근 방법이다. 서브쿼리에서 **중복되지 않는 유니크한 값만 반환**할 때 이 접근 방법을 사용한다

### **index_subquery**

IN(subquery)에서 subquery가 **중복된 값을 반환**할 수도 있는데, 이때 중복된 값을 인덱스를 이용해서 제거할 수 있을 때 index_subquery 접근 방법이 사용된다.

### **range**

인덱스 레인지 스캔 형태의 접근방법으로 주로 <, >, IS NULL, BETWEEN, IN, LIKE 등의 연산자를 이용해 인덱스를 검색할 때 사용된다.

### **index_merge**

2개 이상의 인덱스를 이요해 각 검색 결과를 만든 후, 그 결과를 병하배서 처리하는 방식이다. 여러 인덱스를 읽어야 하므로 일반적으로 range 접근 방법보다 효율성이 떨어진다.

### **index**

처음부터 끝까지 읽는 인덱스 풀 스캔을 의미한다. 풀 테이블 스캔 방식과 비교했을 때 비교하는 레코드 건수는 같지만, 일반적으로 인덱스가 데이터 파일 전체보다 크기가 작으므로 더 빠르게 처리된다.

### **all**

풀 테이블 스캔을 뜻한다. 테이블을 처음부터 끝까지 확인하여 불필요한 레코드를 제거하고 반환한다.

## 2.6 possible_keys 컬럼

사용을 고려한 인덱스 목록이다.

## 2.7 key 컬럼

실행 계획에서 사용하는 인덱스이다. 표시 값이 PRIMARY인 경우에는 프라이머리 키를 사용하는 것을 의미하고, 그 외에는 테이블이나 인덱스를 생성할 때 부여한 고유 이름이 표시된다.

실행 계획의 type 컬럼이 index_merge가 아니라면 반드시 테이블 하나당 하나의 인덱스가 사용되고, index_merge는 `,` 로 구분되어 표시된다. 만약 type이 ALL인 경우엔 key는 `NULL`로 표시된다

## 2.8 key_len 컬럼

쿼리를 처리하기 위해 다중 컬럼으로 구성된 인덱스에서 몇 개의 컬럼까지 사용했는지 알려준다. 정확하게는 인덱스의 각 레코드에서 몇 바이트까지를 사용했는지다.

## 2.9 ref 컬럼

type컬럼이 ref면 참조 조건으로 어떤 값이 제공됐는지를 나타낸다. 상숫값이면 const로 표시되고, 다른 테이블의 컬럼값이면 그 테이블명과 컬럼명이 표시된다.

## 2.10 rows 컬럼

실행 계획의 효율성 판단을 위해 예측했던 레코드 건수를 나타낸다. 각 스토리지 엔진별로 가지고 있는 통계 정보를 참조해 옵티마이저가 산출한 값이기 때문에 정확하지는 않다

## 2.11 filtred 컬럼

필터링되고 남은 레코드의 비율을 의미한다. rows * filterd(%)가 남은 레코드의 수가 된다

## 2.12 Extra 컬럼

### Using filesort

order by 처리가 인덱스를 사용하지 못할 때 나타난다. 조회된 레코드는 정렬용 메모리 버퍼에 복사해 퀵 또는 힙 소트 알고리즘을 이용해 정렬된다.

**가능하다면 Using filesort가 나타나지 않도록 쿼리를 튜닝하거나 인덱스를 생성하는 것이 좋다.**

### Using index(커버링 인덱스)

데이터 파일을 전혀 읽지 않고 인덱스만 읽어서 쿼리를 모두 처리할 수 있을 때 표시된다. 인덱스를 이용해 쿼리를 처리할 때 인덱스 검색에서 일치하는 키 값들의 레코드를 읽기 위해 데이터 파일을 검색하는 작업은 큰 부하를 차지 한다. 최악의 경우에는 인덱스를 통해 검색된 결과마다 디스크를 한 번씩 읽어야 할 수도 있다.

인덱스 레인지 스캔을 사용하지만 쿼리의 성능이 만족스럽지 않다면 인덱스에 있는 컬럼만 사용하도록 쿼리를 변경하여 성능 개선을 할 수 있다. 하지만 무조건 커버링 인덱스를 하는 것은 좋지 않다. 인덱스 컬럼이 과도하게 많아지면 인덱스의 크기가 커져서 메모리 아비가 심해지고 레코드를 저장하거나 변경하는 작업이 매우느려질 수 있다.

type 컬럼이 eq_ref, ref, range, index_merge, index 등과 같이 인덱스를 사용하는 실행계획에서는 모두 Extra 컬럼에 Using Index가 표시될 수 있다.

### using join buffer(block nested loop), using join buffer(batched key access), using join buffer(hash join)

조인을 수행할 때 드리븐 테이블의 조인 컬럼에 적절한 인덱스가 없다면 MrSQL 서버는 block nested loop 조인이나 해시조인을 사용한다.

### using where

MySQL 엔진 레이어에서 별도의 가공을 해 필터링 작업을 처리하면 나타난다.

### const row not found

const 접근 방법으로 테이블을 읽었지만, 테이블에 레코드가 1건도 존재하지 않으면 해당 내용이 표시된다.

### deleting all rows

스토리지 엔진의 핸들러 차원에서 테이블의 모든 레코드를 삭제하는 기능을 제공하는 스토리지 엔진 테이블의 경우 해당 문구가 표시된다. 보통 WHERE 조건절이 없는 delete 문장의 실행 계획에서 자주 표시된다.

### distinct

쿼리의 distinct를 처리하기 위해 조인하지 않아도 되는 항목은 모두 무시하고 필요한 것만 조인해서 읽었다는 것을 표현한다.

### firstmatch

세미 조인의 여러 최적화 중 firstmatch 전략이 사용될 경우 해당 문구가 표시된다.

### full scan on null key

쿼리를 실행하는 중 col1이 null을 만나면 차선책으로 서브 쿼리 테이블에 대해서 풀 테이블 스캔을 사용하는 것을 나타낸다.

```sql
col1 IN (SELECT col2 FROM ... )
```

만약 col1이 not null 로 정의된 컬럼이라면 해당 문구는 나타나지 않는다.

IN이나 NOT IN 연산자의 왼쪽 값이 NULL인 레코드가 있고, 서브 쿼리에 개별적으로 WHERE 조건이 지정되어 있으면 성능 문제가 발생할 수 있으니 IN 조건 앞에 컬럼 IS NOT NULL을 넣어주어 성능 개선을 할 수도 있다.

### impossible having

쿼리에 사용된 having 절의 조건을 만족하는 레코드가 없을 경우에 나타난다.

### impossible where

where 조건이 항상 false인 경우 나타난다.

### LooseScan

세미 조언 최적화 중 LooseScan 최적화 전략이 사용될 때 나타난다.

### No matching min/max row

min이나 max와 같은 집합 함수가 있는 쿼리의 조건절에 일치하는 레코드가 없는 경우 나타난다. 함수의 결과는 null이 반환된다.

## 그 외 Extra 컬럼

필요 시 검색해본다.

no matching row in const table

no matching rows after partition pruning

no tables used

not exists

plain isn't ready yet

range checked for each record

recursive

rematerialize

select tables optimized away

unique row not found

using index condition

using index for group-by

using index for skip scan

using MRR

using sort_union

using union

using intersect

using temporary
