---
title: "읽기 좋은 코드 작성법: 추상화, 논리적 사고, 객체지향 원칙 실전 적용기"
description: "박우빈님의 'Readable Code' 강의에서 배운 추상화 레벨 통일, 사고의 흐름 개선, 객체지향 패러다임 적용, 코드 가독성 향상 기법의 실용적 정리"
categories: cleancode
tags: [cleancode, 코드품질, 추상화, 객체지향, SOLID원칙, 리팩토링, 가독성, 코드작성법, 개발자역량]
---

>   [박우빈님의 Readable Code: 읽기 좋은 코드를 작성하는 사고법](https://www.inflearn.com/course/readable-code-%EC%9D%BD%EA%B8%B0%EC%A2%8B%EC%9D%80%EC%BD%94%EB%93%9C-%EC%9E%91%EC%84%B1%EC%82%AC%EA%B3%A0%EB%B2%95)에서 학습한 내용을 정리한 글입니다.
## 1. 추상

### 클린 코드를 추구하는 이유는?

코드가 잘 읽히기 위해서 = 유지보수 하기가 수월하다 = 시간 & 자원이 절약 된다.

### 추상과 구체

추상이란 중요한 정보는 가려내어 남기고, 덜 중요한 정보는 생략하여 버리는 것이다.

적절한 추상화는 복잡한 데이터와 복잡한 로직을 단순화하여 **이해하기 쉽도록 돕는다**

### 추상으로부터 구체를 유추하지 못하는 이유들

- 추상화 과정에서 중요한 정보를 가려내지 못하는 경우
- 해석자와 공유하는 문맥이 없는 경우
  - 중요한 정보의 기준이 작성자와 해석자가 다를 수 있다.
  - 도메인 영역 별 추상화 기준이 다를 수 있다.
    - 예) 원격 진료의 **종료**와 결제 종료의 **종료**는 다르다

적절한 추상화는 해당 **도메인의 문맥** 안에서 중요한 **핵심** 개념만 **가려내어 표현**하는 것이다.

### 이름은

이름 짓기는 추상적 사고를 기반으로 한다.

- 표현하고자 하는 구체적 내용에서 중요한 핵심 개념만 추출하여 잘 드러내는 표현이다
- 도메인 문맥안에서 이해되는 용어이다.

#### **단수와 복수 구분하기**

데이터가 단수인지, 복수인지를 나타내는 것만으로도 중요한 정보를 같이 전달하는 것이다.

#### **이름 줄이지 않기**

관용어처럼 많은 사람들이 사용하는 줄임말 외에는 줄여서 사용하는 것보다 풀어서 사용하는게 좋다. 많은 사람들이 사용하는 말은  줄일 수 있는데 그 이유는 문맥이 있기 때문이다.

#### **은어 및 방언 사용하지 않기**

새로운 사람이 팀에 합류 했을 때 바로 이해할 수 있어야 한다

필요하다면 도메인 용어를 먼저 정의한다 (/w team)

#### **좋은 코드를 보고 습득하기**

비슷한 상황에서 자주 사용하는 단어와 개념을 습득하는 것이 좋다.

- ex. pool, candidate, threshold

### 메서드 선언부는

- 추상화된 구체를 유추할 수 있는 적절한 의미가 담긴 이름이여야 한다.
- 파라미터와 연결지어 더 풍부한 의미를 전달 할 수 있다.
- 파라미터의 타입, 개수, 순서를 통해 추가적인 의미 전달이 가능하다
  - 파라미터는 외부 세계와 소통하는 창이라고 보면 된다.
- 메서드 시그니처에 납득이 가는 타입의 반환값을 돌려줘야한다.
- void 대신 반환할 값이 있는지 고민해본다.
  - 반환값이 있다면 테스트가 쉬워질 수 있다.

### 추상화 레벨

**하나의 세계 안에서는 추상화 레벨이 동등해야한다.**

변경 전 코드는 추상화 레벨이 높은데, gameStatus == 1와 같은 코드 때문에 추상화 레벨이 갑자기 낮아지면 가독성이 낮아진다.

변경 전

```java
showGameStartComments();
Scanner scanner = new Scanner(System.in);
initializeGame();
while (true) {
    showBoard();
    if (gameStatus == 1) {
        System.out.println("지뢰를 모두 찾았습니다. GAME CLEAR!");
        break;
    }

```

변경 후

```java
showGameStartComments();
Scanner scanner = new Scanner(System.in);
initializeGame();
while (true) {
    showBoard();
    if (doesUserWinTheGame()) {
        System.out.println("지뢰를 모두 찾았습니다. GAME CLEAR!");
        break;
    }
```

```java
private boolean doesUserWinTheGame() {
	return gameStatus == 1;
}
```

### 매직 넘버, 매직 스트링

의미를 갖고 있으나 상수로 추출되지 않는 숫자나 문자열 등을 말한다. 상수로 추출하여 이름을 짓고 의미를 부여하여 가독성과 유지보수성을 향상 시킬 수 있다

```java
    public static final int BOARD_ROW_SIZE = 8;
    public static final int BOARD_COL_SIZE = 10;
    private static final String[][] BOARD = new String[BOARD_ROW_SIZE][BOARD_COL_SIZE];
    private static final Integer[][] NEARBY_LAND_MINE_COUNTS = new Integer[BOARD_ROW_SIZE][BOARD_COL_SIZE];
    private static final boolean[][] LAND_MINES = new boolean[BOARD_ROW_SIZE][BOARD_COL_SIZE];
    public static final int LAND_MINE_COUNT = 10;
    public static final String FLAG_SIGN = "⚑";
    public static final String LAND_MINE_SIGN = "☼";
    public static final String CLOSED_CELL_SIGN = "□";
    public static final String OPENED_CELL_SIGN = "■";
    
    private static int gameStatus = 0; // 0: 게임 중, 1: 승리, -1: 패배
```

TIP) Mac Intellij 상수 추출 단축키 : option + commmand + c

## 2. 논리, 사고의 흐름

### Early Return

`else`의 코드를 읽을 때 앞선 분기의 조건들을 계속 기억하고 있게 된다.

```java
if( a > 3 ) {
...
} else if ( a <= 3 && b > 1 ) {
...
} else {
...
}
```

아래와 같이 리턴으로 앞선 조건을 기억하지 않도록 하는 것이 Early Return 이다. (else의 사용을 피한다)

```java
void extracted() {

if( a > 3 ) {
...
	return 
}

if ( a <= 3 && b > 1 ) {
...
	return 
}
...

}
```

변경 전

```java
  if (doseUserChooseToPlantFlag(userActionInput)) {
      BOARD[selectedRowIndex][selectedColIndex] = FLAG_SIGN;
      checkIfGameIsOver();
  } else if (doseUserChooseToOpenCell(userActionInput)) {
      if (isLandMineCell(selectedRowIndex, selectedColIndex)) {
          BOARD[selectedRowIndex][selectedColIndex] = LAND_MINE_SIGN;
          changeGameStatusToLose();
          continue;
      } else {
          open(selectedRowIndex, selectedColIndex);
      }
      checkIfGameIsOver();
  } else {
      System.out.println("잘못된 번호를 선택하셨습니다.");
  }

```

변경 후

```java
private static void actOnCell(String userActionInput, int selectedRowIndex, int selectedColIndex) {
    if (doseUserChooseToPlantFlag(userActionInput)) {
        BOARD[selectedRowIndex][selectedColIndex] = FLAG_SIGN;
        checkIfGameIsOver();
        return;
    }

    if (doseUserChooseToOpenCell(userActionInput)) {
        if (isLandMineCell(selectedRowIndex, selectedColIndex)) {
            BOARD[selectedRowIndex][selectedColIndex] = LAND_MINE_SIGN;
            changeGameStatusToLose();
            return;
        }
        open(selectedRowIndex, selectedColIndex);
        checkIfGameIsOver();
        return;
    }
    System.out.println("잘못된 번호를 선택하셨습니다.");
}
```

### 사고의 depth 줄이기

중첩 분기문, 중첩 반복문을 메소드 단위로 나누어 `사고의 depth`를 줄일 수 있다.

변경 전

```java
for(int i = 0; i < 20; i++){
      for(int j = 20; j < 30; j++) {
          if( i >= 10 && j < 25) {
              doSomething();
          }
      }
  }
```

변경 후

```java
for(int i = 0; i < 20; i++){
  doSomethingWith(i)
}

private void doSomethingWith(int i) {
  for(int j = 20; j < 30; j++) {
      doSomethingWIthIJ(i,j)
  }
}

private void doSomethingWith(int i){
  for (i >= 10 && j < 25) {
      doSomething():
  }
}
```

단, 무조건 depth을 1단계로 낮추라는 것은 아니다. 추상화를 통한 사고 과정의 depth를 줄이는 것이 중요하다.

만약 2중 중첩 구조로 표현하는 것이 사고 하는데 더 낫다고 판단한다면 depth를 줄이지 않는 것이 더 좋은 선택이다.

```java
private static boolean isAllCellIsOpened() {
    boolean isAllOpened = true;
    for (int row = 0; row < BOARD_ROW_SIZE; row++) {
        for (int col = 0; col < BOARD_COL_SIZE; col++) {
            if (BOARD[row][col].equals(CLOSED_CELL_SIGN)) {
                isAllOpened = false;
            }
        }
    }
    return isAllOpened;
}
```



```java
	
private static boolean isAllCellIsOpened() {
    return Arrays.stream(BOARD)
            .flatMap(Arrays::stream)
            .noneMatch(cell -> cell.equals(CLOSED_CELL_SIGN));
}
//보드의 각셀(string)을 1차원으로 평탄화하여 CLOSED_CELL_SIGN과 매치하는 것이 하나도 없으면 true
```

#### 사용할 변수는 가깝게 선언하여 사용하기

만약 변수가 로직에서 멀리 있다면 뇌에서 계속 변수를 기억하고 있어야 한다.

### 공백 라인을 대하는 자세

공백 라인도 의미를 가진다. 복잡한 로직을 의미 단위를 나누어 보여줄 수 있다.

### 부정어를 대하는 자세

부정어는 코드를 이해할 때 추가적인 사고가 필요하다.

```java
if(!left) {

}
```

부정어를 사용하지 않고 아래와 같이 한번에 이해할 수 있도록 코드를 작성하는 것이 좋다

```java
if(right)

if(notLeft)
```

즉 부정어구(!)는 부정어를 사용하는 경우엔 부정의 의미를 담은 다른 단어가 있으면 해당 단어를 사용하고

아니면 부정어구로 메서드명을 사용한다.

변경 전

```java
for (int row = 0; row < BOARD_ROW_SIZE; row++) {
  for (int col = 0; col < BOARD_COL_SIZE; col++) {
      int count = 0;
      if (!isLandMineCell(row, col)) {
          if (row - 1 >= 0 && col - 1 >= 0 && isLandMineCell(row - 1, col - 1)) {
              count++;
              ...
              
```

변경 후

부정연산자를 없애고 코드의 순서를 변경한다.

```java
  for (int row = 0; row < BOARD_ROW_SIZE; row++) {
      for (int col = 0; col < BOARD_COL_SIZE; col++) {
          if (isLandMineCell(row, col)) {
              NEARBY_LAND_MINE_COUNTS[row][col] = 0;
              continue;
          }
          int count = countNearbyLandMines(row, col);
          NEARBY_LAND_MINE_COUNTS[row][col] = count;
      }
  }
```

### 해피케이스와 예외 처리

예외처리를 잘하는 방법은 무엇일까?

- 예외가 발생할 가능성을 낮춘다
- 어떤 값에 대해 검증이 필요한 부분은 주로 외부와의 접점이다
  - 사용자 입력, 객체 생성자, 외부 서버의 요청
- 의도한 예외와 예상치 못한 예외를 구분하자
  - 사용자에게 보여줄 예외와 개발자가 보고 처리해야할 예외를 구분한다.

#### NULL을 대하는 자세

- 항상 `NullPointException`을 방지하는 것을 생각하자
  - cell.equals(상수) 보다는 `상수.equals(cell)`이 안전하다.
- 메서드 설계 시 `return null`을 자제하고, 필요하다면 `Optional` 사용을 고민한다.

### Optional은?

- Optional은 비싼 객체이기 때문에 꼭 필요한 상황에서 반환 타입에 사용한다
- **Optional을 파라미터로 받지 않도록한다.**
  - Optional가진 데이터가 null인지, 아닌지, Optional 그 자체가 Null인지를 체크해줘야한다
- Optional을 반환받았다면 최대한 빠르게 해소한다.
  - isPresent() + get() 대신 orElseGet(), orElseThrow(), ifPresent(), ifPresentOrElse() 등을 사용한다
  - **orElse(), orElseGet(), orElseThrow() 차이를 숙지하는 것 좋다.**
    - orElse 괄호 안에는 항상 실행된다. 확정된 값일 때 사용한다
    - orElseGet 괄호 안에는 null인 경우 실행된다. 람다식으로 값을 제공하는 동작을 정의해야한다.


## 3. 객체 지향 패러다임

### 객체지향 설계하기

- 객체에서 공개 메서드 선언부를 통해 외부 세계와 소통한다. 각 메서드의 기능은 개체의 책임을 드러내는 창구이다.
- 객체의 책임이 나누어짐에 따라 객체 간 협력이 발생한다.

#### 객체가 제공하는 것

관심사가 한 군데로 모여 유지보수성이 높아진다. 예로 객체 내부에서 객체가 가진 데이터 유효성 검증을 책임질 수 있다. 또한, 여러 객체를 사용하는 입장에서 구체적인 구현에 신경쓰지 않고 보다 높은 레벨에서 도메인 로직을 다룰 수 있다.

#### 새로운 객체를 만들 때 주의할 점

- **1개의 관심사로 명확하게 책임이 정의 되었는지 확인한다.**
  - 객체를 만듦으로써 외부 세계와 어떤 소통을 하려고 하는지 생각하기
- 생성자, 정적 팩토리 메소드에서 유효성 검증이 가능하다
- **setter 사용을 피하자**
  - 데이터는 불편이 최고이다. 만약 데이터가 변하더라도 객체가 핸들링 할 수 있어야 한다
  - 만약 외부에서 가지고 있는 데이터로 데이터를 변경해야한다면 `set`이라는 단순한 이름보다 `update`와 같이 의도를 나타내는 네이밍을 고려할 필요가 있다.
- **getter도 처음엔 사용을 자체하자.**
  - 객체에 메시지를 보내자
    - findAge() ≥ 19 보단 isAgeGreaterThanOrEqualTo(19) 로 사용하자
- 필드의 수는 적을 수로 좋다
  - 단, 미리 가공하는 것이 성능이 더 좋은 상황이라면 필드로 가지고 있는 것도 OK

### 객체 설계하기

직접 생성자를 사용하기 보다 정적 팩토리 메서드를 사용해 이름을 줄 수 있고 추가적인 검증을 가져갈 수 있다.

```java

public class Cell {
    private static final String FLAG_SIGN = "⚑";
    private static final String LAND_MINE_SIGN = "☼";
    private static final String UNCHECKED_SIGN = "□";
    private static final String EMPTY_SIGN = "■";

    private int nearbyLandMineCount;
    private boolean isLandMine;
    private boolean isFlagged;
    private boolean isOpened;

    public Cell(int nearbyLandMineCount, boolean isLandMine, boolean isFlagged, boolean isOpened) {
        this.nearbyLandMineCount = nearbyLandMineCount;
        this.isLandMine = isLandMine;
        this.isFlagged = isFlagged;
        this.isOpened = isOpened;
    }

    public static Cell of(int nearbyLandMineCount, boolean isLandMine, boolean isFlagged, boolean isOpened) {
        return new Cell(nearbyLandMineCount, isLandMine, isFlagged, isOpened);
    }

    public static Cell create() {
        return Cell.of(0, false, false, false);
    }

    public void tunOnLandMine() {
        this.isLandMine = true;
    }

    public void updateNearbyLandMineCount(int count) {
        this.nearbyLandMineCount = count;
    }

    public void flag() {
        this.isFlagged = true;
    }

    public void open() {
        this.isOpened = true;
    }

    public boolean isChecked() {
        return isFlagged || isOpened;
    }

    public boolean isLandMine() {
        return this.isLandMine;
    }

    public boolean isOpened() {
        return isOpened;
    }

    public boolean hasLandMineCount() {
        return this.nearbyLandMineCount != 0;
    }

    public String getSign() {
        if (isOpened) {
            if (isLandMine) {
                return LAND_MINE_SIGN;
            }
            if (hasLandMineCount()) {
                return String.valueOf(nearbyLandMineCount);
            }
            return EMPTY_SIGN;
        }

        if (isFlagged) {
            return FLAG_SIGN;
        }

        return UNCHECKED_SIGN;
    }
}

```

setter를 사용하지 않고 getter도 사용을 최대한 피한다

셀이 모두 열려있는지 판단하는 로직이다.

```java
 private static boolean isAllCellIsOpened() {
      return Arrays.stream(BOARD)
              .flatMap(Arrays::stream)
              .noneMatch(CLOSED_CELL_SIGN::equals);
  }
```

부정 & 부정 비교를 긍정으로 바꾸면 훨씬 더 코드가 직관적이게 된다.

```java
 private static boolean isAllCellChecked() {
      return Arrays.stream(BOARD)
              .flatMap(Arrays::stream)
              .allMatch(Cell::isChecked);
  }
```

보드를 그리는 책임은 Game에 있기 때문에 아래에서는 getSign을 사용한다

```java

   private static void showBoard() {
      System.out.println("   a b c d e f g h i j");
      for (int i = 0; i < BOARD_ROW_SIZE; i++) {
          System.out.printf("%d  ", i + 1);
          for (int j = 0; j < BOARD_COL_SIZE; j++) {
              System.out.print(BOARD2[i][j].getSign() + " ");
          }
          System.out.println();
      }
      System.out.println();
  }
```

Cell이 열렸다/ 닫혔다 개념과 사용자가 체크했다 개념은 다르다

예) 깃발은 닫혀있지만 체크했으므로 게임 종료 조건의 일부가 된다.

**변경 전**

sign(String) 기반의 게임 판에서 상황에 따라 표시할 sign을 갈아끼웠다

**변경 후**
Cell이라는 정보를 담을 공간인 객체를 생성한다

게임판은 Cell을 갈아끼우는 곳이 아니라 사용자 행위에 따라 Cell의 상태를 변화시키는 방향으로 가야한다.

이렇게 리팩토링을 진행하며 도메인 지식을 발견해나간다.

아래는 지뢰게임에서 지뢰를 심는 부분이다.

```java
for (int i = 0; i < LAND_MINE_COUNT; i++) {
        int col = new Random().nextInt(BOARD_COL_SIZE);
        int row = new Random().nextInt(BOARD_ROW_SIZE);
        LAND_MINES[row][col] = true;
    }

```

지뢰 정보를 Cell 객체로 옮기고 지뢰를 켜달라는 메시지를 전달한다.

```java
for (int i = 0; i < LAND_MINE_COUNT; i++) {
        int col = new Random().nextInt(BOARD_COL_SIZE);
        int row = new Random().nextInt(BOARD_ROW_SIZE);
        BOARD[row][col].tunOnLandMine();
    }
```

해당 셀의 주변 지뢰 개수를 설정하는 코드이다.

```java
for (int row = 0; row < BOARD_ROW_SIZE; row++) {
          for (int col = 0; col < BOARD_COL_SIZE; col++) {
              if (isLandMineCell(row, col)) {
                  NEARBY_LAND_MINE_COUNTS[row][col] = 0;
                  continue;
              }
              int count = countNearbyLandMines(row, col);
              NEARBY_LAND_MINE_COUNTS[row][col] = count;
          }
      }
```

변경 후에는 초기 생성자에서 주변 지뢰의 개수를 0으로 초기화 해주었기 때문에 지뢰 셀이면 continue만 실행한다. 추가로, setter라는 이름을 사용하기 보다 update라는 이름으로 주변 지뢰 갯수를 입력한다.

```java
for (int row = 0; row < BOARD_ROW_SIZE; row++) {
          for (int col = 0; col < BOARD_COL_SIZE; col++) {
              if (isLandMineCell(row, col)) {
                  continue;
              }
              int count = countNearbyLandMines(row, col);
              BOARD[row][col].updateNearbyLandMineCount(count);
          }
      }
```

아래는 셀을 여는 함수이다.

```java
private static void open(int row, int col) {
      if (row < 0 || row >= BOARD_ROW_SIZE || col < 0 || col >= BOARD_COL_SIZE) {
          return;
      }

      if (!BOARD[row][col].equals(CLOSED_CELL_SIGN)) {
          return;
      }

      if (isLandMineCell(row, col)) {
          return;
      }

      if (NEARBY_LAND_MINE_COUNTS[row][col] != 0) {
          BOARD[row][col] = String.valueOf(NEARBY_LAND_MINE_COUNTS[row][col]);
          return;
      } else {
          BOARD[row][col] = OPENED_CELL_SIGN;
      }
      ...
      
```

변경 후에는 셀의 값을 가져와 직접 비교하지 않고 `isOpened` 메소드로 메시지를 보내 상태를 확인한다.

변경 전 코드에서는 주변 지뢰 개수를 조회 후 다시 BOARD에 값을 넣고 있었다. 리팩토링 후에는 Cell의 주변 지뢰 갯수는 이미 Cell에 저장이 되어 있기 때문에 이 부분도 객체에 메시지를 보내 처리할 수 있다.

```java

    private static void open(int row, int col) {
        if (row < 0 || row >= BOARD_ROW_SIZE || col < 0 || col >= BOARD_COL_SIZE) {
            return;
        }
        if (BOARD[row][col].isOpened()) {
            return;
        }
        if (isLandMineCell(row, col)) {
            return;
        }

        BOARD[row][col].open();

        if (BOARD[row][col].hasLandMineCount()) {
            return;
        }
```

### SOLID

#### SRP(Single Responsibility Principle)

- 하나의 클래스는 단 한가지의 변경 이유(책임)만을 가져야 한다
- 객체가 가진 공개 메서드, 필드, 상수 등이 “**해당 객체의 단일 책임에 의해서만 변경 되는가?”**를 고민해본다.
- 장점
  - 관심사의 분리
  - 높은 응집도, 낮은 결합도

책임을 볼 줄 아는 것이 중요하다.(경험의 영역)

지뢰 게임에서는? 아래와 같은 책임으로 분리 해 볼 수 있을 것이다.

- 게임 어플리케이션 클래스
- 지뢰찾기 게임 클래스
- 콘솔 입력 핸들러
- 콘솔 출력 핸들러
- 게임 보드 클래스

#### OCP (Open-Closed Principle)

- 확장에는 열려 있고, 수정에는 닫혀있어야 한다
  - 기존 코드의 변경 없이 시스템 기능이 확장을 할 수 있어야 한다
- `추상화`와 `다형성`을 활용해서 OCP를 지킬 수 있다.

지뢰 게임에서는? 게임레벨을 런타임에 받아서 게임보드판의 사이즈를 변경한다.

#### LSP (Liskov Substitution Principle)

- 자식 클래스는 부모 클래스의 책임을 준수하며, 부모 클래스의 행동을 변경하지 않는다
- LSP를 위반하면 상속 클래스를 사용할 때 오동작, 예상 밖의 예외가 발생하거나 이를 방지하기 위한 불필요한 타입 체크가 동반 될 수 있다.

#### ISP (Interface Segregation Principle)

- 클라이언트는 자신이 사용하지 않는 인터페이스에 의존하면 안된다
- ISP를 위반하면 불필요한 의존성으로 인해 결합도가 높아지고, 특정 기능의 변경이 여러 클래스에 영향을 미칠 수 있다

#### DIP (Dependency Inversion Principle)

- 상위 수준의 모듈은 하위 수준의 모듈에 의존해서는 안된다. 둘 모두 추상화에 의존해야한다
- 의존성의 순방향 : 고수준 모듈이 저수준 모듈을 참조하는 것
- 의존성의 역방향 (X) : 고수준, 저수준 모듈이 모두 추상화에 의존하는 것

**DIP와 혼동하기 쉬운 용어**

**DI(Dependency Injection)**

필요한 의존성을 직접 생성하는 것이 아니라 외부에서 주입 받는다

- A란 객체가 B라는 객체를 필요하면 제 3자가 둘의 관계(의존성)을 맺어줘야한다.
- 스프링에서는 이 연결을 스프링 컨텍스트(IoC)가 수행한다

**IoC(Inversion Of Control)**

프로그램의 흐름을 개발자가 아닌 프레임워크가 담당하도록 하는 것이다. 즉 객체의 생명주기, 의존관계 연결 등을 컨테이너가 관리해준다.

- 제어의 순방향은 개발자 → 프로그램(프레임워크)
- 제어의 역방향은 프로그램(프레임워크) → 개발자

## 4. 객체 지향 적용하기

### 상속과 조합

- 상속보다 조합을 사용하자
  - 상속은 수정이 어렵다. 부모와 자식의 결합도가 높아진다
- 조합과 인터페이스를 활용하는 것이 유연한 구조이다.
  - 상속을 통한 코드의 중복 제거가 주는 이점보다 중복이 생기더라도 유연한 구조 설계가 주는 이점이 더 크다

### Value Object

- 도메인의 어떤 개념을 추상화하여 표현한 값 객체이다.
- 값으로 취급하기 위해 불편성, 동등성, 유효성 검증등을 보장해야한다
  - 불변성 : final 필드, setter 금지
  - 동등성 : 서로 다른 인스턴스여도 내부의 값이 같으면 같은 값 객체로 취급. equals() & hashCode() 재정의 필요
  - 유효성 검증 : 객체가 생성되는 시점에 값에 대한 유효성 보장

#### VO vs Entity

#### Entity는

- 식별자가 존재한다.
- 식별자가 아닌 필드의 값이 달라도, 식별자가 같으면 동등한 객체로 취급한다
- `equals()` & `hashCode()`도 식별자 필드만 가지고 재정의할 수 있다
- 식별자가 같은데 식별자가 아닌 필드의 값이 다른 두 인스턴스가 있다면 같은 Entity가 변화한 것으로 이해할 수 있다

#### VO는

- 식별자가 없다
- 내부의 모든 값이 다 같아야 동등한 객체로 취급한다

### 일급 컬렉션

#### 일급 시민

- 다른 요소에게 사용 가능한 모든 연산을 지원하는 요소
  - **변수**로 할당될 수 있다
  - **파라미터**로 전달될 수 있다
  - **함수**의 결과로 반환될 수 있다
  - 예시) 일급 함수
    - 함수형 프로그래밍 언어에서 함수는 일급시민이다
      - 함수는 변수에 할당될 수 있고, 인자로 전달될 수 있고, 함수의 결과로 함수가 반환될 수 있다

#### 일급 컬렉션

- **컬렉션을 포장하면서 컬렉션만을 유일하게 필드로 가지는 객체**
  - 컬렉션을 다른 객체와 동등한 레벨로 다루기 위함
  - 단 하나의 컬렉션 필드만 가져야 함
- 컬렉션을 추상화하여 의미를 담을 수 있고, 가공 로직의 보금자리가 생긴다
  - 가공 로직에 대한 테스트도 작성할 수 있음
- 만약 getter로 컬렉션을 반환할 일이 생긴다면
  - **외부 조작을 피하기 위해 꼭 `새로운 컬렉션`을 만들어서 반환하자**

```java
class CreditCards {
	private final List<CreditCard> cards;
	
	public List<CreditCard> findValidCards() {
		return this.cards.stream()
			.filter(CreditCard::isValid)
			.toList();
	}
}
```

### Enum의 특성과 활용

- Enum은 상수의 집합이며 **상수와 관련된 로직을 담을 수 있다.**
  - 상태와 행위를 한 곳에서 관리할 수 있는 추상화된 객체
- 특정 도메인 개념에 대해 종류와 기능을 명시적으로 표현할 수 있다.
- 변경이 잦은 개념은 Enum보다 DB로 관리하는 것이 좋을 수 있다.
  - 코드의 변경을 통해서만 Enum을 바꿀 수 있기 때문이다.

### 다형성 활용하기

다형성을 활용하면 아래와 같은 반복적인 if 문을 제거할 수 있다.

```java
CellSnapshotStatus status = cellSnapshot.getStatus();
if(status == CellSnapshotStatus.EMPTY) {
	return EMPTY_SIGN;
}
if(status == CellSnapshotStatus.FLAG) {
	return FLAG_SIGN;
}
if(status == CellSnapshotStatus.LAND_MINE) {
	return LAND_MINE_SIGN;
}
if(status == CellSnapshotStatus.UNCHECKED) {
	return UNCHECKED_SIGN;
}

```

우선 OCP를 지키기 위해 변화하는 것과 변화하지 않는 것을 나누어준다.

- 변환하는 것
  - 조건과 행위
  - 구체
- 변하지 않는 것
  - 조건을 만족하는가?
  - 행위를 수행한다
  - 추상

**변하지 않는 것 (추상)**

```java
String cellSign = CellSignProvider.findCellSignFrom(snapshot);
```

**변하는 것 (구체)**

```java
public enum CellSignProvider implements CellSignProvidable{
    EMPTY(CellSnapshotStatus.EMPTY){
        @Override
        public String provide(CellSnapshot cellSnapshot) {
            return EMPTY_SIGN;
        }
    },
    FLAG(CellSnapshotStatus.FLAG){
        @Override
        public String provide(CellSnapshot cellSnapshot) {
            return FLAG_SIGN;
        }
    },
    LANDMINE(CellSnapshotStatus.LAND_MINE){
        @Override
        public String provide(CellSnapshot cellSnapshot) {
            return LAND_MINE_SIGN;
        }
    },
    NUMBER(CellSnapshotStatus.NUMBER){
        @Override
        public String provide(CellSnapshot cellSnapshot) {
            return String.valueOf(cellSnapshot.getNearbyLandMineCount());
        }
    },
    UNCHECKED(CellSnapshotStatus.UNCHECKED) {
        @Override
        public String provide(CellSnapshot cellSnapshot) {
            return UNCHECKED_SIGN;
        }
    },
            ;

    //.... 로직
		
}
```

### 숨겨져 있는 도메인 개념 도출하기

- 도메인 지식은 만드는 것이 아니라 발견하는 것이다.
- 객체 지향은 현실을 100% 반영하는 도구가 아니라 흉내내는 것이다
  - 현실 세계에서 쉽게 인지하지 못하는 개념도 도출해서 사용해야 할 때가 있다
- 설계할 때는 근시적, 거시적 관점에서 최대한 미래를 예측하고 시간이 흘러 틀렸다는 것을 알게되면 **언제든 돌아올 수 있도록 코드를 만들어야한다.**

## 5. 코드 다듬기

### 주석의 양면성

- 주석이 많다?
  - 주석이 많다는 것은 비지니스 요구사항을 코드에 잘 녹이지 못했다는 것이다.
  - 주석에 의존하여 코드를 작성하면, 적절하지 않은 추상화 레벨을 갖게 되어 낮은 품질의 코드가 만들어진다.
- 그럼 주석은 언제 쓸까?
  - 의사 결정의 히스토리를 도저히 코드로 표현할 수 없을 때 주석으로 상세하게 설명한다.
- 주석을 작성할 때 주의사항은?
  - 자주 변하는 정보는 작성을 최대한 피한다
  - 정책 또는 코드가 변경 되었다면 주석도 함께 변경해야한다.
    - 주석이 없는 코드보다, 부정확한 주석이 달린 코드가 더 치명적이다
- 그럼 좋은 주석은?
  - 우리가 가진 모든 표현 방법을 총동원해 코드에 의도를 녹여내고, 그럼에도 불구하고 전달해야 할 정보가 남아있으면 주석으로 사용한다


### 변수와 메서드의 나열 순서

- 변수는 사용하는 순서대로 나열한다
  - 인지적 경제성이 좋아진다.
- 메서드 순서는 객체의 입장에서 고려해보자
  - 퍼블릭 메소드 아래 관련된 프라이빗 메소드 or 퍼블릭 묶음 아래 프라이빗 묶음 으로 나열 할 수 있을 것이다.
- 객체는 협력을 위한 존재이다.
  - 협력을 위해 어떤 기능을 제공할 수 있는지 공개 메서드를 외부 세계에 드러낸다.
    - 강의자는 공개 메서드는 상단에 배치하는 것을 선호
  - 공개 메서드 묶음 안에서도 기준을 가지고 배치하는 것이 좋다.
    - 중요도 순, 종류별로 그룹화하여 배치하면 비슷한 로직의 메서드를 중복으로 만드는 것을 예방할 수 있다.
    - 중요도는 기준은?
      - ex) 상태 변경 >> 판별 ≥ 조회
  - 비공개 메서드는 공개 메서드에서 언급된 순서대로 배치한다
  - 공통으로 사용하는 메서드라면?
    - 가장 하단과 같은 적당한 곳에 배치한다

중요한 것은 나열 순서으로도 의도와 정보를 전달 할 수 있다.

### 패키지 나누기

- 패키지는 문맥으로써 정보를 제공할 수 있다.
  - 클래스 이름이 BinggerGameLevel가 아닌 Binnger로 작성해도 괜찮다. 왜냐하면 gamelevel 패키지안에 있기 때문이다.
  - 패키지를 쪼개지 않으면 관리가 어려워진다.
  - 반대로 패키지를 너무 쪼개도 관리가 어려워진다
- 대규모 패키지 변경은 팀원들과 합의가 필요하다.
  - 공통으로 사용하는 클래스들의 패키지를 한번에 변경하면 추후 충돌이 생길 수 있다
  - 처음에 잘 고민해서 패키지를 나누는 것이 좋다.

### IDE 도움받기

- 코드 포맷 정렬
  - Option + Cmd + L
- 코드 품질
  - Sonarlint
- 포맷 규칙
  - .editorconfig

## 6. 리팩토링 연습

### 리팩토링 포인트

- 추상화 레벨
  - 메소드 추출 등
- 객체로 묶어볼만한 것은 없는지
- 객체지향 패러다임에 맞게 객체들이 상호 협력하고 있는지
- SRP : 책임에 따라 응집도 있게 객체가 나누어져 있는지
- DIP : 의존관계 역전을 적용할만한 곳은 없는지
- 일급 컬렉션

리팩토링 한 단계마다, 그 이유를 설명할 수 있어야 한다.

### 추상화 레벨

- 중복 제거, 메서드 추출
  - return null → optional
  - 파라미터에 Optional 전송은 안티 패턴이다. `ifPresentOrElse` 사용한다.
- 객체에 메시지 보내기
- 커밋은 작게 쪼갠다. 작은 커밋은 작업 파악과 롤백에 용이하다.

## 7. 기억하면 좋은 조언들

### 능동적 읽기

- 복잡하거나 엉망인 코드를 이해할 때는 리팩토링하면서 읽는다
  - 공백으로 단락 구분
  - 메서드와 객체로 추상화
  - 주석으로 이해한 내용 표기
- 리팩토링 후에는 언제든지 돌아갈 수 있는 `git reset —hard`을 사용한다.
  - 이전 커밋으로 돌아감
- 핵심 목표는 도메인 지식을 늘리고 이전 작성자의 의도를 파악하는 것이다.

### 오버 엔지니어링

- 오버 엔지니어링은 필요한 적정 수준보다 더 높은 수준의 엔지니어링을 뜻한다.
- **구현체가 하나인 인터페이스**
  - 인터페이스 형태가 아키텍처 이해에 도움을 주거나, 빠른 시일 내에 구현체가 추가될 가능성이 높다면 좋다
  - 구현체를 수정할 때마다 인터페이스도 수정해야한다
  - 코드 탐색에 영향을 주고, 애플리케이션이 비대해진다.
- **이른 추상화**
  - 정보가 숨겨지기 때문에 복잡도가 높아진다.
  - 후대 개발자들이 의도를 파악하기 어렵다

### 은탄환은 없다

은탄환이라고 불리는 정답은 없다.

- 클린 코드도 은탄환이 아니다
- 실무는 2가지 사이의 줄다리기이다
  - 지속 가능한 소프트웨어의 품질 vs 기술 부채를 안고 가는 빠른 결과물
  - 대부분 회사는 돈을 벌어 성장하고, 시장에서 빠르게 살아남는 것이 목표이다
  - 미래 시점에 잘 고칠 수 있도록 하는 코드 센스가 필요하다. 즉, 클린 코드의 사고법을 기반으로 결정한다.
- 모든 기술과 방법론은 적정 기술의 범위 내에서 사용 되어야 한다
  - 한계까지 연습해보고, 적정 수준, 적정 시점을 깨닫는게 중요하다


## 8.결론

추상과 구체를 넘나들어야 한다

## 99. 책 추천

### 김창준 - 함께 자라기
