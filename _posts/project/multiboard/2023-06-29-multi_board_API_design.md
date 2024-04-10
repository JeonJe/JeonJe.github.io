---
title: RESTful API 설계 & 개발 순서
categoreis: project multiboard
tags: [multiboard API]

---

> [API 설계 주의점](https://www.couchcoding.kr/blogs/couchcoding/%EA%B0%9C%EB%B0%9C%20%EC%B4%88%EB%B3%B4%EB%A5%BC%20%EC%9C%84%ED%95%9C%20RESTful%20API%20%EC%84%A4%EA%B3%84%20%EA%B0%80%EC%9D%B4%EB%93%9C)을 고려하여 GitBook으로 프로젝트에 필요한 API 명세서를 설계합니다.
>  *아래 내용은 초기 설계 단계 내용입니다. 필요한 경우 내용이 변경 될 수 있습니다. 참고 부탁드립니다.*





## RESTful API 디자인 가이드
1. URI는 리소스를 표현합니다.
2. 자원에 대한 행위는 HTTP Method로 표현합니다.

```http
GET  /members/delete/1 (X)
DELTE /members/1 (O)

GET /members/show/1 (X)
GET /members/1 (O)

GET /members/INSERT (X)
POST /members
```

## API 설계 주의점
- `/` 는 계층 관계를 나타내는데 사용 됩니다.

```http
http://restapi.example.com/houses/apartments
http://restapi.example.com/animals/mammals/whales
```
- URI 마지막 문자에 `슬래시(/)` 는 미포함합니다.
- 하이픈(-)은 URI 가독성을 높입니다. 언더바(_)는 사용하지 않습니다.
- URI경로에 대문자 사용은 피합니다.
- 파일확장자는 URI에 포함시키지 않는다. Accept header를 사용합니다.
- 리소스 간에 관계가 있을 수 있습니다. 아래와 같이 표현 될 수 있습니다.
```http
리소스명/리소스 ID/관계가 있는 다른 리소스명
ex)GET : /users/{userid}/devices (일반적으로 소유 ‘has’의 관계를 표현할 때)
GET : /users/{userid}/likes/devices (관계명이 애매하거나 구체적 표현이 필요할 때)
```
1. 자원을 표현하는 collection과 document
   1. document는 문서, 객체라고 이해 할 수 있습니다
   2. collection은 문서들의 집합, 객체들의 집합으로 이해할 수 있습니다.
   3. collection, document는 리소스라고 표현될 수 있기 때문에 URI로 표현 가능합니다. collection은 복수로 사용됩니다.
```http
  http:// restapi.example.com/sports/soccer/players/13
  collection : sports, players
  document : soccer, 13
```

마지막으로 API 요청에 대한 적절한 [응답코드](https://hongong.hanbit.co.kr/http-%EC%83%81%ED%83%9C-%EC%BD%94%EB%93%9C-%ED%91%9C-1xx-5xx-%EC%A0%84%EC%B2%B4-%EC%9A%94%EC%95%BD-%EC%A0%95%EB%A6%AC/)를 설정하여 응답 Reponse를 작성합니다.

---
## Multi Board RESTful API 명세서 작성
Multi Board 프로젝트는 공지사항, 자유게시판, 갤러리 게시판, 문의 게시판에 대한 `작성`,`수정`,`삭제`,`읽기`와
`회원가입`, `로그인`, `파일 업로드/다운로드`, `이미지 업로드/다운로드` 등 다양한 기능이 요구됩니다.
<br/>
<br/>
이 기능들과 관련된 `URI, Parameter, Response`들은 보기쉽게 관리가 되어야 하며 변경 추적관리 및 공유가 되어야 합니다. 
저는 `gitbook`을 사용하여 앞서 알아본 설계 주의점을 고려하며 [API 명세서](https://premsie.gitbook.io/multi-board)를 작성하였습니다.

<br/>
*`이 명세서는 앞으로 개발을 진행하면서 계속 보완하고 내용을 추가해 나갈 예정입니다.`*
<br/>
<br/>

## 개발 순서
이제 다음 스텝으로 개발의 순서를 정하고 설계에 따라 개발을 진행해보겠습니다.
개발 순서는 `높은 중요도`에서 낮은 중요도 순서로 그리고 `낮은 난이도`에서 높은 난이도 순서로 진행할 예정입니다.

**사용자(vue)**
   1. 회원가입
   2. 로그인 
   3. 공지사항 
   4. 문의게시판 
   5. 자유게시판 
   6. 갤러리게시판 



