---
title: "코드 리뷰 허들 낮추기 프로젝트: GitLab + Slack + ChatGPT로 자동화한 리뷰 문화 개선기"
description: "GitLab, Slack, n8n, ChatGPT를 활용해 코드 리뷰 요청 알림과 AI 자동 리뷰를 도입하여 팀의 코드 리뷰 문화를 개선한 경험을 공유합니다."
categories:
  - 개발문화
  - 코드리뷰
  - 생산성향상
tags:
  - 코드 리뷰 자동화
  - GitLab CI/CD
  - Slack Webhook
  - n8n workflow
  - ChatGPT
  - 프롬프트 엔지니어링
  - 개발 생산성
series: work-improvement
series_order: 6
toc: true
toc_sticky: true
image: /assets/img/thumbnail/code-review-automation.png
---
## 1. 들어가며
코드 리뷰는 중요하다. 리뷰를 통해 중요한 버그를 사전에 예방할 수 있을 뿐만 아니라, 코드가 예측 가능하고 읽기 쉽게 작성되었는지도 점검할 수 있다.
이 과정은 리뷰를 받는 사람뿐만 아니라, 리뷰어에게도 큰 도움이 된다. 자신의 논리를 설명하고, 더 나은 방법을 함께 고민하면서 모두가 함께 성장할 수 있기 때문이다.

이처럼 코드 리뷰는 팀 전체의 기술력과 협업 능력을 키우는 중요한 문화다.
하지만 사내에서는 코드 리뷰에 대한 강제성이 없고, 리뷰를 받으려면 직접 요청해야 하는 비효율적인 부분이 있어 코드 리뷰 문화가 잘 자리잡지 못했다.

이번 글에서는 이런 문제를 해결하기 위해 GitLab CI/CD, Slack, n8n, ChatGPT를 활용한 코드 리뷰 알림 및 AI 리뷰 도입 과정과 효과를 공유하고자 한다.


## 2. 코드 리뷰 요청 알림의 필요성 인식
예전에는 Gitlab에 MR(Merge Request)가 만들어지면, 아래와 같이 단순한 MR 알림 메시지만 Slack 채널에 전송됐다. 그렇다 보니 실제로 코드 리뷰를 받으려면 리뷰어에게 직접 메신저나 구두로 일일이 요청해야 했다.
이런 불편함이 있었지만, 나를 포함한 누구도 이 비효율적인 문제를 적극적으로 개선하려고 하지 않았다.

개선 전 MR Slack 알림

![개선 전 MR Slack 알림 ](https://i.imgur.com/HoOvHGf.png)

그러던 중, 글또 10기에서 코드 리뷰 문화 개선에 대한 아래 글을 접하게 되었다. (지금은 아쉽게도 글이 내려가있다)

![글또 코드 리뷰 개선글](https://i.imgur.com/PzcwWBS.png)

이 글에서는 커밋 내역과 PR 요청이 한 채널에 뒤섞여 있어 중요한 알림이 묻히고, 리뷰 요청을 직접 해야 하는 번거로움이 코드 리뷰 활성화를 어렵게 만드는 허들이라고 지적하였다.
내용을 읽으면 읽을 수록 우리 팀의 상황과 너무나도 닮아 있다는 생각이 들었고, “왜 이런 불편함을 당연하게 받아들이고 있었을까?”라는 반성이 들었다.

이 계기를 통해, 직접 사내 코드 리뷰 요청 과정을 더 효율적으로 만들어 보겠다는 다짐을 하게 되었다.
그래서 업무 시간 짬짬이 GPT와 함께 코드 리뷰 Slack 알림 시스템을 도입을 만들기 시작했다.

## 3. 코드 리뷰 요청 알림 프로세스
아래는 GitLab에서 MR(Merge Request)이 생성된 후, 리뷰 요청 알림 메시지가 Slack으로 전송되기까지의 흐름이다.

![Slack 알림 메시지 전송 프로세스](https://i.imgur.com/s2hb8RR.png)


### 전체 단계 요약
각 단계를 간략하게 살펴보자.

#### 1. Merge Request가 생성
#### 2. GitLab CI/CD 파이프라인 트리거
- MR가 생성되면 GitLab CI/CD가 트리거되면서 'nofiy_slack.sh'을 실행하여 Slack에게 코드 리뷰 알림을 보낼 수 있도록 구성하였다.

```yml
#.gitlab-ci.yml
stages:
  - notify
notify_slack:
  stage: notify
  script:
    - chmod +x notify_slack.sh
    - bash ./notify_slack.sh
  only:
    - merge_requests
```

> 추가로 Gitlab Repository에 notify_slack.sh를 실행할 수 있는 Gitlab Runner을 할당해 줘야 한다.

![gitlab runner 활성화 화면](https://i.imgur.com/6u0VHah.png)

GitLab CI/CD, GitLab Runner 설정은 검색이나 AI를 통해 어렵지 않게 설정할 수 있으니 자세한 설명은 생략했다. 

#### 3. 코드 리뷰 알림 스크립트 실행
- GitLab CI/CD에 할당된 Gitlab Runnder가 'notify_slack.sh' 스크립트를 실행한다.
- 아래는 요약된 스크립트 내용이다.

```sh
#!/bin/bash
# notify_slack.sh

# 기본 설정 및 필수 환경 변수 체크
check_required_env_vars SLACK_WEBHOOK_URL GITLAB_PRIVATE_TOKEN CI_PROJECT_ID ...

# GitLab API를 통해 MR 상세 정보 조회
MR_JSON=$(curl -s -H "PRIVATE-TOKEN: $GITLAB_PRIVATE_TOKEN" \
  "https://gitlab.example.com/api/v4/projects/$CI_PROJECT_ID/merge_requests/$CI_MR_IID")

# 작성자/리뷰어 정보 추출
AUTHOR=$(parse_author "$MR_JSON")
REVIEWER=$(parse_reviewer "$MR_JSON")

# Slack ID 매핑 (slack_ids.json 사용)
AUTHOR_SLACK_ID=$(find_slack_id "$AUTHOR")
REVIEWER_SLACK_ID=$(find_slack_id "$REVIEWER")

# Slack 메시지 구성
MESSAGE=":wave: *코드 리뷰 요청!*\n작성자: <@$AUTHOR_SLACK_ID>\n리뷰어: <@$REVIEWER_SLACK_ID>\n링크: $MR_URL"

# Slack으로 메시지 전송
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"$MESSAGE\"}" "$SLACK_WEBHOOK_URL"
```

#### 4. MR 상세 정보 조회
- 스크립트는 GitLab API를 통해 MR의 상세 정보를 조회한다.
- 작성자, 리뷰어, MR 제목, 설명 등 코드 리뷰 알림 작성을 위해 필요한 정보를 추출한다. 

#### 5. Slack ID 맵핑
- GitLab 저장소에는 GitLab username과 매핑되는 Slack ID를 저장한 slack_ids.json 파일이 존재한다.
- 이 파일을 통해 작성자와 리뷰어의 Slack ID를 추출한다.

#### 6. 코드 리뷰 알림 메시지 생성 및 전송
- Slack에 전송할 코드 리뷰 알림 메세지에 추출한 리뷰어의 ID를 넣어 리뷰어가 Slack 채널에서 멘션될 수 있도록 한다.
- 마지막으로 Slack WebHook 주소로 스크립트를 통해 생성된 코드 리뷰 알림 메시지를 전송한다.

### 결과
#### 코드 리뷰 알림 메시지 예시
이제 MR이 생성되면 아래와 같이 코드 리뷰 요청 메시지가 Slack으로 전송된다.

![코드 리뷰 알림 요청 메시지](https://i.imgur.com/hTbfGWs.png)

한 가지 더 개선이 필요했던 부분은, MR 알림뿐만 아니라 불필요한 push 알림까지 모두 채널에 전송되어 알림이 과도하게 쌓인다는 점이었다.
이로 인해 대부분의 팀원들이 채널 알림을 음소거했고, 나 역시 마찬가지였다. 그래서 코드 리뷰 알림 도입과 함께, 불필요한 알림이 오지 않도록 GitLab 설정도 함께 개선 해주었다.

이제 Slack에서 **"@멘션에 대한 알림만 받기"**로 설정하면, 본인에게 리뷰 요청이 올 때만 알림을 받을 수 있다.

직접 리뷰 요청을 하지 않아도 되고, 꼭 필요한 알림만 받아 개발에 더욱 집중할 수 있는 환경이 만들어졌다. 야호!

## 4. 더 나아가기 - AI 코드 리뷰 도입
최근 "크래프톤 정글" 수료생들과의 대화를 통해, 다른 회사들의 코드 리뷰 문화에 대해 들을 기회가 있었다.
특히, 개발자라면 대부분 알만한 서비스에서는 AI 코드 리뷰를 적극적으로 도입해 코드 품질을 높이고 있다는 점이 인상적이었다.
예를 들어, [인프랩에서는 CodeRabbit이라는 툴을 사용 중이다.](https://tech.inflab.com/20250303-introduce-coderabbit)

CodeRabbit은 코드 변경사항 요약, 오타 및 잘못된 인자 전달 피드백 등 다양한 기능을 제공한다.
사내에도 이런 툴을 도입하면 좋겠지만, 현실적으로 금액적인 부담이 있었다.
비용이 개발자당 최소 24달러로, 열 명만 사용해도 한 달에 약 33만 원이 든다.🥲

![coderabbit price](https://i.imgur.com/Xih4mXJ.png)

"그래! 이가 없으면 잇몸으로"라는 마음으로, 사내 n8n을 활용해 MR 발생 시 AI가 자동으로 코드 리뷰를 남겨주는 시스템을 직접 만들어보기로 했다.

### n8n AI 코드 리뷰 워크 플로우
아래는 현재 사용 중인 n8n AI 코드 리뷰 워크플로우다.

![Image](https://i.imgur.com/Z0iTcAX.png)

간단히 설명하면 다음과 같다.
1. GitLab MR 생성 시 트리거
  - GitLab에서 MR이 생성되면, n8n의 GitLab Trigger가 실행된다.
2. MR 댓글 확인
  - GitLab의 MR notes 정보를 통해 댓글 리스트를 확인한다.
3. AI 댓글 여부 체크
  - 기존 댓글에 AI 댓글이 없으면, 코드 변경 내역을 추출한다.
4. AI 코드 리뷰 요청
  - 변경된 코드와 함께 코드 리뷰 프롬프트를 바탕으로 ChatGPT 코드 리뷰를 요청한다.
5. 리뷰 결과 템플릿화
  - ChatGPT에게 받은 코드 리뷰 내용을 GitLab 댓글에서 보기좋게 확인할 수 있도록 템플릿에 적용한다.
6. MR에 리뷰 댓글 등록 
  - 정리된 내용을 MR에 댓글로 남긴다.

이 워크플로우는 실제 운영하면서 점진적으로 개선해 나가고 있다.

아래는 AI 코드 리뷰 도입 과정에서 특히 중점적으로 개선했던 부분이다.
#### 1. 중복 리뷰 문제 해결
- 예전에는 MR에 변경사항이 생길 때마다 동일한 코드 리뷰가 반복해서 달리는 문제가 있었다.
- 이를 해결하기 위해, 리뷰 댓글에 **<!-- AI_COMMENT -->**라는 태그를 추가했다.
- MR에 변경 내역이 생겨 코드 리뷰 트리거가 다시 발동되더라도, 기존 댓글에 이 태그가 포함되어 있는지 확인해 중복 리뷰가 달리지 않도록 했다. 이 과정은 n8n의 IF, Merge 노드를 활용해 조건 분기를 설계했다.


#### 2. 리뷰 개수 제한
- 기존에는 파일별로 리뷰를 남겼지만, 이제는 전체 리뷰 개수를 3개로 제한하는 방식으로 변경했다.
- 여러 파일의 diff를 하나로 합쳐 OpenAI에 전달하고, 프롬프트를 개선해 가장 중요한 5가지 항목만 추려서 리뷰하도록 했다.
- 이렇게 개선한 정말 중요한 피드백에 집중할 수 있게 되었다.

#### 3. 프롬프트 템플릿 리팩토링
프롬프트 리팩토링을 지속적으로 진행했다.
- 프롬프트에 분명한 역할을 부여 했다.
- 어떤 리뷰가 중요한지 우선순위를 정해주었다.
- 답변 작성 규칙과 출력 포맷을 프롬프트에 명확히 명시했다.
- 특히 프롬프트에 XML 태그 스타일의 메타 지시어를 적용해, 구조적 구분이 명확해지고 파싱이 훨씬 쉬워졌다.
  태그명을 통해 LLM에게 각 항목의 의미를 명확히 전달할 수 있어, 리뷰 결과의 일관성과 품질이 크게 향상됐다.

```text
<SystemPrompt>
  <Role>
    당신은 Java, Spring, Mybatis를 사용하는 의료 도메인 플랫폼의 시니어 백엔드 개발자입니다.
     주니어 개발자가 작성한 Java 코드를 리뷰해 주세요.
  </Role>

  <Task>
    <Objective>
      당신의 코드 리뷰 목표는 다음과 같습니다:
      1. 코드 품질을 높이는 동시에 **주니어 개발자가 성장할 수 있도록 격려와 피드백 제공**
      2. 가독성, 유지보수성, 테스트 용이성, 객체지향 설계, 예외 처리 관점에서 **가장 핵심적인 개선점**을 알려주세요
      3. 코드 변경이 많더라도, **리뷰 항목은 최대 3개까지만** 선택하세요
      4. 큰 문제가 없더라도 **칭찬과 학습 포인트**는 반드시 1개 이상 제공하세요
    </Objective>

    <PriorityRules>
      리뷰 우선순위는 다음 기준을 참고해주세요 (높을수록 먼저 피드백):
      1. 심각한 버그 발생 가능성
      2. 테스트/유지보수에 영향을 주는 구조적 문제
      3. 객체지향 원칙 위반 (SRP, DI 등)
      4. 예외 처리 부족 또는 애매한 로직
      5. 불명확한 변수명 또는 복잡한 흐름
      6. 불필요한 디버깅 코드 또는 주석
    </PriorityRules>
  </Task>

  <InputInformation>
    <RequiredOutputFields>
      다음 정보를 반드시 출력에 포함하세요:
    </RequiredOutputFields>
    ...
    <ChangedCodeDiff>
      ...
    </ChangedCodeDiff>
  </InputInformation>

  <OutputFormat>
    <SummarySection>
      코드 리뷰 전반을 요약해서 주니어 개발자가 **무엇을 잘했고, 어떤 부분을 개선하면 더 성장할 수 있을지**  
      3~5문장 이내로 친절하고 응원하는 말투로 정리해주세요.

      예시 표현:
      - `"이런 점은 정말 잘 하셨어요!"`, `"이 부분은 앞으로 더 좋아질 수 있어요"`  
      - `"이런 식으로 접근한 건 아주 인상적이었어요"`  
      - `"조금만 수정하면 실전에서도 충분히 통하는 코드가 될 것 같아요"`

      출력은 `"summary"` 필드로 작성하며, **한글 문장만 사용**하세요.
    </SummarySection>

    <ReviewSection>
      <ReviewItemStructure>
        | 키 | 설명 |
        |----|------|
        | `main_issue` | 한 줄 요약 (문제나 칭찬 요점) |
        | `suggestion` | 구체적인 개선 방법 또는 긍정 포인트 설명 |
        | `reason` | 해당 피드백의 이유와 장점 |
        | `example_code` | 개선 전/후 예시 코드 (마크다운 코드블럭 포함) |
      </ReviewItemStructure>
      ...
    </ReviewSection>

    <OutputExample>
      ```json
      {
        "projectId": 1,
        "iid": 2,
        "summary": "전체적으로 코드가 깔끔하고 읽기 쉽게 작성되어 있어 좋았어요! 특히 변수 네이밍과 메서드 분리 방식이 인상적이었습니다. 다만 입력값에 대한 유효성 검사가 조금 아쉬웠는데, 이 부분을 보완하면 안정성 면에서도 크게 향상될 거예요.",
        "reviews": [
          {
            "filePath": "src/main/java/com/example/ExampleService.java",
            "main_issue": "입력값 검증이 누락되어 있을 수 있어요",
            "suggestion": "메서드 시작 부분에서 null이나 유효 범위를 체크하고, 에러 메시지를 조금 더 구체적으로 작성해보면 어떨까요?",
            "reason": "입력 검증은 사용자나 외부 시스템에서 잘못된 값이 들어오는 걸 막아주기 때문에 서비스의 안정성에 큰 영향을 줘요.",
            "example_code": "#### 🔴 개선 전\n\n```java\nif (x < 0) {\n  throw new IllegalArgumentException(\"Invalid input\");\n}\n```\n\n#### 🟢 개선 후\n\n```java\nif (x == null) {\n  throw new IllegalArgumentException(\"x는 null일 수 없습니다.\");\n}\nif (x < 0) {\n  throw new IllegalArgumentException(\"x는 0 이상이어야 합니다. (입력값: \" + x + \")\");\n}\n```"
          }
        ]
      }
      ```
    </OutputExample>
  </OutputFormat>
</SystemPrompt>
```

아직은 코드의 변경 사항(diff)만으로 AI 코드 리뷰를 요청하다 보니, 전체적인 코드 맥락을 파악하지 못하고 단편적인 부분만 리뷰하는 한계가 있다.
이를 보완하기 위해 변경된 코드 파일의 전체 내용을 함께 전달해보기도 했지만, 파일이 많거나 코드가 길 경우 컨텍스트 길이 초과나 답변 지연 문제가 발생했다.
앞으로는 이런 문제들을 해결해가며, AI 코드 리뷰의 품질을 더욱 높여나갈 계획이다.

그럼에도 불구하고, 현재 버전만으로도 **AI 리뷰를 통해 적절한 메소드명 추천, 불필요한 주석 제거, 오타 수정, 부족한 예외처리 개선 등 동료 개발자가 놓칠 수 있는 부분까지 꼼꼼하게 챙길 수 있게 되었다.**
덕분에 동료 개발자들은 더 중요한 코드 리뷰에 집중할 수 있는 환경이 마련되었다.

## 5. 배운점
1. 불편함을 개선하는 즐거움
   코드 리뷰 알림 시스템을 개선하면서, 사소한 불편함도 직접 해결해보는 과정이 생각보다 재미있었고, 팀의 생산성에 조금이나마 기여할 수 있어 뿌듯했다.
   최근에는 n8n 자동화를 활용해 GeekNews나 Tech Blog의 RSS에서 뉴스를 수집하고, 사내 개발자들에게 유용한 정보를 자동으로 발행하는 작업도 진행하고 있다.
   ![Image](https://i.imgur.com/07Z2wDK.png)

2. 알림의 중요성
   코드 리뷰 채널에서 더 나아가 모니터링 채널도 개선하고 있다. 기존에는 모니터링 채널에서 15분마다 슬로우 쿼리 발생 알림을 받았지만, 단순히 대시보드 링크만 제공되어 실질적인 도움이 되지 않았다.
   이를 개선해 데일리 슬로우 쿼리 TOP3를 직접 보여주도록 바꿨고, 정말 중요한 알림을 놓치지 않게 개선하였다.

   변경 전 슬로우 쿼리 알람 메시지

   ![변경 전 슬로우 쿼리 알람](https://i.imgur.com/xAAsOqP.png)

   변경 후 슬로우 쿼리 알람 메시지

   ![변경 후 슬로우 쿼리 알람 메시지](https://i.imgur.com/UgivWrH.png)

3. AI와 자동화에 대한 관심
   이번 프로젝트를 계기로 AI를 더 잘 활용하고 싶다는 생각이 들었다.
   특히 프롬프트를 어떻게 작성하느냐에 따라 결과가 크게 달라진다는 점에서 프롬프트 엔지니어링에 관심이 생겼고, 사내 AI 스터디에도 참여해 다양한 AI 관련 지식을 습득하고 있다.



## 참고 사이트
- [코드 리뷰 요정, CodeRabbit이 나타났다 (인프랩 Tech 블로그)](https://tech.inflab.com/20250303-introduce-coderabbit/)
- [GitLab CI/CD 시작하기 (Infograb Docs)](https://insight.infograb.net/docs/user/quick_start_ci_cd/)
