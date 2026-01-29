---
title: "멀티보드 갤러리게시판 상세 보기: 이미지 슬라이더 구현"
description: "Spring Boot와 Vue.js를 활용한 갤러리게시판 상세 보기 기능, vueper-slides 라이브러리를 활용한 이미지 슬라이더 구현 방법"
categories: project multiboard
tags: [multiboard, 갤러리게시판, 이미지슬라이더, Spring, Vue, vueper-slides, 권한관리, 이미지처리]

---


##  갤러리 게시글 보기
### 화면

![image](https://github.com/JeonJe/Multi_Board/assets/43032391/39894f79-8705-46dd-8b27-e321d077ccee)

갤러리 게시판 상세보기 화면입니다.

자유게시판과 동일하게 현재 로그인 유저의 sequence Id와 게시글 작성자 유저 sequence Id를 비교하여 동일하면 수정, 삭제를 할 수 있는 버튼이 생깁니다. 이 권한을 확인하는 부분은 `자유게시글 보기`와 동일합니다.

자유게시판과 다른점은 첨부파일 다운로드 대신 첨부된 이미지를 [vueper-slides](https://antoniandre.github.io/vueper-slides/)를 활용하여 슬라이드 형태로 나타냅니다.

```javascript
/**
 * views > boards > free > BoardGalleryView.vue
 */

<div v-if="boardInfo.boardImages.length > 0">
  <div class="slide-container">
    <vueper-slides
      3d
      :touchable="false"
      arrows-outside
      bullets-outside
      :slide-ratio="1"
    >
      <vueper-slide
        v-for="(slide, i) in boardImages"
        :key="i"
        :image="getImageURL(slide.fileName)"
        :title="slide.title"
      />
    </vueper-slides>
  </div>
</div>
...
<script>
  /**
   * 이미지의 전체 URL을 생성하는 함수입니다.
   * @param {string} thumbnailPath - 이미지 경로
   * @returns {string} - 이미지의 전체 URL
   */
  getImageURL(imagePath) {
    return `${process.env.VUE_APP_API_SER_URL}${process.env.VUE_APP_API_IMAGE}/${imagePath}`;
  },
...
</script>
```
`vueper-slide`의 `image`에 서버에 저장된 `image path`를 넣어 이미지를 가져옵니다.

---
### Controller
```java
/**
 * board > BoardController.java
 */

/**
 * 현재 사용자가 특정 갤러리 게시글을 수정할 권한이 있는지 확인합니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 게시글 ID
 * @return 권한 여부를 담은 API 응답 객체
 */
@GetMapping("/api/auth/boards/gallery/{boardId}")
public ResponseEntity<APIResponse> hasGalleryBoardEditPermission(HttpServletRequest request, @PathVariable int boardId) {

    APIResponse apiResponse;
    int seqId = AuthUtil.getSeqIdFromRequest(request);

    if (seqId == 0) {
        apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }

    //boardId 작성자와 userId가 동일하면 true
    boolean hasPermission = boardService.hasGalleryBoardEditPermission(seqId, boardId) == 1;

    if (hasPermission) {
        apiResponse = ResponseBuilder.SuccessWithData("게시글 작성자와 동일합니다.", true);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    } else {
        apiResponse = ResponseBuilder.SuccessWithData("게시글 작성자와 동일하지 않습니다.", false);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }
}

/**
 * 특정 갤러리 게시글의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 갤러리 게시글 상세 내용을 담은 API 응답 객체
 */
@GetMapping("/api/boards/gallery/{boardId}")
ResponseEntity<APIResponse> getGalleryBoardDetail(@PathVariable @NotEmpty int boardId) {
    BoardGalleryDTO galleryBoard = boardService.getGalleryBoardDetail(boardId);

    APIResponse apiResponse;
    if (ObjectUtils.isEmpty(galleryBoard)) {
        apiResponse = ResponseBuilder.ErrorWithoutData("해당 정보를 찾을 수 없습니다.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
    } else {
        apiResponse = ResponseBuilder.SuccessWithData("자유게시글 상세 내용입니다.", galleryBoard);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}

```
위 코드를 보시면 앞서 작성한 자유게시판 관련 코드와 중복되는 코드가 많습니다.
설명과 코드의 명확성을 위해 분리하여 작성하였으나 Path Variable에서 Board Type을 식별하여 특정 보드의 서비스를 호출하는 식으로 코드를 작성하면 중복된 코드를 줄일 수 있을 것 입니다.



---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 갤러리게시판의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 갤러리게시판 상세 내용
 */
public BoardGalleryDTO getGalleryBoardDetail(int boardId) {
    BoardGalleryDTO boardDTO = boardRepository.getGalleryBoardDetail(boardId);
    if (ObjectUtils.isEmpty(boardDTO)) {
        return null;
    }

    boardRepository.updateGalleryBoardVisitCount(boardId);
    List<ImageDTO> images = imageRepository.getImagesByBoardId(boardId);
    boardDTO.setBoardImages(images);
    return boardDTO;
}

/**
 * 갤러리게시판 수정 권한 여부를 확인합니다.
 *
 * @param seqId   사용자 식별자 아이디
 * @param boardId 게시글 ID
 * @return 권한 여부 (1: 권한 있음, 0: 권한 없음)
 */
public int hasGalleryBoardEditPermission(int seqId, int boardId) {
    return boardRepository.hasGalleryBoardEditPermission(seqId, boardId);
}
```
`getGalleryBoardDetail` 에서는 1) boardId에 해당되는 글을 가져오고, 2) 조회수를 1 증가시킨 후 3) boardId에 해당되는 이미지들을 가져와 `BoardGalleryDTO` 객체에 담습니다.


---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 갤러리게시판의 상세 내용을 조회
 *
 * @param boardId 게시글 ID
 * @return 갤러리게시판 상세 내용
 */
BoardGalleryDTO getGalleryBoardDetail(int boardId);

/**
 * 갤러리게시판의 조회수를 1 증가
 *
 * @param boardId 게시글 ID
 */
void updateGalleryBoardVisitCount(int boardId);

/**
 * 갤러리게시판 수정 권한 여부를 확인
 *
 * @param seqId   사용자 식별자 아이디
 * @param boardId 게시글 ID
 * @return 권한 여부 (1: 권한 있음, 0: 권한 없음)
 */
int hasGalleryBoardEditPermission(int seqId, int boardId);
```

```sql
<!-- 갤러리 게시글의 상세 정보를 조회하는 쿼리 -->
<select id="getGalleryBoardDetail" parameterType="java.lang.Integer" resultType="BoardGalleryDTO">
    SELECT target_board.*,
            target_board.child_code_value as categoryValue,
            cc.child_code_name            AS categoryName,
            u.user_id                     as userId
    FROM gallery_board AS target_board
              JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
              JOIN users AS u ON target_board.user_seq_id = u.seq_id
    WHERE target_board.board_id = #{boardId}
</select>

<!-- 갤러리 게시글의 방문 횟수를 업데이트하는 쿼리 -->
<update id="updateGalleryBoardVisitCount" parameterType="java.lang.Integer">
    UPDATE gallery_board
    SET visit_count = visit_count + 1
    WHERE board_id = #{boardId}
</update>

<!-- 갤러리 게시글의 편집 권한 여부를 확인하는 쿼리 -->
<select id="hasGalleryBoardEditPermission" resultType="int">
    SELECT COUNT(*) > 0
    FROM gallery_board
    WHERE board_id = #{boardId}
      AND user_seq_id = #{seqId}
</select>
```
`BoardRepository`와 `sql`문입니다.
`category_child_code`와 join하여 해당 게시글의 카테고리 값이 나타내고 있는 카테고리 이름을 가져옵니다. 

또한, `users` 테이블과도 join하여 해당 게시글 작성자의 seq id가 나타내고 있는 `String userId`를 가져옵니다.

---
## 어려웠던점
리스트에서 나타내는 썸네일의 크기 조절과 마찬가지로, `vueper-slide`를 사용하여 이미지를 나타낼 때 크기 조절에 어려움이 있었습니다. vue-per-slide에서 제공하는 옵션만으로 이미지의 크기를 조절하면 이미지의 일부분이 잘리거나 사진이 너무 크게 나타났습니다. 이 부분도 커스텀 css로 크기에 맞게 조절할 수 있었습니다.

```javascript
.slide-container {
  max-width: 400px;
  margin: 0 auto; 
}
```

---
## 다음으로 
갤러리 게시글 등록, 삭제, 수정 부분에 대해 확인해보겠습니다. 자유게시글과 가장 다른점은 게시글에 대한 썸네일을 만들어줘야 하는 부분입니다.