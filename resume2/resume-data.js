window.RESUME_DATA = {
  "name": "이전제",
  "role": "Backend Product Engineer",
  "character": "반복되는 문제의 구조를 바꾸는 백엔드 개발자",
  "email": "whssodi@gmail.com",
  "phone": "010-8304-2640",
  "links": [
    {
      "name": "Blog",
      "url": "https://jeonje.github.io/about/"
    },
    {
      "name": "GitHub",
      "url": "https://github.com/jeonje"
    }
  ],
  "profileImage": "",
  "intro": {
    "paragraphs": [
      "겉으로 드러난 문제를 해결하는 데서 그치지 않습니다. 반복되는 문제를 만드는 구조를 바로잡는 일을 중요하게 생각합니다. 예약 단위를 사람에서 진료 공간으로 전환해 스케줄 변경을 건별 대응에서 1회 처리로 줄였습니다.",
      "불확실할수록 빠르게 검증합니다. 기존 통증 구조로 프로토타입을 먼저 구현해 재사용 가능성을 확인했고, 한계를 확인한 뒤 환자 중심 건강기록 도메인을 설계했습니다. 검증을 통해 확신을 만들고, 서비스가 안정적으로 확장될 수 있는 구조를 만드는 데 집중하고 있습니다."
    ]
  },
  "experience": [
    {
      "company": "플라잉닥터",
      "role": "백엔드 개발자",
      "companyIntro": "비대면 진료 서비스 모비닥 개발 및 운영",
      "period": "23.09 ~ 재직중",
      "achievements": [
        "예약 단위 사람 → 진료 공간 전환, 스케줄 변경 <b>건별 → 1회</b> 처리 · 공간별 운영 지표 확보",
        "만성질환 관리 확장 위해 환자 중심 건강기록 도메인 설계, <b>신규 서비스 영역 진입 기반</b> 마련",
        "진료 예약 동시성 제어로 이중 예약 차단 → 환자 불필요 대기·병원 민원 대응 제거",
        "스테이징 배포에 n8n 자동화 활용, 주 <b>15~20회</b> 수동 배포 요청 제거"
      ]
    },
    {
      "company": "현대 AutoEver",
      "role": "정보보안시스템 담당자",
      "companyIntro": "",
      "period": "21.09 ~ 22.10",
      "achievements": [
        "그룹사 WAF(80+ 도메인), DDoS(10G급) 운영",
        "Log4Shell 취약점 긴급 보안 패치 대응"
      ]
    },
    {
      "company": "신세계 I&C",
      "role": "정보보안시스템 담당자",
      "companyIntro": "",
      "period": "20.04 ~ 21.09",
      "achievements": [
        "2천+ 유저 SSL-VPN 정책 구조 전환 PM(20+ 관계사, 매출 1억)",
        "단일 IDC → IDC 간 이중화 개선으로 원활한 원격근무에 기여"
      ]
    }
  ],
  "skills": [
    {
      "category": "",
      "items": [
        "<b>AI</b> · Claude Code AI 도구·스킬 개발 및 사내 공유, 에이전트 기반 개발·리뷰·검증 워크플로우 활용",
        "<b>Java/Spring Boot</b> · 객체지향 설계, 테스트 코드 기반 리팩터링, 도메인 모델링",
        "<b>MySQL</b> · 인덱스 설계, 실행계획 분석, 데드락 트러블슈팅",
        "<b>Redis</b> · 분산락 설계, 캐시 전략 적용",
        "<b>Vue.js/Nuxt.js</b> · 서버-화면 풀스택 구현",
        "<b>K8s</b> · 멀티 인스턴스 롤링 업데이트/롤백 운영",
        "<b>Docker</b> · <a href='https://jeonje.github.io/posts/docker-layer-caching-optimization/' target='_blank' rel='noopener'>레이어 캐싱 최적화</a>",
        "<b>Security</b> · DDoS·WAF·SSL-VPN 운영, 정보보호 국제 인증 심사 대응"
      ]
    }
  ],
  "projects": [
    {
      "mode": "deep",
      "title": "고혈압 건강기록 — 만성질환 관리 플랫폼 전환",
      "subtitle": "도메인 설계 · 심혈관 위험도 · 건강검진 연동",
      "company": "플라잉닥터",
      "period": "25.10 ~ 진행중",
      "stack": "Java, Spring Boot, MySQL, Vue.js",
      "overview": "비대면 진료 서비스에서 만성질환 관리 플랫폼으로의 확장. 혈압 기록을 기존 통증 구조에 얹으려 했으나 두 도메인이 구조적으로 다르다는 것을 발견해 재설계. 만성질환 임상 가이드라인을 직접 학습해 환자 중심 건강기록 도메인을 새로 설계하고, 심혈관 위험도 계산과 건강검진 연동까지 구현.",
      "team": "백엔드 주도, 기획, 도메인 모델링, 프론트엔드 개발 참여 (PM·디자이너·의료진 협업)",
      "tasksLabel": "문제",
      "tasks": [
        "비대면 진료 중심 서비스에서 만성질환 관리로 확장. 환자 건강기록을 담을 도메인 구조부터 새로 만들어야 하는 상황",
        "단순 혈압 기록 앱을 넘어, 의료 플랫폼으로서 환자에게 차별화된 건강 정보를 제공할 방향을 찾는 것이 핵심 과제"
      ],
      "solutions": [
        {
          "title": "1. 환자 중심 건강기록 도메인 재설계",
          "items": [
            "기존 통증 구조 재사용(빠른 출시) vs 환자 중심 독립 도메인 신규 설계(초기 비용) 비교.",
            "기존 통증 기록 구조로 프로토타입을 빠르게 구현해 기능 검증. 건강 관리 도메인에 적합하지 않다고 판단 → 2주 내 새 도메인으로 전체 기능 전환 완료."
          ]
        },
        {
          "title": "2. 10년 내 심혈관 위험도 계산",
          "items": [
            "임상 가이드라인(ACC/AHA) 조사, PCE·PREVENT 두 모델의 산출식을 추출해 비교. 경계값 기준이 모델마다 다른 것을 확인하고 의료진에게 자문을 구해 채택 기준 결정.",
            "환자 연령, 보유 데이터에 따라 적합한 위험도 모델을 자동 선택하는 방식으로 설계.",
            "범위 초과 입력값을 에러로 차단하지 않고 경고로 처리. 극단적 수치도 임상 데이터로 보존."
          ]
        },
        {
          "title": "3. 건강검진 연동",
          "items": [
            "위험도 계산 데이터 직접 입력이 사용 허들로 작용. 외부 건강검진 데이터 연동으로 허들 해소.",
            "미리 입력된 사용자 건강 정보와 건강검진 연동 데이터 충돌 시 유지/덮어쓰기 선택권을 부여하는 정책 설계."
          ]
        }
      ],
      "results": [
        "프로토타입 기반 사용성·가치 검증 후 2주 내 도메인 전환 완료 — 비대면 진료 → 만성질환 관리 플랫폼 확장 기반 마련",
        "단순 혈압 기록 앱 → 의학 가이드라인 기반 심혈관 위험도 분석 서비스로 전환",
        "외부 건강검진 데이터 자동 연동 · 기존 수동 입력 건강정보 충돌 처리 정책 설계 및 구현"
      ],
      "retrospective": [
        "프로토타입으로 빠르게 검증 후 구조 전환, 가이드라인 학습으로 서비스 차별화 기준 수립.",
        "복잡도를 최소화하는 구조로 개발했으나, 트래픽 증가 시 캐시 적용·알림 방식 전환 등 설계 고도화 고려 필요."
      ]
    },
    {
      "mode": "deep",
      "title": "예약 동시성 제어",
      "subtitle": "락 전략 비교 · Redis 분산락 도입",
      "company": "플라잉닥터",
      "period": "25.04",
      "stack": "Java, Spring Boot, MySQL, Redis",
      "links": [
        {
          "name": "예약 동시성 제어와 분산락",
          "url": "https://jeonje.github.io/posts/redis-distributed-lock-concurrency-control/"
        }
      ],
      "retrospective": [
        "동시성 제어 방법 비교를 통해 무조건 특정 락을 써야 하는 것이 아니라, <a href='https://jeonje.github.io/posts/redis-distributed-lock-concurrency-control/' target='_blank'>시스템 제약과 상황에 맞는 방식을 선택하는 것</a>이 중요하다는 것을 경험.",
        "Redis 장애 시 동시성 제어가 풀리는 한계가 있음. 예약 구조 변경 또는 여러 테이블에 걸친 DB 락으로 보완 가능하나, 현재 트래픽과 Redis 가용성을 고려하여 오버엔지니어링으로 판단."
      ],
      "overview": "",
      "team": "백엔드 단독 수행, 프론트엔드 개발자 2명 협업",
      "tasks": [
        "이중 예약이 가능한 구조적 문제 — 환자 대기, 병원 민원 대응 및 수동 예약 변경 비용 발생"
      ],
      "solutions": [
        {
          "title": "시도1. DB 락 없는 방식",
          "items": [
            "슬롯이 DB에 없고 매번 동적 계산되는 구조 — 조회 후 추가/수정 사이 경쟁 발생",
            "낙관적 락/조건부 UPDATE — 버전 체크할 예약 슬롯 Row 없음, 다중 테이블 수동 관리 복잡도 높음",
            "유니크 제약 — 동일 시작 시간만 차단, 범위 겹침 감지 불가"
          ]
        },
        {
          "title": "시도2. 비관적 락·애플리케이션 락",
          "items": [
            "비관적 락 — 예약 슬롯 Row 없어 락 대상 부재, 진료실 테이블에 걸면 예약 처리 중 해당 진료실 전체 시간대 블로킹",
            "애플리케이션 락(synchronized) — 단일 JVM 환경에서만 유효, 멀티 인스턴스 간 경쟁 제어 불가"
          ]
        },
        {
          "title": "채택. Redis 분산락",
          "items": [
            "AOP 어노테이션 — 기존 예약 로직 변경 없이 동시성 제어 적용",
            "진료 공간 + 예약일 조합으로 락 키 설계 — 경합 구간 최소화",
            "TTL·재시도·실패 정책 설계, Redis 장애 시 Slack 즉시 알림"
          ]
        },
      ],
      "results": [
        "10명 동시 예약 테스트 차단 검증 → 운영 <b>6개월+ 이중 예약 0건</b>",
        "환자 예약 혼선 감소, 병원의 민원 대응 및 수동 변경 처리 비용 제거",
        "추가 지연 <b>20ms</b>로 정합성 보장, Redis 장애 시 Slack 알림 즉시 발송으로 장애 즉시 인지"
      ]
    },
    {
      "mode": "compact",
      "title": "예약 시스템 개선(진료 공간 도메인 도입)",
      "subtitle": "도메인 설계 · 구조 리팩토링",
      "company": "플라잉닥터",
      "period": "25.02 ~ 25.04",
      "stack": "Java, Spring Boot, MySQL",
      "compactSummary": [
        "예약이 의사/직원 스케줄에 의존하여 스케줄 변경 시 건별 수동 수정, 공간 예약은 임시 직원 계정으로 우회해서 사용 중. 필드 추가로는 해결 불가한 구조적 문제로 판단, 예약 단위를 사람에서 공간으로 전환하는 방향을 선택.",
        "<a href='https://jeonje.github.io/posts/room-domain-and-refactoring-review/' target='_blank' rel='noopener'>'진료 공간' 도메인을 정의하고 공간 중심으로 전환하여</a> 스케줄 변경 <b>건별 → 1회 처리</b>, 공간별 진료건수, 신규, 재방문 통계를 병원 운영 지표로 활용."
      ],
      "links": [
        {
          "name": "진료 공간 도메인 설계 회고",
          "url": "https://jeonje.github.io/posts/room-domain-and-refactoring-review/"
        }
      ]
    },
    {
      "mode": "compact",
      "title": "병원 통계 AI 분석 타임아웃 개선",
      "subtitle": "비동기 전환 · Circuit Breaker",
      "company": "플라잉닥터",
      "period": "25.09 ~ 25.10",
      "stack": "Java, Spring Boot, MySQL",
      "compactSummary": [
        "병원 통계 AI 분석이 동기 처리되어 장기간 통계 요청 시 사용자 응답 대기, 타임아웃 발생 및 스레드 고갈 위험 구조. 타임아웃 확대·경량 모델 전환 등 간단 조치 대신 사용자 대기 구조 자체를 해소하는 방향으로 판단.",
        "<a href='https://jeonje.github.io/posts/hospital-statistics-ai-improvement/' target='_blank' rel='noopener'>비동기 전환을 선택하여</a> 응답 시간 <b>8초+ → 0.1초</b> 및 타임아웃 <b>0건</b>. Circuit Breaker로 외부 AI 장애 격리."
      ],
      "links": [
        {
          "name": "AI 분석 비동기 전환",
          "url": "https://jeonje.github.io/posts/hospital-statistics-ai-improvement/"
        }
      ]
    },
    {
      "mode": "compact",
      "title": "마케팅 동의 이력 정합성·처리 안정성 개선",
      "subtitle": "데드락 트러블슈팅 · 쿼리 튜닝",
      "company": "플라잉닥터",
      "period": "25.01",
      "stack": "Java, Spring Boot, MySQL",
      "compactSummary": [
        "로그인 시 마케팅 동의 이력 계산 중 데드락 반복, 환자가 최신 동의 상태를 조회하지 못하는 정합성 문제 발생. 원인인 스토어드 프로시저가 이해하기 어렵고 테스트 불가한 구조여서 부분 수정이 아닌 개선 대상으로 판단.",
        "<a href='https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/' target='_blank' rel='noopener'>애플리케이션 로직 전환을 선택하여</a>(정렬 순서 추가, 트랜잭션 범위 축소 방식과 비교), 데드락 <b>1년+ 미발생</b> 및 트랜잭션 처리 시간 <b>1.4s → 0.2s 감소</b>."
      ],
      "links": [
        {
          "name": "MySQL 데드락 트러블슈팅",
          "url": "https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/"
        }
      ],
      "image": ""
    }
  ],
  "activities": [
    {
      "name": "팀 프로젝트 멘토",
      "category": "멘토링",
      "org": "크래프톤 정글 교육과정",
      "period": "25.06, 25.12 (8기, 11기)",
      "achievements": [
        "2개 기수 참여, 경험 기반 멘토링으로 팀 자율 의사결정 지원 — '<a href='https://jeonje.github.io/posts/jungle-mentoring_review/' target='_blank' rel='noopener'>깊이 고민하고 구체적으로 설명해준다</a>'는 멘티 피드백"
      ]
    },
    {
      "name": "개발자 글쓰기 커뮤니티",
      "category": "스터디",
      "org": "글또 10기",
      "period": "24.10 ~ 25.03 (600+명)",
      "achievements": [
        "기술 글 11편 발행, <a href='https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/' target='_blank'>데드락 개선기 큐레이션 선정</a> — 문제 해결 과정을 구조화·도식화하여 공유"
      ]
    },
    {
      "name": "부트캠프",
      "category": "교육/프로젝트",
      "org": "크래프톤 정글 1기",
      "period": "22.10 ~ 23.03",
      "achievements": [
        "알고리즘, OS 커널, WebRTC 팀 프로젝트 수행 — 기술 블로그, 멘토링 활동으로 이어짐"
      ]
    }
  ],
  "etc": [
    {
      "category": "자격증",
      "items": [
        "SQLD",
        "정보처리기사",
        "리눅스마스터 1급",
        "네트워크관리사 2급"
      ]
    },
    {
      "category": "수상",
      "items": [
        "과학기술정보통신부 장관상<span class='etc-sub'>ㄴ K-Shield Jr. 2기 정보보호관리진단 과정 우수 인증생, 50명 중 2위</span>",
        "광운대학교 졸업작품 장려상<span class='etc-sub'>ㄴ 스마트 컨트랙트 기반 분산형 토큰 교환 시스템, 팀장</span>"
      ]
    }
  ]
};
