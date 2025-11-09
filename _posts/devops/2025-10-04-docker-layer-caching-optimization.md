---
title:  Docker 레이어 캐시로 빌드 시간 30초 단축 — 잃어버린 하루를 되찾자
description: 사소한 수정에도 처음부터 다시 빌드되던 문제를 Docker 레이어 캐시로 해결한 경험. 빌드 시간을 2분에서 1분 30초로 단축하며, 매일 반복되는 배포 효율을 높인 경험을 담았습니다.
categories:
  - DevOps
  - 성능개선
tags:
  - Docker
  - Dockerfile
  - 레이어 캐시
  - Gradle
  - 빌드 최적화
  - CI/CD
series: work-improvement
series_order: 7
toc: true
toc_sticky: true
image: /assets/img/thumbnail/docker-layer-caching-optimization.png
---

## 들어가며

스타트업의 경쟁력은 **사용자에게 가치를 얼마나 빨리 전달하느냐**에 달려 있다.
팀에서는 기능을 빠르게 개발하고 **매주 운영 환경(프로덕션)**에 배포한다. 또한 프로덕션 배포 전 staging 환경에서 최종 QA를 거치기에 배포 빈도는 자연스럽게 높다.

문제는 사소한 변경에도 빌드가 매번 처음부터 시작되어 대기 시간이 누적됐다는 점이다.
이번 글에서는 Docker 레이어 캐시가 제대로 동작하도록 Dockerfile을 개선해, 빌드 시간을 약 2분에서 1분 30초 수준으로(약 30초 단축) 줄인 방법을 다룬다.

![](https://i.imgur.com/VjiVtnj.png)

하루 10회 배포 기준으로 계산하면, 1년에 약 30시간의 개발 시간을 되찾은 셈이다.

## 문제 상황: 매번 처음부터 다시 빌드

팀에서 사용하던 Dockerfile은 Builder 단계와 Runtime 단계로 구성되어 있었다.

```dockerfile
# Builder 단계
FROM gradle:8.8.0-jdk21-alpine AS builder
WORKDIR /app
COPY . .                  # 공통 모듈 + 소스코드 전부 복사
RUN gradle bootJar -x test  # Gradle 빌드

# Runtime 단계
FROM openjdk:21
WORKDIR /home/app
COPY --from=builder /app/build/libs/app.jar ./app.jar
CMD ["java", "-jar", "app.jar"]
```

이 구조에서는 **아주 작은 변경에도 캐시가 무효화**된다. `COPY . .` 때문에 소스의 어떤 파일이든 바뀌면 해당 레이어가 변경된 것으로 인식되고, 이어지는 `gradle bootJar`도 매번 새로 실행된다. 결과적으로 빌드에는 항상 **2분 이상**이 걸렸고, 배포가 잦을수록 그 시간을 고스란히 기다려야 했다.

## Docker(도커) 레이어 캐시 원리 이해하기

### Docker 레이어 캐시란?

Docker 빌드는 Dockerfile의 각 명령어(FROM, COPY, RUN 등)를 **레이어(layer)**로 쌓는다. 동일한 명령어와 동일한 입력이면 이전에 만든 레이어를 **캐시(cache)**로 재사용한다. 캐시가 잘 작동하면 변경된 부분만 다시 빌드되고 나머지는 `CACHED`로 처리되어 시간이 크게 줄어든다.

### 캐시가 깨지는 순간

캐시는 “입력”이 바뀌면 무효화된다. 여기서 입력은 명령어 문자열뿐 아니라 **명령어가 다루는 파일들의 체크섬(hash)**까지 포함된다.

아래처럼 소스를 한 번에 복사한다고 해보자.

```dockerfile
WORKDIR /app
COPY . .
RUN gradle bootJar -x test
```

`.`에는 수많은 파일이 포함되어 있다. 파일 하나만 바뀌어도 **체크섬**이 달라지고, Docker는 이를 기준으로 캐시 사용 여부를 판단한다.

```
"hello" → 2cf24d...
"hella" → aaf4c6...
```

체크섬이 달라지면 해당 레이어 이후 단계는 모두 캐시가 깨지고, 결국 매번 **처음부터 다시 빌드**하게 된다.

## Dockerfile 최적화

핵심은 **의존성과 소스코드를 분리**하고, 변경이 거의 없는 **의존성 레이어를 위쪽**에 배치해 캐시가 불필요하게 무효화되지 않도록 하는 것이다. 이렇게 하면 코드는 바뀌어도 시간이 오래 걸리는 의존성 다운로드는 그대로 재사용되고, **빌드 단계만 다시 수행**된다.

```dockerfile
# ---------- Build stage ----------
FROM gradle:8.8.0-jdk21-alpine AS builder
ARG APP_NAME=app
WORKDIR /workspace

# 1) Gradle 설정 먼저 복사 (변동 적은 입력을 상단으로)
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# 2) 모듈별 build.gradle 선반영 (의존성 캐시 키로 활용)
#    멀티 모듈일 경우 각 모듈의 build.gradle만 먼저 복사
COPY modules/**/build.gradle ./modules/**/build.gradle
COPY common/**/build.gradle  ./common/**/build.gradle
COPY ${APP_NAME}/build.gradle ./${APP_NAME}/build.gradle

# 3) 의존성만 먼저 해석/다운로드하여 캐시 레이어 확보
RUN gradle --no-daemon :${APP_NAME}:dependencies --parallel --continue || echo "[warn] dependency warm-up failed; continuing"

# 4) 소스 코드 전체 복사 (변동 많은 입력은 하단으로)
COPY modules ./modules
COPY common  ./common
COPY ${APP_NAME} ./${APP_NAME}

# 5) 애플리케이션 빌드
RUN gradle --no-daemon :${APP_NAME}:bootJar -x test

# ---------- Runtime stage ----------
FROM openjdk:21
ARG APP_NAME=app
WORKDIR /opt/app

# 최소 산출물만 복사 (슬림 런타임)
COPY --from=builder /workspace/${APP_NAME}/build/libs/${APP_NAME}.jar ./app.jar

ENTRYPOINT ["sh","-c","exec java ${JAVA_LOCALE} -server ${JAVA_OPT} -Dspring.profiles.active=${SPRING_ENV} -jar app.jar"]
```

**옵션 설명**

- `--no-daemon`: 컨테이너 빌드에선 데몬을 유지할 이유가 없다. 어차피 매번 새로 실행되기 때문에, 이 옵션으로 리소스를 아낀다.
- `--parallel`: 가능한 태스크를 동시에 실행해 멀티코어를 최대한 활용한다. 멀티모듈 빌드일수록 효과가 크다.
- `--continue`: 일부 태스크가 실패해도 빌드를 멈추지 않는다. 의존성 캐시 워밍업 단계에서 특히 유용하다.

위 Dockerfile의 포인트를 정리하면 다음과 같다.

1. **Gradle 설정 파일을 먼저 복사**  
   `build.gradle`, `settings.gradle`을 상단에 두면 이 파일이 바뀌지 않는 한 이후 의존성 단계가 캐시된다.
2. **의존성만 먼저 받아 캐시 확보**  
   `gradle :app:dependencies`로 빌드 전에 필요한 의존성을 미리 내려받아 별도 레이어로 만든다.
3. **소스 코드는 마지막에 복사**  
   자주 바뀌는 입력을 하단으로 내려, 코드가 변해도 위쪽 의존성 캐시는 유지한다.
4. **런타임 이미지는 슬림하게**  
 최종 실행에는 JAR 등 필요한 산출물만 복사해 이미지 크기와 푸시 시간을 줄인다.

이렇게 최적화한 뒤 빌드 로그를 보면, 변경되지 않은 의존성 단계는 `CACHED`로 표시되고 소스 코드처럼 변경이 발생한 단계만 새로 실행(`DONE`)되는 것을 확인할 수 있다.

![](https://i.imgur.com/VMMRkfa.png)

Docker 레이어 캐시를 적용한 결과, **빌드 시간은 평균 2분 3초에서 1분 36초로 단축(약 22% 개선)**됐다.
이후 서버와 프론트엔드의 Dockerfile 모두 같은 방식으로 개선해, 서버는 빌드 시간이 약 30초~1분, 프론트는 30~40초 줄었다.

무엇보다도 **변경이 없는 모듈은 재빌드하지 않고 캐시로 처리**되면서 불필요한 대기 시간이 크게 줄었다. 
그 결과 **불필요한 Jenkins 빌드와 Kubernetes 파드 교체도 줄어들어**, 전체 배포 파이프라인이 한층 가벼워졌다. 

필요에 따라 **모듈 단위로 더 세분화**해 캐시 효과를 극대화할 수도 있다.
다만 Docker 레이어가 지나치게 많아지면 오히려 빌드 속도와 관리 효율이 떨어질 수 있으므로, **캐시 효율성과 레이어 수 사이에서 균형**을 잡는 것이 중요하다.

## 끝으로

이번에 적용한 Docker 레이어 캐시 최적화는 서버와 프론트 모두의 빌드 시간을 줄이고, 배포 파이프라인을 가볍게 만들었다.  
매번 전체 빌드로 고생 중이라면, **Dockerfile에서 의존성과 소스를 분리**하고 **변경이 드문 입력을 위로 끌어올리는 것**부터 시도해보자. 작은 변화가 배포 빈도와 리드타임을 눈에 띄게 바꿔 줄 것이다.
