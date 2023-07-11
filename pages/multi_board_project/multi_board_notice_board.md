---
title: 공지사항 구현
tags: [multi board, notice board]
keywords: multi board, notice board
sidebar: mydoc_sidebar
permalink:  multi_board_notice_board.html
folder: multi_board_project
last_updated: 2023-07-11
---

{% include note.html content='
프로젝트 요구조건 상 사용자는 공지사항 게시글을 작성할 수 없기 때문에 이번 포스팅에는 공지사항 리스트 보기, 상세 보기 내용만 있습니다. 게시글 추가/수정/삭제는 자유게시판,갤러리게시판,문의사항에서 다루도록 하겠습니다. *(+ 화면 꾸미기는 기능 구현 완료 후 진행하겠습니다.)*
' %}

## 공지사항 리스트

### 화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/d6192576-17fc-45dd-a522-ae23f7b56cc0)<br/>

공지사항 리스트 페이지는 크게 3가지 부분으로 나누어져 있습니다.
1. 상단에는 게시글 검색 조건을 입력할 수 있는 `SearchForm` 컴포넌트입니다.
2. 중단에는 검색 조건에 따른 공지사항 게시글 목록입니다.
3. 하단에는 검색 결과를 나누어 보여주는 `BoardPagination` 컴포넌트입니다.

하나씩 살펴보도록 하겠습니다.

---
### 검색조건
검색 조건을 입력하는 `SearchForm`은 공지사항뿐만 아니라 자유게시판, 갤러리게시판, 문의게시판에서도 사용되기 때문에 컴포넌트로 분리하였습니다.

 이 컴포넌트에서는 1)시작일, 2)종료일 3)카테고리 4) 검색어 입력 후 `검색버튼`을 누르면 부모 컴포넌트로 현재 검색조건 값들이 `emit`됩니다. 
 
 또한, 1) OO개씩 보기, 2)OO기준으로 정렬, 3)OO차순 정렬은 값이 `변경`될 때마다 검색조건 값들이 `emit`됩니다.

 이렇게 `emit`된 검색 조건을 `BoardNoticeList`를 보여주는 vue에서 받아 서버로 검색 조건에 맞는 리스트를 요청합니다.

<br/>
`주의할 점`은 공지사항의 카테고리 목록이 검색 컴포넌트 안에서 `의존` 되어서는 안됩니다. 카테고리 목록을 `props`로 전달해, 받은 목록을 `select-option`을 보여주어야 게시판에 의존되지 않게 카테고리 목록을 보여줄 수 있습니다.

```javascript
/**
 * boards > notice > BoardNoticeList.vue
 */
  <!-- 게시판 카테고리를 pros로 전달 -->
  <SearchForm
    :categories="categories"
    @emitSearchContion="updateSearchCondition"
  />
  ...
  export default {
  /**
   * 컴포넌트 등록 
   */
  components: {
    SearchForm,
    BoardPagination,
  },
  ...
```
위 코드처럼 검색조건을 입력할 수 있는 컴포넌트를 사용할 때 `props`로 게시판 카테고리 목록을 전달합니다.
`@emitSearchCondtion`은 자식이 `emitSearchContion` 이벤트를 `emit`하면 `updateSearchCondition` 메소드를 실행시킵니다.

```javascript
/**
 * components > SearchForm.vue
 */
<select v-model="searchCondition.categoryName" class="form-control">
  <option
    v-for="categoryOption in categoryOptions"
    :key="categoryOption.value"
    :value="categoryOption.value"
  >
    {{ categoryOption.label }}
  </option>
</select>

<script>
...

export default {
  props: {
    categories: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      /**
       * 검색 조건을 담는 객체
       */
      searchCondition: this.createDefaultSearchCondition(),
    };
  },
  computed: {
    /**
     * 카테고리 select-option 목록을 생성합니다.
     */
    categoryOptions() {
      const defaultOption = { value: "", label: "전체" };
      const options = this.categories.map((category) => ({
        value: category,
        label: category,
      }));
      return [defaultOption, ...options];
    },
  },  
  mounted() {
    // 컴포넌트가 마운트되면 기본 검색 조건을 이벤트로 전달합니다.
    this.$emit("emitSearchContion", this.searchCondition);
  },
```
props를 사용하기 위해 `props`에 `type`과 `default`를 명시하였습니다. 목록에 따른 select-option목록을 동적으로 만들기 위해 `computed`에서 `categoryOptions` 메소드를 활용하였습니다.

---
### 공지사항 리스트 
검색 버튼을 누르거나, 검색 조건이 변경 되었으면 자식에서 `emitSearchContion`이벤트를 `emit`하게 됩니다. 리스트 페이지 vue에서는 해당 이벤트를 수신하고, 새로운 검색 조건을 서버로 전달하여 조건에 맞는 공지사항 리스트를 요청합니다.
```javascript
/**
 * boards > notice > BoardNoticeList.vue
 */
/**
 * 검색 조건을 업데이트하고 공지사항 목록을 가져오는 함수입니다.
 * @param {Object} searchCondition - 업데이트할 검색 조건 데이터
 */
updateSearchCondition(searchCondition) {
  this.searchCondition = searchCondition;
  this.getNoticeBoardList();
},
/**
 * 공지사항 목록을 가져오는 비동기 함수입니다.
 */
async getNoticeBoardList() {
  try {
    const response = await boardService.getNoticeBoardList(
      this.searchCondition
    );
    if (response === "") {
      alert("표시 할 공지사항이 없습니다.");
    } else {
      this.searchBoardList = response.data.searchNoticeBoards;
      this.markNoticedBoardList = response.data.markNoticedBoards;
      this.countMarkNoticedBoards = response.data.countMarkNoticedBoards;
      this.totalPosts = response.data.countNoticeBoards;
      this.totalPages = Math.ceil(
        this.totalPosts / this.searchCondition.pageSize
      );
    }
  } catch (error) {
    console.log(error);
  }
},
/**
 * 공지 게시판 카테고리를 가져옵니다.
 */
async getNoticeBoardCategories() {
  try {
    const response = await boardService.getNoticeBoardCategories();
    if (response === "") {
      alert("카테고리 목록이 없습니다.");
    } else {
      this.categories = response.data;
      this.getNoticeBoardList();
    }
  } catch (error) {
    console.log(error);
  }
},
```
만약 표시할 공지사항 목록이 없으면, `alert`를 띄웁니다. 

반대로 표시할 공지사항이 있다면, 목록을 페이지에 그려줍니다.
공지사항은 두 가지 유형이 있습니다.
1. 관리자가 공지사항을 작성할 때 알림글로 `체크한` 공지사항
2. 관리자가 공지사항을 작성할 때 알림글로 `체크하지 않은` 공지사항

만약 알림글로 체크가 되었다면, 별도로 `markNoticedBoardList`에 리스트가 담기게 됩니다.

이 표시된 알림글들은 사용자가 입력한 검색 조건과 별개로 공지사항 리스트의 상단에 계속 표시가 됩니다. 현재 프로젝트에서는 페이지네이션을 통해 페이지를 옮겨도 리스트의 상단에 알림글이 계속 표시가 되도록 구현되어 있습니다.


```javascript
/**
 * services > board-service.js
 */

/**
 * 공지사항 목록을 가져오는 함수입니다.
 *
 * @param {object} searchCondition - 검색 조건
 * @returns {Promise} - 공지사항 목록을 담은 Promise 객체
 */
const getNoticeBoardList = async (searchCondtion) => {
  try {
    const response = await api.get(process.env.VUE_APP_API_BOARD_NOTICE, {
      params: searchCondtion,
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
```
service의 검색 조건에 따른 공지사항 목록을 요청하는 함수입니다.


---
### 페이지네이션
페이지네이션도 검색 조건을 입력하는 폼과 마찬가지로 공지사항 외 게시판에서 사용될 수 있기 때문에 컴포넌트로 분리하였습니다.

```javascript
/**
 * boards > notice > BoardNoticeList.vue
 */
<BoardPagination
      :currentPage="searchCondition.currentPage"
      :totalPages="totalPages"
      @clickPagination="updatePagination"
    />
  
...

/**
 * 페이지네이션을 업데이트하는 함수입니다.
 * @param {number} page - 업데이트할 페이지 번호
 */
updatePagination(page) {
  this.searchCondition.currentPage = page;
  this.searchCondition.offset = (page - 1) * this.searchCondition.pageSize;
  this.getNoticeBoardList();
},
```
컴포넌트에서 props로 `1) 현재 페이지 번호`와 `검색조건을 만족하는 게시글 수`를 `현재 페이지크기`로 나눈 `2) 총 페이지 수` 를 전달받고, 컴포넌트로부터 `clickPagination` `emit`을 수신할 때 `updatePagination`를 호출합니다.


![페이지네이션](https://github.com/JeonJe/Multi_Board/assets/43032391/87920dbf-bdf4-484f-89e4-6c5623c8e811)

```javascript

export default {
  props: {
    /**
     * 현재 페이지 번호
     */
    currentPage: {
      type: Number,
      required: true,
    },
    /**
     * 총 페이지 수
     */
    totalPages: {
      type: Number,
      required: true,
    },
  },
  methods: {
    /**
     * 페이지 링크 클릭 이벤트를 처리합니다.
     *
     * @param {number} page - 이동할 페이지 번호
     */
    clickPagination(page) {
      this.$emit("clickPagination", page);
    },
  },
};
```

페이지네이션은 현재 페이지 번호에 따라 페이지네이션 처리하도록 구현하였습니다.


---
### Controller

```java
/**
 * controller > BoardController.java
 */
/**
 * 공지 게시판의 카테고리 목록을 가져옵니다.
 * @return API 응답 객체
 */
@GetMapping("/api/boards/notice/categories")
ResponseEntity<APIResponse> getNoticeBoardCategories(){
    List<String> categories = boardService.getNoticeBoardCategories();

    APIResponse apiResponse = ResponseUtil.SuccessWithData("공지사항 카테고리 목록입니다.", categories);
    if (ObjectUtils.isEmpty(categories)) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
```
공지사항 카테고리 목록을 반환하는 컨트롤러입니다. 서비스에서 카테고리 목록을 조회하고, `APIResponse`에 담아 반환합니다. 만약 카테고리가 존재하지 않다면, `NO_CONTENT`로 반환합니다.

```java
/**
 * 검색 조건에 해당하는 공지 게시글 목록을 가져옵니다.
 *
 * @param searchCondition 검색 조건 객체
 * @return API 응답 객체
 */
@GetMapping("/api/boards/notice")
ResponseEntity<APIResponse> getNoticeBoardsWitchSearchCondition(@ModelAttribute SearchConditionDTO searchCondition) {
    List<NoticeBoard> searchResult = boardService.searchNoticeBoards(searchCondition);
    int countNoticeBoards = boardService.countNoticeBoards(searchCondition);

    List<NoticeBoard> markedNoticedBoards = boardService.getMarkedNoticedBoards();
    int countMarkedNoticedBoards = boardService.countMarkedNoticedBoards();

    BoardSearchResponse boardSearchResponse = BoardSearchResponse
            .builder()
            .searchNoticeBoards(searchResult)
            .countNoticeBoards(countNoticeBoards)
            .markNoticedBoards(markedNoticedBoards)
            .build();

    APIResponse apiResponse = ResponseUtil.SuccessWithData("검색조건에 해당하는 공지 게시글 목록입니다.", boardSearchResponse);

    if (countNoticeBoards == 0 && countMarkedNoticedBoards == 0) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
```

검색 조건에 따른 공지사항 목록과 알림글 표시가 된 공지사항 목록을 반환하는 컨트롤러입니다.
1. `searchNoticeBoards` 메소드를 통해 검색조건에 해당하는 공지사항을 가져옵니다. 이 목록에서는 알림글 체크가 된 공지게시글은 포함되지 않습니다. 
2. `countNoticeBoards` 메소드를 통해 검색 조건에 해당하는 공지사항 게시글의 개수를 확인합니다.
3. `markedNoticedBoards` 메소드를 통해 알림글 체크가 된 공지게시글 목록을 가져옵니다.
4. `countMarkedNoticedBoards` 메소드르르 통해 알림글 체크가 된 공지게시글 개수를 가져옵니다.

APIResponse에 위 데이터들을 일괄적으로 담기 위해 `BoardSearchResponse를` 만들어 Builder로 각 값을 넣어주었습니다.
만약 보여줄 공지사항이 하나도 없다면 `NO-CONTENT`로 반환하며, 하나라도 존재한다면 `OK`로 `BoardSearchResponse`를 담아 반환합니다.



---
### DTO
```java
@Data
public class SearchConditionDTO {
    /**
     * 검색할 카테고리의 이름
     */
    private String categoryName;

    /**
     * 검색 키워드
     */
    private String searchText;

    /**
     * 검색 시작 날짜
     */
    private LocalDate startDate;
    
    /**
     * 검색 종료 날짜
     */
    private LocalDate endDate;
    
    /**
     * 페이지 사이즈
     */
    private Integer pageSize;
    
    /**
     * 현재페이지
     */
    private Integer currentPage;

    /**
     * 페이지 offset
     */
    private Integer offset;
    
    /**
     * 정렬 기준(예 : 등록 일시)
     */
    private String sortCriteria;
    
    /**
     * 정렬 순서(예 desc ..)
     */
    private String orderBy;
}

```
검색 조건을 전달하는 `searchConditionDTO`입니다.

---
### Service
```java
/**
 * service > BoardService.java
 */

@Service
@RequiredArgsConstructor
public class BoardService {
    /**
     * 게시글 저장소 객체
     */
    private final BoardRepository boardRepository;

    /**
     * 검색 조건에 해당하는 공지 게시글 목록을 조회합니다.
     *
     * @param searchParamsDTO 검색 조건 DTO
     * @return 공지 게시글 목록
     */
    public List<NoticeBoard> searchNoticeBoards(SearchConditionDTO searchParamsDTO) {
        return boardRepository.searchNoticeBoards(searchParamsDTO);
    }

    /**
     * 검색 조건에 해당하는 공지 게시글의 개수를 조회합니다.
     *
     * @param searchConditionDTO 검색 조건 DTO
     * @return 공지 게시글의 개수
     */
    public int countNoticeBoards(SearchConditionDTO searchConditionDTO) {
        return boardRepository.countNoticeBoards(searchConditionDTO);
    }

    /**
     * 알림 표시된 공지 게시글 목록을 조회합니다.
     *
     * @return 알림 표시된 게시글 목록
     */
    public List<NoticeBoard> getMarkedNoticedBoards() {
        return boardRepository.getMarkedNoticedBoards();
    }

    /**
     * 알림 표시된 공지 게시글의 개수를 조회합니다.
     *
     * @return 알림 표시된 게시글의 개수
     */
    public int countMarkedNoticedBoards() {
        return boardRepository.countMarkedNoticedBoards();
    }

    /**
     * 공지사항의 카테고리 목록을 가져옵니다.
     *
     * @return 공지사항의 카테고리 목록
     */
    public List<String> getNoticeBoardCategories() {
        return boardRepository.getNoticeBoardCategories();
    }

}
```
`BoardService` 부분입니다 

---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */
@Mapper
public interface BoardRepository {
  /**
   * 검색 조건에 해당하는 공지 게시글 목록을 조회합니다.
   *
   * @param searchConditionDTO 검색 조건 DTO
   * @return 검색 결과 공지 게시글 목록
   */
  List<NoticeBoard> searchNoticeBoards(SearchConditionDTO searchConditionDTO);

  /**
   * 검색 조건에 해당하는 공지 게시글의 개수를 조회합니다.
   *
   * @param searchConditionDTO 검색 조건 DTO
   * @return 공지 게시글의 개수
   */
  int countNoticeBoards(SearchConditionDTO searchConditionDTO);

  /**
   * 알림 표시된 공지 게시글 목록을 조회합니다.
   *
   * @return 알림 표시된 게시글 목록
   */
  List<NoticeBoard> getMarkedNoticedBoards();

  /**
   * 알림 표시된 공지 게시글의 개수를 조회합니다.
   *
   * @return 알림 표시된 공지 게시글의 개수
   */

  int countMarkedNoticedBoards();

  /**
   * 공지사항의 카테고리 목록을 가져옵니다.
   *
   * @return 카테고리 목록
   */
  List<String> getNoticeBoardCategories();

}


```
`BoardRepository` 부분입니다.

```sql
<sql id = "searchQuery">
    AND is_noticed = 0
    <if test="searchText != null and searchText != ''">
        AND (title LIKE concat('%', #{searchText}, '%')
        OR content LIKE concat('%', #{searchText}, '%'))
    </if>
    <if test="categoryName != null and categoryName != ''">
        AND nb.child_code_value IN (
        SELECT cc.child_code_value FROM category_child_code AS cc WHERE cc.child_code_name = #{categoryName}
        )
    </if>
    AND created_at BETWEEN #{startDate} AND DATE_ADD(#{endDate}, INTERVAL 1 DAY)
</sql>

<!-- user_id로 사용자 정보를 조회 -->
<select id="searchNoticeBoards" parameterType="SearchConditionDTO" resultType="NoticeBoard">
    SELECT nb.*, cc.child_code_name AS categoryName
    FROM notice_board AS nb
    JOIN category_child_code AS cc ON nb.child_code_value = cc.child_code_value
    WHERE 1=1
    <include refid="searchQuery" />
    ORDER BY
    <choose>
        <when test="sortCriteria == 'createdAt'">
              nb.created_at
        </when>
        <when test="sortCriteria == 'title'">
            nb.title
        </when>
        <when test="sortCriteria == 'visitCount'">
            nb.visit_count
        </when>
        <otherwise>
            nb.created_at
        </otherwise>
    </choose>
    <if test="orderBy == 'desc'">
        DESC
    </if>
    <if test="orderBy == 'asc'">
        ASC
    </if>
    LIMIT #{pageSize}
    OFFSET #{offset}
</select>

<!-- 검색 조건에 해당하는 공지 게시글의 개수를 조회 -->
<select id="countNoticeBoards" parameterType="SearchConditionDTO" resultType="java.lang.Integer">
    SELECT COUNT(*)
    FROM notice_board AS nb
    WHERE 1=1
    <include refid="searchQuery" />
</select>

<!-- 알림 표시된 공지 게시글 목록을 조회 -->
<select id="getMarkedNoticedBoards" resultType="NoticeBoard">
    SELECT nb.*, cc.child_code_name AS categoryName
    FROM notice_board AS nb
    JOIN category_child_code AS cc ON nb.child_code_value = cc.child_code_value
    WHERE is_noticed = 1
</select>

<!-- 알림 표시된 공지 게시글의 개수를 조회 -->
<select id="countMarkedNoticedBoards" resultType="java.lang.Integer">
    SELECT COUNT(*)
    FROM notice_board
    WHERE is_noticed = 1
</select>

<!--  공지사항의 카테고리 목록을 조회  -->
<select id="getNoticeBoardCategories" resultType="java.lang.String">
    SELECT cc.child_code_name
    FROM category_child_code cc
    JOIN category_parent_code cp ON cc.parent_code_value = cp.parent_code_value
    WHERE cp.parent_code_name LIKE '%공지사항%'
</select>
```
`Mapper` 부분입니다.

`검색 조건`은 리스트를뿐만 아니라 개수를 구할 때도 동일하게 사용하기 때문에 `<include refid=""/>`를 사용하여 코드 중복을 줄였습니다.

정렬 기준과 정렬 순서는 들어온 값을 확인하여 SQL을 만들 수 있도록 작성하였습니다. 

<br/>
이제 카테고리 관련하여 쿼리를 살펴보겠습니다.

공지사항 테이블에서 category에 대한 `value`값만 가지고 있기 때문에 `category_child_code` 테이블과 `JOIN`하여 해당 `child_code_value`가 나타내는 `카테고리 이름(child_code_name)`을 같이 반환할 수 있도록 쿼리를 작성하였습니다. 


{% include note.html content='
**공지사항 게시판에서 나타낼 수 있는 카테고리 목록**은 `category_parent_code` 테이블의 `parent_code_name`에 `공지사항`이라는 문자열이 포함되어 있다면 해당 코드는 `공지사항` 테이블에서 사용되는 코드로 판단하도록 구현하였습니다.<br/>

 이 부분 구현은 각 테이블이 어떤 `parent_code`를 쓰는지 맵핑하여 확인하는 방법도 있지만, 이번 프로젝트에서는 간단하게 각 게시판의 이름이 `parent_code_name`에 포함되어 있다면 해당 코드를 사용하는 것으로 구현하였습니다. 
' %}


---
### 결과

![카테고리 검색](https://github.com/JeonJe/Multi_Board/assets/43032391/267233c2-8cdc-4361-9314-aef16b5471b4)<br/>
공지사항의 카테고리 목록을 가져오고, `B`라는 카테고리를 선택하여 검색한 결과화면입니다.
알림으로 `체크된 공지`를 2개는 항상 리스트에 나타나고, 1개의 B카테고리가 검색되어 나타난 것을 확인할 수 있습니다.


![검색조건](https://github.com/JeonJe/Multi_Board/assets/43032391/fccb9a49-144f-4415-9a09-e9513cb26d30)<br/>
20개씩보기, 등록일시로 오름차순 정렬한 결과 화면입니다.
공지 게시글이 선택한 조건대로 정렬되어 나타나는 것을 확인할 수 있습니다.


![페이지네이션](https://github.com/JeonJe/Multi_Board/assets/43032391/bf08e8d2-1f81-4501-aa4e-553b323854f9)<br/>
페이지네이션 번호를 클릭하여 페이지네이션도 잘 동작하는 것을 확인합니다.


---
## 공지 게시글 상세보기 
### 화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/428a1b0f-10d0-4bd5-be19-4fadbef2d2d6)<br/>

공지사항 제목을 눌렀을 때 공지사항 상세 페이지로 이동한 화면입니다.

조회수가 1증가하였으며, 목록버튼을 누르면 이전 게시글 검색 조건을 유지하며 리스트로 되돌아갑니다.

---
### Controller
```java
controller > BoardController.java
/**
 * 공지사항의 상세 내용을 가져옵니다.
 *
 * @param boardId 게시글 ID
 * @return API 응답 객체
 */
@GetMapping("/api/boards/notice/{boardId}")
ResponseEntity<APIResponse> getNoticeBoardDetail(@PathVariable @NotEmpty int boardId) {
    NoticeBoard noticeBoard = boardService.getNoticeBoardDetail(boardId);

    APIResponse apiResponse = ResponseUtil.SuccessWithData("공지사항 상세 내용입니다.", noticeBoard);
    if (ObjectUtils.isEmpty(noticeBoard)) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
```
Controller에서는 `boardId`를 `PathVariable`로 가져와 해당 게시글의 정보를 가져옵니다. 

만약 해당 게시글 내용이 존재하지 않는다면 `NO_CONTENT` 상태로 반환하며, 존재한다면 `OK` 상태로 게시글 내용과 함께 반환합니다.

---
### DTO
```java

@Data
public class NoticeBoard {
    /**
     * 공지 게시글 ID
     */
    private int boardId;

    /**
     * 제목
     */
    private String title;

    /**
     * 내용
     */
    private String content;

    /**
     * 작성자 ID
     */
    private String userId;

    /**
     * 작성일시
     */
    private Date createdAt;

    /**
     * 방문 횟수
     */
    private int visitCount;

    /**
     * 알림 여부 (1: 알림 표시, 0: 알림 미표시)
     */
    private int isNoticed;

    /**
     * 카테고리 값
     */
    private String categoryName;

}

```
`NoticeBoard VO`에 게시글을 나타날 때 필요한 정보들을 담아서 사용합니다.


---
### Service
```java
/**
 * service > BoardService.java
 */
/**
 * 공지사항의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 공지사항의 상세 내용
 */
public NoticeBoard getNoticeBoardDetail(int boardId) {
  boardRepository.updateNoticeBoardVisitCount(boardId);
  return boardRepository.getNoticeBoardDetail(boardId);
}
```
`BoardService`에서는 `boardId`의 조회수를 증가시키고, 게시글 내용을 반환합니다.


---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 공지사항의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 공지사항의 상세 내용
 */
NoticeBoard getNoticeBoardDetail(int boardId);

/**
 * 공지사항의 조회수를 1 증가시킵니다.
 * @param boardId 게시글 ID
 */
void updateNoticeBoardVisitCount(int boardId);
```

```sql
<!-- 공지사항의 상세 내용을 조회 -->
<select id="getNoticeBoardDetail" parameterType="java.lang.Integer" resultType="NoticeBoard">
    SELECT nb.*, cc.child_code_name AS categoryName
    FROM notice_board AS nb
    JOIN category_child_code AS cc ON nb.child_code_value = cc.child_code_value
    WHERE nb.board_id = #{boardId}
</select>

<!-- 공지 게시글의 방문수를 1 증가 -->
<update id="updateNoticeBoardVisitCount" parameterType="java.lang.Integer">
    UPDATE notice_board
    SET visit_count = visit_count + 1
    WHERE board_id = #{boardId}
</update>
```
공지사항의 상세 내용을 조회 시, `notice_board` 테이블에는 `child_code_value` 값만 있기 때문에 `category_child_code` 테이블과 조인하여 `child_code_value`에 해당하는 `child_code_name`을 가져와야 합니다.

 쿼리에서 `child_code_name`은 `cateogryName`으로 `Alias`하여 `NoticeBoard` 객체의 `categoryName`과 자동으로 맵핑될 수 있게합니다. 
 
 이제 해당 게시글의 카테고리 정보까지 가져올 수 있게 되었습니다.

---
## 어려웠던점

### 재사용
검색조건 컴포넌트 SearchForm과 페이지네이션 컴포넌트 BoardPagination은 다른 게시판에서도 
사용이 되어야 하기 때문에 이를 `재사용`할 수 있도록 컴포넌트화가 필요하였습니다. 

어렵다고 느낀 이유는 `props을 중간에 변경하여 기존 element 변경하는 것이 불가능하다`는 내용을 `자식 컴포넌트에서 부모 컴포넌트로 데이터 전달이 불가능하다`로 착각하고 있었기 때문입니다. React를 활용한 프로젝트에서 학습한 내용과 헷갈린 부분이 있었습니다.

이 부분에 대해서 다시 학습을 하여 자식 컴포넌트에서 콜백함수나, 이벤트를 통해 부모 컴포넌트로 데이터를 전달 할 수 있는 것을 배웠고 이를 활용하여 컴포넌트로 분리 할 수 있었습니다.


### 카테고리 설계 
공지사항 게시판 구현 중간에 카테고리에 관한 `ERD` 설계 변경이 있었습니다.
기존에는 `각 테이블`과 `카테고리 코드`를 맵핑을 해주는 별도의 테이블을 사용하는 것으로 설계하였으나, 구현을 진행하면서 다시 생각해보니 분리하지 않아도 해당 게시글의 카테고리 이름을 알 수 있고, 상위 카테고리 코드도 알 수 있을 것 같다는 느낌이 들었습니다.

다만, 조금 고민이 되었던 부분은 예로 관리자가 상위 코드명 : `A001` - 상위 코드 이름 : `공지사항 카테고리 입니다.` 라고 데이터를 저장할 때 `A001`이 `notice_table`의 카테고리 임을 어떻게 맵핑해주냐는 것이였습니다.

지금 구현은 "상위 코드 이름에 공지사항이 있기 때문에 `A001`은 공지사항 카테고리 분류 코드다"라고 구현하였지만, 만약 상위 코드명 : `TEST` - 상위 코드 이름 : `테스트입니다.` 라고 데이터가 입력된다면, 지금 코드는 어떠한 게시판에서도 사용되는 코드가 아닙니다.

상위 코드를 등록할 때 드롭다운 메뉴를 활용해서 기존 테이블과 맵핑되도록 제약을 걸 수 있지만, 우선은 다른 기능 구현의 우선순위를 두어 간단한 방법으로 처리하여 빠르게 진행하도록 하겠습니다.
추후 이 부분에 대해 변경이 필요하다면 변경되는 부분에 대해 더 자세히 다뤄보겠습니다.


---
## 다음으로 
사용자 자유게시판으로 구현으로 넘어가겠습니다.

자유게시판은 리스트보기, 게시글 상세보기뿐만 아니라 자유게시판 `등록/삭제/수정`과 `첨부파일 등록/다운로드`, `댓글 등록/삭제` 등 공지사항보다 더 다양한 기능이 있습니다. 한번에 다루기는 양이 많기 때문에 나누어서 내용을 다루겠습니다.

