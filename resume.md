---
layout: resume
title: Resume
permalink: /resume/
---

<section class="resume" id="resume-content">
  <!-- 이 부분은 JavaScript로 자동 생성됩니다 -->
</section>

<script>
// ========================================
// 📝 여기만 수정하면 됩니다!
// ========================================

const resumeData = {
  // 기본 정보
  name: "이전제",
  role: "Backend Developer",
  email: "whssodi@gmail.com",
  phone: "010-8304-2640",
  links: [
    { name: "Blog", url: "https://jeonje.github.io/about/" },
    { name: "GitHub", url: "https://github.com/JeonJe" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/jeonje/" }
  ],
  profileImage: "/assets/img/resume/me.jpg",

  // 소개
  intro: {
    paragraphs: [
      "이중 예약 0건, 데드락 0건, 통계 불일치 문의 0건. 서비스 신뢰도에 집중합니다.",
      "보안 시스템 운영 경험을 통해 안정성의 중요성을 배웠습니다. 문제를 먼저 발견해 개선하고, 장애에 강한 구조를 만드는 태도로 이어졌습니다.",
      "보안 담당자, PM, 서버 개발, 최근에는 화면 개발과 기획까지 담당하며 다양한 역할과 경험을 쌓아나고 있습니다."
    ]
  },

  // 실무 경력
  experience: [
    {
      company: "플라잉닥터",
      role: "백엔드 개발자",
      period: "23.09 ~ 재직중 (2년 5개월)",
      achievements: [
        "비대면 진료 플랫폼 '모비닥' 운영. 환자 앱(예약·혈압 기록) 및 병원 클라이언트(예약·진료·통계) 개발 및 운영",
        "진료 공간 기반 예약 시스템 개편 및 이중 예약 방지를 위한 Redis 분산락 도입",
        "병원 통계 요약/상세 조회 불일치 구조 개선 및 AI 분석 사이드 패널 기능 개발",
        "레거시 저장 프로시저를 애플리케이션 로직으로 전환하여 구조 및 성능 개선"
      ]
    },
    {
      company: "현대 AutoEver",
      role: "보안서비스팀 · 정보보안시스템 담당자",
      period: "21.09 ~ 22.10 (1년 2개월)",
      achievements: [
        "현대자동차그룹의 IT 서비스 전문 기업, 그룹사 공용 네트워크 보안 시스템의 운영 및 관리 담당",
        "DDoS(10G급), WAF(80+도메인), 스팸차단 시스템의 보안 정책 관리 및 OS 업그레이드 작업 수행",
        "WAF장비의 ISO-27001(정보보호 경영시스템) 인증심사 인터뷰 대응"
      ]
    },
    {
      company: "신세계 I&C",
      role: "정보보안팀 · 정보보안시스템 담당자",
      period: "20.04 ~ 21.09 (1년 6개월)",
      achievements: [
        "신세계그룹의 IT 서비스 전문 기업, 그룹사 공용 보안 시스템 운영 및 개선 담당",
        "재택근무 급증 대응 SSL-VPN 정책 자동화 개선 프로젝트 PM (매출 1억)",
        "SSL-VPN IDC 간 이중화 작업으로 IDC 장애·마비 시에도 무중단 원격근무 환경 확보 기여"
      ]
    }
  ],

  // 기술 역량
  skills: [
    {
      category: "Backend",
      items: ["Java", "Spring Boot", "MyBatis"]
    },
    {
      category: "Database",
      items: ["MySQL"]
    },
    {
      category: "Infrastructure",
      items: ["Redis", "Jenkins", "Docker", "Kubernetes"]
    }
  ],

  // 프로젝트 상세
  projects: [
    {
      title: "예약 담당자 변경 업무 효율화(건별→1회) 및 이중 예약 0건",
      subtitle: "진료 공간 도메인 설계, 예약 시스템 리팩토링, 분산락 도입",
      company: "플라잉닥터",
      period: "25.02 ~ 25.04",
      stack: "Java, Spring Boot, MyBatis, MySQL, Redis",
      links: [
        { name: "진료 공간 도메인 설계 회고", url: "https://jeonje.github.io/posts/room-domain-and-refactoring-review/" },
        { name: "예약 동시성 제어와 분산락", url: "https://jeonje.github.io/posts/redis-distributed-lock-concurrency-control/" }
      ],
      image: "/assets/img/resume/reservation-before-after.svg",
      imageCaption: "",
      overview: "진료 공간 기반 예약 시스템 개편 및 동시성 제어 도입",
      team: "백엔드 단독 수행, 프론트엔드 개발자 2명 협업<br>• 일정 및 배포 전략 주도 (진료공간 관리 → 예약 리팩토링 순차 배포)<br>• 영향 범위 파악 후 프론트엔드 개발자와 작업 범위 공유 및 일정 조율",
      tasks: "기존 예약은 사람(의사/직원)에 묶인 구조로, 담당자 변경 시 예약을 건별로 수동 변경 <br>도수치료실, 물리치료실 같은 공간 기반 예약이 필요할 때는 '가짜 직원 계정'을 만들어 임시 처리하는 불편함 발생<br>동시 예약 요청 시 동시성 제어 부재로 이중 예약 간헐적 발생",
      solutions: "<strong>1. 신규 도메인 설계</strong><br>• PM/실무자 협업으로 '진료 공간' 도메인 정의, DB 스키마 설계<br>• 진료과목 등 상위 개념은 너무 추상적, 진료실/물리치료실/기기는 병원 운영에서 거의 변경되지 않아 적절한 추상화 레벨로 판단<br><br><strong>2. 예약 로직 리팩토링</strong><br>• 기존) 템플릿 메서드 구조에서 하위 클래스가 상위 메서드를 호출하는 꼬인 의존 관계<br>• 선택) 클라이언트/예약자 타입별 동적 변경 부분을 전략으로 분리 → 의존성 단방향 정리, 테스트 용이<br><br><strong>3. 동시성 제어 - Redis 분산락 선택 이유</strong><br>• <strong>대안 1) 비관적 락</strong>: 예약 슬롯을 실시간 계산하는 구조라 락을 걸 테이블 부재<br>• <strong>대안 2) 낙관적 락</strong>: 버전 필드 적용 테이블 부재, 예약 시간 일부 겹침 케이스 대응 어려움<br>• <strong>선택) Redis 분산락</strong>: 비즈니스 로직 변경 없이 도입 가능, 기존 Redis 인프라 활용<br>• Redis 장애 시 서비스 유지를 위해 이중 요청 허용 결정 및 즉시 대응을 위한 Slack 알림 추가",
      results: [
        "진료 공간 도메인 도입으로 담당자 변경 시 예약 건별 수동 작업을 <mark>1회</mark>로 효율화",
        "공간 기반 예약 확대로 서비스 범위 확장, 진료 공간별 진료건수/신규/재방문 통계로 운영 효율 분석 가능",
        "분산락 도입으로 이중 예약 <mark>0건</mark>, 병원 운영 혼선 및 환자 불편 최소화"
      ]
    },
    {
      title: "통계 불일치 고객 문의 0건, AI 분석 타임아웃 0건",
      subtitle: "통계 요약/상세 조회 집계 구조 통합, AI 분석 비동기 백그라운드 처리 전환",
      company: "플라잉닥터",
      period: "25.09 ~ 25.10",
      stack: "Java, Spring Boot, MyBatis, MySQL",
      links: [
        { name: "통계 수치 불일치 해결", url: "https://jeonje.github.io/posts/hospital-statistics-domain-refactoring/" },
        { name: "AI 분석 비동기 전환", url: "https://jeonje.github.io/posts/hospital-statistics-ai-improvement/" }
      ],
      image: "/assets/img/resume/ai-async-flow.svg",
      imageCaption: "",
      overview: "병원 통계 수치 불일치 구조 개선 및 AI 분석 사이드 패널 개발",
      team: "백엔드 & 프론트엔드 단독 수행<br>• 통계 불일치 리포팅 → 구조 변경 필요성 판단 및 개선<br>• AI 통계 분석: 개발/디자인 단독 수행",
      tasks: "진료 테이블과 통계용 테이블(1시간마다 동기화)에 동일한 집계 기준이 각각 구현, 불일치로 고객 문의 발생<br>AI 분석 응답 수 초~수십 초 대기로 스레드 풀 고갈, 요청 몰릴 때 서버 응답 지연 발생 가능",
      solutions: "<strong>1. 통계 수치 불일치 해결 - 집계 구조 통합</strong><br>• 대안) 두 쿼리의 집계 기준 동기화 유지 → 변경 시마다 두 곳 수정 필요, 불일치 재발 위험<br>• 선택) 통계 테이블이 조회 책임, 상세 조회는 통계에서 추출한 ID 기반으로만 조회하여 일관성 보장<br><br><strong>2. AI 분석 비동기 전환 - 점진적 개선</strong><br>• <strong>1차) 스레드 분리</strong>: 메인 스레드 점유 시간 단축, 하지만 클라이언트는 여전히 수 분 대기<br>• <strong>2차) 완전 비동기</strong>: 요청 시 작업 ID만 즉시 반환, 완료 시 웹소켓 알림<br>• 웹소켓은 기존 시그널서버에서 사용 중인 패턴 활용, 메시지 누락 대비하여 사이드 패널 진입 시 DB 조회로 보완<br><br><strong>3. 외부 시스템 장애 대비</strong><br>• 기존) 장애 시에도 외부 요청 계속 발생, 타임아웃까지 대기 필요<br>• 선택) Circuit Breaker 도입하여 장애 시 즉시 실패 처리, 사용자가 요청 상태 바로 인지 가능",
      results: [
        "집계 구조 통합으로 통계 수치 불일치 해결하여 고객 문의 <mark>0건</mark> 및 조회 속도 개선 (<mark>1s → 100ms</mark>)",
        "집계 구조 통합(2곳 → 1곳)으로 유지보수/트러블슈팅 비용 감소",
        "비동기 전환으로 AI 분석 초기 응답 <mark>수 초~수십 초 → 0.1s</mark> 단축, 타임아웃 <mark>0건</mark>"
      ]
    },
    {
      title: "환자 앱 로그인 데드락 해결 (0건)",
      subtitle: "레거시 프로시저 → 애플리케이션 전환, 쿼리 튜닝",
      company: "플라잉닥터",
      period: "25.01",
      stack: "Java, Spring Boot, MyBatis, MySQL",
      overview: "환자 앱 로그인 데드락 원인 분석 및 레거시 프로시저 전환",
      links: [
        { name: "MySQL 데드락 트러블슈팅", url: "https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/" }
      ],
      image: "/assets/img/resume/deadlock-flow.svg",
      imageCaption: "",
      team: "백엔드 단독 수행",
      tasks: "환자 앱 로그인 후속 처리(마케팅 동의 이력 업데이트) 중 데드락 발생으로 최신 데이터 계산 실패",
      solutions: "<strong>1. 데드락 원인 분석</strong><br>• 스토어드 프로시저 내 GROUP BY 정렬 조건 누락에 따른 Lock 경합 원인 파악<br><br><strong>2. 대안 비교 및 선택</strong><br>• 대안 1) 정렬 순서 지정: ORDER BY 추가로 빠른 적용 가능하나 성능/유지보수/테스트 문제 미해결<br>• 대안 2) 트랜잭션 범위 축소: @Transactional 제거로 간단하나 일관성 감소<br>• 선택) 순서보장 및 애플리케이션 로직 전환: 일관성 유지 + 성능/유지보수성/테스트 용이성 우수<br><br><strong>3. 쿼리 성능 최적화</strong><br>• GROUP BY → Window Function 전환으로 Full Table Scan 제거<br>• 한 건씩 처리 → 일괄 처리로 전환하여 DB I/O 효율화",
      results: [
        "애플리케이션 로직 전환으로 데드락 발생 <mark>0건</mark>, 마케팅 동의 이력 계산 안정성 향상",
        "프로시저 → 애플리케이션 전환으로 트랜잭션 처리 시간 <mark>85% 단축 (1.4s → 0.2s)</mark>",
        "테스트 불가/이해하기 어려운 프로시저 → 테스트 가능 + 가독성 높은 코드로 전환"
      ]
    },
    {
      title: "재택근무 급증으로 인한 성능 문제 해결 (매출 1억+)",
      subtitle: "보안장비 정책 할당 및 그룹웨어 자동 연동 시스템 개선",
      company: "신세계 I&C",
      period: "20.04 ~ 21.09",
      stack: "SSL-VPN",
      links: [],
      image: "/assets/img/resume/ssl-vpn-acl.svg",
      imageCaption: "",
      overview: "SSL-VPN 접근제어 정책 개선 및 그룹웨어 자동화 연동 프로젝트",
      team: "프로젝트 PM (외부 정책 자동화 시스템 개발자, SSL-VPN 엔지니어와 협업)",
      tasks: "코로나인한 재택근무자 급증하여 장비 성능 임계치 도달 및 신규 세션 연결 불가",
      solutions: "<strong>1. 접근정책 수 한계 초과 해결</strong><br>• 대안 1) 미사용 사용자 삭제: 신규 사용자 계속 증가로 불가<br>• 대안 2) 장비 증설: 정책 임계치 동일, 장비 증설로 해결 불가<br>• 선택) 사용자별 32bit IP를 24bit(C클래스)로 변경 → 정책 수 절감<br><br><strong>2. 그룹웨어 연동 자동화 시스템 개선 </strong><br>• 기존 SSL-VPN과 그룹웨어 간 연동 자동화 시스템 변경 필요 → 그룹웨어 팀과 협업하여 프로젝트 리딩<br>• IP 대역 기반 정책 할당 기능 추가, SI/이마트 협력사 전용 등 신규 SSL-VPN 장비 연동 기능 확대",
      results: [
        "20개 이상 관계사 대상 <mark>매출 1억+</mark>",
        "24bit 정책 전환으로 신규 사용자 증가에도 장비 부하 안정화",
        "24bit 전환으로 유동 IP 변경 시에도 같은 대역 내 정책 유지, 기안 횟수 감소 및 불필요 정책 최소화"
      ]
    }
  ],

  // 대외활동
  activities: [
    {
      name: "크래프톤 정글 - 팀 프로젝트 멘토",
      category: "멘토링",
      role: "멘토",
      period: "25.06 ~ 25.07 (8기)<br>25.12 ~ 26.01 (11기)",
      achievements: [
        "MVP 기능 우선순위 조율 및 AI 활용 가이드로 팀 개발 속도 향상",
        "<a href='https://jeonje.github.io/posts/jungle-mentoring_review/' target='_blank'>멘토링 회고</a>"
      ]
    },
    {
      name: "글또 10기 - 개발자 글쓰기 커뮤니티",
      category: "스터디",
      role: "",
      period: "24.10 ~ 25.03",
      achievements: [
        "문제 해결 경험 중심 글 11편 작성, <a href='https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/' target='_blank'>데드락 개선기</a> 큐레이션 선정",
        "<a href='https://jeonje.github.io/posts/geultto-review/' target='_blank'>글또 활동 회고</a>"
      ]
    },
    {
      name: "크래프톤 정글 1기",
      category: "개발자 양성 과정",
      role: "",
      period: "22.10 ~ 23.03",
      achievements: [
        "크래프톤 주관 소프트웨어 개발자 양성 합숙 교육 프로그램",
        "WebRTC 기반 실시간 1:1 퍼즐 게임 개발"
      ]
    }
  ],

  // 기타 (자격증, 수상)
  etc: [
    {
      category: "자격증",
      items: [
        { name: "SQLD", date: "2021" },
        { name: "정보처리기사", date: "2019" },
        { name: "COS Pro 1급", date: "2019" },
        { name: "리눅스마스터 1급", date: "2018" },
        { name: "네트워크관리사 2급", date: "2018" }
      ]
    },
    {
      category: "수상",
      items: [
        { name: "과학기술정보통신부 장관상 - K-shield Jr. 2기 정보보호 관리 진단 과정 우수 인증생", date: "2019" },
        { name: "광운대학교 졸업작품 장려상 - 스마트 컨트랙트 기반 분산형 토큰 교환 시스템", date: "2019" },
        { name: "광운대학교 성적 우수상", date: "2019" }
      ]
    }
  ]
};

// ========================================
// 🚫 아래 코드는 수정하지 마세요
// ========================================

function getLinkIcon(name) {
  switch (name) {
    case 'GitHub':
      return 'Link :';
    case 'LinkedIn':
      return 'Link :';
    case 'Blog':
      return 'Link :';
    default:
      return '';
  }
}

function renderResume(data) {
  const resume = document.getElementById('resume-content');

  let html = `
    <header class="resume-header">
      <div class="header-left">
        ${data.profileImage ? `<div class="profile-img" style="background-image: url('${data.profileImage}')"></div>` : ''}
        <div class="header-text">
          <h1>${data.name}</h1>
          <h2>${data.role}</h2>
        </div>
      </div>
      <div class="header-right">
        <p>${data.email}</p>
        <p>${data.phone}</p>
        <div class="header-links">
          ${data.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>`).join('')}
        </div>
      </div>
    </header>

    <!-- 소개 -->
    <section>
      <h3 class="section-title" id="intro">자기소개</h3>
      <div style="max-width: 100%;">
        ${data.intro.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
    </section>

    <!-- 실무 경력 -->
    <section>
      <h3 class="section-title" id="experience">경력</h3>
      ${data.experience.map(exp => `
        <div class="layout">
          <div class="details">
            <h4>${exp.company}</h4>
            <p><b>${exp.role}</b></p>
            <p>${exp.period}</p>
          </div>
          <div class="content">
            <ul>
              ${exp.achievements.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- 주요 프로젝트 -->
    <section id="projects">
      <h3 class="section-title">주요 프로젝트</h3>
      ${data.projects.map(project => `
        <div class="layout">
          <div class="details">
            <h4>${project.title}</h4>
            <p><b>${project.subtitle}</b></p>
            ${project.company ? `<p><b>${project.company}</b></p>` : ''}
            <p>${project.period}</p>
            <p>${project.stack}</p>
            ${project.links ? `<p>${project.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>`).join('<br>')}</p>` : ''}
            ${project.image ? `
              <figure class="project-media">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                ${project.imageCaption ? `<figcaption>${project.imageCaption}</figcaption>` : ''}
              </figure>
            ` : ''}
            ${project.image2 ? `
              <figure class="project-media">
                <img src="${project.image2}" alt="${project.title}" loading="lazy">
                ${project.imageCaption2 ? `<figcaption>${project.imageCaption2}</figcaption>` : ''}
              </figure>
            ` : ''}
          </div>
          <div class="content">
            <p><strong>프로젝트 개요</strong><br>${project.overview}</p>
            <p><strong>팀 구성 및 역할</strong><br>${project.team}</p>
            <p><strong>문제</strong><br>
            ${Array.isArray(project.tasks)
            ? `<ul>${project.tasks.map(task => `<li>${task}</li>`).join('')}</ul>`
            : project.tasks}
            <p><strong>문제 해결 과정</strong><br>${project.solutions}</p>
            <p><strong>성과</strong><br>
            <ul>
              ${project.results.map(result => `<li>${result}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- 기술 역량 -->
    <section>
      <h3 class="section-title" id="skills">기술 역량</h3>
      ${data.skills.map(skill => `
        <div class="layout">
          <div class="details">
            <h4>${skill.category}</h4>
          </div>
          <div class="content">
            <p>${skill.items.join(' · ')}</p>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- 대외활동 -->
    <section>
      <h3 class="section-title" id="activities">대외활동</h3>
      ${data.activities.map(activity => `
        <div class="layout">
          <div class="details">
            <h4>${activity.name}</h4>
            <p><b>${activity.role}</b></p>
            <p>${activity.period}</p>
          </div>
          <div class="content">
            <ul>
              ${activity.achievements.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- 기타 -->
    <section>
      <h3 class="section-title" id="etc">기타</h3>
      ${data.etc.map(group => `
        <div class="layout">
          <div class="details">
            <h4>${group.category}</h4>
          </div>
          <div class="content">
            ${group.items.map(item =>
            typeof item === 'string'
                ? `<p style="margin: 0;">${item}</p>`
                : `<p style="display: flex; justify-content: space-between; margin: 0;">${item.name}<span style="font-size: 0.85em; color: #888;">${item.date}</span></p>`
        ).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `;

  resume.innerHTML = html;
}

// 페이지 로드 시 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderResume(resumeData);
});
</script>
