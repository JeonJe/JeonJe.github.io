---
title: "루퍼스 7주차 WIL"
description: "루퍼스 7주차에서 배운 내용과 얻은 인사이트를 정리했습니다."
categories:
  - 루퍼스
  - WIL
tags:
  - 설계
  - 의사결정
  - Entity
  - 멱등성
  - 문서화전략
series: loopers-ecommerce
series_order: 9
toc: true
toc_sticky: true
#image: /assets/img/thumbnail/loopers-week2-WIL.png
---


# 루퍼스 7주차 WIL

### Open Weekly Talk 발표 - 글 쓰기
- 할까말까 고민될 때는 하는 게 역시 좋다는 걸 다시 느낌
- 발표를 준비하면서 내 글과 다른 분이 쓴 글을 비교해봄. 테크니컬 라이팅에 적절한 구조를 쓰고 있다는 약간(?)의 확신을 느낌
- 또, 멘토님들의 피드백을 분석하면서 내 글의 강점도 파악할 수 있었음
- 생각보다 차분하게 발표를 진행 하였음. 많은 사람들 앞에서 이야기하는 게 예전보다 익숙해졌다는 걸 느낌(다른 사람들의 얼굴이 안보여서 그랬을 수도 ㅎㅎ)
- 북 스터디 발표를 몇 번 했던게 도움이 되었음

## 이번 주 핵심 배움
### 1. Command vs Event 차이와 트레이드오프
- Command는 "너 이거 해"(강한 결합, 순서/롤백 제어 쉬움), Event는 "나 이런 일 있었어"(느슨한 결합, 확장 쉬움)
- Event로 분리하면 결합도는 낮아지지만, 추적이 어렵고 Eventual Consistency를 수용해야 함을 배움
- Eventual Consistency: 즉시 일관성 대신 "결국엔 맞춰진다"를 수용 (예: 좋아요 카운트는 잠시 늦어도 됨)

### 2. 이벤트 레이어 배치 (DIP 적용 버전)
- **도메인**: 이벤트 클래스 + 퍼블리셔 인터페이스 (도메인은 "발행" 사실만 알고 구현을 모름)
- **인프라**: 퍼블리셔 구현체 (ApplicationEventPublisher, Kafka 등)
- **애플리케이션**: 이벤트 핸들러 (여러 도메인 서비스 조합)
- 이벤트를 직접 배치해보면서 각 레이어의 역할에 대한 이해도가 조금씩 늘고 있다는 걸 느낌

### 3. AFTER_COMMIT 이후 REQUIRES_NEW가 필요한 이유
- `@TransactionalEventListener(phase = AFTER_COMMIT)`: 트랜잭션 커밋이 확정된 후에 핸들러를 실행하는 설정
- AFTER_COMMIT을 "트랜잭션 이후의 명시적 후처리 단계"로 취급하기 때문에, 기본 `@Transactional`을 같이 쓰게 되면 설계 의도가 불분명한 코드로 간주됨
- 트랜잭션 경계 의도를 명확히 강제하기 위해 `REQUIRES_NEW`(새 트랜잭션) 또는 `NOT_SUPPORTED`(트랜잭션 없이)만 허용함을 배움

### 4. 비동기 이벤트 테스트 전략
- 기본적으로 `verify()`로 함수 호출 검증까지만 수행 (ApplicationEventPublisher 등 API를 신뢰)
- 신뢰도를 높이려면 `Awaitility`의 `atMost`를 넓게 잡고 빠른 주기로 assert해서 성공 시 early-return하는 방식을 배움
