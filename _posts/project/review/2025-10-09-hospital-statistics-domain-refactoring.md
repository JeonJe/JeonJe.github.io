---
title: "병원 통계 시스템 리팩토링 - 중복 로직 제거로 데이터 신뢰도 높이기"
description: "통계 테이블과 진료 테이블 수치 불일치 문제를 DRY 원칙 적용과 도메인 객체 캡슐화로 해결한 경험. 신규/이탈 판정 로직을 서비스 계층에서 분리하고, 단일 데이터 소스 기준으로 통합해 수치 신뢰도 100% 확보와 개발 리소스 절반 단축을 이뤄낸 과정을 공유합니다."
categories:
  - 프로젝트
  - Architecture
tags:
  - DRY원칙
  - 리팩토링
  - 데이터일관성
  - 책임분리
toc: true
toc_sticky: true
image: /assets/img/thumbnail/hospital-statistics-refactoring.png
---

## 들어가며

![](https://i.imgur.com/aWvdBFm.png)

병원 통계 기능은 신규·재방문·이탈의심·노쇼(미방문) 같은 데이터를 통해 병원 운영 현황을 보여준다.
단순한 숫자가 아니라, 병원이 어디에 집중해야 할지를 알려주는 **방향표**다.

이번 글에서는 기존에 단순하게 정의되었던 통계 데이터의 기준(‘신규’, ‘이탈의심’)을 사용자에게 더 가치 있게 다시 세우고,
그로 인해 복잡해진 로직을 어떻게 **구조적으로** 풀어냈는지 그 경험을 공유한다.

## 문제 배경 - 중복 계산과 불일치의 시작

초기 통계 시스템에서는 신규 환자를 조회 기간 내 진료가 있는 환자 중, 환자 등록일이 진료일 기준 30일 이내인 경우로 판단했다.
이탈의심 환자는 신규 환자 중에서도 마지막 진료일 이후 일정 기간 동안 추가 진료가 없는 경우로 계산했다.

단순하고 빠른 쿼리 중심 구조로, 초기 서비스 검증에는 적합했다. 하지만 하나의 환자가 조회 기간 중 여러 번 진료를 받으면 매번 신규 환자로 중복 계산되는 문제가 발생했다.
예를 들어, 같은 환자가 5월 1일에 등록하고 5월 11일과 13일에 진료를 받으면 두 날짜 모두 신규로 잡히는 식이었다.

정의가 구체화되면서 로직도 복잡해졌고, 두 가지 과제가 드러났다.

1) 이탈 판정은 신규 판정에 의존하므로 **신규 로직을 재사용할 수 있도록 서비스 계층에서 책임을 분리하고 로직을 캡슐화**해야 했다(기존에는 각자 쿼리로 독립 동작).
2) 통계 테이블(통계 데이터)과 진료 테이블(진료 데이터)이 **서로 다른 기준으로 계산**되어 수치가 어긋났고, 원인 추적에 시간이 많이 들었다(예: 통계 테이블 10명, 진료 테이블 8명).

결국 **정확도, 유지보수성, 디버깅 효율**을 함께 높일 필요가 있었다.

## 해결 - 한 번 계산하고, 모든 곳에서 신뢰하기

### 문제 1 — 신규/이탈 구조 재정렬(단일 책임 + 재사용)

이탈의심 환자를 계산하려면 먼저 **신규 환자 식별**이 정확해야 한다. 이전 구조는 각 쿼리를 따로 관리해 **신규 기준을 바꾸면 이탈 로직도 별도로 손봐야** 했다. 로직이 복잡해지면서 더는 쿼리만으로 각각 처리하기 어려웠다.

이 문제를 해결하기 위해 **책임을 재배치**했다. **신규 환자 서비스**와 **이탈의심 환자 서비스**를 분리해 만들고, 각 서비스는 **도메인 객체와 일급 컬렉션에 판정 책임을 위임해, 객체가 스스로 판단하도록 구조를 캡슐화했다.** 예를 들어 ‘환자별 최초/마지막 진료’ 같은 개념을 객체가 스스로 판정하고, 이탈 판정은 캡슐화된 신규환자 판정 로직을 활용하도록 했다.

간단하게 신규환자 로직이 어떻게 개선되었는지를 살펴보자.

#### 개선 전 — 쿼리 중심(단일 쿼리로 모든 통계 계산)

기존에는 하나의 복합 쿼리에서 신규/이탈/노쇼 등 모든 지표를 집계한다.
아래 첫 메서드는 **일별 통계를 한 번에 계산**, 두 번째는 **신규 환자 CASE WHEN** 예시다.

```java
// StatisticsRepositoryImpl.java
public List<DailyStats> findDailyStats(SearchPeriod period) {
    // 하나의 쿼리에서 신규환자 카운트를 계산
    return queryFactory.select(/* 생략 */)
        .from(stats)
        .where(dateBetween(period))
        .groupBy(stats.date)
        .fetch();
}

private NumberExpression<Long> countNewPatients() {
    DateExpression<LocalDate> regDate = regDateOf(stats.patientId);
    DateExpression<LocalDate> thirtyDaysBefore = addDays(stats.date, -30);
    return new CaseBuilder()
        .when(stats.status.in("COMPLETED", "ENDED")
              .and(regDate.between(thirtyDaysBefore, stats.date)))
        .then(stats.patientId)
        .otherwise((Long) null)
        .countDistinct();
}
```

- 문제: **로직이 SQL 내부에 강결합**, 변경/테스트/가독성 모두 불리

#### 개선 후 — 서비스/도메인 중심(관심사 분리)

신규환자 서비스에서는 단계별로 데이터를

1. 신규환자 후보 조회
2. 신규환자의 최초 진료일 확인
3. 일급 컬렉션으로 신규환자 여부 판단
4. 신규환자의 진료 정보 요약 조회

```java
// NewPatientService.java
public class NewPatientService {
    private final NewPatientRepository repository;

    /** 기간 내 신규 환자의 모든 진료 요약을 반환 */
    public List<NewPatientVisitSummary> findNewPatientVisits(SearchRequest search) {
        // 1) 기간 내 최초 진료 후보
        List<EarliestVisit> candidates = repository.findEarliestVisitCandidates(search);

        // 2) 전체 이력 기준 최초 진료
        List<Long> ids = candidates.stream().map(EarliestVisit::patientId).toList();
        List<EarliestVisit> baseline = repository.findEarliestVisitsUpTo(search.endDate(), ids);

        // 3) 일급 컬렉션으로 신규 판정 캡슐화
        NewPatientCandidates inPeriod = new NewPatientCandidates(candidates);
        NewPatientCandidates allTime   = new NewPatientCandidates(baseline);
        NewPatientCandidates actual    = inPeriod.filterAgainst(allTime); // 기간 첫 진료 == 전체 첫 진료

        // 4)신규 환자의 진료 정보 요약 조회
        return repository.findNewPatientVisitSummaries(search, actual.patientIds());
    }
}
```

환자의 ‘최초 진료’를 불변으로 표현한다(동등성/비교 용이).

```java
// EarliestVisit.java
public record EarliestVisit(long patientId, long consultId, LocalDate date) {
    public static EarliestVisit of(long patientId, long consultId, LocalDate date) {
        return new EarliestVisit(patientId, consultId, date);
    }
}
```

기간 기준과 전체 기준을 비교해 ‘진짜 신규’만 남기는 필터 로직을 일급 컬렉션으로 캡슐화했다.

```java
// NewPatientCandidates.java — 일급 컬렉션
public final class NewPatientCandidates {
    private final List<EarliestVisit> items;
    private final Map<Long, EarliestVisit> byPatient;

    public NewPatientCandidates(List<EarliestVisit> items) {
        this.items = List.copyOf(items);
        this.byPatient = this.items.stream()
            .collect(Collectors.toMap(EarliestVisit::patientId, Function.identity()));
    }

    /** 기간 기준과 전체 기준을 비교해 '진짜 신규'만 남긴다 */
    public NewPatientCandidates filterAgainst(NewPatientCandidates baseline) {
        List<EarliestVisit> filtered = items.stream()
            .filter(v -> {
                EarliestVisit b = baseline.byPatient.get(v.patientId());
                return b != null && b.consultId() == v.consultId();
            })
            .toList();
        return new NewPatientCandidates(filtered);
    }

    public List<Long> patientIds() { return items.stream().map(EarliestVisit::patientId).toList(); }
}
```

집계 지점에서는 서비스 한 줄 호출만으로 일관된 결과를 얻는다.

```java
// 집계 지점에서의 사용 — 필요한 한 줄만
List<NewPatientVisitSummary> newPatients = newPatientService.findNewPatientVisits(search);
```

- 핵심: **쿼리는 단순 조회**, 판정은 **도메인/컬렉션이 담당** → 테스트 용이·변경 영향 최소화

---

### 문제 2 — 통계 테이블 수치와 진료 테이블의 일치성 확보

테이블 수치와 진료 테이블이 어긋난 건 **구조적 문제**였다. 초기에는 성능을 우선시해 **통계 테이블은 통계 데이터**, **진료 테이블은 진료 데이터**를 조회하도록 분리했다. 그 결과 비즈니스 로직 오류, 테이블 간 동기화 시차, 데이터 자체 불일치가 겹치며 차이가 발생했다.
![](https://i.imgur.com/WFiHLJG.png)
*그림 1. AS-IS: 통계 테이블과 진료 테이블이 서로 다른 데이터 소스를 참조하여 불일치 발생*

고민 끝에 원칙을 정했다: **“계산은 한 번만, 결과는 일관되게.”**  
통계 API가 집계 시점의 **포함 환자·진료 식별자 목록**을 함께 반환하고, 진료 테이블은 **그 목록만**으로 정렬/페이지네이션 한다. 즉, **수치 계산과 진료 조회의 기준을 하나로 통합했다.**
![](https://i.imgur.com/SC4A8v9.png)
*그림 2. TO-BE: 통합 API에서 식별자를 함께 반환하여 1:1 매칭 보장*

이제 통계 테이블과 진료 테이블은 **항상 1:1로 일치**한다. 통계 테이블이 ‘이탈의심 10명’이면 진료 테이블도 10명이다. 데이터 신뢰가 회복됐고, 개발·디버깅 시간도 줄었다.

## 성과 - “이젠 일치해요”

사용자와 개발 관점에서 아래와 같은 성과가 있었다.

### 사용자(병원) 관점

- **활용성 증가**: 새로운 신규·이탈 기준을 바탕으로  정확한 신규환자와 이탈의심환자 식별이 가능해져 **재방문 관리 및 캠페인 타깃팅**이 쉬워졌다.
- **수치 신뢰도 향상**: 통계 테이블 수치와 진료 테이블 불일치 문의가 **0건으로 유지**되고 있다.

### 개발 관점

- **개발 리소스 단축**: 계산 로직을 한 곳으로 모으면서 **추가 개발·수정 리소스가 약 절반 수준으로 줄었고**, 수치가 달라졌을 때 **원인 파악·수정 시간도 크게 줄었다**. 로직이 단순해져 **코드 변경도 쉬워졌다**.
- **패턴 확장성**: 동일 방식으로 **시간대별 진료 건수와 해당 시간대 진료 테이블 상세 리스트**도 구현 가능하다.

한 가지 우려는 응답 크기였다. 기존 구조는 식별자 목록이 없어 응답이 작았지만, 개선 후에는 ‘포함된 진료 식별자’를 함께 내려야 하므로 커질 수 있다. 이를 검증하기 위해 가장 긴 조회 구간(1년)을 대상으로 **응답 크기**와, 그 식별자 목록을 사용한 **진료 테이블 상세 조회 시간**을 비교했다.

### 메모리 및 성능 비교(개선 전·후, 1년치 기준)

아래 표는 응답 크기(통계 테이블 API)와 진료 테이블 조회 시간(진료 테이블 API)을 **각각** 비교했다. 마지막 열은 **절대 증감값**이다.

#### 응답 크기

| 기간 | 기존 | 개선 | 증감 |
|---|---:|---:|---:|
| Weekly  | 12.5kb | **42.7kb** | **+30.2kb** 증가 |
| Monthly | 3.5kb  | **34.6kb** | **+31.1kb** 증가 |
| Daily   | 77.1kb | **122kb**  | **+44.9kb** 증가|

#### 진료 테이블 조회 시간

| 기간 | 기존 | 개선 | 개선율 |
|---|---:|---:|---:|
| Weekly  | 486ms  | **149ms** | **69% 단축** |
| Monthly | 1,090ms| **95ms**  | **91% 단축** |
| Daily   | 395ms  | **173ms** | **56% 단축** |

응답 크기는 늘었지만, 진료 테이블 조회는 빨라졌다. 이번 변경의 목적이 **일치성·신뢰·운영 효율**에 있었음을 감안하면 적절한 트레이드 오프라 생각한다.

## 끝으로 - 코드는 단순하게, 데이터는 일관되게

처음엔 구조를 건드리지 않으려 로직을 복제했고, 수치가 어긋날 때마다 반나절씩 원인 찾기에 매달렸다.  
중복을 제거하고 **한 곳에서 계산해 재사용**하도록 바꾸자, 수정 지점이 하나로 모였고  
통계 테이블과 진료 테이블은 자연스럽게 일치했다.

돌이켜보면 성능보다 먼저 지켜야 할 건 **원칙**이었다.  
**DRY**를 적용하니 판단·테스트·운영이 단순해졌고, 응답 크기는 조금 늘었지만 **데이터 신뢰도는 확실히 높아졌다.**

비슷한 로직이 여러 곳에 흩어져 있다면, 이번처럼 **‘한 번 계산하고 재사용’**하는 구조로 바꾸는 것을 권한다.

