---
title: 중간점검
categories: project multiboard
tags: [multiboard midtermcheck]

---

## 코드 개선

### 1. UserID가 아닌 사용자 Sequence Number ID로 게시글 작성자 판단 

**[개선 전]**


게시글과 댓글 수정 권한을 판단하는 로직은 로그인한 사용자의 `JWT`에서 `String userId`를 추출해 해당 정보를 작성한 `userId`와 비교하는 방식입니다. userId가 유저 테이블의 기본키이기 때문에 기능상에는 문제가 없습니다.

하지만 추후 **회원탈퇴** 기능이 추가 될 경우, 신규 회원가입 사용자가 **탈퇴한 사용자의 아이디를 사용**한다면 탈퇴한 사용자의 게시글/댓글에 대한 권한을 갖게 되는 문제가 발생합니다.

따라서, 게시글과 댓글 작성자 여부를 `String userId`가 아닌 회원가입 시 부여된 `Integer SeqId`를 사용하여 확인하도록 변경이 필요합니다.

```java
/**
 * 자유게시판 정보를 수정합니다.
 *
 * @param userId   사용자 ID
 * @param boardDTO 수정할 게시글 정보를 담은 DTO 객체
 * @throws AppException 사용자 정보가 유효하지 않을 경우 예외 발생
 */
public void updateFreeBoardInfo(String userId, BoardDTO boardDTO) throws Exception {
    if (StringUtils.isEmpty(userId) || !userId.equals(boardDTO.getUserId())) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
    }
    ...

```

**[개선 후]**

먼저 데이터베이스 변경이 필요합니다.

 사용자, 관리자 테이블에 `sequence id` 컬럼을 추가하였습니다.
<img width="567" alt="image" src="https://github.com/JeonJe/Free_Board/assets/43032391/f540cf58-36c1-42b6-a08d-cc874c99796a">

각 테이블에서 작성자 정보를 `user_id VARCHAR(255)`에 저장하고 있었습니다. 이를 테이블에 따라 `user_seq_id INT(11)` 또는 `admin_seq_id INT(11)`을 사용하도록 변경하였습니다.
<img width="478" alt="image" src="https://github.com/JeonJe/Free_Board/assets/43032391/fcdb1206-03dd-4b30-8a00-803f3451ceff">
<img width="913" alt="image" src="https://github.com/JeonJe/Free_Board/assets/43032391/4a48d98b-2d57-42c7-a4b5-ed474ff7b093">


```java
/**
 * security > JwtTokenProvider.java
 */
public String createToken(int seqId) {
    String subject = String.valueOf(seqId);
    Claims claims = Jwts.claims().setSubject(subject);

    Date now = new Date();
    Date validity = new Date(now.getTime()
            + validityInMilliseconds);

    return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(now)
            .setExpiration(validity)
            .signWith(SignatureAlgorithm.HS256, secretKey)
            .compact();
}
```
JWT을 생성하는 `createToken`에서는 이제 `userId`가 아닌 `seqId`를 추가하여 생성하도록 변경합니다.


```java
/**
 * security > BearerAuthInterceptor.java
 */
@Component
@AllArgsConstructor
public class BearerAuthInterceptor implements HandlerInterceptor {
/**
 * 요청 헤더에서 인증 정보를 추출
 */
private AuthorizationExtractor authExtractor;
/**
 * jwtToken 관련 유틸리티
 */
private JwtTokenProvider jwtTokenProvider;

/**
 * Pre-handle 메서드는 요청이 컨트롤러에 도달하기 전에 실행되는 메서드입니다.
 * 이 메서드에서는 요청 헤더에서 JWT 토큰을 추출하고 유효성을 검사한 후,
 * 추출한 토큰의 사용자 ID를 요청 속성에 저장합니다.
 *
 * @param request  현재 요청 객체 (HttpServletRequest)
 * @param response 현재 응답 객체 (HttpServletResponse)
 * @param handler  현재 처리기 객체 (Object)
 * @return 요청 처리 여부 (true: 계속 진행, false: 중단)
 * @throws IllegalArgumentException 토큰이 유효하지 않을 경우 발생하는 예외
 */
@Override
public boolean preHandle(HttpServletRequest request,
                          HttpServletResponse response, Object handler) {

    //헤더에서 JWT 토큰 추출
    String token = authExtractor.extract(request, "Bearer");

    //빈 토큰 일 경우 다음으로 이동
    if (StringUtils.isEmpty(token) || "null".equals(token)) {
        return true;
    }

    //JWT 토큰이 유효하지 않는 경우 예외처리
    if (!jwtTokenProvider.validateToken(token)) {
        throw new IllegalArgumentException("요청이 정상적으로 실행되지 않았습니다. 유효하지 않는 토큰입니다.");
    }

    /**
     * TODO : 프로젝트 범위 상 인터셉터를 통해 request에 seqId를 추가하여 권한을 확인하지만 이는 권고되는 방법은 아닙니다.
     * TODO : AOP, Resolver, @RequestHeader 어노테이션 사용 등 다른방식으로 jwt 토큰을 확인하는 것이 좋습니다.
     */
    String seqId = jwtTokenProvider.getSubject(token);
    request.setAttribute("seqId", seqId);
    return true;
}
}
```
또한, `BearerAuthInterceptor`에서 JWT로부터 `userId`가 아닌 `seqId`를 추출하여 컨트롤러에 전달해야합니다.

```java
/**
 * 자유 게시글 정보를 수정하는 메서드입니다.
 *
 * @param seqId 사용자 식별 ID
 * @param boardDTO 수정할 게시글 정보
 * @throws Exception 예외 발생 시
 */

public void updateFreeBoardInfo(int seqId, BoardFreeDTO boardDTO) throws Exception {
    //현재 userSeqId와 게시글 정보에 저장된 userSeqId와 비교
    int getUserSeqId = boardRepository.getFreeBoardDetail(boardDTO.getBoardId()).getUserSeqId();
    if (seqId != getUserSeqId) {
        throw new AppException(ErrorCode.INVALID_PERMISSION, "수정 권한이 없습니다.");
    }

    //게시글 수정
    boardRepository.updateFreeBoardInfo(boardDTO);
    ...
```
이제 JWT에서 추출한 JWT의 seqId와 게시글/댓글을 작성한 seqId를 비교해야합니다.


 위 코드를 예시로 보겠습니다.
`updateFreeBoardInfo`는 자유게시판을 업데이트하는 메소드입니다. 컨트롤러부터 `JWT`에서 추출한 `seqId`와 수정하려는 `board` 정보를 전달받습니다.

이후 `board` 정보에서 `boardId`를 가져오고, `boardId`에 해당하는 데이터를 조회하여 이 게시글을 작성한 사용자의 `seqId`를 가져옵니다.

**위와 같이 seqID로 비교할 경우 과거 탈퇴한 사용자와 신규 사용자가 같은 아이디를 사용하고 있더라도, seqId는 다르기 때문에 해당 게시글/댓글에 대한 권한이 없습니다.**


```sql
<!-- 자유게시판 상세 내용을 조회 -->
<select id="getFreeBoardDetail" parameterType="java.lang.Integer" resultType="BoardFreeDTO">
  SELECT target_board.*,
          target_board.child_code_value as categoryValue,
          cc.child_code_name            AS categoryName,
          u.user_id                     as userId
  FROM free_board AS target_board
            JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
            JOIN users AS u ON target_board.user_seq_id = u.seq_id
  WHERE target_board.board_id = #{boardId}
</select>

<!-- 게시글에 달린 모든 댓글 조회 -->
<select id="getCommentsByBoardId" resultType="CommentDTO">
    SELECT c.*, u.user_id AS userId
    FROM comments AS c
              JOIN users u on c.user_seq_id = u.seq_id
    WHERE c.board_id = #{boardId}
</select>
```
SQL도 변경이 필요합니다.

기존에는 각 테이블의 데이터베이스의 `userId` 컬럼이 게시글/댓글 작성자임을 나타냈었지만, 이제는 사용자의 `seqId`값만 가지고 있기 때문에 사용자 및 관리자 테이블과 `JOIN`하여 `seqId`가 가리키는 `String ID`를 가져와야합니다.

위 변경에 따른 클라이언트 수정은 설명을 생략하겠습니다.

---
### 2. Enum을 활용한 Category Code와 Table Mapping
**[개선 전]**

관리자가 새로운 공지사항 테이블에 대한 카테고리를 관리하기 위해 `category_parent_code`테이블에 `parent_code_value = "notice"`, `parent_code_name ="공지사항 카테고리"`를 추가했다고 가정하겠습니다.

현재 방식은 `parent_code_name`에서 **"공지사항" 문자열**이 포함되어있는 `parent_code_value`를 찾아서 해당 값을 가지고 있는 `category_child_code` 테이블 값들을 공지사항 하위 카테고리라고 판단합니다.
```sql
<!--  공지사항의 카테고리 목록을 조회  -->
<select id="getNoticeBoardCategories" resultType="CategoryDTO">
    SELECT  cc.child_code_name as categoryName ,cc.child_code_value as categoryValue
    FROM category_child_code cc
        JOIN category_parent_code cp ON cc.parent_code_value = cp.parent_code_value
    WHERE cp.parent_code_name LIKE '%공지사항%'
</select>
```
위 같이 하드코딩을 작성하게 된 이유는 결국 관리자가 입력한 `parent_code_value`인 `"notice"`와 `notice_table` 간의 연결관계가 없기 때문입니다.

데이터베이스에 맵핑 테이블을 만들어서 관리해도 되지만 더 간단하게 자바 `enum` class를 통해 연결관계를 표현할 수 있습니다.

```java
/**
 * service > BoardCategory.java
 */

/**
 * 게시글의 카테고리를 정의하는 열거형(Enum) 클래스
 */
@Getter
public enum BoardCategory {
    /**
     * 공지사항 카테고리
     */
    FREE_BOARD("자유게시판", "free"),
    /**
     * 공지사항 카테고리
     */
    NOTICE_BOARD("공지사항", "notice"),

    /**
     * 갤러리게시판 카테고리
     */
    GALLERY_BOARD("갤러리게시판", "gallery"),

    /**
     * 문의게시판 카테고리
     */
    INQUIRY_BOARD("문의게시판", "inquiry");

    /**
     * 카테고리의 부모 코드 테이블 이름
     */
    private final String categoryParentCodeName;

    /**
     * 카테고리의 부모 코드 테이블 값
     */
    private final String categoryParentCodeValue;

    /**
     * BoardCategory 생성자
     *
     * @param categoryParentCodeName 카테고리의 부모 코드 테이블 이름
     * @param categoryParentCodeValue 카테고리의 부모 코드 테이블 값
     */
    BoardCategory(String categoryParentCodeName, String categoryParentCodeValue) {
        this.categoryParentCodeName = categoryParentCodeName;
        this.categoryParentCodeValue = categoryParentCodeValue;
    }

}

```
위와 같이 `enum`을 활용하면 어느 게시판이, 어느 테이블과 관계가 있는지 한눈에 파악하며 관리할 수 있습니다.

예로 공지사항인 `BoardCategory.NOTICE`를 보면 `categoryParentCodeName`에는 "**공지사항**", `categoryParentCodeValue`는 "**notice**"가 맵핑되어있습니다.

```java
/**
 * service > BoardService.java
 */
   
/**
 * 공지사항의 카테고리 목록을 가져옵니다.
 *
 * @return 공지사항의 카테고리 목록
 */
public List<CategoryDTO> getNoticeBoardCategories() {

    BoardCategory categoryParentCode = BoardCategory.NOTICE_BOARD;
    return boardRepository.getNoticeBoardCategories(categoryParentCode.getCategoryParentCodeValue());
}
```

이제 서비스에서 공지사항 카테고리를 가져오는 메소드를 실행시킬 때 
`BoardCategory.NOTICE_BOARD`의 `getCategoryParentCodeValue`인 "`notice`" 라는 값을 넘겨 sql에서 notice table에 관한 카테고리를 찾아야 하는구나를 알 수 있게 됩니다.

```sql
<!--  공지사항의 카테고리 목록을 조회  -->
<select id="getNoticeBoardCategories" parameterType="java.lang.String" resultType="CategoryDTO">
    SELECT cc.child_code_name as categoryName, cc.child_code_value as categoryValue
    FROM category_child_code cc
              JOIN category_parent_code cp ON cc.parent_code_value = cp.parent_code_value
    WHERE cp.parent_code_value = #{categoryParentCodeValue}
</select>
```

sql에서는 `categoryParentCodeValue`인 `"notice"`에 해당하는 값을 알고 있기 때문에 이를 활용하여 하위 카테고리 목록을 가져올 수 있습니다.

이렇게 sql문에 문자열 하드코딩 부분을 enum을 통해 관리하도록 개선함으로써 아래와 같은 장점을 갖을 수 있습니다.

**1. 자동완성, 오타확인, 허용 가능한 값 범위 제한 등 IDE 지원과 코드 안정성을 확보할 수 있습니다.**

**2. 변경 지점을 sql문에서 enum으로 최소화 시킬 수 있습니다.**

---
### 다음으로
다음으로는 변경된 코드를 기반으로 갤러리게시판을 구현해보겠습니다. 자유 게시판과 중복은 최대한 생략하고 이미지 관리, 썸네일, content slider 라이브러리 사용 등 새로 배운 내용을 위주로 포스팅을 진행 할 예정입니다.