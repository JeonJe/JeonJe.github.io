---
title: "병원 통계 시스템 리팩토링 - 중복 로직 제거로 데이터 신뢰도 높이기"
description: "통계-진료 테이블 수치 불일치 문제를 DRY 원칙으로 해결한 경험. 신규/이탈 판정 로직을 서비스로 분리하고 단일 데이터 소스로 통합해 불일치 문의 0건, 개발 시간 절반 단축을 달성한 과정을 공유합니다."
categories:
  - 프로젝트
  - Architecture
tags:
  - DRY원칙
  - 리팩토링
  - 데이터일관성
  - 책임분리
series: work-improvement
series_order: 9
toc: true
toc_sticky: true
image: /assets/img/thumbnail/hospital-statistics-refactoring.png
---

## 들어가며

![](https://i.imgur.com/aWvdBFm.png)

모비닥의 병원 통계 기능은 신규·재방문·이탈의심·노쇼(미방문) 등 병원 운영의 핵심 데이터를 표와 그래프 형태로 제공한다. 만약 이 데이터를 신뢰할 수 없다면, 통계의 의미가 사라지게 될 것이다.

이번 글에서는 두 가지 문제를 다룬다.
첫째, 기존에 단순하게 정의되었던 '신규', '이탈의심' 기준을 사용자에게 더 가치 있는 형태로 재정의한 과정.
둘째, 통계 테이블과 진료 테이블의 수치 불일치를 구조적으로 해결한 경험.

## 문제 배경 - 중복 계산과 불일치의 시작

초기 통계 시스템의 정의는 다음과 같았다.

- **신규 환자**: 조회 기간 내 진료가 있고, 환자 등록일이 진료일 기준 30일 이내인 경우
- **이탈의심 환자**: 신규 환자 중 마지막 진료일 이후 일정 기간 동안 추가 진료가 없는 경우

이 정의는 단순하고 빠른 쿼리 중심으로 구현되어, 초기 서비스 검증에 적합했다. 하지만 환자가 조회 기간 중 여러 번 진료를 받으면, 매번 신규 환자로 중복 계산되는 문제가 있었다.

예: 5월 1일 등록 환자가 5월 11일, 13일에 진료 → 두 날짜 모두 신규로 집계

신규환자와 이탈환자의 정의가 점점 구체화되면서 조건도 복잡해져 개선이 필요한 상황이 찾아왔다.
여기서 두 가지 과제가 드러났다.

1. 이탈 환자는 신규 환자이다. 즉, **신규 로직을 재사용할 수 있도록 서비스 계층에서 책임을 분리하고 로직을 캡슐화**해야 했다(기존에는 각자 쿼리로 독립 동작).
2. 통계 테이블(통계 데이터)과 진료 테이블(진료 데이터)이 **서로 다른 기준으로 계산**되어 수치가 어긋났고, 원인 추적에 시간이 많이 들었다(예: 통계 테이블 10명, 진료 테이블 8명).

결국 **정확도, 유지보수성, 디버깅 효율**을 함께 높일 필요가 있었다.

## 해결과정

### 문제 1 — 신규/이탈 구조 재정렬(단일 책임 + 재사용)

이탈의심 환자를 계산하려면 먼저 **신규 환자**인지 판단해야 한다.
기존에는 신규/이탈을 각각 쿼리로 계산했기 때문에, 신규 기준이 바뀌면 이탈 쿼리도 따로 수정해야 했다. 기준이 복잡해지면서 쿼리만으로는 유지보수가 어려워졌다.

해결책은 **책임을 한 곳으로 모으는 것**이었다. 신규 환자 서비스를 만들고, 판정 로직은 도메인 객체와 일급 컬렉션에 위임했다. 이탈 판정은 이 신규 판정 로직을 재사용한다.

#### 개선 전 — 쿼리 중심(각각 독립 계산)

기존에는 신규 환자와 이탈 환자를 각각 별도 쿼리로 계산했다. 아래는 신규 환자 카운트 예시다.

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

신규환자 서비스에서는 후보 조회 → 최초 진료일 확인 → 일급 컬렉션으로 판정 → 요약 조회 순서로 처리한다.

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

        // 4) 신규 환자의 진료 정보 요약 조회
        return repository.findNewPatientVisitSummaries(search, actual.patientIds());
    }
}
```

핵심은 **쿼리는 단순 조회만**, 판정은 **도메인 객체와 일급 컬렉션이 담당**하도록 분리한 것이다.

개선 후, 아래와 같은 장점을 갖게 되었다.

- **강결합 해소**: 로직이 SQL에서 분리되어 변경/테스트가 쉬워졌다.
- **재사용 가능**: 이탈환자 판정 시 신규환자 서비스를 그대로 호출해서 사용할 수 있다. 신규 기준이 바뀌어도 이탈 로직은 수정할 필요가 없다.

---

### 문제 2 — 통계 테이블 수치와 진료 테이블의 일치성 확보

병원에서 통계 수치가 일치하지 않는다는 문의가 간헐적으로 들어왔다.
트러블슈팅 결과, 통계 테이블과 진료 테이블이 어긋난 건 **구조적 문제**였다. 초기에는 성능을 우선시해 **통계 테이블은 통계 데이터**, **진료 테이블은 진료 데이터**를 각각 조회하도록 분리했다. 그 결과 비즈니스 로직 오류, 동기화 시차, 데이터 불일치가 겹치며 수치 차이가 발생했다.

![](https://i.imgur.com/WFiHLJG.png)
_그림 1. AS-IS: 통계 테이블과 진료 테이블이 서로 다른 데이터 소스를 참조하여 불일치 발생_

어떤 수치가 맞는지, 어떤 로직이 문제인지 파악하기 어려워 트러블슈팅 시간이 점점 늘어났다. 고민 끝에 원칙을 정했다: **"계산은 한 번만, 결과는 일관되게."**

통계 API가 집계 시점의 **포함 환자·진료 식별자 목록**을 함께 반환하도록 구조를 변경했다. 진료 테이블은 **그 목록만**으로 정렬/페이지네이션한다. 즉, **수치 계산과 진료 조회의 기준을 하나로 통합**한 것이다.

![](https://i.imgur.com/SC4A8v9.png)
_그림 2. TO-BE: 통합 API에서 식별자를 함께 반환하여 1:1 매칭 보장_

이제 통계 테이블과 진료 테이블은 **항상 1:1로 일치**한다. 통계 테이블이 '이탈의심 10명'이면 진료 테이블도 10명이다.

## 개선 효과

### 사용자 관점

- **활용성 증가**: 정확한 신규/이탈 기준으로 재방문 관리 및 이탈환자에 대한 캠페인 타깃팅이 쉬워졌다.
- **수치 신뢰도 향상**: 통계-진료 테이블 불일치 문의가 0건으로 감소했다.

### 유지보수 관점

- **리소스 단축**: 계산 로직을 한 곳으로 모으면서 개발/수정 시간이 절반으로 줄었다.
- **안정성 향상**: 판정 로직이 도메인 객체로 분리되어 단위 테스트가 가능해졌다.

### 트레이드오프: 응답 크기 vs 조회 속도

요약 테이블에 식별자 목록을 함께 반환하면서 응답 크기는 늘었지만, 상세 조회 시 별도 쿼리 없이 식별자로 바로 조회하므로 속도는 빨라졌다.

#### 응답 크기 (1년 기준)

| 기간 |   기존 |   개선 |    증감 |
| ---- | -----: | -----: | ------: |
| 주별 | 12.5kb | 42.7kb | +30.2kb |
| 월별 |  3.5kb | 34.6kb | +31.1kb |
| 일별 | 77.1kb |  122kb | +44.9kb |

#### 진료 테이블 조회 시간

| 기간 |    기존 |  개선 |   개선율 |
| ---- | ------: | ----: | -------: |
| 주별 |   486ms | 149ms | 69% 단축 |
| 월별 | 1,090ms |  95ms | 91% 단축 |
| 일별 |   395ms | 173ms | 56% 단축 |

이번 개선의 목적이 수치 신뢰 확보였기 때문에, 응답 크기 증가는 허용 가능한 범위라고 판단했다. 향후 응답 크기가 문제가 된다면 캐시 키 기반으로 식별자 목록을 별도 저장하는 방식을 검토할 예정이다.

## 끝으로

처음엔 구조를 건드리지 않으려 로직을 복제했고, 수치가 어긋날 때마다 반나절씩 원인을 찾았다.
중복을 제거하고 **한 곳에서 계산해 재사용**하도록 바꾸자, 수정 지점이 하나로 모이고 통계-진료 테이블도 자연스럽게 일치했다.

돌이켜보면 성능보다 먼저 지켜야 할 건 **원칙**이었다. **DRY**를 적용하니 테스트와 운영이 단순해졌고, 응답 크기는 늘었지만 데이터 신뢰도는 확실히 높아졌다.

코드에 의도치 않은 중복이 있다면, 이번 경험이 제일 먼저 생각날 것 같다.
