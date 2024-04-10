---
title: 문의 게시판 가져오기
categoreis: project multiboard
tags: [multiboard inquiryboard]
---

>프로젝트 코드는 포스팅 이후에도 계속 개선 중입니다. 
>포스팅은 게시판 구현이 어떤 흐름으로 가는지 참고하는 용으로 보시면 좋을 것 같습니다. 
>프로젝트 코드 : **[링크](https://github.com/JeonJe/Multi_Board)**

##  문의 게시판 가져오기

### 화면
<img width="1312" alt="image" src="https://github.com/JeonJe/Multi_Board/assets/43032391/b7cc30b9-2519-490a-948d-cb550bc107fe">
다른 게시판 조회 페이지와 문의 게시판 조회 페이지가 다른 점은 목록에 있습니다. 
관리자 답변이 달린 문의 게시글은 제목에 `(답변완료)`가 나타납니다. 
만약 사용자가 해당 게시글에 4자리 이상의 비밀번호를 설정하였다면 제목 옆에 `자물쇠 모양` 아이콘이 나타납니다.

---
<img width="1324" alt="image" src="https://github.com/JeonJe/Multi_Board/assets/43032391/41c195ca-34a2-4341-8a15-b4007a94b76b">
비밀글 제목을 클릭하면 해당 게시글의 비밀번호를 넣을 수 있는 모달 창이 나타납니다.

```javascript
/**
 * views > boards > gallery > BoardInquiryList.vue
 */

<tbody>
<!-- 문의게시글 -->
<tr v-for="(item, index) in searchBoardList" :key="item.boardId">
    ...
  <td class="text-left">
    <!-- 비밀번호가 있는 문의 게시글 -->
    <div v-if="item.isSecret === 1" class="d-flex align-items-center">
      <div class="list-title" @click="clickSecretBoard(item.boardId)">
        <span>{{ item.title }}</span>
        <span v-if="item.isAnswered === 1"> (답변 완료) </span>
        <span v-if="IsNewBoard(item.createdAt)" class="new-text">
          New
        </span>
      </div>
      <i class="fa-solid fa-lock ml-2"></i>
    </div>
    <!-- 비밀번호가 없는 문의 게시글 -->
    <router-link v-else :to="getBoardDetail(item.boardId)">
      <span class="list-title">{{ item.title }}</span>
      <span v-if="item.isAnswered === 1" class="list-title">
        (답변 완료)
      </span>
      <span v-if="IsNewBoard(item.createdAt)" class="new-text">
        New
      </span>
    </router-link>
  </td>
  ...
</tr>
</tbody>
....
  <b-modal v-model="showModal" title="비밀번호 확인" @ok="handleOk">
    <div>
      <b-form @submit.stop.prevent="handlePasswordSubmit">
        <b-form-input
          v-model="inputPassword"
          ref="passwordInput"
          id="password"
          type="password"
          placeholder="비밀번호"
          :state="passwordState"
        ></b-form-input>
        <b-form-invalid-feedback :state="passwordState">
          <div v-if="passwordState === 'invalidLength'">
            비밀번호를 4자 이상 입력해주세요.
          </div>
          <div v-else-if="passwordState === 'invalidPassword'">
            비밀번호가 틀렸습니다.
          </div>
        </b-form-invalid-feedback>
      </b-form>
    </div>
  </b-modal>
... 

// script
clickSecretBoard(boardId) {
  this.showModal = true;
  this.inputPassword = "";
  this.passwordState = null;
  this.selectedBoardId = boardId;
},
/**
 * 모달 확인 버튼 핸들러 함수입니다.
 * 비밀번호 유효성 검사를 진행하고 처리합니다.
 * @param {bvModalEvent} bvModalEvent - 모달 이벤트 객체
 * @returns {void}
 */
handleOk(bvModalEvent) {
  bvModalEvent.preventDefault();
  this.handlePasswordSubmit();
},
/**
 * 비밀번호 검증 및 처리 함수입니다.
 * 비밀번호의 유효성을 확인하고 상태를 처리합니다.
 * @returns {void}
 */
async handlePasswordSubmit() {
  if (this.inputPassword.length < 4) {
    this.passwordState = "invalidLength";
    return;
  }

  const response = await boardService.checkInquiryBoardPassword(
    this.selectedBoardId,
    this.inputPassword
  );

  if (response) {
    this.$router.push(this.getBoardDetail(this.selectedBoardId));
  } else {
    this.passwordState = "invalidPassword";
  }
},
```
비밀 문의 게시글을 누르면 비밀번호를 입력하는 모달이 나타납니다. 모달에 입력한 비밀번호가 4자 이상이면, 서버로 해당 `게시글 id`와 입력한 `게시글 password`를 전송하여 비밀번호 일치 여부를 반환받습니다.

비밀번호가 설정되어 있지 않는 게시글은 바로 상세보기 페이지로 이동합니다.


---
### Controller

```java
/**
 * controller > BoardController.java
 */

/**
 * 문의 게시글 목록을 검색 조건에 따라 조회합니다.
 *
 * @param searchCondition 검색 조건 DTO
 * @return 검색 조건에 해당하는 문의 게시글 목록과 개수를 담은 API 응답 객체
 */
@GetMapping("/api/boards/inquiry")
ResponseEntity<APIResponse> getInquiryBoardsWitchSearchCondition(@ModelAttribute SearchConditionDTO searchCondition) {
    List<BoardInquiryDTO> searchResult = boardService.searchInquiryBoards(searchCondition);
    int countFreeBoards = boardService.countInquiryBoards(searchCondition);

    BoardSearchResponse boardSearchResponse = BoardSearchResponse.builder()
            .searchInquiryBoards(searchResult)
            .countSearchBoards(countFreeBoards)
            .build();

    APIResponse apiResponse = ResponseBuilder.SuccessWithData("검색조건에 해당하는 자유 게시글 목록입니다.", boardSearchResponse);

    if (countFreeBoards == 0) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}

/**
 * 특정 문의 게시글의 비밀번호를 확인합니다.
 *
 * @param request  HttpServletRequest 객체
 * @param boardId  게시글 ID
 * @param boardDTO 비밀번호 확인을 위한 DTO
 * @return 비밀번호 일치 여부를 담은 API 응답 객체
 */
@PostMapping("/api/auth/boards/inquiry/{boardId}")
public ResponseEntity<APIResponse> checkInquiryBoardPassword(HttpServletRequest request, @PathVariable int boardId,
                                                              @RequestBody BoardInquiryDTO boardDTO) {

    APIResponse apiResponse;

    //boardId 작성자와 userId가 동일하면 true
    boolean isValid = boardService.checkInquiryBoardPassword(boardId, boardDTO);

    if (isValid) {
        apiResponse = ResponseBuilder.SuccessWithData("비밀번호가 맞습니다.", true);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    } else {
        apiResponse = ResponseBuilder.SuccessWithData("비밀번호가 틀렸습니다.", false);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }
}
```
`Controller`에서는 다른 게시판과 동일하게 사용자가 입력한 검색 조건을 전달받아 해당 조건을 만족하는 문의 게시글 목록과 개수를 `Service`에 요청합니다. 반환된 결과들은 `boardSearchResponse`로 묶어 `APIResponse의 data`로 반환합니다.

`checkInquiryBoardPassword` 는 해당 boardId와 password를 전달받아 데이터베이스에 저장된 비밀번호와 비교하는 `checkInquiryBoardPassword` service를 요청합니다.

---
### DTO

```java
/**
 * dto > BoardInquiryDTO.java
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardInquiryDTO {
/**
 * 공지 게시글 ID
 */
private int boardId;

/**
 * 제목
 */
@NotEmpty(message = "제목은 필수 항목입니다.")
@Size(max = 100, message = "제목은 100자 이하로 입력해야 합니다.")
private String title;

/**
 * 내용
 */
@NotEmpty(message = "내용은 필수 항목입니다.")
@Size(max = 4000, message = "내용은 4000자 이하로 입력해야 합니다.")
private String content;

/**
 * 사용자 식별자 아이디
 */
private int userSeqId;

/**
 * 작성일시
 */
private Date createdAt;

/**
 * 방문 횟수
 */
private int visitCount;

/**
 * 카테고리 값
 */
@NotEmpty(message = "카테고리 값은 필수 항목입니다.")
private String categoryValue;

/**
 * 카테고리 이름 (카테고리 목록 조회 시 사용)
 */
private String categoryName;

/**
 * 사용자 아이디
 */
private String userId;
/**
 * 비밀글 여부 (1 : 비밀 글, 0 : 일반 글)
 */
private int isSecret;
/**
 * 답변 여부 (1 : 답변 완료, 0 : 미 답변)
 */

private int isAnswered;
/**
 * 비밀글에 사용되는 비밀번호
 */
private String password;

/**
 * 문의 게시글 답변 리스트
 */
List<ReplyDTO> boardReplies;
}

```
`BoardInquiryDTO` 는 아래와 같은 항목들이 추가로 필요합니다.

1. 비밀글 설정 여부 isSecret
2. 관리자 답변 여부 isAnswered
3. 비밀글 비밀번호 password
4. 문의 게시 답변 리스트  boardReplies

```java
/**
 * dto > ReplyDTO.java
 */

/**
 * 댓글 정보를 담는 DTO
 */
@Data
@Builder

public class ReplyDTO {
/**
 * 답변 번호
 */
private int replyId;

/**
 * 댓글 작성자의 사용자 ID
 */
private int adminSeqId;

/**
 * 댓글 내용
 */
private String content;

/**
 * 댓글 작성 일시
 */
private Date createdAt;

/**
 * 댓글이 속한 게시글의 ID
 */
private int boardId;

/**
 * 답변한 관리자 아이디
 */
private String adminId;
}

```
답변 정보를 담는 `ReplyDTO`는 위와 같이 구성되어 있습니다.


---
### Service

```java
/**
 * service > BoardService.java
 */

/**
 * 검색 조건에 해당하는 문의 게시글 목록을 조회합니다.
 *
 * @param searchParamsDTO 검색 조건 DTO
 * @return 검색 결과 문의 게시글 목록
 */
public List<BoardInquiryDTO> searchInquiryBoards(SearchConditionDTO searchParamsDTO) {
    return boardRepository.searchInquiryBoards(searchParamsDTO);
}

/**
 * 검색 조건에 해당하는 문의 게시글의 개수를 조회합니다.
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 문의 게시글의 개수
 */
public int countInquiryBoards(SearchConditionDTO searchConditionDTO) {
    return boardRepository.countInquiryBoards(searchConditionDTO);
}
/**
 * 문의 게시판의 비밀번호를 확인합니다.
 *
 * @param boardId  게시글 ID
 * @param boardDTO 게시판 정보 DTO
 * @return 비밀번호 일치 여부
 * @throws AppException 비밀번호가 틀렸을 경우 발생하는 예외
 */
public boolean checkInquiryBoardPassword(int boardId, BoardInquiryDTO boardDTO) {
    BoardInquiryDTO boardInfo = boardRepository.getInquiryBoardDetail(boardId);

    String hashedPassword = AuthUtil.hashPassword(boardDTO.getPassword());
    if (!boardInfo.getPassword().equals(hashedPassword)) {
        throw new AppException(ErrorCode.INVALID_PERMISSION, "비밀번호가 틀렸습니다.");
    }
    return true;
}

```
`Service` 중 `checkInquiryBoardPassword`에서는 데이터베이스에 저장된 게시글 비밀번호와 사용자가 입력한 비밀번호가 같지 않으면 `INVALID_PERMISSION` Exception을 발생시킵니다.


---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 검색 조건에 해당하는 문의 게시글 목록을 조회
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 검색 결과 문의 게시글 목록
 */
List<BoardInquiryDTO> searchInquiryBoards(SearchConditionDTO searchConditionDTO);

/**
 * 검색 조건에 해당하는 문의 게시글의 개수를 조회
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 문의 게시글의 개수
 */
int countInquiryBoards(SearchConditionDTO searchConditionDTO);
```

```sql
<!-- 문의 게시글 검색 쿼리 -->
<select id="searchInquiryBoards" parameterType="SearchConditionDTO" resultType="BoardInquiryDTO">
    SELECT target_board.*, cc.child_code_name AS categoryName, u.user_id as userId
    FROM inquiry_board AS target_board
    JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
    JOIN users AS u ON target_board.user_seq_id = u.seq_id
    WHERE 1=1
    <include refid="searchQuery"/>
    <include refid="orderQuery"/>
    LIMIT #{pageSize}
    OFFSET #{offset}
</select>

<!-- 문의 게시글 개수 조회하는 쿼리 -->
<select id="countInquiryBoards" parameterType="SearchConditionDTO" resultType="java.lang.Integer">
    SELECT COUNT(*)
    FROM inquiry_board AS target_board
    WHERE 1=1
    <include refid="searchQuery"/>
</select>
```
`searchInquiryBoard` 쿼리는 반환 형식 `BoardInquiryDTO`에 문의 게시글 답변상태나 비밀글 여부 등의 정보가 모두 있기 때문에 자유 게시글, 갤러리 게시글의 검색 쿼리에 비해 간단합니다.

---
## 어려웠던점
새로운 기능인 비밀번호 모달을 만드는데 시간을 꽤 소요하였습니다. 그 외 나머지 기능은 다른 게시판에서 반복적으로 다루었기 때문에 비교적 수월하게 구현할 수 있었습니다.


---
## 다음으로 
문의 게시글 상세보기 과정에 대해 살펴보겠습니다. 