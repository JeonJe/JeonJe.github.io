---
title: 자유 게시글 보기
tags: [multi board, free board]
keywords: multi board, free board
sidebar: mydoc_sidebar
permalink:  multi_board_free_board_view.html
folder: multi_board_project
last_updated: 2023-07-25
---


##  자유 게시글 보기

### 화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/c81a1347-a3ff-45df-86c2-bec17cf67332)

자유 게시글 상세보기에서도 사용자 로그인 여부를 확인합니다.
로그인 후 `유효한 JWT`을 가지고 있다면, 댓글을 등록할 수 있는 `입력 폼`과 `버튼`이 나타납니다. 


JWT의 `userId`와 자유 게시글 `작성자`가 동일하다면 게시글을 수정하고 삭제할 수 있는 버튼이 나타나며, 댓글 작성자와 동일하다면 댓글을 삭제할 수 있는 버튼이 나타납니다.

{% include note.html content='
현재는 유저 확인을 `String userId`로 비교 중이지만, 아래와 같은 시나리오를 핸들링하기 위해 userId가 가지고 있는 PrimaryKey인 seq number로 유저 확인을 변경할 예정입니다.
<br/>
  1)기존 사용자가 탈퇴 -> 2)새로운 사용자가 동일한 `String userId`로 가입 -> 3)기존 사용자가 작성한 게시글, 댓글 수정 권한 획득' %}

```javascript
/**
 * views > boards > free > BoardFreeView.vue
 */

/**
 * 공지사항 상세 정보를 가져오는 비동기 함수
 * @param {number} boardId - 공지사항 게시글의 ID
 */
async getFreeBoardDetail(boardId) {
  try {
    const response = await boardService.getBoardDetail("free", boardId);
    if (response.data != "") {
      this.boardInfo = response.data;
    }

    this.editPermission = await boardService.hasBoardEditPermission(
      boardId
    );
  } catch (error) {
    alert(error);
  }
},
```

`getFreeBoardDetail`메소드에서는 게시글 정보를 요청하고, 해당 게시글을 수정할 수 있는 권한이 있는지 확인합니다.

```javascript 
/**
 * services > board-service.js
 */

/**
 * 게시판의 편집 권한을 확인하는 함수
 *
 * @param {number} boardId - 게시글 ID
 * @returns {Promise} - 게시글 편집 권한 여부를 담은 Promise 객체
 * @throws {Error} API 요청 중 발생한 오류
 */
const hasBoardEditPermission = async (boardId) => {
  try {
    const response = await api.get(
      `${process.env.VUE_APP_API_BOARD_FREE_EDIT_PERMISSION}/${boardId}`
    );
    return response.data.data;
  } catch (error) {
    console.log(error.response.data.message);
    return false;
  }
};
```
`hasBoardEditPermission`메소드를 통해 서버로 확인 요청을 보내게 되면, 서버는 JWT에서 userId를 추출하여 해당 게시글의 작성자와 비교하여 결과를 리턴합니다.

```java
/**
 * board > BoardController.java
 */
/**
 * 게시글 수정 권한을 확인하고 결과를 반환하는 API 메서드입니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 수정할 게시글 ID
 * @return 수정 권한 여부를 담은 API 응답 객체
 */
@GetMapping("/api/auth/boards/free/{boardId}")
public ResponseEntity<APIResponse> hasFreeBoardEditPermission(HttpServletRequest request, @PathVariable int boardId) {

    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");

    //boardId 작성자와 userId가 동일하면 true
    boolean hasPermission = (boardService.hasFreeBoardEditPermission(userId, boardId) == 1) ? true : false;

    if (hasPermission) {
        APIResponse apiResponse = ResponseBuilder.SuccessWithData("게시글 작성자와 동일합니다.", true);
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    } else{
        APIResponse apiResponse = ResponseBuilder.SuccessWithData("게시글 작성자와 동일하지 않습니다.", false);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }
}
```
수정권한이 있는지 확인하는 `hasFreeBoardEditPermission` 메소드입니다.

---
### Controller

```java
/**
 * controller > BoardController.java
 */

/**
 * 자유게시글의 상세 내용을 가져옵니다.
 *
 * @param boardId 게시글 ID
 * @return API 응답 객체
 */
@GetMapping("/api/boards/free/{boardId}")
ResponseEntity<APIResponse> getFreeBoardDetail(@PathVariable @NotEmpty int boardId) {
    BoardDTO noticeBoard = boardService.getFreeBoardDetail(boardId);

    APIResponse apiResponse = ResponseBuilder.SuccessWithData("자유게시글 상세 내용입니다.", noticeBoard);
    if (ObjectUtils.isEmpty(noticeBoard)) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
    } else {
        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
```
`getFreeBoardDetail` 메소드는 `PathVariable`로 게시글 ID를 받아 서비스로 전달하고 반환된 내용을 리턴합니다.

---
### DTO
```java
/**
 * dto > BoardDTO.java
 */
/**
 * 게시글 정보를 전달하는 DTO
 */
@Data
public class BoardDTO {
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
   * 작성자 ID
   */
  @NotEmpty(message = "작성자는 필수 항목입니다.")
  @Size(max = 255, message = "작성자는 255자 이하로 입력해야 합니다.")
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
   * 카테고리 이름
   */
  @NotEmpty(message = "카테고리 값은 필수 항목입니다.")
  private String categoryValue;


  /**
   * 카테고리 값
   */
  private String categoryName;


  /**
   * 알림 여부 (1: 알림 표시, 0: 알림 미표시)
   */
  private int isNoticed;

  /**
   * 삭제할 첨부 파일의 ID 목록
   */
  private List<Integer> deletedAttachmentIDs;

  /**
   * 업로드된 첨부 파일 목록
   */
  private List<MultipartFile> uploadAttachments;

  /**
   * 업로드된 첨부 파일 목록
   */
  private List<AttachmentDTO> boardAttachments;
  /**
   * 댓글 목록
   */
  private List<CommentDTO> boardComments;

  }
```
게시글 내용을 담는 `BoardDTO`입니다. 

공지 게시판, 자유 게시판 모두에서 사용할 수 있도록 되어있습니다.


---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 자유게시글의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 자유게시글 상세 내용
 */
public BoardDTO getFreeBoardDetail(int boardId) {
    boardRepository.updateFreeBoardVisitCount(boardId);

    List<AttachmentDTO> attachments = attachmentRepository.getAttachmentsByBoardId(boardId);
    List<CommentDTO> comments = commentRepository.getCommentsByBoardId(boardId);

    BoardDTO boardDTO = boardRepository.getFreeBoardDetail(boardId);
    boardDTO.setBoardAttachments(attachments);
    boardDTO.setBoardComments(comments);

    return boardDTO;
}
```

Service의 `getFreeBoardDetail`에서는 `boardId`에 해당하는 게시글의 조회수를 증가시키고, 해당 게시글의 첨부파일 목록과 댓글목록을 가져와 게시글 내용과 같이 `BoardDTO` 객체에 담아 반환합니다.


### Repository & Mapper
```java
/**
 * mapper > BoardRepository.java
 */
/**
 *  자유 게시글의 상세 내용을 조회합니다.
 *
 * @param boardId 게시글 ID
 * @return 자유게시글 상세 내용
 */
BoardDTO getFreeBoardDetail(int boardId);
```

```sql
  <!-- 자유게시판 상세 내용을 조회 -->
  <select id="getFreeBoardDetail" parameterType="java.lang.Integer" resultType="BoardDTO">
      SELECT target_board.*, target_board.child_code_value as categoryValue, cc.child_code_name AS categoryName
      FROM free_board AS target_board
                JOIN category_child_code AS cc ON target_board.child_code_value = cc.child_code_value
      WHERE target_board.board_id = #{boardId}
  </select>
```
`BoardRepository`와 `sql`문입니다. boardId에 해당하는 게시글의 정보를 가져오고, `child_code_value`는 DTO의 멤버 변수명과 맵핑될 수 있도록 `AS categoryName`으로 별칭을 설정하였습니다.

---
## 첨부파일 
첨부파일을 전송하기 위해서는 `application/json` 가 아닌 `multipart/form-data` 형태로 데이터가 전송되어야 합니다.

```javascript
/**
 * services > axiosInstance.js
 */

// multipart 콘텐츠를 위한 헤더 설정
const multipartApi = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "multipart/form-data", // multipart 콘텐츠 타입
  },
});
```

첨부파일 업로드는 게시글 작성과 관련있지만, 첨부파일 다운로드와 함께 미리 내용을 살펴보겠습니다.
### 첨부파일 업로드 

첨부파일을 전달하려면 
HTML form 태그에서 encrtype을 `multipart/form-data` 로 설정해야합니다.
```javascript
/**
 * views > boards > free > BoardFreeWrite.vue
 */

<form enctype="multipart/form-data">
...
<div>
    <!-- 기존 첨부파일 리스트  -->
    <div
      v-for="(attachment, index) in boardInfo.boardAttachments"
      :key="attachment.attachmentId"
    >
      <div class="d-flex justify-content-between">
        <span>{{ attachment.originFileName }}</span>
        <div>
          <button
            type="button"
            @click="clickDeleteAttachment(index, attachment.attachmentId)"
            class="btn btn-sm btn-danger mx-2"
          >
            삭제
          </button>
          <a
            :href="downloadAttachment(attachment.attachmentId)"
            class="btn btn-sm btn-primary"
          >
            다운로드
          </a>
        </div>
      </div>
    </div>

    <!-- 새로 첨부파일 추가할 수 있는 input -->
    <div class="mt-3" v-for="(file, index) in fileInputBoxes" :key="index">
      <div class="d-flex justify-content-between align-items-center">
        <input
          type="file"
          :id="'attachment' + (index + 1)"
          :name="files"
          @change="handleFileChange($event)"
          class="form-control-file"
        />
        <button
          type="button"
          @click="clickRemoveEmptyInput(index)"
          class="btn btn-sm btn-danger mx-2"
        >
          삭제
        </button>
      </div>
    </div>

    <button
      type="button"
      @click="clickAddAttachmentForm"
      v-show="fileInputBoxes.length < 5"
      class="btn btn-secondary mt-3"
    >
      첨부파일 추가
    </button>
  </div>

```
게시글 `write`와 `update`를 하나의 vue로 처리하기 때문에 기존 첨부파일을 가져오는 부분과 새로 첨부파일을 추가하는 부분을 분리하여 작성하였습니다. 

사용자가 화면에서 첨부파일을 추가하면 `handleFileChange` 에 의해  `uploadAttachments` 에 담기게 되고 저장 버튼을 누르는 시점에서 `createFormDataToSumbit` 메소드를 통해 서버로 전송하려는 게시글 정보를 `new FormData()`에 담아 전송합니다.

```javascript
 /**
 * 파일 선택 이벤트 핸들러
 *  선택한 파일을 boardInfo.uploadAttachments 배열에 추가
 * @param {Event} event - 파일 선택 이벤트 객체
 */
handleFileChange(event) {
  const file = event.target.files[0];
  this.uploadAttachments.push(file);
},
```

```javascript
/**
 * views > boards > free > BoardFreeWrite.vue
 */
/**
* 게시판 정보를 서버에 저장하는 함수
*/
async clickBoardInfoSubmit() {
  //... 유효성 검증 코드

const getNewBoardInfo = this.createFormDataToSumbit();

await boardService.saveBoardInfo("free", getNewBoardInfo);
boardService.replaceRouterToFreeBoardList(this.$router, this.$route);
},
/**
* 게시글을 수정하기 위해 제출할 FormData를 생성하는 함수
* @returns {FormData} - 게시글 수정에 사용될 FormData 객체
*/
createFormDataToSumbit() {
const newBoardInfo = new FormData();

newBoardInfo.append("categoryValue", this.boardInfo.categoryValue);
newBoardInfo.append("userId", this.boardInfo.userId);
newBoardInfo.append("title", this.boardInfo.title);
newBoardInfo.append("content", this.boardInfo.content);

this.uploadAttachments.forEach((file) => {
  newBoardInfo.append(`uploadAttachments`, file);
});
return newBoardInfo;
},
  ...
```
위 코드에서 주의해야 할 부분이 있습니다. 첨부 파일리스트의 유효성 검증 부분입니다. 
처음에는 `forEach`문으로 첨부된 파일 리스트를 순회하며 각 파일에 대한 유효성을 검증하는 코드를 작성하였습니다. 

하지만 제대로 유효성 검증이 되지 않았고 디버그 결과 파일 리스트가 빈 리스트로 나오는 것을 확인하였습니다. **그 이유는 foreach 리스트 요소를 하나씩 반복하며 콜백함수를 실행할 뿐 코드가 동기인지 비동기인지는 상관하지 않기 때문입니다.**  

리스트를 순회하며 각 파일에 대한 유효성 검증을 확인하기 위해서 아래 코드와 같이 `for of` 를 사용해주어야 합니다.

```javascript
const validateFiles = async (files) => {
  const allowedExtensions = ["jpg", "jif", "png", "zip"];
  const maxFileSize = 2 * 1024 * 1024;

  for (const file of files) {
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension) || file.size > maxFileSize) {
      return false;
    }
  }

  return true;
};
```

```javascript
/**
 * services > board-service.js 
 */

/**
 * saveBoardInfo 메소드는 주어진 게시판 타입과 새로운 게시글 정보를 받아와 저장하는 기능을 제공
 *
 * @param boardType     게시판 타입 (예: "free", "notice" 등)
 * @param newBoardInfo  새로운 게시글 정보
 * @return              게시글 저장 결과
 */
const saveBoardInfo = async (boardType, newBoardInfo) => {
  try {
    const apiURL = await getAPIUrlByBoardType(boardType);
    const response = await multipartApi.post(apiURL, newBoardInfo);
    alert(response.data.message);
  } catch (error) {
    alert(error);
  }
};
```

이제 서버쪽 코드를 살펴보겠습니다.

서버에서는 게시글 정보와 함께 업로드할 첨부파일 리스트도 전달 받습니다.
지금은 첨부파일을 서버로 업로드하는 부분만 살펴보겠으며 게시글을 저장하는 코드는 다음 포스팅에서 자세히 다루겠습니다.
```java
/**
 * service > BoardUservice.java
 */

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
```

서버의 `Service`에서는 전달받은 `boardDTO`로부터 `MultipartFile` 리스트를 꺼내옵니다.

`for` 문으로 파일 하나씩을 가져와 유틸로 중복되지 않은 파일명을 만들어 사용자가 업로드 한 파일명과 함께 `attachmentRepository`에 전달합니다. 데이터베이스가 아닌 서버 upload path 위치로 파일 업로드를 하는 것은 여기가 아닌 `FileUtil.uploadFile` 메소드입니다.

```java
/**
 * utils > FileUtil.java 
 */

/**
 * 파일을 업로드합니다.
 *
 * @param file        업로드할 파일
 * @param uploadPath  파일을 업로드할 경로
 * @return            업로드된 파일 객체
 * @throws Exception  예외 발생 시
 */
public static File uploadFile(MultipartFile file, String uploadPath) throws Exception {
    String fileName = file.getOriginalFilename();
    String baseName = FilenameUtils.getBaseName(fileName);
    String extension = FilenameUtils.getExtension(fileName);

    // 파일 크기 제한: 2MB
    long maxSize = 2 * 1024 * 1024; // 2MB
    if (file.getSize() > maxSize) {
        throw new IllegalArgumentException("파일 크기는 최대 2MB까지 업로드 가능합니다.");
    }

    // 확장자 제한: jpg, gif, png, zip
    List<String> allowedExtensions = Arrays.asList("jpg", "gif", "png", "zip");
    if (!allowedExtensions.contains(extension.toLowerCase())) {
        throw new IllegalArgumentException("jpg, gif, png, zip 형식의 파일만 업로드 가능합니다.");
    }

    // 중복 파일명 처리합니다.
    File uploadedFile = new File(uploadPath + File.separator + fileName);

    int count = 1;
    while (uploadedFile.exists()) {
        // 중복 파일명에 번호 추가합니다.
        String numberedFileName = baseName + "_" + count + "." + extension;
        uploadedFile = new File(uploadPath + File.separator + numberedFileName);
        count++;
    }

    //파일을 업로드 폴더로 업로드합니다.
    file.transferTo(uploadedFile);
    //파일 고유 식별번호를 반환합니다.
    return uploadedFile;
}
```
`uploadFile`에서는 서버사이드 파일 유효성 검증과 유니크 파일명을 생성하고, 서버의 upload path로 파일을 업로드해주는 역할을 하고 있습니다.

### 첨부파일 다운로드 
첨부파일 다운로드는 파일 이름을 누르면 첨부파일 ID가 `downloadAttachment` 메소드로 전달됩니다.
```javascript
/**
 * views > boards > free > BoardFreeView.vue
 */
<a :href="downloadAttachment(attachment.attachmentId)">
    {{ attachment.originFileName }}
  </a>

/**
 * utils > utils.js
 */
const downloadAttachment = (attachmentId) => {
  return `${process.env.VUE_APP_API_SER_URL}${process.env.VUE_APP_API_FILE_DOWNLOAD}/${attachmentId}`;
};
```


```java
/**
 * board > BoardController.java
 */

/**
 * 첨부 파일을 다운로드합니다.
 *
 * @param attachmentId   다운로드할 첨부 파일의 ID
 * @return               Resource 객체를 ResponseEntity로 래핑한 결과
 * @throws Exception     예외 발생 시
 */
@GetMapping("api/attachments/{attachmentId}")
public ResponseEntity<Resource> downloadAttachment(@PathVariable @NotEmpty int attachmentId)
        throws Exception{

        AttachmentDTO attachment = attachmentService.getAttachmentByAttachmentId(attachmentId);
        return FileUtil.fileDownload(attachment, UPLOAD_PATH);
}
```
첨부파일ID는 `Path Variable`로 전달되고 서버 컨트롤러에서는 `attachmentId`에 해당하는 파일 정보를 데이터베이스에서 가져와 FileUtil.fileDownload로 전달합니다.

```java
/**
 * utils > FileUtil.java
 */
/**
 * 파일을 다운로드합니다.
 *
 * @param attachment   다운로드할 파일 정보
 * @param uploadPath   파일이 업로드된 경로
 * @return             파일 다운로드 응답 객체
 * @throws IOException 예외 발생 시
 */
public static ResponseEntity<Resource> fileDownload(AttachmentDTO attachment, String uploadPath) throws IOException {
    String filePath = uploadPath + File.separator + attachment.getFileName();
    File file = new File(filePath);

    // 파일이 존재하는지 확인합니다.
    if (!file.exists()) {
        return ResponseEntity.notFound().build();
    }

    InputStreamResource resource = new InputStreamResource(new FileInputStream(file));

    // 파일 다운로드를 위한 Response Header를 설정합니다.
    HttpHeaders headers = new HttpHeaders();
    headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + attachment.getFileName());

    // 파일의 MIME 타입을 설정합니다.
    String contentType = Files.probeContentType(file.toPath());
    headers.setContentType(MediaType.parseMediaType(contentType));

    // 파일의 크기를 설정합니다.
    long contentLength = file.length();
    headers.setContentLength(contentLength);
    // 파일 다운로드 응답을 생성하여 반환합니다.
    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
}

`fileDownload`에서는 파일이 존재하는지 확인 후 다운로드 할 파일 `resource`를 만들어 반환합니다.

```
## 댓글 
다음으로 댓글 기능을 살펴보겠습니다.
### 댓글 리스트
댓글 목록은 위에서 살펴본 게시글 정보를 가져오는 `getFreeBoardDetail` 호출 시점에서 서버로부터 `List<CommentDTO>` 형태로 게시글 정보와 같이 반환됩니다. 따라서 화면에서는 이 댓글 목록을 화면에 적절하게 나타내주기만 하면됩니다.

여기서 발생한 문제점이 있었습니다. 

현재 `CommentDTO` 클래스는 `builder` 어노테이션을 사용중입니다.

buidler 패턴은 builder 필드 이름으로 값을 설정하기 때문에 필드 순서는 신경을 쓰지 않아도 된다고 생각하였습니다. 그래서 아래와 같이 데이터베이스 컬럼 순서를 고려하지 않고 무작위 순서로 클래스 필드를 작성하였습니다.
```java
@Data
@Builder
public class CommentDTO {
  private int boardId;
  private int commentId;
  private Date createdAt;
  private String content;
  private String userId;
}
```

```
Error attempting to get column 'user_id' from result set.  Cause: java.sql.SQLDataException: value 'test' cannot be decoded as Integer
; value 'test' cannot be decoded as Integer
```
?! 코드를 실행하니 위와 같이 user_id를 가져올 때 에러가 발생하였습니다.

```sql
<!-- 게시글에 달린 모든 댓글 조회 -->
<select id="getCommentsByBoardId" resultType="CommentDTO">
    SELECT *
    FROM comments
    WHERE board_id = #{boardId}
</select>
```

디버깅 결과 문제 발생 원인을 `Mybatis`에서 `select` 쿼리의 결과를 resultType인 `CommentDTO`에 맵핑 시 발생하는 문제로 파악하였습니다.

**결론부터 말하면 DTO 필드 순서와 데이터베이스 컬럼 순서를 맞춰야합니다.**

현재 `CommentDTO`에는 `@data`, `@builder`어노테이션만 사용했기 때문에 `final`이나 `@NotNull` 필드 값을 파라미터로 받는 생성자로 만들어지는 `@RequiredArgsConstructor`이 자동적으로 사용됩니다. 

이때 `@RequiredArgsConstructor`는 필드를 선언한 순서대로 매개 변수를 만들어주기 때문에 데이터베이스의 컬럼 순서와 동일하게 순서를 맞추어주지 않는다면 `Mybatis`에서 제대로 맵핑이 되지 않습니다.


참고
- [Lombok 사용시 ConstructorAnnotation 사용을 자제해야하는 이유](https://prolog.techcourse.co.kr/studylogs/2490)

- [Spring + MyBatis에서 쿼리의 결과와 객체가 매핑이 되는 과정](https://zzang9ha.tistory.com/420)

필드 순서를 데이터베이스 컬럼과 동일한 순서로 바꾸어 정상적으로 값이 맵핑이 되는 것을 확인하였습니다. 그동안은 운이 좋아서 해당 내용을 모른채 데이터베이스 컬럼 순서대로 작성했기 때문에 에러가 발생하지 않았었습니다.🥲
### 댓글 작성
```javascript
/**
 * services > board-serivce.js
 */
/**
 * 자유 게시판에 댓글을 작성하는 함수
 *
 * @param {string} newComment - 작성할 댓글 내용
 * @param {number} boardId - 게시글 ID
 * @returns {Promise} - 댓글 작성 결과를 담은 Promise 객체
 * @throws {Error} API 요청 중 발생한 오류
 */
const addFreeBoardComment = async (newComment, boardId) => {
  try {
    const response = await api.post(
      `${process.env.VUE_APP_API_BOARD_FREE}/${boardId}/comments`,
      { content: newComment }
    );
    alert(response.data.message);
  } catch (error) {
    alert(error.response.data.message);
  }
};
```
댓글 작성은 댓글 내용을 post 요청에 담아 서버로 전달합니다.

```java
/**
 * 자유 게시글에 댓글을 추가하고 결과를 반환하는 API 메서드입니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 게시글 ID
 * @param commentDTO 추가할 댓글 정보
 * @return 댓글 추가 결과를 담은 API 응답 객체
 */
@PostMapping("/api/boards/free/{boardId}/comments")
public ResponseEntity<APIResponse> addFreeBoardComment(HttpServletRequest request,@PathVariable int boardId, @RequestBody CommentDTO commentDTO) {

    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");
    commentDTO.setUserId(userId);
    commentDTO.setBoardId(boardId);
    // 댓글 추가
    commentService.addFreeBoardComment(userId, commentDTO);

    APIResponse apiResponse = ResponseBuilder.SuccessWithoutData("댓글 추가에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```
서버에서는 `Path variable`로 `boardId`를 가져오고, `JWT`으로부터 댓글작성자 ID를 가져옵니다. 이 두 값을 commentDTO에 담아 `commentService.addFreeBoardComment`에 전달합니다.

```java
/**
 * service > CommentService.java
 */
/**
 * 자유게시판에 댓글을 추가합니다.
 *
 * @param userId     사용자 ID
 * @param commentDTO 댓글 정보를 담은 DTO 객체
 * @throws AppException 사용자 정보가 유효하지 않을 경우 예외 발생
 */
public void addFreeBoardComment(String userId, CommentDTO commentDTO){
    if (StringUtils.isEmpty(userId) || !userId.equals(commentDTO.getUserId())) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
    }
        commentRepository.addFreeBoardComment(commentDTO);
}
```
`Service`에서는 전달받은 userId와 댓글 작성자 Id를 비교하고 같다면 댓글을 데이터베이스에 저장합니다. Repository와 sql은 간단하기 때문에 생략하겠습니다.

### 댓글 삭제 

```javascript
/**
 * services > board-services.js
 */

/**
 * 자유 게시판의 댓글을 삭제하는 함수
 *
 * @param {Object} comment - 삭제할 댓글 정보
 * @param {number} boardId - 게시글 ID
 * @returns {Promise} - 댓글 삭제 결과를 담은 Promise 객체
 * @throws {Error} API 요청 중 발생한 오류
 */
const deleteFreeBoardComment = async (comment, boardId) => {
  try {
    const response = await api.delete(
      `${process.env.VUE_APP_API_BOARD_FREE}/${boardId}/comments`,
      { data: comment }
    );
    alert(response.data.message);
  } catch (error) {
    alert(error.response.data.message);
  }
};
```
댓글 삭제는 댓글의 작성자, 생성시간, userId, commentId가 담긴 comment 객체를 전달합니다. 물론 필요한 부분인 commentId와 userId만 추출하여 전달해도 됩니다.

```java
/**
 * board > BoardController.java
 */

/**
 * 자유 게시글의 댓글을 삭제하고 결과를 반환하는 API 메서드입니다.
 *
 * @param request HttpServletRequest 객체
 * @param commentDTO 삭제할 댓글 정보
 * @return 댓글 삭제 결과를 담은 API 응답 객체
 */
@DeleteMapping("/api/boards/free/{boardId}/comments")
public ResponseEntity<APIResponse> deleteFreeBoardComment(HttpServletRequest request, @RequestBody CommentDTO commentDTO) {

    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    String userId = (String) request.getAttribute("userId");
    // 댓글 삭제
    commentService.deleteFreeBoardComment(userId, commentDTO);

    APIResponse apiResponse = ResponseBuilder.SuccessWithoutData("댓글 삭제에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```
Controller에서는 `Path Variable`로 boardId와 JWT에서 추출한 userId를 Service로 전달합니다.



```java
/**
 * service > BoardService.java
 */

/**
 * 자유게시판의 댓글을 삭제합니다.
 *
 * @param userId     사용자 ID
 * @param commentDTO 댓글 정보를 담은 DTO 객체
 * @throws AppException 사용자 정보가 유효하지 않을 경우 예외 발생
 */
public void deleteFreeBoardComment(String userId, CommentDTO commentDTO) {
    if (StringUtils.isEmpty(userId) || !userId.equals(commentDTO.getUserId())) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
    }

    commentRepository.deleteFreeBoardComment(commentDTO);
}
```
`Service`에서는 userId를 확인 후 `commentDTO` 객체를 `Repository`에 전달해주었습니다.


Repository는 전달받은 `commentDTO`를 그대로 Mybatis 전달해주고, Mybatis에서는 `parameterType`을 `CommentDTO`로 명시하여 `commentId`필드를 바로 사용하였습니다.
```sql
<!-- 댓글 삭제 -->
<delete id="deleteFreeBoardComment" parameterType="CommentDTO">
    DELETE FROM comments
    WHERE comment_id = #{commentId}
</delete>
```
---
## 다음으로
첨부파일과 댓글 기능은 싱글 게시판 프로젝트 시 구현해본 내용이기 때문에 금방 구현할 줄 알았으나 첨부파일 유효성 검증 이슈 , DTO 필드 순서에 따른 맵핑 이슈 등 생각지도 못한 곳에서 문제가 발생하여 애를 먹었습니다. 다음으로는 자유 게시글 작성, 수정, 삭제에 대해 확인해보겠습니다.
