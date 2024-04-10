---
title: 자유게시판 가져오기
categories: project multiboard
tags: [multiboard freeboard]

---

> 프로젝트 코드는 포스팅 이후에도 계속 개선 중입니다. 
> 포스팅은 게시판 구현이 어떤 흐름으로 가는지 참고하는 용으로 보시면 좋을 것 같습니다. 
> 프로젝트 코드 : **[링크](https://github.com/JeonJe/Multi_Board)**


## 자유게시판 가져오기

### 화면
<img width="1289" alt="image" src="https://github.com/JeonJe/Free_Board/assets/43032391/0c14af39-2daa-4e32-8a02-70d732599c58">


자유게시판 조회 페이지는 공지사항 조회 페이지와 동일하게 1) 검색 조건 입력 부분, 2) 리스트 부분, 3)페이지네이션 부분으로 나누어져 있습니다.

1)검색 조건 입력(+카테고리 불러오기)과 3)페이지네이션은 공지사항과 비슷하기 때문에 넘아가겠습니다.

공지사항 리스트와 다른 부분은 사용자가 로그인을 한 상태라면 화면처럼 우측에 자유게시판에 글을 쓸 수 있는 `글 등록 버튼`이 나타납니다.

```javascript
/**
 * views > boards > free > BoardFreeList.vue
 */
/**
 * 자유게시글 목록을 가져오는 비동기 함수
 */
async getFreeBoardList() {
  try {
    const response = await boardService.getBoardList(
      "free",
      this.searchCondition
    );
    if (response.status === "success") {
      if (response === "") {
        alert("표시 할 자유게시글이 없습니다.");
      } else {
        this.searchBoardList = response.data.searchBoards;
        this.totalPosts = response.data.countSearchBoards;
        this.totalPages = Math.ceil(
          this.totalPosts / this.searchCondition.pageSize
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
},

```
검색 조건을 입력하는 자식컴포넌트에서 이벤트가 emit되면 getReeBoardList를 호출하고 반환된 데이터로 리스트를 그려줍니다.
```javascript
/**
 * services > board-service.js
 */
**
 * 게시판의 카테고리 목록을 가져오는 함수
 *
 * @param {string} boardType - 게시판 종류 ('notice', 'free', 'gallery', 'inquiry' 등)
 * @returns {Promise} - 게시판의 카테고리 목록을 담은 Promise 객체
 * @throws {Error} API 요청 중 발생한 오류
 */
const getBoardList = async (boardType, searchCondtion) => {
  try {
    const apiURL = await getAPIUrlByBoardType(boardType);
    const response = await api.get(apiURL, {
      params: searchCondtion,
    });
    return response.data;
  } catch (error) {
    alert("리스트를 가져오지 못했습니다.");
    return false;
  }
};
```
게시판 목록을 호출하는 메소드는 여러 게시판 종류에서 사용 할 수 있도록 구현하였습니다.

---
### Controller
```java
/**
 * controller > BoardController.java
 */

/**
 * 검색 조건에 해당하는 자유 게시글 목록을 가져옵니다.
 *
 * @param searchCondition 검색 조건 객체
 * @return API 응답 객체
 */
@GetMapping("/api/boards/free")
ResponseEntity<APIResponse> getFreeBoardsWitchSearchCondition(@ModelAttribute SearchConditionDTO searchCondition) {
    List<BoardDTO> searchResult = boardService.searchFreeBoards(searchCondition);
    int countFreeBoards = boardService.countFreeBoards(searchCondition);

    BoardSearchResponse boardSearchResponse = BoardSearchResponse.builder()
            .searchBoards(searchResult)
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

`Controller`에서는 사용자가 입력한 검색 조건을 전달받아 해당 조건을 만족하는 자유게시판 목록과 개수를 Service에 요청합니다. 반환된 결과들은 `boardSearchResponse`로 묶어 `APIResponse의 data`로 반환합니다.

---
### DTO

```java
/**
 * response > BoardSearchResponse.java
 */

/**
 * 검색조건에 검색결과를 나타내는 클래스입니다.
 */
@Data
@Builder
public class BoardSearchResponse {

    /**
     * 검색 조건에 해당하는 공지 게시글 목록
     */
    private List<BoardDTO> searchBoards;
    /**
     * 검색 조건에 해당하는 공지 게시글의 개수
     */
    private int countSearchBoards;

    /**
     * 공지사항의 알림 표시된 게시글 목록
     */
    private List<BoardDTO> markNoticedBoards;

}
```

`BoardSearchResponse`에는 검색조건에 해당하는 게시글 목록 및 개수 그리고 공지사항 리스트에서 사용되는 `알림 표시된 게시글 목록`을 담을 수 있습니다.

---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 검색 조건에 해당하는 자유 게시글 목록을 조회합니다.
 *
 * @param searchParamsDTO 검색 조건 DTO
 * @return 자유 게시글 목록
 */
public List<BoardDTO> searchFreeBoards(SearchConditionDTO searchParamsDTO) {
    return boardRepository.searchFreeBoards(searchParamsDTO);
}

/**
 * 검색 조건에 해당하는 자유 게시글의 개수를 조회합니다.
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 공지 게시글의 개수
 */
public int countFreeBoards(SearchConditionDTO searchConditionDTO) {
    return boardRepository.countFreeBoards(searchConditionDTO);
}
```
---
### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */

/**
 * 검색 조건에 해당하는 자유 게시글 목록을 조회합니다.
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 검색 결과 자유 게시글 목록
 */
List<BoardDTO> searchFreeBoards(SearchConditionDTO searchConditionDTO);

/**
 * 검색 조건에 해당하는 자유 게시글의 개수를 조회합니다.
 *
 * @param searchConditionDTO 검색 조건 DTO
 * @return 자유 게시글의 개수
 */
int countFreeBoards(SearchConditionDTO searchConditionDTO);
```
```sql
<!-- 검색 조건에 해당하는 자유 게시글 리스트 조회  -->
<select id="searchFreeBoards" parameterType="SearchConditionDTO" resultType="BoardDTO">
    SELECT target_board.*, cc.child_code_name AS categoryName
    FROM free_board AS target_board
    JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
    WHERE 1=1
    <include refid="searchQuery" />
    <include refid="orderQuery" />
    LIMIT #{pageSize}
    OFFSET #{offset}
</select>

<!-- 검색 조건에 해당하는 자유 게시글의 개수를 조회 -->
<select id="countFreeBoards" parameterType="SearchConditionDTO" resultType="java.lang.Integer">
    SELECT COUNT(*)
    FROM free_board AS target_board
    WHERE 1=1
    <include refid="searchQuery" />
</select>

<sql id = "searchQuery">
  <!-- 검색어가 존재하는 경우, 제목 또는 내용에 검색어가 포함된 게시글을 검색합니다. -->
  <if test="searchText != null and searchText != ''">
      AND (title LIKE concat('%', #{searchText}, '%')
      OR content LIKE concat('%', #{searchText}, '%'))
  </if>
  <if test="categoryValue != null and categoryValue != ''">
      <!-- 카테고리값이 존재하는 경우, 해당 카테고리로 필터링합니다. -->
      AND target_board.child_code_value = #{categoryValue}
  </if>
  <!-- 생성일자 범위로 필터링합니다. -->
  AND created_at BETWEEN #{startDate} AND DATE_ADD(#{endDate}, INTERVAL 1 DAY)
</sql>

<sql id="orderQuery">
  <!-- 정렬 기준에 따라 결과를 정렬합니다. -->
  ORDER BY
  <choose>
      <when test="sortCriteria == 'createdAt'">
          created_at
      </when>
      <when test="sortCriteria == 'title'">
          title
      </when>
      <when test="sortCriteria == 'visitCount'">
          visit_count
      </when>
      <otherwise>
          created_at
      </otherwise>
  </choose>
  <!-- 정렬 순서에 따라 오름차순 또는 내림차순으로 정렬합니다. -->
  <if test="orderBy == 'desc'">
      DESC
  </if>
  <if test="orderBy == 'asc'">
      ASC
  </if>
</sql>

```

검색조건은 리스트 조회와 개수 조회 쿼리 모두에서 사용되기 때문에 `include` 키워드로 재사용할 수 있도록 작성하였습니다. 

위 쿼리문에서 주의해야할 부분은 자유게시판, 갤러리 게시판 등 다양한 게시판에서 `sql id = "searchQuery"` 을 사용할 수 있도록 특정 게시판을 가리키는 `target_board`라는 별칭을 사용하고 있습니다. 

따라서 `include` 문을 호출하는 쿼리에서 `free_board` AS `target_board` 로 별칭을 붙여줘야합니다.


---
### 로그인 여부 확인
공지사항은 관리자가 글을 등록하기 때문에 사용자 로그인 상태와 전혀 관계가 없었습니다. 
하지만, 자유게시판에서는 로그인된 사용자가 글을 작성 할 수 있도록 버튼을 만들어줘야 합니다.


`글 작성 권한`은 클라이언트 `localStorage`에 저장된 `JWT` 내 사용자ID가 회원가입된 사용자ID면 작성 권한이 있는 것으로 구현하였습니다.

```javascript
/**
 * src > views > boards > free > BoardFreeList.vue
 */

export default {
  components: {
    SearchForm,
    BoardPagination,
  },
  data() {
    return {
      searchCondition: {},
      searchBoardList: [],
      categories: [],
      totalPosts: 0,
      totalPages: 0,
      showRegisterButton: false,
    };
  },
  async mounted() {
    await this.checkJWTAuth();
    await this.getFreeBoardCategories();
  },
  },
```
`mounted()`에서는 클라이언트 JWT가 유효한지 확인하는 `checkJWTAuth`과 자유게시판 카테고리 리스트를 가져오는 `getFreeBoardCategories` 을 호출합니다.

```javascript
/**
 * src > views > boards > free > BoardFreeList.vue
 */

 /**
 * 사용자 인증 상태를 확인하는 함수
 */
async checkJWTAuth() {
  try {
    const hasPermission = await userService.getJWTAuthStatus();
    this.showRegisterButton = hasPermission;
    return true;
  } catch (error) {
    this.showRegisterButton = false;
    return false;
  }
```
checkJWTAuth에서는 `userService.getJWTAuthStatus()`을 호출하여 서버로부터 해당 JWT 토큰의 권한이 유효(회원가입된 사용자)한지 확인 요청 후 반환된 결과로 글 등록 버튼 상태를 결정합니다.

```javascript
/**
 * services > user-service.js
 */

/**
 * JWT 토큰 확인을 위한 함수
 * @returns {Promise<Object|false>} - JWT 토큰 확인 성공 시 응답 데이터, 실패 시 false
 */
const getJWTAuthStatus = async () => {
  try {
    const response = await api.get(process.env.VUE_APP_API_CHECK_JWT_STATUS);
    return response.data;
  } catch (error) {
    // 400 : 만료된토큰
    if (error.response.status === 400) {
      alert("로그인 시간이 만료되었습니다. 재로그인하세요.");
    }
    // 401 : 미인증
    return false;
  }
};
```
`userService.getJWTAuthStatus()` 에서는 사용자 JWT을 `header`에 담아 서버로 유효성 확인 요청을 보냅니다. 
만약 유효한 사용자라면 서버는 `data`에 `true`를 담아 반환하고, `getJWTAuthStatus` 메소드는 그 반환 값을 그대로 return 해줍니다. 

만약 JWT 토큰이 만료되었다면 서버에서는 response status를 `400(bad request)`로 반환하고, 미인증 상태라면 `401(UnAuthorized)`로 반환합니다. 

만약 만료된 토큰이라면 재로그인이 필요하기 때문에 alert으로 사용자에게 안내메시지를 띄워주었습니다.


```java
/**
 * controller > UserController.java
 */

/**
 * JWT 토큰 인증 상태를 확인합니다.
 *
 * @param request HttpServletRequest 객체
 * @return API 응답 객체
 */
@GetMapping("/api/auth/status")
public ResponseEntity<APIResponse> getAuthenticationStatus(HttpServletRequest request) {

    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");

    User user = userService.findUserByUserId(userId);
    if (ObjectUtils.isEmpty(user)) {
        throw new AppException(ErrorCode.INVALID_AUTH_TOKEN, "유효한 사용자가 아닙니다.");
    }


    APIResponse apiResponse = ResponseBuilder.SuccessWithData("유효한 토큰입니다.", true);
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```

Request는 인터셉터를 통과하며 `JWT토큰 추출 > JWT 토큰으로부터 유저 ID를 추출 > Request에 userId attribute에 추가`되어 전달됩니다. 이 Request에서 userId를 가져와 회원 가입된 사용자ID인지 확인 합니다.

>  Request을 직접 조작하는 것은 권장되지 않는 방법입니다. 인터셉터를 사용하지 않고 @RequestHeader("Authorization")을 사용하여 컨트롤러, 서비스 계층에서 직접 JWT토큰을 추출하여 확인하는 방법도 있습니다.
> 추가로 **현재는 String userId로 비교 중이지만, 고유한 seqId를 비교하는 방식으로 변경 예정입니다.**


## 어려웠던 점
### 로그인 & 로그아웃
사용자가 로그인을 했다면 글 등록 버튼 생성이 되어야 하고, 로그인한 사용자가 자유 게시글 작성자이면 수정 버튼이 활성화 되어야 합니다. 또한, 로그인한 사용자가 댓글 작성자이면 해당 댓글 삭제 버튼이 활성화 되어야 하고 이 외에도 여러 부분에서 로그인한 사용자에 대한 정보가 사용됩니다.

마주쳤던 문제점은 **1번 사용자로 로그인 후 2번 사용자로 로그인했을 때 1번 사용자의 jwt 토큰 정보로 요청이 되는 현상이 발생하였습니다.** 

1번 사용자 로그아웃 시 locaStorage에서 jwt 토큰을 지웠음에도 불구하고 요청은 1번 사용자의 jwt토큰을 담고 있었습니다. 삽질 끝에 axios 요청의 headers에 JWT토큰을 초기에만 설정한 것이 원인임을 알게 되었습니다.  `JWT 토큰이 갱신되는 시점에 axios 요청 헤더에 다시 JWT을 다시 설정해주어 문제를 해결할 수 있었습니다.`


**변경 전**
```javascript
const jwtToken = localStorage.getItem("jwt");
    api.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
```

**변경 후**

user-service, board-serivce에서 나누어 관리하던 axios 인스턴스를 하나로 관리 할 수 있도록 `axiosInstace.js`를 만들었습니다. 


axiosInstace.js에서 header에 jwt을 추가/삭제 메소드를 함께 export 해주어 로그인 시 jwt 토큰을 헤더에 추가하고 로그아웃 시 jwt 토큰을 헤더에서 삭제 하도록 코드를 추가하였습니다.
```javascript
/**
 * services > axiosInstance.js
 */
import axios from "axios";

// JSON 콘텐츠와 multipart 콘텐츠를 위한 서버 URL과 헤더를 사용하여 Axios 인스턴스 생성
const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json", // JSON 콘텐츠 타입
  },
});

// multipart 콘텐츠를 위한 헤더 설정
const multipartApi = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "multipart/form-data", // multipart 콘텐츠 타입
  },
});

const setAuthorizationHeader = (token) => {
  const authHeader = `Bearer ${token}`;
  api.defaults.headers.common["Authorization"] = authHeader;
  multipartApi.defaults.headers.common["Authorization"] = authHeader;
};

const clearAuthorizationHeader = () => {
  delete api.defaults.headers.common["Authorization"];
  delete multipartApi.defaults.headers.common["Authorization"];
};

// 생성한 인스턴스를 내보내기
export { api, multipartApi, setAuthorizationHeader, clearAuthorizationHeader };

```

로그인 후 사용자 정보는 `vuex`를 통해 관리됩니다.
vuex에서 유저 정보를 저장하는 시점에서 localStorage에 저장된 JWT 정보를 axios headers에 추가하도록 변경하였습니다.

```javascript
/**
 * store > user.js 
 */

import { createStore } from "vuex";
import {
  setAuthorizationHeader,
  clearAuthorizationHeader,
} from "../services/axiosInstance";
/**
 * Vuex Store를 생성
 *
 * @returns {Object} - Vuex Store 객체
 */
export default createStore({
  /**
   * 상태(State) 객체를 정의
   * @returns {Object} - 초기 상태 객체
   */
  state() {
    return {
      user: null, // 사용자 정보를 저장하는 상태 변수
    };
  },
  /**
   * Getter 함수를 정의
   */
  getters: {
    /**
     * 사용자가 로그인 중인지 여부를 반환하는 Getter 함수
     * @param {Object} state - Vuex 상태 객체
     * @returns {boolean} - 사용자 로그인 여부
     */
    isLoggedIn: (state) => !!state.user,
    /**
     * 현재 로그인한 사용자 정보를 반환하는 Getter 함수
     * @param {Object} state - Vuex 상태 객체
     * @returns {Object|null} - 현재 로그인한 사용자 정보
     */
    getUser: (state) => state.user,
  },
  mutations: {
    /**
     * 사용자 정보를 설정하는 Mutation 함수
     * @param {Object} state - Vuex 상태 객체
     * @param {Object|null} user - 설정할 사용자 정보
     */
    setUser(state, user) {
      state.user = user;
    },
    /**
     * 사용자 정보를 초기화하는 Mutation 함수
     * @param {Object} state - Vuex 상태 객체
     */
    clearUser(state) {
      state.user = null;
    },
  },
  /**
   * Action 함수를 정의합니다.
   */
  actions: {
    /**
     * 사용자 정보를 설정하는 Action 함수
     * @param {Object} context - Vuex context 객체
     * @param {Object|null} user - 설정할 사용자 정보
     */
    setLoginUser({ commit }, user) {
      localStorage.setItem("jwt", user.jwt);
      setAuthorizationHeader(user.jwt);
      commit("setUser", user);
    },
    /**
     * 사용자 정보를 초기화하는 Action 함수
     * 로그아웃 시 localStorage에서 JWT를 제거하고 사용자 정보를 초기화합니다.
     * @param {Object} context - Vuex context 객체
     */
    clearLoginUser({ commit }) {
      localStorage.removeItem("jwt");
      clearAuthorizationHeader();
      commit("clearUser");
    },
  },
  modules: {},
});

```
---
## 다음으로 

사용자 권한과 연관되어 있어 생각보다 구현 기간이 길어졌습니다. 다음 포스팅에서는 자유게시글 상세보기 구현 과정에 대해 살펴보겠습니다.