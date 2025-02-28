---
title: "멀티보드 갤러리게시판 CRUD 구현: 이미지 업로드와 썸네일 생성"
description: "Spring Boot와 Vue.js를 활용한 갤러리게시판 게시글 작성, 수정, 삭제 기능과 이미지 우선순위 관리, 썸네일 자동 생성 구현 방법"
categories: project multiboard
tags: [multiboard, 갤러리게시판, CRUD, 이미지업로드, 썸네일생성, spring, Vue, Thumbnailator, 이미지우선순위]

---


##  갤러리 게시글 등록/수정/삭제

### 화면
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/75495b4e-b2f9-4627-b593-328df0336f2d)
게시글 등록 화면입니다.

게시글에 첨부된 이미지 중 1번째 이미지는 게시글 리스트에서 나타나는 썸네일로 활용됩니다.

---
![image](https://github.com/JeonJe/Multi_Board/assets/43032391/491d8c75-8818-48b8-b41f-9a1d06386bbf)
게시글 수정화면입니다.

수정 시 썸네일로 사용되는 1번째 이미지가 삭제처리되면 1) 기존 이미지 중 우선순위가 가장 높은(번호로 가장 낮은) 이미지가 썸네일이 됩니다. 썸네일로 대체될 기존 이미지가 없다면, 새로 첨부하는 이미지의 1번째 이미지가 다시 새로운 썸네일이 됩니다.


---
### Controller
```java
/**
 * board > BoardController.java
 */

/**
 * 갤러리 게시글을 저장하고 결과를 반환합니다.
 *
 * @param request  HttpServletRequest 객체
 * @param boardDTO 갤러리 게시글 정보 DTO
 * @return 게시글 저장 결과를 담은 API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PostMapping("/api/boards/gallery")
ResponseEntity<APIResponse> saveGalleryBoardInfo(HttpServletRequest request, @Valid @ModelAttribute BoardGalleryDTO boardDTO) throws Exception {

    APIResponse apiResponse;
    int seqId = AuthUtil.getSeqIdFromRequest(request);

    if (seqId == 0) {
        apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }

    boardService.saveGalleryBoardInfo(seqId, boardDTO);

    apiResponse = ResponseBuilder.SuccessWithoutData("게시글 저장에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}

/**
 * 특정 갤러리 게시글을 삭제합니다.
 *
 * @param request HttpServletRequest 객체
 * @param boardId 게시글 ID
 * @return 게시글 삭제 결과를 담은 API 응답 객체
 */
@DeleteMapping("/api/boards/gallery/{boardId}")
public ResponseEntity<APIResponse> deleteGalleryBoard(HttpServletRequest request, @PathVariable int boardId) {
    //BearerAuthInterceptor에서 JWT에 따른 userId를 포함한 Request를 전달
    APIResponse apiResponse;
    int seqId = AuthUtil.getSeqIdFromRequest(request);

    if (seqId == 0) {
        apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }

    // 첨부파일 삭제 후 게시글 삭제
    boardService.deleteGalleryBoard(seqId, boardId);

    apiResponse = ResponseBuilder.SuccessWithoutData("게시글 삭제에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}

/**
 * 특정 갤러리 게시글을 수정하고 결과를 반환합니다.
 *
 * @param request  HttpServletRequest 객체
 * @param boardId  수정할 게시글 ID
 * @param boardDTO 수정할 갤러리 게시글 정보
 * @return 게시글 수정 결과를 담은 API 응답 객체
 * @throws Exception 예외 발생 시
 */
@PutMapping("/api/boards/gallery/{boardId}")
public ResponseEntity<APIResponse> updateGalleryBoardInfo(HttpServletRequest request, @PathVariable int boardId,
                                                          @Valid @ModelAttribute BoardGalleryDTO boardDTO) throws Exception {
    //BearerAuthInterceptor 에서 Request에 추출한 JWT로부터 추출한 seqId 포함하여 전달
    APIResponse apiResponse;
    int seqId = AuthUtil.getSeqIdFromRequest(request);

    if (seqId == 0) {
        apiResponse = ResponseBuilder.ErrorWithoutData("로그인되지 않았습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiResponse);
    }

    boardDTO.setBoardId(boardId);
    boardService.updateGalleryBoardInfo(seqId, boardDTO);

    apiResponse = ResponseBuilder.SuccessWithoutData("게시글 수정에 성공하였습니다.");
    return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
}
```
`Controller`에서 갤러리 게시글 save과 update 구조가 매우 유사합니다. 
delete의 경우엔 갤러리 게시글에 첨부된 이미지를 모두 지운 후 게시글을 삭제합니다.


---
### Service
```java
/**
 * service > BoardService.java
 */

/**
 * 갤러리게시판 정보를 저장합니다.
 *
 * @param seqId    사용자 식별자 아이디
 * @param boardDTO 갤러리게시판 정보 DTO
 * @throws Exception 예외 발생 시 처리
 */
public void saveGalleryBoardInfo(int seqId, BoardGalleryDTO boardDTO) throws Exception {

    if (seqId <= 0) {
        throw new AppException(ErrorCode.USER_NOT_FOUND, "유효한 사용자가 아닙니다.");
    }

    boardRepository.saveGalleryBoardInfo(boardDTO);
    List<MultipartFile> newFiles = boardDTO.getUploadImages();
    int priority = 1;
    int boardId = boardDTO.getBoardId();
    if (newFiles != null) {
        for (MultipartFile file : newFiles) {
            if (!file.isEmpty()) {

                String originName = file.getOriginalFilename();
                File numberedFile = FileUtil.uploadImage(file, UPLOAD_PATH);

                ImageDTO imagesDTO = ImageDTO.builder()
                        .boardId(boardId)
                        .fileName(numberedFile.getName())
                        .originFileName(originName)
                        .priority(priority)
                        .build();
                imageRepository.saveImage(imagesDTO);

                priority++;
            }
        }
    }

    ImageDTO firstPriorityImage = imageRepository.getFirstPriorityImageByBoardId(boardId);

    if (firstPriorityImage != null) {
        File newThumbNail = new File(UPLOAD_PATH + File.separator + firstPriorityImage.getFileName());
        Thumbnails.of(newThumbNail)
                .height(200)
                .keepAspectRatio(true)
                .toFiles(new File(THUMBNAIL_PATH), Rename.NO_CHANGE);
    }

}

/**
 * 갤러리 게시판 정보를 수정합니다.
 *
 * @param seqId    사용자 식별자 아이디
 * @param boardDTO 갤러리 게시판 정보 DTO
 * @throws Exception 예외 발생 시 처리
 */
public void updateGalleryBoardInfo(int seqId, BoardGalleryDTO boardDTO) throws Exception {
    //현재 userSeqId와 게시글 정보에 저장된 userSeqId와 비교
    int getUserSeqId = boardRepository.getGalleryBoardDetail(boardDTO.getBoardId()).getUserSeqId();
    if (seqId != getUserSeqId) {
        throw new AppException(ErrorCode.INVALID_PERMISSION, "수정 권한이 없습니다.");
    }
    //게시글 수정
    boardRepository.updateGalleryBoardInfo(boardDTO);

    //첨부파일 수정
    List<Integer> deletedAttachmentIds = boardDTO.getDeletedAttachmentIDs();
    int boardId = boardDTO.getBoardId();
    if (deletedAttachmentIds != null) {
        for (Integer deletedId : deletedAttachmentIds) {
            String deletedImageName = imageRepository.
                    getImageByImageId(deletedId).getFileName();

            //업로드 폴더/썸네일에서 이미지 삭제
            if (deletedImageName != null) {
                File file = new File(UPLOAD_PATH + '/' + deletedImageName);
                if (file.exists()) {
                    file.delete();
                }
                File thumbnail = new File(THUMBNAIL_PATH + '/' + deletedImageName);
                if (thumbnail.exists()) {
                    file.delete();
                }
            }
            //데이터베이스에서 이미지 정보 삭제
            imageRepository.deleteImageByImageId(deletedId);
        }
    }

    // 기존 이미지에 대해 우선순위 조정
    int lastPriority = 1;
    List<ImageDTO> remainingImages = imageRepository.getImagesByBoardId(boardId);

    if (!remainingImages.isEmpty()) {
        int newPriority = 1;
        for (ImageDTO image : remainingImages) {
            image.setPriority(newPriority);
            imageRepository.updateImagePriority(image);
            newPriority++;
        }
        lastPriority = newPriority;
    }

    //기존 이미지 -> 업로드 이미지 순으로 우선순위 적용
    List<MultipartFile> newFiles = boardDTO.getUploadImages();
    if (newFiles != null) {
        for (MultipartFile file : newFiles) {
            if (!file.isEmpty()) {
                String originName = file.getOriginalFilename();
                File numberedFile = FileUtil.uploadImage(file, UPLOAD_PATH);

                ImageDTO imagesDTO = ImageDTO.builder()
                        .boardId(boardDTO.getBoardId())
                        .fileName(numberedFile.getName())
                        .originFileName(originName)
                        .priority(lastPriority)
                        .build();
                imageRepository.saveImage(imagesDTO);
                lastPriority++;
            }
        }
    }
    //우선순위가 가장 높은 이미지를 썸네일로 사용
    ImageDTO firstPriorityImage = imageRepository.getFirstPriorityImageByBoardId(boardId);
    File newThumbNail = new File(UPLOAD_PATH + File.separator + firstPriorityImage.getFileName());
    if (firstPriorityImage != null) {
        Thumbnails.of(newThumbNail)
                .height(200)
                .keepAspectRatio(true)
                .toFiles(new File(THUMBNAIL_PATH), Rename.NO_CHANGE);
    }
}

/**
 * 갤러리게시판을 삭제합니다.
 *
 * @param seqId   사용자 식별자 아이디
 * @param boardId 게시글 ID
 */
public void deleteGalleryBoard(int seqId, int boardId) {
    //현재 userSeqId와 게시글 정보에 저장된 userSeqId와 비교
    int getUserSeqId = boardRepository.getGalleryBoardDetail(boardId).getUserSeqId();
    if (seqId != getUserSeqId) {
        throw new AppException(ErrorCode.INVALID_PERMISSION, "삭제 권한이 없습니다.");
    }
    imageRepository.deleteImageByBoardId(boardId);
    boardRepository.deleteGalleryBoard(boardId);
}


```
`save` 시에는 priority가 1로 저장된 이미지 정보를 가져와 해당 이미지로 썸네일을 만들어 썸네일 별도에 폴더에 업로드 합니다.  썸네일을 사용하기 위해 build.gradle에 아래와 같이 implementation을 추가하였습니다.
```java
//썸네일 사용을 위해 추가
implementation group: 'net.coobird', name: 'thumbnailator', version: '0.4.20'
```

`update`시에는 아래와 같은 과정을 통해 썸네일 수정이 필요합니다.
1. 사용자가 삭제 요청한 이미지를 이미지 업로드 폴더에서 삭제한다. 만약, 썸네일이라면 썸네일도 삭제한다.
2. 수정 후 남아있는 기존 이미지가 있으면 우선순위를 재조정한다.
3. 새로 업로드한 이미지는 기존 이미지보다 낮은 우선순위로 넣는다.
4. 우선순위가 가장 높은 이미지를 썸네일로 만든다.


---
### Repository & Mapper
```java
/**
 * repository > BoardRepository.java
 */

/**
 * 갤러리게시판 정보를 저장
 *
 * @param boardDTO 갤러리게시판 정보 DTO
 * @return 저장된 게시글의 ID
 */
int saveGalleryBoardInfo(BoardGalleryDTO boardDTO);

/**
 * 갤러리 게시글을 수정합니다.
 *
 * @param boardDTO 수정할 문의 게시글 정보 DTO
 */
void updateGalleryBoardInfo(BoardGalleryDTO boardDTO);

/**
 * 갤러리게시판을 삭제합니다.
 *
 * @param boardId 게시글 ID
 */
void deleteGalleryBoard(int boardId);

```

```sql
<!-- 갤러리 게시글 저장   -->
<insert id="saveGalleryBoardInfo" parameterType="BoardGalleryDTO" useGeneratedKeys="true" keyProperty="boardId">
    INSERT INTO gallery_board
    (title, content, user_seq_id, created_at, visit_count, child_code_value)
    VALUES (#{title},
            #{content},
            (SELECT seq_id FROM users WHERE user_id = #{userId}),
            now(),
            0,
            #{categoryValue})
</insert>

<!-- 문의 게시글 정보를 업데이트하는 쿼리 -->
<update id="updateGalleryBoardInfo" parameterType="BoardGalleryDTO">
    UPDATE gallery_board
    SET title            = #{title},
        content          = #{content},
        child_code_value = #{categoryValue}
    WHERE board_id = #{boardId}
</update>

<!-- 갤러리 게시글 삭제하는 쿼리 -->
<delete id="deleteGalleryBoard">
    DELETE
    FROM gallery_board
    WHERE board_id = #{boardId}
</delete>
```

게시글 저장 시 `String userId`에 해당하는 `user sequence id`를 서브쿼리로 가져와 해당 값을 `user_seq_id`에 넣습니다.

---
## 어려웠던점
썸네일을 저장하는 방법과 우선순위에 따른 썸네일을 교체하는 과정이 어려웠습니다.
썸네일 저장은 `thumbnailator`에 대해 학습하여 원하는 크기와 비율 그리고 파일명을 설정하여 저장할 수 있었습니다. 이미지 업로드 폴더에 썸네일 이름 패턴을 추가하여 썸네일을 저장해도 되나 불필요한 탐색 시간을 줄이기 위해 이미지 업로드와 썸네일 업로드 폴더를 구분하였습니다.

이미지 우선순위는 수정에서 이미지에 대한 우선순위를 조절할 수 있도록 개선 될 수 있습니다.


---
## 다음으로 
마지막으로 문의 게시판을 살펴보겠습니다.

 다른 게시판과 문의 게시판이 가장 큰 차이점은 비밀글로 설정할 수 있다는 것입니다. 