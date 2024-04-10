---
title: 문의 게시판 보기
categoreis: project multiboard
tags: [multiboard inquiryboard]
---

> 관리자 페이지는 현재 미구성된 상태입니다. 따라서 아래 관리자 답변은 데이터베이스에 직접 쿼리를 작성하여 넣은 값입니다.

##  문의 게시판 보기
### 화면

<img width="1305" alt="image" src="https://github.com/JeonJe/Multi_Board/assets/43032391/f8e2ac88-d833-45cd-8fd0-32459b03a92b">

문의게시판은 답변은 자유게시판과 댓글한 구조로 되어 있습니다.

```javascript
/**
 * views > boards > free > BoardInquiryView.vue
 */

<div class="bg-light">
  <div
    v-for="reply in boardInfo.boardReplies"
    :key="reply.replyId"
    class="mb-4"
  >
    <div class="d-flex justify-content-between mb-2">
      <div class="mx-2">
        <strong> {{ reply.adminId }} </strong>
              ...
      </div>
    </div>
    <div class="m-2" style="overflow: auto; word-wrap: break-word">
      <p>{{ reply.content }}</p>
    </div>
    <hr />
  </div>
</div>
...
```
관리자가 문의 답변을 작성하는 화면은 현재 없기 때문에 별도 관리자 페이지가 필요합니다.

그 외 자유게시판 보기 포스팅에서 다룬 댓글 구조와 매우 유사하기 때문에 내용은 생략하겠습니다. 

---
### Controller
```java
/**
 * board > BoardController.java
 */

/**
 * 특정 문의 게시글의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 문의 게시글 상세 내용을 담은 API 응답 객체
 */
@GetMapping("/api/boards/inquiry/{boardId}")
ResponseEntity<APIResponse> getInquiryBoardDetail(@PathVariable @NotEmpty int boardId) {
    BoardInquiryDTO inquiryBoard = boardService.getInquiryBoardDetail(boardId);

    APIResponse apiResponse;
    if (ObjectUtils.isEmpty(inquiryBoard)) {
        apiResponse = ResponseBuilder.ErrorWithoutData("해당 정보를 찾을 수 없습니다.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
    } else {
        apiResponse = ResponseBuilder.SuccessWithData("문의게시글 상세 내용입니다.", inquiryBoard);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}

```
`Controller`에서는 확인하고자 하는 boardId를 service로 넘기고 결과값을 반환합니다.



---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 문의 게시판의 상세 내용을 조회하고, 관련된 댓글을 포함하여 반환합니다.
 *
 * @param boardId 게시글 ID
 * @return 문의 게시판 상세 내용
 */
 public BoardInquiryDTO getInquiryBoardDetail(int boardId) {
        BoardInquiryDTO boardDTO = boardRepository.getInquiryBoardDetail(boardId);
        if (ObjectUtils.isEmpty(boardDTO)) {
            return null;
        }
        boardDTO.setPassword(null);
        boardRepository.updateInquiryBoardVisitCount(boardId);

        List<ReplyDTO> replies = replyRepository.getRepliesByBoardId(boardId);
        boardDTO.setBoardReplies(replies);

        return boardDTO;
    }
```
`getInquiryBoardDetail` 에서는 1) boardId에 해당되는 글을 가져오고, 2) 조회수를 1 증가시킨 후 3) boardId에 해당되는 관리자 답변을 가져와 `BoardInquiryDTO` 객체에 담습니다.

비밀번호는 해싱이 되어있긴하지만 클라이언트에서 가지고 있을 필요가 없기 때문에 null값으로 반환하였습니다.

---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 문의 게시글의 상세 내용을 조회
 *
 * @param boardId 게시글 ID
 * @return 문의 게시글 상세 내용
 */
BoardInquiryDTO getInquiryBoardDetail(int boardId);
```

```sql
<!-- 문의 게시글의 상세 정보를 조회하는 쿼리 -->
<select id="getInquiryBoardDetail" parameterType="java.lang.Integer" resultType="BoardInquiryDTO">
    SELECT target_board.*,
            target_board.child_code_value as categoryValue,
            cc.child_code_name            AS categoryName,
            u.user_id                     as userId
    FROM Inquiry_board AS target_board
              JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
              JOIN users AS u ON target_board.user_seq_id = u.seq_id
    WHERE target_board.board_id = #{boardId}

</select>
<!-- 문의 게시글의 방문 횟수를 업데이트하는 쿼리 -->
<update id="updateInquiryBoardVisitCount" parameterType="java.lang.Integer">
    UPDATE inquiry_board
    SET visit_count = visit_count + 1
    WHERE board_id = #{boardId}
</update>
```
문의게시글 관련 `BoardRepository`와 `SQL`쿼리입니다.

```java
/**
 * mapper > ReplyMapper.java
 */

@Mapper
public interface ReplyRepository {
    /**
     * 특정 게시글에 달린 모든 댓글을 조회
     *
     * @param boardId 게시글 ID
     * @return 특정 게시글에 달린 댓글 목록
     */
    List<ReplyDTO> getRepliesByBoardId(int boardId);
    ...

}
```
```sql
<!-- 게시글에 달린 모든 댓글을 조회하는 쿼리 -->
<select id="getRepliesByBoardId" resultType="ReplyDTO">
    SELECT r.*, a.admin_id AS userId
    FROM replies AS r
              JOIN admin a ON r.admin_seq_id = a.seq_id
    WHERE r.board_id = #{boardId}
</select>
```
문의 게시글의 답변을 가져오기위한 `ReplyRepository`와 `SQL`쿼리입니다.


---
## 다음으로 
게시판의 마지막으로 문의 게시글 등록, 삭제, 수정 부분에 대해 확인해보겠습니다. 다른 게시판과 차이점은 게시글 자체에 비밀번호를 설정한다는 것입니다.