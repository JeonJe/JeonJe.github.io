---
title: "Point 객체 도입으로 가독성 높이기: 사다리 게임 리팩토링 사례"
description: "사다리 게임 구현 과정에서 Point 객체 도입, 책임 분리, 응집도 향상을 통한 객체지향 원칙 적용과 코드 품질 개선 경험"
categories: 글또 객체지향설계
tags: [객체지향, TDD, 클린 코드, Java, 리팩토링, 책임 분리, 응집도, 캡슐화, Point 객체, 가독성]
series: nextstep-tdd
series_order: 3
toc: true
toc_sticky: true
---


## 요약

- Next-step의 "TDD, 클린 코드 with Java " 과정 중 사다리타기 게임 미션을 통해 배운 객체지향 프로그래밍에 대해 작성하였습니다.

---

## 이 글의 목적

- 객체지향 프로그래밍과 클린 코드에 관심이 생긴 2년 차 개발자로서, 제 코드가 어떻게 변화하는지 다루고자 합니다.
- 이 글을 통해 스스로 개선된 부분을 인식하는 것이 첫 번째 목표이며, 이 경험을 공유하는 것이 두 번째 목표입니다.

---

## 사다리타기(생성)

### 1) 미션 요구사항 개발

- 사다리 게임에 참여하는 사람에 이름을 최대5글자까지 부여할 수 있다. 사다리를 출력할 때 사람 이름도 같이 출력한다.
- 사람 이름은 쉼표(,)를 기준으로 구분한다.
- 사람 이름을 5자 기준으로 출력하기 때문에 사다리 폭도 넓어져야 한다.
- 사다리 타기가 정상적으로 동작하려면 라인이 겹치지 않도록 해야 한다.
  - **`|-----|-----|`** 모양과 같이 가로 라인이 겹치는 경우 어느 방향으로 이동할지 결정할 수 없다.

```
참여할 사람 이름을 입력하세요. (이름은 쉼표(,)로 구분하세요)
pobi,honux,crong,jk

최대 사다리 높이는 몇 개인가요?
5

실행결과

pobi  honux crong   jk
    |-----|     |-----|
    |     |-----|     |
    |-----|     |     |
    |     |-----|     |
    |-----|     |-----|
```

이번 미션은 아래 두 가지 항목을 최대한 지키려고 하였습니다.

1. 객체를 최대한 작게 유지하기
2. 스트림과 람다를 적용해 코드의 간결성과 가독성 높이기

사다리 타기 첫 번째 미션에서는 아래 내용이 가장 고민이 되었습니다.

- 사다리 연결 주입 전략을 **Line 객체와 Lines 객체**에 전달할 수도, 전달하지 않을 수도 있다고 생각했습니다.
  - 만약 사다리 생성 전략을 주입받지 않는다면, 게임 요구사항에 맞게 사다리 연결을 생성하는 제너레이터를 내부적으로 만들어 사용하게 됩니다.
  - 즉, 사다리 연결 주입 생성자는 **테스트 시에만 필요한 생성자**가 되며, 이 테스트용 생성자의 사용이 적절한지 고민이 되었습니다.
    - Line : 사다리와 사다리 사이의 연결
    - Lines : 사다리의 연결의 묶음
- 즉, Line, Lines 객체에는 '연결 생성 전략`을 주입 받는 테스트용 생성자가 존재합니다.

**Line 객체 일부**

```java
public class Line {
    private List<Boolean> points = new ArrayList<>();
    private LineGenerateStrategy lineGenerateStrategy;

//사다리 생성 전략을 주입받지 않으면 랜덤으로 생성하는 제너레이터 사용
    public Line(List<Boolean> points) {
        this(points, new RandomLineGenerator());
    }

//테스트를 위해 사다리 연결 주입 전략  사용 
    public Line(List<Boolean> points, LineGenerateStrategy lineGenerateStrategy) {
        this.points = points;
        this.lineGenerateStrategy = lineGenerateStrategy;
    }
    ...
}
```

**Lines 객체 일부**

```java
public class Lines {
    private List<Line> lines = new ArrayList<>();
    private LineGenerateStrategy lineGenerateStrategy;

    public Lines(List<Line> lines, LineGenerateStrategy lineGenerateStrategy) {
        this.lines = lines;
        this.lineGenerateStrategy = lineGenerateStrategy;
    }
  //사다리 생성 전략을 주입받지 않으면 랜덤으로 생성하는 제너레이터 사용
    public Lines(int countOfPerson, Height height) {
        this(countOfPerson, height.getValue(), new RandomLineGenerator());
    }
  //사다리 생성 전략을 주입받지 않으면 랜덤으로 생성하는 제너레이터 사용
    public Lines(int countOfPerson, int height) {
        this(countOfPerson, height, new RandomLineGenerator());
    }
  //테스트를 위해 사다리 연결 주입 전략  사용 
    public Lines(int countOfPerson, int height, LineGenerateStrategy lineGenerateStrategy) {
        for (int i = 0; i < height; i++) {
            lines.add(new Line(countOfPerson, lineGenerateStrategy));
        }
    }

```

코드를 개선하면서 이 고민에 대한 답을 얻을 수 있었습니다.

### 2) 개선하기

1. **변경 영향을 최소화하자**

만약 `Line`과 `Lines` 객체가 스스로 사다리 연결 전략을 생성하게 된다면, 해당 전략이 변경될 경우 두 객체의 생성자를 모두 찾아 수정해야 합니다. 이러한 **변경의 영향을 최소화**하기 위해 `Line`과 `Lines`에서 직접 생성하지 않고, 상위 객체인 `LadderGame`에서 **전략을 주입받도록 설계해야합니다**.

```java
//사다리 생성 전략을 주입받지 않으면 랜덤으로 생성하는 제너레이터 사용 -> 제거한다!
//   public Line(List<Boolean> points) {
//     this(points, new RandomLineGenerator());
//}

//테스트 + 프로덕션용 생성자
public Line(List<Boolean> points, LineGenerateStrategy lineGenerateStrategy) {
  this.points = points;
  this.lineGenerateStrategy = lineGenerateStrategy;
}
```

이렇게 개선함으로써 `Line`과 `Lines` 클래스는 특정 전략 구현에 대해 **강한 결합**에서 벗어나게 되었고, 외부에서 전략을 주입받아 더 유연하게 사용할 수 있게 되었습니다. 결과적으로, **전략이 변경되더라도 코드 수정 없이 다른 전략을 주입받아 사용할 수 있는 유연성**이 크게 향상되었습니다.

### 3) 개선 전 /후 비교

개선 전 첫 구현은 요구사항은 만족했지만, **OCP, SRP, DIP와 같은 객체지향 설계 원칙**을 잘 지키지 못해 변경 시 많은 영향도가 발생하고 유연하지 못한 코드였습니다.

- **OCP 위반**: `Line`과 `Lines` 클래스가 직접 사다리 연결 전략을 생성하여, 전략을 변경할 때마다 코드 자체를 수정해야 했습니다. 이는 **변경에 닫혀있지 않은 상태**였기 때문에, 전략의 변경이 필요할 때마다 코드를 수정해야 했습니다.
- **SRP 위반**: `Line` 클래스는 사다리 연결의 표현 외에도 **연결 전략 생성의 책임**까지 가지고 있어 단일 책임 원칙을 위반했습니다. 이는 클래스의 역할이 불명확하게 되고, 수정 시 더 많은 부분을 고쳐야 해서 유지보수가 어려웠습니다.
- **DIP 위반**: `Line` 클래스가 구체적인 전략 구현 (`RandomLineGenerator`)에 의존했기 때문에, **추상화 대신 구체적인 구현에 의존**하는 구조였습니다. 이는 전략 변경 시 유연성을 떨어트렸습니다.

개선 후, 다음과 같은 효과가 있었습니다.

- **OCP 준수**: 연결 전략을 외부에서 주입받도록 하여, `Line`과 `Lines` 클래스는 **변경에 닫혀 있고, 확장에 열려 있는 구조**가 되었습니다. 전략을 추가하거나 변경할 때 기존 코드를 수정할 필요가 없어졌습니다.
- **SRP 준수**: `Line` 클래스는 사다리의 연결을 표현하는 역할에만 집중하고, 전략 생성의 책임은 외부로 분리되었습니다. 이를 통해 클래스가 **단일 책임**만을 가지게 되어 **가독성**과 **유지보수성**이 향상되었습니다.
- **DIP 준수**: `Line` 클래스가 구체적인 클래스가 아닌 **추상적인 인터페이스**에 의존하도록 개선하여, 의존성 역전 원칙을 준수하는 구조로 변경되었습니다.

---

## 사다리타기(게임생성 & 리팩토링)

### 1) 미션 요구사항 개발

- 사다리 실행 결과를 출력해야 한다.
- 개인별 이름을 입력하면 개인별 결과를 출력하고, "all"을 입력하면 전체 참여자의 실행 결과를 출력한다.

```
참여할 사람 이름을 입력하세요. (이름은 쉼표(,)로 구분하세요)
pobi,honux,crong,jk

실행 결과를 입력하세요. (결과는 쉼표(,)로 구분하세요)
꽝,5000,꽝,3000

최대 사다리 높이는 몇 개인가요?
5

사다리 결과

pobi  honux crong   jk
    |-----|     |-----|
    |     |-----|     |
    |-----|     |     |
    |     |-----|     |
    |-----|     |-----|
꽝    5000  꽝    3000

결과를 보고 싶은 사람은?
pobi

실행 결과
꽝

결과를 보고 싶은 사람은?
all

실행 결과
pobi : 꽝
honux : 3000
crong : 꽝
jk : 5000
```

이번 미션에서는 사다리 게임의 **결과를 계산하고 출력**하는 부분이 어려웠습니다. 우선 초기 구현부터 살펴보겠습니다.

사다리 게임에서 각 참가자가 출발 지점에서 **최종 도착 지점까지 이동**하도록 하는 로직은 `Lines` 객체에 있는 `movePoints`와 `move` 메서드를 통해 구현했습니다.

- `movePoints` **메서드**는 각 참가자들이 **사다리를 타고 이동한 최종 위치**를 계산합니다. 초기 위치(`Position`)를 생성하고 이를 `move` 메서드를 통해 모든 `Line`을 따라가며 이동시킵니다.

```java
//Lines 객체

private final List<Position> positions = new ArrayList<>();
...

public List<Position> movePoints() {
    int countOfPersons = lines.get(INIT).getPoints().size() + 1;
    
  //각 참가자들의 Position는 사다리 연결을 통해 최종 위치로 이동
    IntStream.range(INIT, countOfPersons)
            .mapToObj(Position::new)
            .map(this::move)
            .forEach(positions::add);

    return positions;
}

private Position move(Position position) {
    for (Line line : lines) {
        position = line.move(position);
    }
    return position;
}
```

- `move` **메서드**는 각현재 위치에서 왼쪽 방향으로 이동할 수 있으면 현재 위치를 감소시키고, 오른쪽 방향으로 이동할 수 있으면 현재 위치를 증가시킵니다. 움직일 수 없다면 같은 Position을 반환하도록 하였습니다.

```java
//Line 객체 
public Position move(int position) {
      return move(new Position(position));
  }

public Position move(Position position) {
    if (position.isGreaterThanZero() && points.get(position.decrease().getPosition())) {
        return position.decrease();
    }

    if (position.isLessThan(points.size()) && points.get(position.getPosition())) {
        return position.increase();
    }
    return position;
}
```

새로운 요구사항인 사용자의 사다리게임 결과를 출력하기 위해 각 참가자들의 이름과 최종 위치를 맵핑하는 `LadderResult` 객체를 추가하였습니다.

이 객체의 특정 참가자의 사다리 게임 결과를 조회할 때 사용하는 `getPrizeResult` 메소드의 코드가 잘 읽히지 않아 고민이 되었습니다.

```java
public class LadderResult {
    private static final String ALL = "all";

    private final Map<String, Position> ladderResultMap = new LinkedHashMap<>();

    public LadderResult(Names names, List<Position> ladderResult) {
        if (names.hasDifferentSize(ladderResult.size())) {
            throw new IllegalArgumentException("게임 참가자와 실행 결과의 수가 일치 하지 않습니다.");
        }

        for (int person = 0; person < names.getSize(); person++) {
            ladderResultMap.put(names.getNameOf(person), ladderResult.get(person));
        }
    }

  //특정 참가자의 사다리게임 결과 조회 (가독성이 낮음)
    public Map<String, String> getPrizeResult(Name user, Prizes prizes) {
        Map<String, String> userPrizeResult = new HashMap<>();

        Optional<Map.Entry<String, Position>> userResult = ladderResultMap.entrySet()
                .stream()
                .filter(entry -> entry.getKey().equals(user.getName()))
                .findFirst();

        if (userResult.isPresent()) {
            userPrizeResult.put(userResult.get().getKey(), prizes.getPrize(userResult.get().getValue().getPosition()));
            return userPrizeResult;
        }

        if (user.isNotEqualTo(ALL) && user.isNotEqualTo(EXIT)) {
            throw new IllegalArgumentException("잘못된 이름을 입력하였습니다.");
        }

        ladderResultMap.forEach((key, value) -> userPrizeResult.put(key, prizes.getPrize(value.getPosition())));
        return userPrizeResult;
    }
}

```

### 2) 개선하기

**1.getter를 줄여 가독성을 향상 시켜보자**

```java
Optional<Map.Entry<String, Position>> userResult = ladderResultMap.entrySet()
              .stream()
              .filter(entry -> entry.getKey().equals(user.getName()))
              .findFirst();

      if (userResult.isPresent()) {
          userPrizeResult.put(userResult.get().getKey(), prizes.getPrize(userResult.get().getValue().getPosition()));
          return userPrizeResult;
      }
```

기존 코드에서는 `get().getValue().getPosition()`과 같은 **getter 메서드 호출이 반복**되어 코드의 가독성을 떨어트려 유지보수를 어렵게 만들고, 로직의 의미를 흐리게 합니다.

이를 해결하기 위해 참가자의 이름(Name)과 최종 위치(Position)을 **`UserResult`** 객체로 합쳤습니다.

```java
public class UserResult {
    private Name name;
    private Position position;
		..
}
```

이렇게 개선함으로써 객체는 관련된 데이터를 하나로 묶어 더 높은 응집도를 가지게 되며, 코드의 가독성도 향상됩니다.

또한, 객체를 합쳤기 때문에 인스턴스 변수의 자료구조를 `Map`에서 `List`로 변경할 수 있게 되어 아래와 같은 효과를 얻을 수 있었습니다.

- Map의 Key**를** 가져오는 **getter를 사용하지 않아도 됩니다.**
- `UserResult` 객체의 `isNameEqualTo()` 메서드를 사용해 **특정 참가자를 찾는 로직을 더 간단하게 표현**할 수 있었습니다.

```java
public class LadderResult {
//Map -> List
    private final List<UserResult> userResults = new ArrayList<>();    
    ...

//특정 참가자의 사다리게임 결과 조회
    public Map<String, String> getPrizeResult(Name user, Prizes prizes) {
          Map<String, String> userPrizeResult = new HashMap<>();

        UserResult foundUserResult = userResults.stream()
                .filter(userResult -> userResult.isNameEqualTo(user))
                .findFirst()
                .orElse(null);

        if (Objects.nonNull(foundUserResult)) {
            userPrizeResult.put(foundUserResult.getName(), prizes.getBetting(foundUserResult.getPosition()));
            return userPrizeResult;
        }

        if (user.isNotEqualTo(ALL) && user.isNotEqualTo(EXIT)) {
            throw new IllegalArgumentException("잘못된 이름을 입력하였습니다.");
        }

        userResults.forEach(userResult ->
                userPrizeResult.put(userResult.getName(), prizes.getBetting(userResult.getPosition())
        ));
        return userPrizeResult;
    }
}

```

**2.코드 리팩토링을 통해 코드 가독성 향상 시켜보자**

우선 `lines` 객체의 이름을 **더 명확하게 개선**하였습니다. 처음에는 사다리의 연결 부분을 묶어 표현하기 위해 `lines`라는 이름을 사용했지만, 미션을 진행하면서 이 객체가 **최종적으로 사다리 전체를 표현**하고 있다는 것을 깨닫게 되었습니다. 따라서, 의미를 더 정확하게 전달하기 위해 `lines`를 `ladder`로 변경하여, 코드의 가독성을 높이고 **객체의 역할을 명확히** 드러내도록 개선하였습니다.

다음으로 사다리 연결을 개선하였습니다. 기존에는 `Line` 객체를 생성할 때 **이전 사다리 연결과 현재 연결 상태**를 직접 파악하며 사다리를 구성했습니다. 이로 인해 **로직이 복잡하고 가독성이 떨어지는** 문제가 있었습니다.

```java
public class Line {
  private List<Boolean> points = new ArrayList<>();
  ...
    
  public Line(int countOfPerson, LineGenerateStrategy lineGenerateStrategy) {
      boolean isPrevLineConnected = false;

      for (int i = 0; i < countOfPerson - 1; i++) {
          boolean currentLineConnection = !isPrevLineConnected && lineGenerateStrategy.generate();
          points.add(currentLineConnection);
          isPrevLineConnected = currentLineConnection;
      }
  }
	...
}
```

이를 개선하기 위해, **다리 연결의 각 점을 `Point` 객체로 포장**하여 **사다리 연결과 관련된 비즈니스 로직을 캡슐화**하였습니다. 이를 통해 각 점의 연결 상태를 더 직관적이고 명확하게 관리할 수 있게 되었습니다.

```java
public class Point {
    private final boolean left;
    private final boolean current;

    private Point(boolean left, boolean current) {
        if (left && current) {
            throw new IllegalArgumentException("유효하지 않는 사다리 구성입니다.");
        }
        this.left = left;
        this.current = current;
    }

    public static Point first(boolean current) {
        return new Point(false, current);
    }

    public Point next(boolean current) {
        return new Point(this.current, current);
    }

    public Point last() {
        return new Point(this.current, false);
    }
    
    public Direction move() {
        if (left) {
            return Direction.LEFT;
        }
        if (current) {
            return Direction.RIGHT;
        }
        return Direction.PASS;
    }
   
    ..
}
```

또한 Point로 객체를 포장하여 다음과 같은 효과도 얻었습니다.

1. **정적 팩토리 메소드로 가독성 개선**
  - `Point` 클래스에서는 **정적 팩토리 메소드**를 사용하여 사다리 연결을 더 명확하게 생성할 수 있도록 했습니다.
  - 예를 들어, 사다리의 가장 왼쪽 점은 항상 왼쪽이 연결되지 않아야 하기 때문에, `Point.first(true)` 메서드를 사용하면 명확하게 왼쪽이 연결되지 않은 상태의 **첫 번째 점**을 생성할 수 있습니다.
2. **객체를 통한 비즈니스 로직 캡슐화**
  - 각 점의 연결 상태를 `Point` 객체로 캡슐화하면서, 이전의 복잡했던 `Boolean` 값들에 대한 처리가 **보다 명확하고 직관적인 메서드 호출**로 대체되었습니다.
  - 예를 들어, `Point.first(true).next(true)`를 통해 이전 연결 상태와 현재 연결 상태를 직관적으로 표현할 수 있게 되었습니다.
3. **유효성 검사 강화**
  - 두 점이 동시에 연결된 경우(`left`와 `current`가 모두 `true`인 경우)를 허용하지 않도록 **유효성 검사**를 추가하여 **잘못된 사다리 구성**을 방지했습니다. 이를 통해 코드의 안정성이 향상되었습니다.

<br/>
다음으로 앞서 추가한 사다리 연결여부를 가지고 있는 Point객체와 위치를 나타내는 객체 `Position`을 묶은 `LadderPosition` 객체를 만들었습니다.

- 사다리의 각 위치에서 어떤 방향으로 이동할 수 있는지를 명확하게 표현할 수 있습니다.
- **생성자**에서는 `LadderPosition` 객체를 초기화할 때, **위치와 연결 상태를 설정**하여 사다리의 각 지점에서 연결을 명확하게 나타내도록 했습니다.

```java

public class LadderPosition {
    private final Position position;
    private final Point point;

    public LadderPosition(int position, boolean left, boolean current) {
        this(new Position(position), Point.first(left).next(current));
    }

    public LadderPosition(Position poisition, Point point) {
        this.position = poisition;
        this.point = point;
    }

    public Position move() {
        if (point.move() == Direction.RIGHT) {
            return position.left();
        }
        if (point.move() == Direction.LEFT) {
            return position.right();
        }
        return position;
    }

    public Direction getDirection() {
        return point.move();
    }

    public boolean hasRightConnection() {
        return point.move() == Direction.RIGHT;
    }

}
```

이제 **위치 이동의 책임**을 `LadderPosition`에 위임할 수 있게 되어, `Line` 클래스는 사다리의 연결 상태에만 집중할 수 있게 되었습니다.

결과적으로, `Line` 클래스의 이동 로직이 간단해지고, 각 객체의 **책임이 명확하게 분리**되어 **가독성과 유지보수성**이 높아졌습니다.

```java
public Line(int countOfPerson, LineGenerateStrategy lineGenerateStrategy) {
    boolean isPrevLineConnected = false;

    for (int i = 0; i < countOfPerson - 1; i++) {
        boolean currentLineConnection = !isPrevLineConnected && lineGenerateStrategy.generate();
        ladderPositions.add(new LadderPosition(i, isPrevLineConnected, currentLineConnection));
        isPrevLineConnected = currentLineConnection;
    }

    ladderPositions.add(new LadderPosition(new Position(countOfPerson - 1), Point.first(isPrevLineConnected).last()));
}

	...
//기존 move 메소드
//public Position move(Position position) {
//    if (position.isGreaterThanZero() && points.get(position.decrease().getPosition())) {
//        return position.decrease();
//    }

//    if (position.isLessThan(points.size()) && points.get(position.getPosition())) {
//        return position.increase();
//    }
public Position move(Position position) {
    return ladderPositions.get(position.getPosition()).move();
}

```

### 3) 개선 전 /후 비교

**개선 후**에는 다음과 같은 변화가 있었습니다

- `UserResult`, `Point`, `LadderPosition` 등의 객체가 생성되었습니다.
- **가독성 향상**: UserResult 객체를 생성하여복잡했던 로직을 **캡슐화**하고 `getter`호출을 줄여 **더 직관적인 코드**로 개선되었습니다.
- **책임의 단일화**: `Line` 클래스는 사다리의 연결에만 집중하고, 이동과 관련된 책임은 `LadderPosition`으로 위임하여 각 클래스가 **하나의 역할**에 충실하도록 설계되었습니다.


### 4) 소소한 피드백
리뷰어님의 소소한 의견도 반영하여 코드의 품질을 개선시켜나갔습니다.
- **인스턴스 변수명에 자료형 붙이지 않기 (`ladderResultMap`)**
  - 자료형이 변경될 경우 변수명도 함께 수정해야 하는 불편함이 있습니다. 또한, IDE나 선언부에서 자료형을 쉽게 확인할 수 있으므로 변수명에 자료형(`Map`)을 붙이지 않는 것이 더 적절할 수 있습니다.
- **메서드 명명 개선 (`increase`, `decrease` → `moveLeft`, `moveRight`)**
  - 사다리 위치를 이동하는 메서드명을 `increase`, `decrease`에서 `moveLeft`, `moveRight`로 변경하면 이동 방향이 명확하게 표현될 수 있습니다.

---

## 느낀 점

이번 사다리타기 미션을 통해서는

- 객체지향 설계 원칙인 `OCP`, `DIP`, `SRP` 위반한 코드를 고쳐나가면서, 객체지향을 적용했을 때 **변경 영향도가 낮아지고**과 **유지보수성이 높아진다**는 것을 느낄 수 있었습니다.
- 객체들의 **역할 분리**와 **책임 단일화**통해 각 객체의 역할이 더욱 명확해졌습니다.

![image.png](/assets/img/2024-11-23-geultto-ladder-game-with-tdd-and-clean-code/image.png)

-  개발을 통해 도메인 지식을 발견하고, 이를 더 명확히 표현하는 것이 리팩토링이라는 것을 느꼈습니다.
  - 객체의 이름을 `lines`에서 `ladder`로 변경하여, 객체의 역할을 더욱 명확하게 나타내고자 했습니다.
  - 사다리 위치와 관련된 메서드명을 `increase`, `decrease`에서 `left`, `right`로 변경하니 코드가 더 자연스럽게 읽혔습니다.
