---
title: 자유 게시글 등록/수정/삭제
tags: [multi board, free board]
keywords: multi board, free board
sidebar: mydoc_sidebar
permalink:  multi_board_free_board_write.html
folder: multi_board_project
last_updated: 2023-07-26
---



## 자유게시글 등록/수정/삭제

### 화면
**자유게시글 등록 화면**
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/cd6da150-b4f6-484c-bc00-1e5bf2041d84)
자유게시글 등록화면입니다.

분류는 자유게시판 데이터베이스에서 카테고리 목록을 가져와 드롭다운으로 보여줍니다. 
첨부파일 추가 버튼을 누르게 되면 첨부파일을 추가할 수 있는 버튼이 동적으로 생성됩니다 (최대 5개)


---
**자유 게시글 수정 & 삭제  화면**
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/b112c59c-2440-46f9-8b5d-d5f2e6cbd902)
자유게시글 수정페이지 화면입니다. 

자유게시글 작성자와 JWT 유저ID가 동일하다면 기존 게시글 정보가 불러와지고 해당 정보를 수정할 수 있습니다. 기존 첨부파일은 삭제하거나 다운로드 할 수 있습니다.

게시글 등록, 수정, 삭제는 유사한 부분이 많기 때문에 묶어서 Controller, Service, Mapper를 살펴보겠습니다.


---
### Controller

```java
/**
 * board > BoardController.java
 */

/**
 * 자유 게시글을 저장합니다.
 *
 * @param request   HttpServletRequest 객체
 * @param boardDTO  저장할 게시글 정보
 * @return          API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PostMapping("/api/boards/free")
ResponseEntity<APIResponse> saveFreeBoardInfo(HttpServletRequest request, @Valid @ModelAttribute BoardDTO boardDTO) throws Exception {

    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");

    boardService.saveFreeBoardInfo(userId, boardDTO);

    APIResponse apiResponse = ResponseBuilder.SuccessWithoutData("게시글 저장에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}

/**
 * 자유 게시글을 수정하고 결과를 반환하는 API 메서드입니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 수정할 게시글 ID
 * @param boardDTO 수정할 게시글 정보
 * @return 게시글 수정 결과를 담은 API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PutMapping("/api/boards/free/{boardId}")
public ResponseEntity<APIResponse> updateFreeBoardInfo(HttpServletRequest request, @PathVariable int boardId,
                                                        @Valid @ModelAttribute BoardDTO boardDTO) throws Exception {
            //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");

    boardDTO.setBoardId(boardId);
    boardService.updateFreeBoardInfo(userId, boardDTO);

    APIResponse apiResponse = ResponseBuilder.SuccessWithoutData("게시글 수정에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}

/**
 * 자유 게시글을 삭제하고 결과를 반환하는 API 메서드입니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 삭제할 게시글 ID
 * @return 삭제 결과를 담은 API 응답 객체
 */
@DeleteMapping("/api/boards/free/{boardId}")
public ResponseEntity<APIResponse> deleteFreeBoard(HttpServletRequest request, @PathVariable int boardId) {
    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");

    // 댓글이 남아있는지 확인
    int countBoardComment = commentService.countCommentByFreeBoardId(boardId);
    if (countBoardComment > 0){
        APIResponse apiResponse = ResponseBuilder.ErrorWithoutData("댓글이 남아있어서 삭제가 불가합니다.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiResponse);
    }
    // 첨부파일 삭제 후 게시글 삭제
    attachmentService.deleteAttachmentsByBoardId(boardId);
    boardService.deleteFreeBoard(userId, boardId);

    APIResponse apiResponse = ResponseBuilder.SuccessWithoutData("게시글 삭제에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```
Controller에서 자유게시글 `save`과 `update` 구조가 매우 유사합니다.
`delete`의 경우엔 자유 게시글에 댓글이 남아 있지 않을 경우에만 삭제를 할 수 있습니다.

---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 자유 게시글 정보를 저장합니다.
 *
 * @param boardDTO 저장할 게시글 정보
 * @throws Exception 예외 발생 시
 */
public void saveFreeBoardInfo(String userId, BoardDTO boardDTO) throws Exception {

    if (StringUtils.isEmpty(userId) || !userId.equals(boardDTO.getUserId())) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
    }

    boardRepository.saveFreeBoardInfo(boardDTO);
    List<MultipartFile> newFiles = boardDTO.getUploadAttachments();

    if (newFiles != null) {
        for (MultipartFile file : newFiles) {
            if (!file.isEmpty()) {
                String originName = file.getOriginalFilename();
                String numberedFileName = FileUtil.uploadFile(file, UPLOAD_PATH).getName();
                AttachmentDTO attachmentDTO = AttachmentDTO.builder()
                        .boardId(boardDTO.getBoardId())
                        .fileName(numberedFileName)
                        .originFileName(originName)
                        .build();
                attachmentRepository.saveAttachment(attachmentDTO);
            }
        }
    }
}

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

    //게시글 수정
    boardRepository.updateFreeBoardInfo(boardDTO);

    //첨부파일 수정
    List<Integer> deletedAttachmentIds = boardDTO.getDeletedAttachmentIDs();
    if (deletedAttachmentIds != null){
        for (Integer deletedId : deletedAttachmentIds) {
            String deletedFileName = attachmentRepository.
                    getAttachmentByAttachmentId(deletedId).getFileName();

            //업로드 폴더에서 파일 삭제
            if (deletedFileName != null) {
                File file = new File(UPLOAD_PATH + '/' + deletedFileName);
                if (file.exists()) {
                    file.delete();
                }
            }
            //데이터베이스서 첨부파일 정보 삭제
            attachmentRepository.deleteAttachmentByAttachmentId(deletedId);
        }
    }

    //첨부파일 신규 추가
    List<MultipartFile> newFiles = boardDTO.getUploadAttachments();

    if (newFiles != null) {
        for (MultipartFile file : newFiles) {
            if (!file.isEmpty()) {
                String originName = file.getOriginalFilename();
                String numberedFileName = FileUtil.uploadFile(file, UPLOAD_PATH).getName();
                AttachmentDTO attachmentDTO = AttachmentDTO.builder()
                        .boardId(boardDTO.getBoardId())
                        .fileName(numberedFileName)
                        .originFileName(originName)
                        .build();
                attachmentRepository.saveAttachment(attachmentDTO);
            }
        }
    }
}

/**
 * 자유게시판을 삭제합니다.
 *
 * @param userId  사용자 ID
 * @param boardId 게시글 ID
 */
public void deleteFreeBoard(String userId, int boardId) {
    boardRepository.deleteFreeBoard(userId, boardId);
}

```

Service의 경우 `update`가 로직이 조금 더 복잡합니다. `save`는 데이터베이스에 게시글 정보저장하고, `자유게시판 보기` 포스팅에서 다루었던 `첨부파일 업로드` 로직을 그대로 사용합니다. 

하지만 `update`의 경우엔 데이터베이스 업데이트와 첨부파일 업로드뿐만 아니라, **사용자가 삭제하기 원하는 첨부파일을 upload path와 데이터베이스에서 삭제하는 로직이 추가로 필요합니다.**



---
### Repository & Mapper
```java
/**
 * repository > BoardRepository.java
 */

/**
 * 새로운 자유게시판을 저장합니다.
 * @param boardDTO
 * @return
 */
int saveFreeBoardInfo(BoardDTO boardDTO);

/**
 * 특정 자유게시판을 삭제하는 메서드입니다.
 *
 * @param userId  사용자 ID
 * @param boardId 자유게시판의 ID
 */
void deleteFreeBoard(String userId, int boardId);
/**
 * 자유게시판 정보를 업데이트하는 메서드입니다.
 *
 * @param boardDTO 업데이트할 자유게시판 정보를 담은 BoardDTO 객체
 */
void updateFreeBoardInfo(BoardDTO boardDTO);
```

```sql
<!-- 자유 게시글 저장   -->
<insert id="saveFreeBoardInfo" parameterType="BoardDTO" useGeneratedKeys="true" keyProperty="boardId" >
    INSERT INTO free_board
        (title, content, user_id, created_at, visit_count, child_code_value)
    VALUES(#{title}, #{content},#{userId},now(),0,#{categoryValue})
</insert>

<!-- 자유게시글 삭제 -->
<delete id="deleteFreeBoard">
    DELETE FROM free_board
    WHERE board_id = #{boardId}
    AND user_id = #{userId}
</delete>

<!-- 자유 게시글 수정 -->
<update id="updateFreeBoardInfo" parameterType="BoardDTO">
    UPDATE free_board
    SET title = #{title}, content = #{content}, user_id = #{userId}, child_code_value = #{categoryValue}
    WHERE board_id = #{boardId}
</update>
```
Repository와 Mybatis의 SQL문은 Service에 비해 간단합니다.

`save`에서는`useGeneratedKeys="true" keyProperty="boardId"` 로 기본키를 자동적 생성하고 BoardDTO의 boardId `속성에` 저장 해주었습니다.

---
## 다음으로 
게시글 등록/수정 화면을 하나의 vue에서 처리하다보니 코드가 꽤나 길어지고 복잡해졌습니다. 아직 미비점이 많아 계속해서 부족한 기능을 채워 프로젝트 완성도를 높힐 예정입니다. 

다음으로는 갤러리 게시판 구현으로 바로 들어가지 않고 기존코드에서 `2가지` 부분에 대해 코드를 변경 해보겠습니다.

1. 앞선 포스팅에서 계속 언급한 `String userId`로 사용자의 권한을 확인하던 부분을 `Integer sequenceId`로 변경할 예정입니다.

2. 현재 공지사항(or 자유 게시판) 테이블이 사용하는 카테고리를 아래와 같이 sql 에서 `parent_code_name에서 like`로 찾고 있습니다. 하드코딩 부분을 이 부분을 `enum`을 활용하여 parent_code_name과 각 테이블을 맵핑하는 방식으로 바꿔볼 예정입니다.

```sql
<!--  공지사항의 카테고리 목록을 조회  -->
<select id="getNoticeBoardCategories" resultType="CategoryDTO">
    SELECT  cc.child_code_name as categoryName ,cc.child_code_value as categoryValue
    FROM category_child_code cc
              JOIN category_parent_code cp ON cc.parent_code_value = cp.parent_code_value
    WHERE cp.parent_code_name LIKE '%공지사항%'
</select>

<select id="getFreeBoardCategories" resultType="CategoryDTO">
    SELECT cc.child_code_name as categoryName ,cc.child_code_value as categoryValue
    FROM category_child_code cc
              JOIN category_parent_code cp ON cc.parent_code_value = cp.parent_code_value
    WHERE cp.parent_code_name LIKE '%자유%'
</select>

```


