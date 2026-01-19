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
    { name: "Blog", url: "https://jeonje.github.io/" },
    { name: "GitHub", url: "https://github.com/JeonJe" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/jeonje/" }
  ],
  profileImage: "",

  // 소개
  intro: {
    paragraphs: [
      "비효율을 개선하고 실질적인 가치를 만드는 일에 몰입하며, 변화가 필요할 땐 주저 없이 도전합니다.",
      "보안 담당자로서 시스템 안정성의 가치를 배웠고, 지금은 주도적으로 문제를 해결하며 사용자에게 도움이 되는 가치 있는 서비스를 만들어가고 있습니다.",
      "'더 나은 방법은 없을까?'라는 고민을 하나씩 풀어가며, 이런 작은 개선들이 쌓여 팀과 서비스를 더 효율적으로 만들어갑니다."
    ]
  },

  // 실무 경력
  experience: [
    {
      company: "플라잉닥터",
      role: "백엔드 개발자",
      period: "2023.09 - 재직중 (2년 5개월)",
      achievements: [
        "비대면 진료 플랫폼 '모비닥' 운영. 환자 앱(예약·혈압 기록) 및 병원 클라이언트(예약·진료·통계) 개발 및 운영",
        "진료 공간 기반 예약 시스템 개편 및 오버부킹 방지를 위한 Redis 분산락 도입",
        "병원 통계 요약/상세 조회 불일치 구조 개선 및 AI 분석 사이드 패널 기능 개발",
        "레거시 저장 프로시저를 애플리케이션 로직으로 전환하여 구조 및 성능 개선"
      ]
    },
    {
      company: "현대 AutoEver",
      role: "보안서비스팀 · 정보보안시스템 담당자",
      period: "2021.09 - 2022.10 (1년 2개월)",
      achievements: [
        "현대자동차그룹의 IT 서비스 전문 기업, 그룹사 공용 네트워크 보안 시스템의 운영 및 관리 담당",
        "DDoS(10G급), WAF(80+도메인), 스팸차단 시스템의 보안 정책 관리 및 OS 업그레이드 작업 수행",
        "WAF장비의 ISO-27001(정보보호 경영시스템) 인증심사 인터뷰 대응"
      ]
    },
    {
      company: "신세계 I&C",
      role: "정보보안팀 · 정보보안시스템 담당자",
      period: "2020.04 - 2021.09 (1년 6개월)",
      achievements: [
        "신세계그룹의 IT 서비스 전문 기업, 그룹사 공용 보안 시스템 운영 및 개선 담당",
        "SSL-VPN 정책 자동화 개선 프로젝트 PM(+2000 User, +20개 관계사, +1억원)",
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
      title: "진료 공간 기반 예약 시스템 개편으로 운영 리소스 절감 및 오버부킹 방지",
      subtitle: "도메인 모델 재설계 및 Redis 분산락 도입",
      period: "2025.02 - 2025.04",
      stack: "Java, Spring Boot, MyBatis, MySQL, Redis",
       links: [
         { name: "운영 자동화를 위한 진료 공간 도메인 설계 과정", url: "https://jeonje.github.io/posts/room-domain-and-refactoring-review/" },
         { name: "DB Lock을 쓸 수 없는 환경에서 Redis 분산락을 선택한 이유", url: "https://jeonje.github.io/posts/redis-distributed-lock-concurrency-control/" }
       ],
      image: "",
      imageCaption: "",
      overview: "'의사 중심' 예약 구조를 '진료 공간' 중심으로 재설계하여 담당자 변경 시 발생하는 운영 비효율을 제거</br> Redis 분산락을 도입해 예약 오버부킹을 방지하여 데이터 정합성과 병원 운영 안정성을 확보",
      team: "백엔드 단독 수행, 프론트 엔드 개발자 2명과 협업",
      tasks: [
        "진료 공간 중심의 예약 도메인 모델링 및 DB 스키마 재설계",
        "Redis 분산락을 활용한 예약 동시성 제어 및 데이터 정합성 확보",
        "복잡한 예약 로직을 기능별로 분리하고 전략 패턴을 적용하여 유지보수가 쉬운 구조로 개선"
      ],
      solutions: "<strong>1. 신규 도메인 도입 및 예약 로직 리팩토링</strong><br>• PM/실무자와의 협업을 통해 '진료 공간' 도메인을 새롭게 정의하여 비즈니스 확장성 확보<br>• 예약 기능을 전략 패턴으로 전환하여 다양한 예약 유형에 대응 가능한 구조로 개선<br><br><strong>2. 동시성 제어</strong><br>• DB Row Lock 적용이 불가능한 환경적 제약을 고려해 Redis 분산락을 도입하여 중복 예약 방지<br>• 장애 시에도 서비스가 유지되도록 Fail-Safe 전략 구현<br><br><strong>3. 성능 병목 개선</strong><br>• 불필요한 연관 데이터 조회를 제거하여 응답 속도 개선<br>• 대량의 객체 생성 로직을 DB 연산으로 변경하여 메모리 사용량 최적화",
      results: [
        "담당자 변경 시 예약 건별 수동 이관 작업을 <mark>1회</mark> 변경으로 간소화",
        "공간 기반 예약 확대로 서비스 범위를 넓히고, 공간별 통계 측정 구조 구축",
        "중복 예약 <mark>0건</mark> 달성으로 병원 운영 혼선 및 환자 불편 최소화",
        "예약 조회 메모리 사용량 95% 절감(20MB → 1MB) 및 응답 속도 개선(50ms → 20ms)"
      ]
    },
    {
      title: "통계 데이터 신뢰도 회복 및 AI 분석 시스템 안정성 확보",
      subtitle: "조회 기준 통합 및 비동기 도입으로 데이터 정합성 확보 및 응답 속도 개선",
      period: "2025.09 - 2025.10",
      stack: "Java, Spring Boot, MyBatis, MySQL",
       links: [
         { name: "통계 데이터 정합성 확보를 위한 조회 기준 통합 및 리팩토링 과정", url: "https://jeonje.github.io/posts/hospital-statistics-domain-refactoring/" },
         { name: "AI 분석 성능 개선을 위한 비동기 처리 도입 및 프롬프트 최적화 과정", url: "https://jeonje.github.io/posts/hospital-statistics-ai-improvement/" }
       ],
      image: "",
      imageCaption: "",
      overview: "통계 수치와 진료 상세 목록 간 조회 로직 파편화로 발생하는 데이터 불일치를 해결<br>장시간 소요되는 AI 분석을 '비동기 백그라운드 처리' 구조로 전환하여 시스템 안정성과 사용자 경험을 동시에 확보",
      team: "백엔드 & 프론트엔드 단독 수행",
      tasks: [
        "데이터 불일치 해결을 위한 조회 기준 통합 및 도메인 리팩토링",
        "웹소켓 및 폴백(Fallback)을 활용한 AI 분석 비동기 응답 시스템 구축",
        "복잡한 SQL 로직의 애플리케이션 이관 및 외부 AI 모델(LLM) 연동 구조 설계"
      ],
      solutions: "<strong>1. 데이터 정합성 확보</strong><br>• 통계 집계 시 추출된 식별자(ID)를 상세 목록 조회 시 재사용하는 구조로 개선하여 데이터 정합성 확보<br><br><strong>2. 비즈니스 로직 리팩토링</strong><br>• 일급 컬렉션 도입으로 환자 분류 로직을 캡슐화하여 단위 테스트가 가능한 구조적 기반 확보<br><br><strong>3. 타임아웃 해결 및 비동기 패턴 전환</strong><br>• 요청 즉시 작업 ID를 반환하고, 웹소켓 알림 및 폴백(Fallback) 조회를 지원하는 비동기 처리 구조 구현",
      results: [
        "통계 요약 및 상세 목록 간 수치 불일치 관련 고객 문의 <mark>0건</mark> 유지",
        "월간 진료 상세 조회 성능 <mark>1s → 100ms</mark> 개선 (ID 공유 구조 도입)",
        "AI 분석 초기 응답 속도 <mark>수 초 이상 → 0.1s</mark> 단축 및 타임아웃 <mark>0건</mark> 달성"
      ]
    },
    {
      title: "마케팅 동의 데이터 처리 프로세스 최적화 및 데드락 해결",
      subtitle: "프로시저를 애플리케이션 로직으로 전환하고 쿼리 튜닝으로 트랜잭션 시간 85% 단축",
      period: "2025.01",
      stack: "Java, Spring Boot, MyBatis, MySQL",
      overview: "환자 앱 로그인 시 간헐적으로 발생하는 데드락의 원인을 분석</br> 레거시 프로시저를 애플리케이션(Java) 로직으로 전환하고 쿼리 구조를 개선하여 시스템 안정성과 성능을 확보",
      links: [
        {
          name: "레거시 프로시저 이관을 통한 데드락 해결 및 쿼리 최적화 과정",
          url: "https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/"
        }
      ],
      team: "백엔드 단독 수행",
      tasks: [
        "MySQL 데드락 원인 분석 및 트랜잭션 경합 최소화를 위한 아키텍처 개선",
        "레거시 저장 프로시저(Stored Procedure)를 애플리케이션 계층으로 전환 및 리팩토링",
        "반복적인 DB I/O 최소화를 위한 배치 Insert 사용 및 쿼리 튜닝"
      ],
      solutions: "<strong>1. 데드락 원인 분석 및 구조 개선</strong><br>• 로그 부재 상황에서 코드 분석으로 GROUP BY 정렬 불일치에 따른 Lock 경합 원인 파악<br>• 성능 해결과 테스트 용이성을 함께 확보하기 위해 애플리케이션(Java) 로직 전환 및 배치 Insert 사용<br><br><strong>2. 쿼리 성능 최적화</strong><br>• GROUP BY 집계 쿼리를 Window Function으로 교체하여 Full Table Scan 제거<br>• 커서 기반 처리를 배치 Insert로 전환하여 DB I/O 효율 최적화",
      results: [
        "트랜잭션 처리 시간 <mark>85% 단축</mark> (1,395ms → 204ms, 로컬 테스트 기준)",
        "마케팅 이력 조회 성능 <mark>102.6ms → 0.88ms</mark> (로컬 테스트 기준)",
        "개선 후 데드락 발생 <mark>0건</mark> 달성"
      ]
    },
  ],

  // 대외활동
  activities: [
     {
       name: "글또 10기 (개발자 글쓰기 스터디)",
       category: "스터디",
       role: "",
       period: "2024.10 - 2025.03",
       achievements: [
         "문제 해결 과정을 기록한 기술 아티클 11편 작성 및 큐레이션 선정",
         "<a href='https://jeonje.github.io/posts/geultto-review/' target='_blank'>기록을 통해 기술적 성장을 증명하는 법: 6개월간의 글쓰기 회고</a>",
         "<a href='https://jeonje.github.io/posts/geultto-mysql-deadlock-improvement/' target='_blank'>[큐레이션 선정] MySQL 데드락 발생 프로시저 개선기</a>"
       ]
     },
     {
       name: "크래프톤 정글 팀 프로젝트 멘토",
       category: "멘토링",
       role: "멘토",
       period: "2025.06 - 2025.07 (8기)<br>2025.12 - 2026.01 (11기)",
       achievements: [
         "MVP 완성을 위한 개발 스코프 조율 및 생산성 향상을 위한 AI 활용 가이드",
         "다이어그램을 활용한 기술 설명 및 선택지 제시를 통해 팀의 주도적인 의사결정 지원",
         "<a href='https://jeonje.github.io/posts/jungle-mentoring_review/' target='_blank'>정답 제시보다는 선택지와 경험 공유로 성장을 도운 5주간의 멘토링 기록</a>"
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
        <h1>${data.name}</h1>
        <h2>${data.role}</h2>
      </div>
      <div class="header-right">
        <p>${data.email}</p>
        <p>${data.phone}</p>
        <div class="header-links">
          ${data.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>`).join(' · ')}
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
    <section>
      <h3 class="section-title" id="projects">주요 프로젝트</h3>
      ${data.projects.map(project => `
        <div class="layout">
          <div class="details">
            <h4>${project.title}</h4>
            <p><b>${project.subtitle}</b></p>
            <p>${project.period}</p>
            <p>${project.stack}</p>
            ${project.links ? `<p>${project.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>`).join('<br>')}</p>` : ''}
            ${project.image ? `
              <figure class="project-media">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                ${project.imageCaption ? `<figcaption>${project.imageCaption}</figcaption>` : ''}
              </figure>
            ` : ''}
          </div>
          <div class="content">
            <p><strong>프로젝트 개요</strong><br>${project.overview}</p>
            <p><strong>팀 구성 및 역할</strong><br>${project.team}</p>
            <p><strong>주요 업무</strong>
            <ul>
              ${project.tasks.map(task => `<li>${task}</li>`).join('')}
            </ul>
            <p><strong>문제 해결 과정</strong><br>${project.solutions}</p>
            <p><strong>성과</strong></p>
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
  `;

  resume.innerHTML = html;
}

// 페이지 로드 시 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderResume(resumeData);
});
</script>
