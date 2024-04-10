---
title: 갤러리 게시판 가져오기
categoreis: project multiboard
tags: [multiboard galleryboard]

---

> 프로젝트 코드는 포스팅 이후에도 계속 개선 중입니다. 
> 포스팅은 게시판 구현이 어떤 흐름으로 가는지 참고하는 용으로 보시면 좋을 것 같습니다. 
> 프로젝트 코드 : **[링크](https://github.com/JeonJe/Multi_Board)**



## 갤러리 게시판 가져오기

### 화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/a55b2896-83e4-4edd-a3b3-f79bf9b8a3a3)

갤러리 게시판 조회 페이지는 공지사항, 자유게시판과 동일하게 1) 검색 조건 입력 부분, 2) 리스트 부분, 3)페이지네이션 부분으로 나누어져 있습니다.
또한, 자유게시판과 동일하게 사용자가 로그인 한 상태라면 우측에 갤러리게시판에 글을 쓸 수 있는 `글 등록` 버튼이 나타납니다.

자유게시판과 다른점은 리스트를 보여줄 때 갤러리 게시글의 첫번째 이미지를 `썸네일` 형태로 보여주는 것입니다.

```javascript
/**
 * views > boards > gallery > BoardGalleryList.vue
 */
<div
  v-for="item in searchBoardList"
  :key="item.boardId"
  class="d-flex border"
>
  <div class="col-md-2 p-2">
    <div class="thumbnail-container">
      <img
        :src="getFullThumbnailURL(item.thumbnailPath)"
        alt="Thumbnail"
        class="thumbnail-image"
      />
    </div>
  </div>
  <div class="col-md-10 mt-4">
    <div class="card-body">
      <h5 class="card-title">
        <router-link :to="getBoardDetail(item.boardId)">
          <span class="list-title">{{ item.title }}</span>
          <span v-if="IsNewBoard(item.createdAt)" class="new-text">
            New
          </span>
        </router-link>
      </h5>

      <p class="card-text">{{ item.content }}</p>
    </div>
  </div>
</div>

....

/**
 * 썸네일 이미지의 전체 URL을 생성하는 함수입니다.
 * @param {string} thumbnailPath - 썸네일 이미지 경로
 * @returns {string} - 썸네일 이미지의 전체 URL
 */
getFullThumbnailURL(thumbnailPath) {
  return `${process.env.VUE_APP_API_SER_URL}${process.env.VUE_APP_API_IMAGE_THUMBNAIL}/${thumbnailPath}`;
},
```
썸네일은 해당 게시글의 썸네일 경로를 서버로부터 받아 img태그의 src로 설정하여 가져올 수 있습니다. 


---
### Controller

```java
/**
 * controller > BoardController.java
 */

/**
 * 갤러리 게시글 목록을 검색 조건에 따라 조회합니다.
 *
 * @param searchCondition 검색 조건 DTO
 * @return 검색 조건에 해당하는 갤러리 게시글 목록과 개수를 담은 API 응답 객체
 */
@GetMapping("/api/boards/gallery")
ResponseEntity<APIResponse> getGalleryBoardsWitchSearchCondition(@ModelAttribute SearchConditionDTO searchCondition) {
    List<BoardGalleryDTO> searchResult = boardService.searchGalleryBoards(searchCondition);
    int countFreeBoards = boardService.countGalleryBoards(searchCondition);

    BoardSearchResponse boardSearchResponse = BoardSearchResponse.builder()
            .searchGalleryBoards(searchResult)
            .countSearchBoards(countFreeBoards)
            .build();

    APIResponse apiResponse = ResponseBuilder.SuccessWithData("검색조건에 해당하는 자유 게시글 목록입니다.", boardSearchResponse);

    if (countFreeBoards == 0) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
```
`Controller`에서는 자유게시글과 동일하게 사용자가 입력한 검색 조건을 전달받아 해당 조건을 만족하는 갤러리게시글 목록과 개수를 `Service`에 요청합니다. 반환된 결과들은 `boardSearchResponse`로 묶어 `APIResponse의 data`로 반환합니다.


---
### DTO

```java
/**
 * dto > BoardGalleryDTO.java
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardGalleryDTO {

  /**
   * 게시글 ID
   */
  private int boardId;

  /**
   * 게시글 제목
   */
  @NotEmpty(message = "제목은 필수 항목입니다.")
  @Size(max = 100, message = "제목은 100자 이하로 입력해야 합니다.")
  private String title;

  /**
   * 게시글 내용
   */
  @NotEmpty(message = "내용은 필수 항목입니다.")
  @Size(max = 4000, message = "내용은 4000자 이하로 입력해야 합니다.")
  private String content;

  /**
   * 게시글 작성자의 사용자 ID
   */
  private int userSeqId;

  /**
   * 게시글 작성일
   */
  private Date createdAt;

  /**
   * 게시글 조회수
   */
  private int visitCount;

  /**
   * 게시글 카테고리 값
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
   * 업로드된 첨부 파일 목록
   */
  private List<ImageDTO> boardImages;

  /**
   * 업로드된 이미지 파일 목록
   */
  private List<MultipartFile> uploadImages;

  /**
   * 삭제할 이미지 ID 목록
   */
  private List<Integer> deletedAttachmentIDs;

  /**
   * 썸네일 파일 경로
   */
  private String thumbnailPath;

  /**
   * 게시글과 연관된 이미지 개수
   */
  private int numOfImages;

}

```
`BoardGalleryDTO` 는 아래와 같은 항목들이 추가로 필요합니다.

1. 기존 업로드된 이미지목록 boardImages
2. 새로 업로드가 필요한 이미지목록 uploadImages
3. 수정 시 삭제 요청된 이미지 목록 deletedAttachmentIDs
4. 해당 게시글 썸네일 경로
5. 대시보드에서 보여 줄 해당 게시글에 첨부된 이미지 개수 numOfImages

```java
/**
 * dto > ImageDTO.java
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImageDTO {
/**
 * 이미지 파일 ID
 */
private int imageId;
/**
 * 서버에 저장된 중복되지 않는 파일명
 */
private String fileName;
/**
 * 사용자가 업로드한 파일의 원본 이름
 */
private String originFileName;
/**
 * 이미지 우선순위
 */
private int priority;

/**
 * 이미지를 포함하는 게시물의 ID
 */
private int boardId;
}
```
`ImageDTO` 는 위와 같이 구성되어 있습니다.

---
### Service

```java
/**
 * service > BoardService.java
 */

/**
 * 검색 조건에 해당하는 갤러리 게시글 목록을 조회합니다.
 *
 * @param searchParamsDTO 검색 조건 DTO
 * @return 검색 결과 갤러리 게시글 목록
 */
public List<BoardGalleryDTO> searchGalleryBoards(SearchConditionDTO searchParamsDTO) {
    return boardRepository.searchGalleryBoards(searchParamsDTO);
}

/**
 * 검색 조건에 해당하는 갤러리 게시글의 개수를 조회합니다.
 *
 * @param searchParamsDTO 검색 조건 DTO
 * @return 갤러리 게시글의 개수
 */
public int countGalleryBoards(SearchConditionDTO searchParamsDTO) {
    return boardRepository.countGalleryBoards(searchParamsDTO);
}
    
```

---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 검색 조건에 해당하는 갤러리 게시글 목록을 조회
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 검색 결과 갤러리 게시글 목록
 */
List<BoardGalleryDTO> searchGalleryBoards(SearchConditionDTO searchConditionDTO);

/**
 * 검색 조건에 해당하는 갤러리 게시글의 개수를 조회
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 갤러리 게시글의 개수
 */
int countGalleryBoards(SearchConditionDTO searchConditionDTO);
```

```sql
<!-- 검색 조건에 해당하는 갤러리 게시글 리스트 조회  -->
<select id="searchGalleryBoards" parameterType="SearchConditionDTO" resultType="BoardGalleryDTO">
    SELECT target_board.*, cc.child_code_name AS categoryName, u.user_id as userId,
        (
        SELECT fileName
        FROM images
        WHERE board_id = target_board.board_id AND priority = 1
        LIMIT 1
        ) AS thumbnailPath
    FROM gallery_board AS target_board
    JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
    JOIN users AS u ON target_board.user_seq_id = u.seq_id
    WHERE 1=1
    <include refid="searchQuery"/>
    <include refid="orderQuery"/>
    LIMIT #{pageSize}
    OFFSET #{offset}
</select>

<!-- 검색 조건에 해당하는 갤러리 게시글의 개수를 조회 -->
<select id="countGalleryBoards" parameterType="SearchConditionDTO" resultType="java.lang.Integer">
    SELECT COUNT(*)
    FROM gallery_board AS target_board
    WHERE 1=1
    <include refid="searchQuery"/>
</select>
```
searchGalleryBoards 쿼리는 갤러리 게시글 정보뿐만 아니라 해당 게시글의 썸네일도 반환을 해주어야 합니다. 썸네일 반환을 위해 `서브쿼리`로 images 테이블에서 해당 게시글의 이미지 중 우선순위가 가장 높은 이미지의 `fileName`을 가져옵니다. 여기서 이미지의 우선순위 숫자가 높을수록 중요도는 높습니다.

---

## 어려웠던점
자유 게시글과 비슷한 부분이 많았으나 썸네일 이미지를 저장하고, 이를 적절한 크기로 화면에 나타나는 부분에서 애를 먹었습니다. 썸네일이 잘리지 않는 상태로 적절하게 화면에 나타내기 위해 아래와 같은 스타일을 사용중입니다.

```javascript
.thumbnail-container {
  height: 100px; 
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain; 
}
```

참고사항으로 썸네일을 보여주기 위해 `WebMvcConfig` 파일에 아래와 같은 설정이 추가적으로 필요합니다.

```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/api/images/thumbnail/**") // 썸네일 접근 URL
            .addResourceLocations("file:/Users/premise/Desktop/github/Java/thumbnail/"); // 서버에서 썸네일을 젖아하고 있는 외부 디렉토리 경로

    registry.addResourceHandler("/api/images/**") // 이미지 접근 URL
            .addResourceLocations("file:/Users/premise/Desktop/github/Java/upload/"); //서버에서 이미지를 저장하고 있는 외부 디렉토리 경로

}

```
`addResourceHandler`를 `addResourceLocations` 통해 썸네일 요청 URL과 썸네일 리소스 위치 맵핑이 필요합니다. 갤러리 게시글의 이미지를 보여줄때도 url과 이미지 리소스 경로 맵핑이 필요합니다.

---
## 다음으로 
갤러리 게시글 상세보기 과정에 대해 살펴보겠습니다. 자유 게시판과 달리 갤러리 게시글은 게시글에 첨부된 이미지를 보여줄 수 있는 기능이 필요합니다. 이 부분은 image slider 라이브러리를 활용하겠습니다.