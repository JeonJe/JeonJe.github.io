---
title: "AI가 통계를 바꾼 순간 - 프롬프트 엔지니어링부터 비동기 전환까지"
description: "병원 통계에 AI 분석 기능을 추가하며 겪은 시행착오와 개선 과정. 동기 방식에서 이벤트 기반 비동기로 전환하고, 프롬프트 엔지니어링과 UX 개선까지의 경험을 담았습니다."
categories:
  - 프로젝트
tags:
  - OpenAI
  - 비동기처리
  - 프롬프트엔지니어링
  - UX개선
  - 성능개선
series: work-improvement
series_order: 10
toc: true
toc_sticky: true
image: /assets/img/thumbnail/hospital-statistics-ai-improvement.png
---

## 들어가며

모비닥의 병원 통계 기능은 일/주/월별 신규환자 수, 재방문환자수, 노쇼수와 같은 병원 운영에 중요한 데이터를 표와 그래프로 제공한다. 이번 글은 병원의 통계의 가치를 AI를 활용하여 더 쉽게 사용자에게 전달할 수 있도록 기능을 만들었던 과정에서 겪은 시행착오와 배운점을 정리하였다.

## 1. 비동기 전환으로 처리량을 높이다

### 첫 구현: 동기 방식

기능의 빠른 검증이 필요해서 가장 간단한 동기(Synchronous) 방식으로 구현했다.
통계 분석 요청이 들어오면 서버는 데이터를 수집하고 외부 AI API에 요청을 보낸 뒤, **응답이 올 때까지 메인 스레드에서 대기**한 후 클라이언트에 돌려주는 구조였다. 테스트 환경 기준 AI 응답까지 평균 **약 8초**가 걸렸고, 이 동안 해당 스레드는 다른 요청을 처리할 수 없었다.

![](https://i.imgur.com/QWB3jDF.png)

```java
// 동기 처리 (메인 스레드 ≈8초 점유)
public AnalysisResult analyze(Long id) {
    AnalysisData data = dataCollector.collect(id);      // ≈0.2s
    String aiResponse = aiClient.analyze(data);         // ≈8s (blocking)
    return responseParser.parse(aiResponse);
}
```

문제는 분석 요청이 몰릴 때였다. 스레드 풀이 빠르게 고갈되고 큐가 쌓이면서, AI 호출 하나가 서버 전체 처리량의 병목이 될 수 있었다.

### 개선 v1: 메인 스레드 분리

기능이 쓸만하다고 판단되어 안정화를 위해 **비동기 구조로 전환**했다.

![](https://i.imgur.com/hfFM6cf.png)

`@Async`와 `CompletableFuture`로 **데이터 수집(메인)**과 **AI 호출(백그라운드)**을 분리했다. 메인 스레드 점유 시간이 **8초 → 0.2초**로 줄었다.

```java
// 메인 서비스: 데이터 수집 후 비동기 호출
public AnalysisResult analyze(Long id) {
    AnalysisData data = dataCollector.collect(id); // ≈0.2s
    return asyncService.analyzeAsync(data).get(180, TimeUnit.SECONDS);
}

// 비동기 서비스: 백그라운드에서 AI 처리
@Async("analysisTaskExecutor")
public CompletableFuture<AnalysisResult> analyzeAsync(AnalysisData data) {
    String aiResponse = aiClient.analyze(data); // ≈8s (main thread free)
    return CompletableFuture.completedFuture(responseParser.parse(aiResponse));
}
```

하지만 여전히 클라이언트는 **최대 180초까지 응답을 기다려야** 했다. 말 그대로 "제한적 비동기"였다.

### 개선 v2: 완전한 비동기 (이벤트 기반)

결국 **API 스펙을 변경하였다**. 요청하면 `analysisSeq`만 즉시 반환하고, 결과는 **폴링이나 WebSocket**으로 받는 구조로 전환했다.

```java
// Facade: 즉시 응답
public AnalyzeResponse analyzeAsync(AnalysisRequest request) {
    int analysisSeq = aiAnalysisService.createPendingAnalysis(...);  // DB에 PENDING 생성
    eventPublisher.publishEvent(new AnalysisStartEvent(...));       // 이벤트 발행
    return new AnalyzeResponse(analysisSeq);                        // 즉시 반환
}

// 이벤트 리스너: 트랜잭션 커밋 후 비동기 처리
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onAnalysisStart(AnalysisStartEvent event) {
    asyncService.analyzeWithAIAsync(...);
}
```

추가로 **Circuit Breaker**를 붙여서 외부 AI API 장애가 서버 전체로 번지지 않도록 격리했고, **Redis 캐시**로 상태/결과 조회 성능을 높였다. 완료되면 **RabbitMQ → WebSocket**으로 클라이언트에 실시간 알림을 보내도록 개선하였다.

## 2. 프롬프트 엔지니어링으로 통계 읽는 눈을 만들다

가장 먼저 고민한 건 **"AI에게 무엇을 어떻게 요청할 것인가"**였다. 단순히 "이 통계 데이터를 분석해줘"라고 던지면 너무나 당연한 답이 나왔다. 그래서 세그먼트 분석, 리스크 탐지, 스토리라인 분석, 자유 탐색 등 다양한 프롬프트를 비교하며 어떤 형태가 가장 유용한지를 확인해보았다.

결론적으로 **"집계 수치나 그래프에서 한눈에 보이지 않는 인사이트를 찾아달라"**고 요청했을 때 가장 가치 있는 응답을 얻을 수 있었다.

예를들어 단순히 "이번 주는 지난주보다 환자가 늘었다" 같은 1차원 요약보다, **전주 대비·상하위 5일 비교·요일 효과**처럼 표와 그래프로는 한눈에 비교하기 비교 관점을 알려주는 것에 강점이 있어보였다.

그래서 아래와 같이 어떤 핵심 지표를 조합해 인사이트를 뽑아볼까 고민을 해보았다.
![](https://i.imgur.com/qoWuEsP.png)

여러 실험 끝에 이번 통계 AI 기능의 목표를 두 가지로 잡았다.
첫째, **그래프/표를 쉽게 알려주는 해설자**. 통계 페이지를 처음 보는 사람도 AI 설명만으로 전체 맥락을 파악할 수 있게 하는 것.
둘째, **분석의 킥**. 이상치 탐지와 비교 분석으로 인사이트를 줄 수 있는 문장을 만들어주는 것.
예: "이번 주 화요일은 평균 대비 **40% 낮은** 진료 건수로 **지속 하락 추세**."

프롬프트는 **GPT-5**로 먼저 좋은 답변이 나오는 형태를 잡고, 그걸 **경량 모델(4o-mini)**에서도 비슷하게 나오도록 다듬었다. 비싼 모델로 "정답지"를 만들고, 저렴한 모델이 따라하게끔 만들었다. 응답은 항상 **JSON 형식**으로 받도록 고정하고, 형식이 깨지면 자동으로 다시 요청하게 가드레이을 붙여서 안정성을 높혔다

## 3. 프롬프트 DB 이관으로 배포 없이 개선하기

프롬프트를 어디에 저장할지도 고민이었다.
처음에는 `application.properties`에 하드코딩했는데, 문구를 조금만 바꿔도 **수정 → 빌드 → 배포** 과정을 거쳐야 했다. 그래서 프롬프트를 **DB 테이블**로 옮겼고, 이제는 재배포 없이 바로 반영된다. 추가로 DB 조회 구간에는 **캐시**를 붙여 성능을 높일 예정이다.

## 4. 사이드 패널로 통계와 인사이트를 한눈에 보기

처음에는 AI 분석 결과를 통계 테이블 하단에 표시했는데, 그래프와 나란히 보기 어려웠다. 그래서 **사이드 패널**로 바꿨다. 이제 그래프와 AI 분석 결과를 **한 화면에서 동시에** 볼 수 있다.

![](https://i.imgur.com/66ILbJV.png)

홈페이지 통계에서는 **건강 콘텐츠 초안 작성 기능**도 추가했다. 분석 결과를 보고 바로 피드 작성까지 이어지도록 한 것이다.

## 요약

| 구분                 | 개선 내용                      | 효과                              |
| -------------------- | ------------------------------ | --------------------------------- |
| **비동기 전환**      | 동기 → 이벤트 기반 완전 비동기 | 클라이언트 대기 180초 → 즉시 응답 |
| **프롬프트 DB 이관** | properties → DB 테이블         | 재배포 없이 실시간 반영           |
| **사이드 패널**      | 하단 → 우측 패널               | 그래프와 분석 결과 동시 비교      |

## 마치며

통계 기능에 AI를 붙이면서 기능 개발보다 **"사용자에게 어떤 가치를 줄 수 있을까"**를 더 많이 고민했던 것 같다. 호출 구조, 프롬프트 문구, 결과를 보여주는 위치 하나하나가 사용 흐름에 영향을 줬다. 요즘 들어 UI/UX 학습의 필요성을 많이 느끼고 있다.
