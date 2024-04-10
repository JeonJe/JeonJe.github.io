---
title: ERD 설계
categories: project multiboard
tags: [multiboard ERD]
---



> 앞서 4가지 버전(JSP Model v1, Model v2, Spring Boot, Vue + SpringBoot API)으로 
> [간단한 자유 게시판](https://www.notion.so/whssodi/6bdc5114ae3f4a68a717a1740465b274?pvs=4)을 개발하였습니다. 배운 내용을 바탕으로 조금 더 복잡한 다중(멀티)게시판 프로젝트 개발을 진행해보겠습니다
> *아래 내용은 초기 설계 단계 내용입니다. 필요한 경우 내용이 변경 될 수 있습니다. 참고 부탁드립니다.*


---
## 개발환경

- 프론트엔드 : @vue/cli 5.0.8(사용자)
- 백엔드 : SpringBoot v3.1.0, JDK17, Mybatis3 
- 데이터베이스 : MariaDB 10.11.3
- 서버 : Mac OS(Local), Linux Ubuntu 18.04(Server)

---
## 서비스 주요 기능

### 사용자 
  - GNB(Global Na vigation Bar)
  - 회원가입
  - 로그인
  - 공지사항
    - 글 검색 및 보기
  - 자유게시판
    - 글 등록
      - 첨부파일 업로드/다운로드 및 검증
    - 본인 댓글 삭제
  - 갤러리게시판
    - 이미지 썸네일
    - 라이브러리를 활용한 이미지 네비게이션
    - 파일 리스트 우선순위 변경 
  - 문의사항 게시판
    - 나만의 문의 내역 확인
    - 문의사항 비밀글 처리
    - 관리자 답변 여부에따른 미답변/답변완료 처리



---
## ERD 설계
### v1(최초 설계)
![v1](https://github.com/JeonJe/Multi_Board/assets/43032391/4e5eb8a9-1091-4368-b892-dbfdc4008b72)
- 공지사항, 자유게시판, 갤러리게시판, 문의게시판은 중복되는 필드가 많습니다. 하지만 사용 목적이 다르고 쿼리의 길이와 관리의 편의성을 높이기 위해 각 테이블을 분리하여 설계하였습니다.
- 이미지, 첨부파일도 동일하게 중복되는 필드가 많습니다. 하나의 테이블에서 type 컬럼을 추가하여 해당 해당 파일과 관련있는 게시판을 식별하도록 설계 가능하지만, 사용 목적에 따라 분리하여 명확하게 사용하도록 설계하였습니다. 


### v2(v1 변경)
![v2](https://github.com/JeonJe/Multi_Board/assets/43032391/0e650230-9fb8-490b-93cd-4296a451c23e)
- `코드 관리`는 카테고리에 한정되어 있기 때문에 명확하게 식별할 수 있도록 구체적인 테이블명을 사용하였습니다. 또한 id를 사용하지 않고 코드 자체를 pk로 사용하도록 변경하였습니다.
- `댓글`과 `답변`은 사용 목적이 명확하게 다르기 때문에 별도의 테이블로 분리하였습니다.
- `유저` 테이블에서 `관리자`를 분리하여 보안적으로 더 안전하게 변경하였습니다.

### v3(23.06.30)
![v3](https://github.com/JeonJe/Free_Board/assets/43032391/92a41ced-116c-47fd-89a3-628547351477)
- ~~cateory_board_mapping 테이블을 사용하여 parent_code_value와 board_id 사이 `many to many`관계 설정하였습니다. 이에따라 각 보드에서 child_code_value 컬럼은 삭제되었습니다. board_type은 어떤 보드인지 식별하는 컬럼입니다.~~
- 각 테이블의 userId 컬럼 데이터타입을 INT형이 아닌 VARCHAR(255)로 변경하였습니다. 그 이유는 users 테이블 내에서  varchar형 user_id는 유니크하기 때문에 다른 테이블에서 이 컬럼 값으로 데이터가 식별 가능하기 때문입니다.
- 잘못된 이름 수정하였습니다.
- now() 위치를 수정하였습니다.
- BOOLEAN -> TINYINT(1) 로 수정하였습니다

### v4(23.07.06)

![v4](https://github.com/JeonJe/Multi_Board/assets/43032391/ad1403a1-5124-41b8-af60-38f6e9c12c87)
- 이름 수정 childe_code -> child_code, notice_table -> notice_board
- category mapping 구조 변경 
  각 게시판의 게시글에서 child_code_value를 가지고 있기 때문에 해당 게시판 카테고리의 대분류와 세부카테고리를 알 수 있기 때문에 mapping 테이블이 필요없을 것으로 판단하였습니다. 이 부분은 개발을 진행을 진행하며 더 수정이 필요할 수 있습니다.

### v5 (23.07.27)
![multiboard v1](https://github.com/JeonJe/Free_Board/assets/43032391/b7b20347-b954-41d2-827e-520ad07c2b8a)


- [게시글/댓글 작성자 확인시 String userId -> Integer seqId 로 확인하도록 변경](https://github.com/JeonJe/Free_Board/multi_board_midterm_check)

### 추가 개선 포인트
만약 `갤러리 게시판`에서 댓글을 추가할 수 있거나, `문의 게시판`에서 `첨부파일`을 첨부 하도록 요구조건이 변경된다면 첨부파일, 댓글이 어느 게시판 테이블에서 사용되고 있는지 식별할 수 있도록 추가적인 맵핑 테이블 또는 컬럼이 필요하게 됩니다. 이번 프로젝트에서는 짧은 기간에 핵심기능을 구현하기 위해 이런 확장성까지는 고려하지 않겠습니다.


## 링크
[프로젝트 ERD확인](https://www.erdcloud.com/d/Em46o5hy4evaZy4oN)

  