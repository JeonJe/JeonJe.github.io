# Chirpy 테마 CSS 커스터마이징 가이드

Jekyll Chirpy 테마에서 CSS를 수정할 때 참고하는 가이드입니다.

## 핵심 원칙

1. **Chirpy 내장 CSS 변수 사용** - 직접 색상값 대신 변수 사용
2. **다크모드 자동 대응** - 변수 사용 시 별도 다크모드 CSS 불필요
3. **Fallback 값 필수** - `var(--변수, 기본값)` 형태로 작성

---

## Chirpy CSS 변수 목록

### 텍스트 색상 (가장 자주 사용)

| 변수 | 용도 | 라이트 | 다크 |
|------|------|--------|------|
| `--heading-color` | 제목, 강조 텍스트 | 어두운 색 | 밝은 색 |
| `--text-color` | 본문 텍스트 | 어두운 색 | 밝은 색 |
| `--text-muted-color` | 부제목, 설명, 흐린 텍스트 | 회색 | 연한 회색 |
| `--link-color` | 링크, 액센트 색상 | 파란색 | 연한 파란색 |

### 배경 색상

| 변수 | 용도 |
|------|------|
| `--main-bg` | 페이지 배경 |
| `--card-bg` | 카드, 박스 배경 |
| `--card-hover-bg` | 카드 호버 배경 |
| `--sidebar-bg` | 사이드바 배경 |
| `--topbar-bg` | 상단바 배경 |
| `--inline-code-bg` | 인라인 코드 배경 |

### 테두리 색상

| 변수 | 용도 |
|------|------|
| `--border-color` | 일반 테두리 |
| `--main-border-color` | 주요 구분선 |
| `--tag-border` | 태그 테두리 |

### 기타 유용한 변수

| 변수 | 용도 |
|------|------|
| `--tag-hover` | 태그 호버 색상 |
| `--card-shadow` | 카드 그림자 |
| `--toc-highlight` | TOC 하이라이트 |
| `--prompt-tip-bg` | 팁 프롬프트 배경 |
| `--prompt-info-bg` | 정보 프롬프트 배경 |
| `--prompt-warning-bg` | 경고 프롬프트 배경 |
| `--prompt-danger-bg` | 위험 프롬프트 배경 |

---

## 커스텀 CSS 추가 방법

### 방법 1: 별도 CSS 파일 (권장)

1. `assets/css/` 폴더에 CSS 파일 생성
2. 해당 페이지에서 `<link>` 태그로 로드

```html
<!-- _tabs/about.md 또는 특정 페이지 -->
<link rel="stylesheet" href="/assets/css/my-custom.css">
```

**장점**: 필요한 페이지에만 로드, 유지보수 용이

### 방법 2: 전역 CSS 수정

`_sass/` 폴더의 SCSS 파일 수정 (테마 업데이트 시 충돌 주의)

---

## 다크모드 대응 방법

### 올바른 방법: Chirpy 변수 사용

```css
.my-element {
  color: var(--heading-color, #18181b);
  background: var(--card-bg, #f4f4f5);
  border: 1px solid var(--border-color, #e5e7eb);
}
```

다크모드 전환 시 Chirpy가 자동으로 변수 값을 변경합니다.

### 잘못된 방법: 하드코딩

```css
/* 이렇게 하면 다크모드에서 안 보임 */
.my-element {
  color: #18181b;
  background: #f4f4f5;
}
```

### 직접 다크모드 오버라이드 (필요한 경우만)

Chirpy 변수로 해결 안 될 때만 사용:

```css
/* 기본 (라이트모드) */
.my-element {
  color: var(--heading-color, #18181b);
}

/* 다크모드 오버라이드 */
html[data-mode=dark] .my-element {
  color: #fafafa !important;
}
```

> 주의: `html[data-mode="dark"]` (따옴표 있음/없음 둘 다 작동)

---

## 선택자 우선순위 문제 해결

### 문제: CSS가 적용되지 않음

Chirpy 테마가 더 구체적인 선택자로 덮어쓰는 경우

### 해결 방법

1. **Chirpy 변수 사용** (가장 좋음)
2. **더 구체적인 선택자**
   ```css
   .about-timeline-section .year-number {
     /* 더 구체적 */
   }
   ```
3. **!important 사용** (최후의 수단)
   ```css
   .year-number {
     color: var(--heading-color) !important;
   }
   ```

---

## 실제 사례: About 페이지 타임라인

### 파일 구조

```
assets/css/about-timeline.css  # 커스텀 CSS
_tabs/about.md                 # CSS 로드하는 페이지
```

### CSS 로드

```html
<!-- _tabs/about.md 상단 -->
<link rel="stylesheet" href="/assets/css/about-timeline.css">
```

### 색상 변수 매핑

| 요소 | 사용 변수 |
|------|----------|
| 연도 숫자 | `--heading-color` |
| 연도 테마 | `--text-muted-color` |
| 본문 스토리 | `--text-color` |
| 키워드 태그 배경 | `--card-bg` |
| 키워드 태그 텍스트 | `--text-muted-color` |
| 키워드 태그 테두리 | `--border-color` |
| 포스트 제목 | `--heading-color` |
| 포스트 요약 | `--text-muted-color` |
| 호버 액센트 | `--link-color` |
| 타임라인 선 | `--border-color` |

### 타임라인 마름모 위치 계산

```css
.year-timeline {
  padding-left: 3rem;  /* 콘텐츠 들여쓰기 */
}

.year-timeline::before {
  left: 0;  /* 세로선 위치 */
}

.year-block::before {
  left: -3rem;  /* padding-left와 동일하게 맞춤 */
  transform: rotate(45deg) translate(-50%, -50%);  /* 중심 맞춤 */
}
```

---

## 디버깅 팁

### 1. 브라우저 개발자 도구

- Elements 탭에서 요소 선택
- Computed 탭에서 최종 적용된 스타일 확인
- 어떤 선택자가 이기는지 확인

### 2. Chirpy 변수 값 확인

```bash
# 터미널에서 변수 목록 추출
grep -oE '\-\-[a-zA-Z-]+' _site/assets/css/jekyll-theme-chirpy.css | sort | uniq
```

### 3. Jekyll 서버 재시작

CSS 수정 후 변경사항이 안 보이면:

```bash
pkill -f "jekyll serve"
bundle exec jekyll serve --port 4001
```

### 4. 브라우저 캐시 무효화

- `Cmd + Shift + R` (Mac) / `Ctrl + Shift + R` (Windows)
- 또는 개발자 도구 열고 새로고침 버튼 길게 눌러 "Empty Cache and Hard Reload"

---

## 자주 하는 실수

### 1. 커스텀 변수 정의 후 다크모드 미적용

```css
/* 이렇게 하면 다크모드에서 변수 값이 안 바뀜 */
:root {
  --my-color: #18181b;
}
html[data-mode=dark] {
  --my-color: #fafafa;  /* Chirpy가 덮어쓸 수 있음 */
}
```

**해결**: Chirpy 내장 변수 직접 사용

### 2. 색상 상속 무시

```css
.parent {
  color: var(--heading-color);
}
.child {
  /* color를 명시 안 하면 parent 색상 상속 */
  /* 다크모드에서 문제될 수 있음 */
}
```

**해결**: 각 요소에 명시적으로 변수 지정

### 3. 반응형 미고려

```css
.element::before {
  left: -3rem;  /* 데스크탑용 */
}

@media (max-width: 768px) {
  .parent {
    padding-left: 2rem;  /* 모바일용 */
  }
  .element::before {
    left: -2rem;  /* 이것도 같이 수정해야 함! */
  }
}
```

---

## 체크리스트

CSS 작성 전:
- [ ] Chirpy에 사용할 수 있는 변수가 있는지 확인
- [ ] 다크모드에서 어떻게 보일지 고려

CSS 작성 후:
- [ ] 라이트모드 확인
- [ ] 다크모드 확인 (토글 전환)
- [ ] 모바일 반응형 확인
- [ ] 브라우저 캐시 비우고 확인

---

## 레이아웃 파일에서 CSS 작성

### 인라인 `<style>` 태그 방식

`_layouts/` 폴더의 HTML 파일에서 직접 CSS 작성 가능:

```html
<!-- _layouts/tags.html -->
<div class="my-component">...</div>

<style>
.my-component {
  background: var(--card-bg);
  border: 1px solid var(--card-border-color);
}
</style>
```

**장점**: 해당 페이지에서만 로드, 한 파일에서 관리
**단점**: 재사용 어려움, 파일이 길어짐

### 현재 사용 중인 레이아웃 파일

| 파일 | 용도 |
|------|------|
| `_layouts/tags.html` | 태그 페이지 (분기별 태그 스트립) |
| `_layouts/categories.html` | 카테고리 페이지 (워드 클라우드) |
| `_layouts/archives.html` | 아카이브 페이지 (연도별 목록) |

---

## 재사용 가능한 컴포넌트 패턴

### 통계 요약 카드 (stats-summary)

Tags, Categories, Archives 페이지에서 공통으로 사용:

```html
<div class="stats-summary mb-4">
  <div class="row text-center">
    <div class="col-4">
      <div class="stat-item">
        <span class="stat-number">42</span>
        <span class="stat-label">Posts</span>
      </div>
    </div>
    <!-- 반복 -->
  </div>
</div>
```

```css
.stats-summary {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--card-border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--heading-color);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted-color);
  margin-top: 0.25rem;
}
```

### 카드 컨테이너

```css
.card-container {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--card-border-color);
}
```

### 연도 구분선 (archives)

```css
.year-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.year-line {
  flex-grow: 1;
  height: 1px;
  background: var(--border-color);
}

.year-post-count {
  font-size: 0.85rem;
  color: var(--text-muted-color);
}
```

---

## JavaScript에서 CSS 변수 활용

### CSS 커스텀 프로퍼티 (--tag-color 패턴)

Tags 페이지에서 동적 색상 적용:

```html
<a class="quarter-tag" style="--tag-color: #4f46e5">
  <span class="tag-dot"></span>
  <span>태그명</span>
</a>
```

```css
.quarter-tag .tag-dot {
  background: var(--tag-color);  /* JS에서 설정한 값 사용 */
}

.quarter-tag:hover {
  border-color: var(--tag-color);
  color: var(--tag-color);
}
```

### JavaScript에서 색상 배열 사용

```javascript
const colors = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'
];

// 인라인 스타일로 CSS 변수 설정
element.style.setProperty('--tag-color', colors[i % colors.length]);
// 또는
element.setAttribute('style', `--tag-color: ${colors[i]}`);
```

---

## 페이지별 CSS 변수 사용 현황

### tags.html

| 변수 | 용도 |
|------|------|
| `--card-bg` | 컨테이너 배경 |
| `--card-border-color` | 컨테이너 테두리 |
| `--heading-color` | 숫자, 분기 라벨 |
| `--text-muted-color` | 설명 텍스트, 태그 카운트 |
| `--main-bg` | 태그 버튼 배경 |
| `--text-color` | 태그 텍스트 |

### categories.html

| 변수 | 용도 |
|------|------|
| `--card-bg` | 워드클라우드 배경 |
| `--card-border-color` | 컨테이너 테두리 |
| `--heading-color` | 통계 숫자 |
| `--text-muted-color` | 통계 라벨 |

### archives.html

| 변수 | 용도 |
|------|------|
| `--card-bg` | 통계 카드 배경 |
| `--card-border-color` | 카드 테두리 |
| `--heading-color` | 통계 숫자 |
| `--text-muted-color` | 라벨, 포스트 카운트 |
| `--border-color` | 연도 구분선 |

---

## 추가 Chirpy 변수 (레이아웃에서 발견)

| 변수 | 용도 |
|------|------|
| `--card-border-color` | 카드 테두리 (--border-color와 유사) |
| `--main-bg` | 메인 배경 (태그 버튼 등) |

> 참고: `--card-border-color`와 `--border-color`는 거의 동일한 값이지만, 카드 컴포넌트에서는 `--card-border-color` 사용 권장
