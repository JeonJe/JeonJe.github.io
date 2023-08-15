---
title: 문의 게시판 등록/수정/삭제
tags: [multi board, inquiry board]
keywords: multi board, inquiry board
sidebar: mydoc_sidebar
permalink:  multi_board_inquiry_board_write.html
folder: multi_board_project
last_updated: 2023-08-15
---


##  문의 게시판 등록/수정/삭제

### 화면
<img width="1350" alt="image" src="https://github.com/JeonJe/Multi_Board/assets/43032391/7fba0a15-b73d-4db9-bec0-245700e21039">
문의 게시글 등록 화면입니다.

비밀글 체크박스에 체크 후 비밀번호를 입력하여 문의 게시글을 등록하면 비밀글로 설정됩니다.

---
<img width="1310" alt="image" src="https://github.com/JeonJe/Multi_Board/assets/43032391/818647ee-fac8-445a-87ea-41d4cf0d9505">

게시글 수정 화면입니다.

기존 저장된 문의 게시글 정보가 나타납니다.

---
### Controller
```java
/**
 * board > BoardController.java
 */

/**
 * 문의 게시글을 저장하고 결과를 반환합니다.
 *
 * @param request  HttpServletRequest 객체
 * @param boardDTO 문의 게시글 정보 DTO
 * @return 게시글 저장 결과를 담은 API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PostMapping("/api/boards/inquiry")
ResponseEntity<APIResponse> saveInquiryBoardInfo(HttpServletRequest request, @Valid @RequestBody BoardInquiryDTO boardDTO) throws Exception {

APIResponse apiResponse;

int seqId = AuthUtil.getSeqIdFromRequest(request);

if (seqId == 0) {
    apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
}
boardService.saveInquiryBoardInfo(seqId, boardDTO);

apiResponse = ResponseBuilder.SuccessWithoutData("게시글 저장에 성공하였습니다.");
return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
/**
 * 특정 문의 게시글을 삭제합니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 게시글 ID
 * @return 게시글 삭제 결과를 담은 API 응답 객체
 */
@DeleteMapping("/api/boards/inquiry/{boardId}")
public ResponseEntity<APIResponse> deleteInquiryBoard(HttpServletRequest request, @PathVariable int boardId) {
//BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
APIResponse apiResponse;
int seqId = AuthUtil.getSeqIdFromRequest(request);

if (seqId == 0) {
    apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
}

// 미 답변일 경우에만 삭제 가능
boardService.deleteInquiryBoard(seqId, boardId);

apiResponse = ResponseBuilder.SuccessWithoutData("게시글 삭제에 성공하였습니다.");
return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}

/**
 * 특정 문의 게시글을 수정하고 결과를 반환합니다.
 *
 * @param request  HttpServletRequest 객체
 * @param boardId  수정할 게시글 ID
 * @param boardDTO 수정할 문의 게시글 정보
 * @return 게시글 수정 결과를 담은 API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PutMapping("/api/boards/inquiry/{boardId}")
public ResponseEntity<APIResponse> updateInquiryBoardInfo(HttpServletRequest request, @PathVariable int boardId,
                                                        @Valid @RequestBody BoardInquiryDTO boardDTO) throws Exception {
//BearerAuthInterceptor 에서 Request에 추출한 JWT로부터 추출한 seqId 포함하여 전달
APIResponse apiResponse;
int seqId = AuthUtil.getSeqIdFromRequest(request);

if (seqId == 0) {
    apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
}

boardDTO.setBoardId(boardId);
boardService.updateInquiryBoardInfo(seqId, boardDTO);

apiResponse = ResponseBuilder.SuccessWithoutData("게시글 수정에 성공하였습니다.");
return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```
`Controller`에서 문의게시글 save, update, delete 입니다. 
delete에서 관리자가 문의게시글에 답변을 하였을 경우엔 삭제가 불가합니다. 그 외엔 자유게시글, 갤러리 게시글과 유사하기 때문에 넘어가겠습니다.


---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 문의 게시글 정보를 저장합니다.
 *
 * @param seqId    사용자 식별자 아이디
 * @param boardDTO 문의 게시글 정보 DTO
 * @throws Exception 예외 발생 시 처리
 */
public void saveInquiryBoardInfo(int seqId, BoardInquiryDTO boardDTO) throws Exception {

if (seqId <= 0) {
    throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
}

if (boardDTO.getIsSecret() == 1 && boardDTO.getPassword().length() < 4) {
    throw new AppException(ErrorCode.BAD_REQUEST, "게시글 비밀번호는 4자 이상입니다.");
}
String hashedPassword = AuthUtil.hashPassword(boardDTO.getPassword());
boardDTO.setPassword(hashedPassword);
boardRepository.saveInquiryBoardInfo(boardDTO);
}

/**
 * 문의 게시판 정보를 수정합니다.
 *
 * @param seqId    사용자 식별자 아이디
 * @param boardDTO 문의 게시판 정보 DTO
 * @throws Exception 예외 발생 시 처리
 */
public void updateInquiryBoardInfo(int seqId, BoardInquiryDTO boardDTO) throws Exception {
    //현재 userSeqId와 게시글 정보에 저장된 userSeqId와 비교
    int getUserSeqId = boardRepository.getInquiryBoardDetail(boardDTO.getBoardId()).getUserSeqId();
    if (seqId != getUserSeqId) {
        throw new AppException(ErrorCode.INVALID_PERMISSION, "수정 권한이 없습니다.");
    }
    String enteredPassword = boardDTO.getPassword();
    if (!StringUtils.isEmpty(enteredPassword)){
        String hashedPassword = AuthUtil.hashPassword(enteredPassword);
        boardDTO.setPassword(hashedPassword);
    }

    boardRepository.updateInquiryBoardInfo(boardDTO);
}

/**
 * 문의 게시판을 삭제합니다.
 *
 * @param seqId   사용자 식별자 아이디
 * @param boardId 게시글 ID
 * @throws AppException 삭제 권한이 없거나 남아있는 답변이 있을 경우 발생하는 예외
 */
public void deleteInquiryBoard(int seqId, int boardId) {
//현재 userSeqId와 게시글 정보에 저장된 userSeqId와 비교

int getUserSeqId = boardRepository.getInquiryBoardDetail(boardId).getUserSeqId();
if (seqId != getUserSeqId) {
    throw new AppException(ErrorCode.INVALID_PERMISSION, "삭제 권한이 없습니다.");
}

if (replyRepository.countRepliesByBoardId(boardId) > 0) {
    throw new AppException(ErrorCode.REMAIN_REPLY, "답변 남아있어서 게시글 삭제가 불가합니다.");
}
boardRepository.deleteInquiryBoard(boardId);
}


```
`save` 시에는 유저 회원가입에서 활용한 패스워드 해싱 메소드 AuthUtil.hashPassword을 사용하여 평문 비밀번호를 해싱하여 저장합니다.

`update`에서는 사용자가 비밀번호를 입력하였을 경우, 해당 비밀번호를 해시하여 업데이트합니다.

`delete`에서는 관리자 답변이 남아있을 경우 `REMAIN_REPLY` Exception을 발생합니다. 커스텀 예외인 `REMAIN_REPLY`은 아래와 같이 사용 하고 있습니다. 
```java
@Getter
@AllArgsConstructor
public enum ErrorCode {

    /**
     * 409 CONFLICT : Resource 의 현재 상태와 충돌
     */
    ...
    REMAIN_REPLY(HttpStatus.CONFLICT, "댓글이 남아있어 삭제가 불가합니다"),
```


---
### Repository & Mapper
```java
/**
 * repository > BoardRepository.java
 */

/**
 * 새로운 문의 게시글을 저장
 *
 * @param boardInquiryDTO 문의 게시글 정보 DTO
 */
void saveInquiryBoardInfo(BoardInquiryDTO boardInquiryDTO);

/**
 * 문의 게시글의 조회수를 1 증가
 *
 * @param boardId 게시글 ID
 */
void updateInquiryBoardVisitCount(int boardId);

/**
 * 문의 게시글을 삭제합니다.
 *
 * @param boardId 게시글 ID
 */
void deleteInquiryBoard(int boardId);

```

```sql
<!-- 문의 게시글 저장 -->
<insert id="saveInquiryBoardInfo" parameterType="BoardInquiryDTO" useGeneratedKeys="true" keyProperty="boardId">
    INSERT INTO inquiry_board
    (title, content, user_seq_id, created_at, visit_count, is_secret, is_answered, password, child_code_value)
    VALUES (#{title},
            #{content},
            (SELECT seq_id FROM users WHERE user_id = #{userId}),
            now(),
            0,
            #{isSecret},
            0,
            #{password},
            #{categoryValue})
</insert>

<!-- 문의 게시글 정보를 업데이트하는 쿼리 -->
<update id="updateInquiryBoardInfo" parameterType="BoardInquiryDTO">
    UPDATE inquiry_board
    SET title            = #{title},
        content          = #{content},
        child_code_value = #{categoryValue}
        <if test="password != null">
            , password = #{password}
            , is_secret = 1
        </if>
        <if test="password == null">
            , is_secret = 0
        </if>
    WHERE board_id = #{boardId}
</update>

<!-- 문의 게시글 삭제하는 쿼리 -->
<delete id="deleteInquiryBoard">
    DELETE
    FROM inquiry_board
    WHERE board_id = #{boardId}
</delete>
```

게시글 저장 시엔 앞선 게시글과 동일하게 `String userId`에 해당하는 `user sequence id`를 서브쿼리로 가져와 해당 값을 `user_seq_id`에 넣습니다.
만약 게시글 수정 시 비밀글 체크를하지 않았다면 is_secret 값을 0으로 업데이트합니다.


---

## 다음으로 
계획했던 공지게시판, 자유게시판, 갤러리게시판, 문의게시판 구현을 완료하였습니다. 다음으로 각 게시판 최근 게시글을 볼 수 있는 대시보드 화면을 간단히 살펴보고 프로젝트의 미비점과 개선사항을 점검해보겠습니다.
