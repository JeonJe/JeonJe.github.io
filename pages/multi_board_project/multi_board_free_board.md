

private int boardId;
//    private int commentId;
//    private Date createdAt;
//    private String content;
//    private String userId;

Error attempting to get column 'user_id' from result set.  Cause: java.sql.SQLDataException: value 'test' cannot be decoded as Integer
; value 'test' cannot be decoded as Integer


    private int commentId;
    private String userId;
    private String content;
    private Date createdAt;
    private int boardId;

db select순서랑 연관

@Builder  애노테이션을 사용 할 때
SQL query 의 필드 순서와
데이터 모델의 필드 순서가 달라서 라고 한다.. 맞춰줘야하다니


---
undefined 와 null차이점 

undefined는 변수가 선언되었지만 값을 갖지 않을 때 사용됩니다. 다시 말해, 변수가 정의되었지만 아직 값이 할당되지 않았거나, 존재하지 않는 객체의 프로퍼티에 접근하려고 할 때 반환되는 값
null은 변수가 값이 없음을 나타내는 특별한 값입니다. 명시적으로 변수에 값이 없음을 할당하기 위해 사용됩니다.

