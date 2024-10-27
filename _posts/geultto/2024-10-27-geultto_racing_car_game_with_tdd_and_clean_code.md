---
title: 자동차 경주 게임, 근데 이제 TDD랑 클린코드를 곁들인
categories: 글또
tags: [글또]
---


## 요약

- Next-step의 ”TDD, 클린 코드 with Java ” 과정 중 자동차 경주 미션을 통해 TDD와 클린코드에 대해 학습한 내용입니다.  

---
## 이 글의 목적

객체지향 프로그래밍과 클린 코드에 관심이 생긴 2년 차 개발자로서, 제 코드가 어떻게 변화하는지 다루고자 합니다.

이 글을 통해 스스로 어떤 부분이 개선 되었는지를 인식하는 것이 첫 번째 목표이고, 이 경험을 공유하는 것이 두 번째 목표입니다.

4개의 미션 중 첫 번째인 자동차 경주 미션에 대해 아래 내용을 작성했습니다.

- 1) 미션 요구사항 개발
- 2) 피드백을 통해 개선
- 3) 개선 전 /후 비교

교육을 수강하기 전, 저의 상황은 다음과 같았습니다.

- 서비스 레이어에 비지니스 로직을 구현했습니다.🥲
- SOLID 원칙을 알고 있었지만, 실무에서 잘 활용하지 못했습니다🥲
- [인프런 강의 Readable Code: 읽기좋은 코드를 작성하는 사고법](https://www.inflearn.com/course/readable-code-%EC%9D%BD%EA%B8%B0%EC%A2%8B%EC%9D%80%EC%BD%94%EB%93%9C-%EC%9E%91%EC%84%B1%EC%82%AC%EA%B3%A0%EB%B2%95) 수강
- 도서 [오브젝트](https://product.kyobobook.co.kr/detail/S000001766367)  1~5장, 10장~15장을 학습

---
## 미션을 시작하기 전에

객체 지향 프로그래밍… 어렴풋이 알 것 같으면서도 잘 모르겠습니다.

다행히 미션을 진행하는 동안, 객체 지향 프로그래밍 방식을 연습해 볼 수 있도록 구체적인 가이드를 제시해 주었습니다.

- [소트웍스 앤솔러지](https://m.yes24.com/Goods/Detail/3290339)의 `객체지향 생활체조 원칙`
  - 규칙 1: 한 메서드에 오직 한 단계의 들여쓰기(indent)만 한다.
  - 규칙 2: else 예약어를 쓰지 않는다.
  - 규칙 3: 모든 원시값과 문자열을 포장한다.
  - 규칙 4: 한 줄에 점을 하나만 찍는다.
  - 규칙 5: 줄여쓰지 않는다(축약 금지).
  - 규칙 6: 모든 엔티티를 작게 유지한다.
  - 규칙 7: 3개 이상의 인스턴스 변수를 가진 클래스를 쓰지 않는다.
  - 규칙 8: 일급 콜렉션을 쓴다.
  - 규칙 9: getter/setter를 쓰지 않는다.

각 규칙은 객체지향 프로그래밍의 이론을 반영하고 있습니다

객체지향 프로그래밍을 잘 몰라도, 이 원칙을 지키면서 개발하다 보면 자연스럽게 객체지향적인 코드를 익힐 수 있다고 합니다.(믿고 해보겠습니다.)

예로 `규칙 9: getter/setter를 쓰지 않는다`는 아래와 같은 객체지향 프로그래밍 이론을 담고 있습니다.

1. getter와 setter를 사용하게 되면 객체 내부의 상태를 외부에서 직접 접근하지 못하도록 캡슐화하는 의미가 희미해집니다.
  - getter는 내부 데이터를 노출시키고, setter는 외부에서 데이터를 수정할 수 있게 만듭니다
2. getter로 데이터를 꺼내서 값을 비교하는 로직은 비즈니스 로직 안에서 중복적으로 작성될 가능성이 높습니다.
  - 이러한 중복은 버그의 원인이 될 수 있습니다.
3. getter와 setter 사용을 최소화하고, 객체가 수행해야 할 행동을 메시지를 전달 하는 방식을 사용합니다.
  - 객체 밖에서는 객체가 어떤 데이터를 가졌는지 알 수도 없고, 알 필요도 없습니다.
4. 객체는 자신의 상태와 행동에 대해 책임을 지켜가며 외부에서 전달받은 메시지를 처리합니다.

생활 체조 원칙을 포스트잇에 적어 두고, 미션을 진행하면서 최대한 지키려고 노력했습니다. (/w 지렁이🪱 글씨)

![image.png](/assets/img/2024-10-27-geultto_racing_car_game_with_tdd_and_clean_code/image.png)

일부 규칙들은 함께 적용될 때 더욱 큰 효과를 발휘합니다

**객체를 작게 만든다.**

- 규칙 3 : 원시 값을 객체로 포장한다
- 규칙 7: 클래스가 3개 이상의 인스턴스 변수를 가지지 않도록 한다.
- 규칙 8: 일급 컬렉션을 사용하여 컬렉션을 캡슐화한다.

이 규칙들을 지키면 큰 객체가 작은 객체로 세분화되면서, 코드의 응집도가 높아지고 유지보수가 쉬워집니다.

**메소드가 하나의 동작을 한다.**

- 규칙 1: 한 메서드에서는 1단계의 들여쓰기만 사용한다 (예: for문 안에 if문을 중첩하지 않도록 주의한다)
- 규칙 2: else 키워드를 사용하지 않고, early return을 사용하여 코드를 간결하게 한다
- 규칙 4: 한 줄에 점 연산자(.)를 한 번만 사용한다.

물론, 실무에서 모든 원칙을 엄격하게 지키기는 어렵습니다

- 규칙 7은 클래스가 3개 이상의 인스턴스 변수를 가지지 않도록 권장하지만, 실무에서는 때로 유연하게 적용할 필요가 있습니다

가능한 한 원칙을 최대한 지키려는 노력이 중요하다고 생각합니다.

---
## 자동차 경주 시작

### 1) 미션 요구사항 개발

자동차 경주 게임의 요구사항입니다.

- 사용자로부터 자동차 수와 게임 횟수를 입력받는다.
- 랜덤값 범위 0~9중 4 이상의 랜덤 값이 나올 경우 자동차를 전진한다.

```
자동차 대수는 몇 대 인가요?
3
시도할 횟수는 몇 회 인가요?
3

실행 결과
-
-
-

--
-
--

---
--
---
```

객체 지향 생활 체조 원칙을 지키면서, 아래와 같은 구조로 구현하였습니다.

---

1. `GameApplication`
  - RacingCar에게 InputView, ResultView를 주입하고 실행 메시지를 전달합니다.
2. `RacingCar`
  - 게임 안내 문구 노출, 사용자 입력, 라운드 초기화 및 실행 메시지를 전달합니다.
3. `Round`
  - 자동차를 이동시키는 CarController와 움직여야 할 자동차 목록을 가지고 있습니다.
  - 라운드 횟수만큼 CarController에게 자동차 목록의 자동차를 움직이라는 메시지를 전달합니다.
4. `CarController`
  - 랜덤 값 생성기에서 랜덤 값을 가져와 거리가 4 이상이면 자동차의 위치를 4만큼 이동시켜달라는 메시지를 전달합니다.
5. `RandomNumberGenerator`
  - 랜덤 값을 생성합니다. default와 test용 두 가지 구현체를 구현하였습니다.
6. `Car`
  - 자동차 위치를 가지고 있는 객체입니다. 기본 위치로 0을 사용하였습니다.

---

이번 미션에서 가장 고민한 부분은 “**0~9 사이의 랜덤 값 중 4 이상의 랜덤 값일 때만 차를 이동하는 것을 어떻게 테스트할 것인가?**”이었습니다.

객체 내부에서 랜덤 값이나 현재 시간 같은 값이 생성되면 테스트 시 검증이 어려워집니다. 이러한 테스트를 어렵게 만드는 요소는 객체에서 분리해야 합니다.

저는 랜덤 값을 테스트하기 위해 다음과 같은 방식으로 Car 객체로부터 랜덤 값을 분리했습니다.

- CarController를 생성할 때 랜덤 값 생성기를 주입한다.
- moveCar 메소드에서는  랜덤값을 생성하고, 그 값이 4 이상 일 경우 Car 객체를 움직인다.

```java
public class CarController {
    public static final int ALLOWED_MINIMUM_DISTANCE = 4;
    private final RandomNumberGenerator randomNumberGenerator;

    public CarController(RandomNumberGenerator randomNumberGenerator) {
        this.randomNumberGenerator = randomNumberGenerator;
    }

    public void moveCar(Car car) {
        int randomDistance = randomNumberGenerator.generate();
        if (canMove(randomDistance)) {
            car.move();
        }
    }

    private boolean canMove(int distance) {
        return distance >= ALLOWED_MINIMUM_DISTANCE;
    }
}
```

CarController 객체를 생성할 때 어떻게 랜덤 값을 생성할지 정의하는 RandomNumberGenerator를 주입받기 때문에, 테스트 시에는 고정값을 생성하는 Generator를 사용하여 테스트 검증에 활용할 수 있습니다.

```java
//TestRandomNumberGenerator
public class TestRandomNumberGenerator implements RandomNumberGenerator{
    private final int fixedNumber;
    
    public TestRandomNumberGenerator(int fixedNumber) {
        this.fixedNumber = fixedNumber;
    }
    @Override
    public int generate() {
        return fixedNumber;
    }

}

...

//CarControllerTest
@DisplayName("난수값이 4이상이면 차를 움직인다.")
@ParameterizedTest
@ValueSource(ints = {4, 5, 9, 100})
void moveCar(int randomNumber) {
    // given
    TestRandomNumberGenerator testRandomNumberGenerator = new TestRandomNumberGenerator(randomNumber);
    CarController carController = new CarController(testRandomNumberGenerator);

    Car car = new Car();

    // when
    carController.moveCar(car);

    // then
    assertThat(car.getPosition()).isEqualTo(randomNumber);
}
```

### 2) 개선하기

<br/>
**1. 테스트의 목적을 생각해보자.**

4 이상의 랜덤 값으로 자동차 이동을 시키는 기능을 테스트하기 위해 `RandomNumberGenerator` 인터페이스와 `TestRandomNumberGenerator` 구현체를 만들어 사용하였습니다.

분명 더 괜찮은 방법이 있을 것 같았지만 그 방법이 떠오르지 않아 리뷰어님께 질문을 남겼습니다.

리뷰어님께서는 테스트의 목적을 생각하면 좋을 것 같다는 답변을 남겨주셨습니다.

피드백 내용을 간략히 요약해 보았습니다.

- 랜덤 값을 테스트하는 목적은 **자동차의 움직임을 제어**하고 싶기 때문이다.
- 즉, “자동차를 움직인다.”, “자동차를 안 움직인다”으로 고려해 볼 수 있다.
- 자동차를 움직이는 전략, 정지시키는 전략을 주입하여 테스트할 수 있다. (전략 패턴)

저의 기존 테스트 코드는 “랜덤 값이 4 이상일 때 자동차가 움직인다”는 조건에 집중하고 있었습니다. 이 방식도 테스트가 가능하지만, 만약 요구사항이 “**사용자가 입력한 값을 사용한다**”로 변경된다면, 기존의 테스트 코드 역시 수정해야 하는 문제가 있습니다.

리뷰어님의 피드백을 반영하여 자동차의 이동 조건에 관계없이 테스트할 수 있도록, `움직임을 제어하는 전략`을 만들어 적용했습니다.

```java
public class StopStrategy implements MoveStrategy {
    @Override
    public boolean isMovable() {
        return false;
    }
}
```

<br/>
**2. 잘못된 방식의 랜덤 값 테스트**

아래 코드는 생성된 랜덤값을 테스트하는 테스트 코드입니다.

생성된 랜덤값이 10 이하면 랜덤 값이 예상한 대로 생성되었다고 판단하고 테스트에 성공하도록 코드를 작성하였습니다.

```java
@DisplayName("범위 0~10까지 랜덤 값을 얻을 수 있다")
@RepeatedTest(100)
void gerRandomNumber() {
    // given
    DefaultRandomNumberGenerator defaultRandomNumberGenerator = new DefaultRandomNumberGenerator();

    // when
    int result = defaultRandomNumberGenerator.generate();

    // then
    assertThat(result).isNotNegative().isLessThanOrEqualTo(10);
}
```

랜덤 값 테스트에 대해서는 아래와 같은 피드백을 받았습니다.

- 100회 반복 테스트에서 예상한 범위를 벗어나는 랜덤 값이 나왔다면, 그 테스트는 성공일까요? 실패일까요?
- 확률에 의존하는 테스트는 일관된 결과를 보장할 수 없기 때문에, 의미 없는 테스트가 될 수 있습니다.

테스트 코드를 작성할 당시에는 “100번 정도 반복하면 랜덤 값이 주어진 범위 내에서 생성된다는 것을 충분히 보장할 수 있겠지?“라고 생각했습니다.

그러나 피드백을 받고 보니, 100번 이후의 테스트에서 운이 나쁘면 범위를 벗어나는 값이 나올 수 있다는 점을 깨달았습니다. 이런 테스트는 불확실성을 포함하고 있어, 결과가 항상 성공하거나 항상 실패하지 않을 수 있습니다.

테스트는 항상 일관된 결과를 보장해야 합니다. 따라서 확률에 기반한 테스트는 의미가 없다고 판단해 제거했습니다.

<br/>
**3. CarController 객체의 역할이 애매하다.**

랜덤 값 조건에 따라 차를 움직일지 말지 결정하는 CarController 객체의 이름과 역할에 관한 피드백이 있었습니다.

CarController의 이름과 역할을 다시 생각해 보니 그제야 MVC의 컨트롤러랑 이름이 겹칠 수도 있겠다는 생각이 들었습니다.

그리고 자동차가 스스로 움직일지 말지를 결정할 수 있으면 CarController의 역할이 없어지게 됩니다. 즉 불필요한 객체이었습니다.

### 3) 개선 전 /후 비교

1. **테스트가 깔끔해 졌습니다.**
  - 테스트 코드도 프로덕션 코드와 마찬가지로 지속적인 유지보수가 필요합니다. 따라서 모든 경우를 테스트하기보다는 경계값, 예외 상황 등 반드시 검증해야 할 부분에 집중해야 합니다. 이전에는 가능한 많은 테스트 케이스를 추가하려는 욕심이 있었습니다. 하지만 피드백을 통해 불필요한 테스트는 오히려 코드의 복잡성을 증가시키고 독이 될 수 있다는 점을 깨달아, 불필요한 테스트 케이스를 정리했습니다.
  - 랜덤 값을 직접 주입하는 방식 대신, 자동차의 움직임을 제어하는 전략 패턴을 도입했습니다. 이때 인터페이스는 단일 메서드만 포함하기 때문에 함수형 인터페이스로 간주할 수 있습니다. 따라서, 테스트 코드에서 람다식을 사용해 구현체 없이도 자동차의 움직임을 간단히 결정할 수 있었습니다.

    ```java
    MoveStrategy moveStrategy = new ForwardStrategy();
    //Race race = Race.of(carNames, 1, moveStrategy);
    Race race = Race.of(carNames, 1, () -> true);
    ```

2. **객체의 책임이 명확해 졌습니다.**
  - 자동차의 움직임을 제어하던 CarController 객체를 제거하고, 자동차 스스로가 움직일지 여부를 판단하도록 책임을 부여했습니다.
  - 자동차 리스트를 가지고 carController에게 자동차를 이동하라는 메시지를 보내는 “Round 객체의 이름이 더 명확했으면 좋겠다”라는 피드백이 있었습니다.
    - 또한, 자동차 리스트를 관리하고 CarController를 통해 자동차를 이동시키던 `Round` 객체에 대해, 이름이 더 명확해야 한다는 피드백을 받았습니다. 고민 끝에, 객체가 수행하는 행동이 경주를 의미한다고 판단하여, 이름을 `Race`로 변경했습니다. 이로 인해 전체적인 객체 협력의 흐름이 더 자연스러워졌습니다:
      - 경주는 자동차들을 관리합니다.
      - 경주는 차들을 움직입니다.
      - 경주는 우승자를 결정할 수 있습니다.

---
## 자동차 경주 우승자 찾기

### 1) 미션 요구사항 개발

다음 미션은 각 자동차에 5글자 이하의 이름을 부여하고, 어떤 자동차가 우승했는지를 출력해야 하는 요구사항을 구현해야 합니다.

```
경주할 자동차 이름을 입력하세요(이름은 쉼표(,)를 기준으로 구분).
pobi,crong,honux
시도할 회수는 몇회인가요?
5

실행 결과
pobi : -
crong : -
honux : -

...

pobi : -----
crong : ----
honux : -----

pobi, honux가 최종 우승했습니다.
```

- 각 자동차 객체에 이름을 저장할 수 있도록 String 인스턴스 변수를 추가하였습니다.
- 우승자는 라운드 종료 후 자동차 중 가장 멀리 간 자동차를 찾도록 하였습니다.

이번 단계는 “자동차 경주의 상태와 우승자 이름을 출력하는 `ResultView` 는 어느 객체에 있는 게 적절할까? 자동차 게임 전체를 관리하는 `CarRacing`일까? 아니면 개별 경주를 담당하는 `Race`일까?“라는 고민이 있었습니다.

아래 코드는 CarRacing 객체 안의 `startRace` 메소드입니다.

```java
//CarRacing
private void startRace(int numberOfRounds, Race race) {
    resultView.showCarsInitState(race);
    for (int roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        race.moveCars();
        resultView.showCarsState(race);
    }
    resultView.showWinnerNames(race);
  }
```

만약 CarRacing에서 ResultView를 직접 쓰지 않고, Race에서 resultView를 사용하면 아래처럼 개선될 수 있지 않을까 라는 생각했습니다.

- CarRacing객체는 Race객체에게 경주를 시작하라! 라고 메시지를 보낸다.
- Race객체 내에서 이동 할 때마다 ResultView를 사용해 상태를 출력한다.
- 최종 위치도 Race에 있으니 바로 ResultView로 전달이 가능하다.

이 접근이 더 나은 설계인지에 대한 확신이 없어, 리뷰어님의 의견을 듣고자 질문을 남기게 되었습니다.

### 2) 피드백을 통해 어떻게 개선될 수 있는지 파악

<br/>
**1. ResultView**

앞서 ResultView의 위치를 Race 내부로 옮기고자 했던 이유는, 경주 상태를 출력하기 위해 Race 내부의 데이터가 필요했기 때문입니다.

하지만 필요한 데이터를 객체 외부로 반환하도록 설계하면 어떨까요? 이렇게 하면 Race에서 ResultView를 사용하고 싶은 유혹이 사라집니다.

```java
List<CarRecords> records = race.start();
resultView.showCars(records);
```

리뷰어님의 예시 코드를 통해 resultView의 책임은 Race가 아니라 CarRacing 객체가 갖는 것이 적절하다고 판단하였습니다. Race는 경주 결과를 반환하고, CarRacing은 그 데이터를 ResultView에 전달합니다.

이 예시를 조금 더 개선할 수도 있습니다. 현재의 예시는 자동차 이동 기록을 위한 CarRecord라는 새로운 객체가 필요합니다.

그러나, 만약 자동차가 이동 후 자신의 위치를 Car 객체로 반환해준다면, 새로운 객체 없이도 자동차의 상태를 출력할 수 있습니다.

```java
Car movedCar = car.move(number);
```

<br/>
**2. 자동차 경주 우승자 이름 출력**

아래는  우승자의 이름을 조회하는 메소드입니다.

```java
//Race 객체
public List<String> getWinners() {
      return cars.stream()
              .filter(car -> car.getPosition() == getMaxPosition())
              .map(Car::getName)
              .collect(Collectors.toList());
  }
```

이 메서드에는 다음과 같은 3가지 개선 사항이 있습니다

1.	**자동차 객체의 위치를 가져오기 위해 getter를 사용한 점**
  - 객체에게 직접 데이터를 요청하기 위해 getter를 사용했는데, 이는 객체지향 생활 체조 원칙의 규칙 9번인 “getter/setter를 쓰지 않는다”를 위반하는 것입니다. 객체지향 생활 체조 원칙을 지키려고 했지만, 놓친 부분입니다. 객체에게 메시지를 전달하는 방식으로 개선할 수 있습니다.

2.	**우승자 이름을 반환하는 방식**
  - 기존에는 우승자 이름을 직접 반환했지만, 출력 요구사항이 변경될 때 유연성을 확보하기 위해 객체 자체를 반환하도록 개선 할 수 있습니다.
  - ResultView에서 필요한 값을 객체로부터 가져오면 출력 요구사항이 변경되어도 코드 수정 범위를 줄일 수 있습니다.

3.	**우승자 목록을 Collectors.toList()로 반환하는 점**
  - `Collectors.toList()`로 반환된 리스트는 외부에서 수정될 수 있는 위험이 있습니다. 우승자 목록은 외부에서 수정할 필요가 없기 때문에, `Collectors.toUnmodifiableList()`를 사용하여 불변 리스트로 반환하도록 개선할 수 있습니다.

3번 피드백과 관련해서는 교육 과정의 캡틴 “포비”님께서 강의에서 “**외부에서 수정된 값으로 인해 발생한 버그는 디버깅하기 어려우므로, 불변 리스트로 반환하는 것이 좋다**”고 언급하신 부분입니다.

이를 계기로 `Collectors.toUnmodifiableList()`사용을 의식적으로 연습하려고 합니다.

| 메서드 | 수정 가능 여부 | null 값 허용 여부 |
| --- | --- | --- |
| Collectors.toList() | 가능 | 허용 |
| Collectors.toUnmodifiableList() | 불가능 | 허용하지 않음(NPE) |
| stream.toList() | 불가능 | 허용 |

단, Collectors.toUnmodifiableList()의 특징을 명확히 알고 사용해야 합니다.

저는 toUnmodifiableList로 반환한 리스트를 정렬하려고 하여 예외가 발생시킨 경험이 있습니다.😅

(+ `toUnmodifiableList`는 원본 객체의 변경에 영향을 받으니 새로운 리스트로 복제를 해서 불변 리스트로 만들어야 합니다. [https://colabear754.tistory.com/185](https://colabear754.tistory.com/185)  )

<br/>
**3.반환타입은 배열보다 컬렉션을 사용하자**

컬렉션으로 반환하면 stream(), sort(), filter()와 같은 고차 함수와 스트림 API를 사용할 수 있는 장점이 생깁니다. 반면에 배열을 반환활 경우, 공변성 문제에 직면할 수 있습니다.

여기서 “**공변**”이라는 용어가 생소할 수 있는데, 공변은 배열이나 제네릭 타입 같은 자료형에서 나타나는 특성으로, 자식 클래스가 부모 클래스의 자료형으로 대체될 수 있는지를 설명할 때 사용됩니다.

자바의 배열은 공변성을 지원합니다.

즉, 자식 클래스의 배열을 부모 클래스의 배열로 참조할 수 있습니다. 예를 들어, String[] 배열을 Object[]로 참조할 수 있는 것이 공변성입니다. 그러나 이때 공변성 문제도 발생할 수 있습니다. 예를 들어, Object[]로 참조된 배열에 String이 아닌 다른 타입의 값을 넣으려고 하면 ArrayStoreException이 발생할 수 있습니다.

```java
Object[] objects = new String[10];
objects[0] = 42;  // 런타임에서 ArrayStoreException 발생
```

컬렉션에서는 공변을 허용하지 않기 때문에 공변성 문제가 발생하지 않습니다. 즉, List<String>은 List<Object>로 대체할 수 없습니다. 자바의 제네릭 컬렉션은 서로 다른 타입으로 간주되기 때문에, 타입 변환 시 컴파일 단계에서 오류가 발생합니다.

예를 들어, 아래 코드는 컴파일 오류를 일으킵니다.

```java
List<Object> objects = new ArrayList<String>();  // 컴파일 오류 발생
```

이처럼 List<String>과 List<Object>는 호환되지 않기 때문에, 자바 컴파일러는 타입 안전성을 보장할 수 있습니다. 이러한 이유로 컬렉션을 사용하면 배열보다 더 안전하게 타입을 관리할 수 있습니다.

<br/>
**4. 테스트에서도 getter를 쓸 필요가 없다.**

테스트에서 객체에 값을 꺼내서 비교하지 않고 `hashCode`와 `equals`를 오버라이딩하여 동등성 비교로 값을 검증할 수 있습니다.

```java
//assertThat(car.getPosition()).isEqualTo(1); 
assertThat(car).isEqualTo(new Car("green", 1)); //자동차의 이름과 위치가 같으면 같은 자동차로 판단
```

이 부분은 상황에 맞게 적용하는 것이 좋다고 생각합니다. 이렇게 생각한 이유는 최근 이 방식으로 객체를 검증을 했을 때 실패해야 할 테스트가 성공했던 경험이 있었기 때문입니다.

원인은 객체가 여러 인스턴스 변수를 가지고 있을 때, 모든 필드를 비교하지 않고 seq 값이 동일하면 동일한 객체로 간주하도록 equals 메서드가 오버라이딩되어 있었기 때문입니다.

이로 인해, 객체가 잘못된 값을 가지고 있어도 expected와 seq 값만 같으면 동일한 객체로 판단하여 테스트가 성공했습니다.

따라서, 객체가 가지고 있는 모든 값이 중요한 경우에는 extracting이나 getter를 사용하여 객체의 개별 필드 값을 추출해 예상한 값과 일치하는지 검증하는 것이 더 안전하다고 느꼈습니다.

<br/>
**5. public / private 메소드 순서**

public / private 메소드 순서에 대한 리뷰어님의 의견이 궁금했습니다.

[인프런 강의 Readable Code: 읽기 좋은 코드를 작성하는 사고법](https://www.inflearn.com/course/readable-code-%EC%9D%BD%EA%B8%B0%EC%A2%8B%EC%9D%80%EC%BD%94%EB%93%9C-%EC%9E%91%EC%84%B1%EC%82%AC%EA%B3%A0%EB%B2%95) 에서는 외부에 노출되는 public 메소드를 상단에 모아두고, private 메소드는 public 메소드에서 호출한 순서대로 배치하거나 수정, 판별, 조회의 성격에 따라 배치하는 방식을 소개하고 있습니다.

현재 public / private에 배치에 대한 팀의 컨벤션이 정해지지 않은 상태여서 개인적으로 강의에서 소개된 배치 방식을 사용하고 있었습니다.

리뷰어님께서는 public 메소드와 private 메소드가 너무 멀리 떨어져 있으면 코드를 읽고 수정하는 데 어려움을 느낄 수 있기 때문에 연관된 메소드를 가까이 두는 것을 선호하셨습니다.

저 역시 메소드가 많아지면 public 메소드와 private 메소드 사이의 거리가 멀어지고, private 메소드의 순서 조정이 어려웠던 경험이 있었습니다. 앞으로는 연관된 public / private 메소드를 가까이 배치하는 방식을 시도해 보려고 합니다.

### 3) 개선 전 /후 비교

아래는 자동차 경주 게임을 실행하는 CarRacing 객체입니다.

```java
//CarRacing
//개선 전 
public void run() {
    List<String> carNames = inputView.getCarNamesFromUser();
    int numberOfRounds = inputView.getRoundNumberFromUser();

     Race.of(carNames, randomNumberGenerator);
     startRace(numberOfRounds, race);
}

private void startRace(int numberOfRounds, Race race) {
    resultView.showCarsInitState(race);
    for (int roundNumber = 1; roundNumber <= numberOfRounds; roundNumber++) {
        race.moveCars();
        resultView.showCarsState(race);
    }
    resultView.showWinnerNames(race);
  }

//개선 후 
public void run() {
      List<String> carNames = inputView.getCarNamesFromUser();
      int numberOfRounds = inputView.getRoundNumberFromUser();

      Race race = Race.of(carNames, numberOfRounds, moveStrategy);
      List<RoundRecord> result = race.start();
      List<Car> winners = race.getWinners();

      resultView.showCarRacingResult(result);
      resultView.showWinnerNames(winners);
  }
```

개선 전에는 사용자에게 입력받은 라운드 횟수만큼 Race에게 자동차를 이동하라는 메시지를 전달하고, 이동 후 상태 자체를 resultView로 전달하여 출력하였습니다.

개선 후에는 CarRacing객체에 역할이 “객체를 생성한다”, “객체에게 메시지를 전달한다”로 명확해졌습니다. 입력받은 라운드 횟수만큼 경주하는 것은 Race의 책임으로 이동하였습니다.

```java
//Race
public List<RoundRecord> start() {
      recordRound();
      startRounds();
	    return Collections.unmodifiableList(roundRecords);
  }

private void startRounds() {
    for (int i = 0; i < totalRoundNumber; i++) {
        moveCars();
        recordRound();
    }
}

private void recordRound() {
    roundRecords.add(RoundRecord.from(cars));
}

private void moveCars() {
    cars = cars.stream()
            .map(car -> car.move(moveStrategy))
            .collect(Collectors.toUnmodifiableList());
}
```

또한, 경주 결과를 불변 리스트로 반환하기 때문에 외부에서 자동차 경기 결과를 수정할 수 없게 되어 코드의 안정성이 높아졌습니다.

피드백을 받았던 우승자 찾는 메소드도 개선되었습니다.

```java
//개선 전 
public List<String> getWinners() {
      return cars.stream()
              .filter(car -> car.getPosition() == getMaxPosition())
              .map(Car::getName)
            .collect(Collectors.toList());
}

private int calculateMaxPosition() {
    return carRecords.stream()
            .mapToInt(CarRecord::getPosition)
            .max()
            .orElse(0);
}
    
//개선 후 
public List<Car> getLeadingCar() {
      Position maxPosition = calculateMaxPosition();

      return cars.stream()
              .filter(car -> car.isPositionEqualTo(maxPosition))
              .collect(Collectors.toUnmodifiableList());
  }

 private Position calculateMaxPosition() {
    return cars.stream()
            .map(Car::getPosition)
            .reduce(Position::createMaxPosition)
            .orElseThrow(() -> RacingCarIllegalArgumentException.INVALID_MAX_POSITION);
}
```

자동차의 위치를 나타내는 int형 position을 “규칙 3: 모든 원시값과 문자열을 포장한다.“를 적용하여 `Position`객체로 포장했습니다.

이렇게 객체로 포장함으로써, 생성자에서 위치가 음수일 경우 예외를 발생시킬 수 있고, 자동차 위치와 관련된 비즈니스 로직을 `Position` 객체 내부에 모아둘 수 있게 되었습니다.

```java
public class Position {
    private static final int DEFAULT_POSITION = 1;
    private static final int DEFAULT_INCREMENT = 1;

    private final int value;

    private Position(int value) {
        if (value < 0) {
            throw RacingCarIllegalArgumentException.INVALID_POSITION;
        }
        this.value = value;
    }
    
    ...
    
    public Position createMaxPosition(Position otherPosition) {
        int maxPosition = Math.max(this.value, otherPosition.value);
        return Position.from(maxPosition);
    }
```

---
## 자동차 경주 미션이 끝난 후 느낀 점

### 1. 코드 개선 전후를 비교해 보니, 개선된 코드에서 “**버그가 덜 발생할 것 같다**”는 느낌을 받았습니다.

### 2. TDD로 미션을 진행하면서 테스트 코드의 새로운 용도를 깨달았습니다.

이전까지는 테스트 코드를 단순히 구현한 코드를 검증하는 용도로만 사용했습니다. 하지만 TDD에서는 테스트 코드가 요구사항의 명세를 정리하고, 코드를 어떻게 구현할지 계획해보는 연습장 역할을 한다는 점을 알게 되었습니다.

예를 들어, “자동차를 움직인다”는 요구사항을 구현할 때 기존 방식과 TDD 방식의 차이를 비교해 보겠습니다.

**기존 방식:**

1. 자동차 객체를 생성한다.
2. 필요한 인스턴스 변수를 모두 선언한다.
3. 메소드를 구현한다.
4. 테스트를 통해 해피 케이스를 확인한다.

**TDD 방식:**

1. @DisplayName("자동차가 이동할 수 있다.")로 테스트를 생성한다.
  - 테스트 케이스를 통해 객체가 어떻게 이동해야 하는지 구체적으로 작성한다.
2. Car 객체에 move라는 메소드를 선언하고, 새로운 Car 객체를 반환하도록 설계한다.
3. 검증 방법도 고려한다.
4. 이 시점에서 테스트 코드는 컴파일 에러가 발생한다. 이제 Car 객체를 생성하고, move 메소드를 구현하여 테스트를 통과시키는 코드를 작성한다.
5. 필요하다면 기존 코드를 리팩토링하고, 다시 테스트를 돌려가며 검증한다.

### 3. TDD 사이클로 개발하면서 다음과 같은 장점을 느꼈습니다.

- **테스트 케이스가 풍부해졌습니다.**
  - TDD 사이클에서는 요구사항을 개발하기 위해 테스트가 필수적입니다. 그 결과, 자연스럽게 다양한 테스트 케이스가 생겼습니다.
  - 테스트 코드를 통해 구현한 코드가 제대로 동작하는지 빠르게 확인할 수 있어 안정감을 느꼈습니다. 또한, 리팩토링 후에도 작성된 다양한 테스트 케이스를 실행해 회귀 방지를 효과적으로 할 수 있었습니다.
- 객체가 작아졌습니다.
  - 기존 방식에서는 Car 객체에 인스턴스 변수와 메소드를 계속 추가하며 개발했을 것입니다.
  - 그러나 TDD 방식에서는 테스트를 용이하게 하기 위해 “어떤 객체로 묶어 표현할 수 있을까?“를 고민하게 됩니다.
  - 예를 들어, “자동차 이름은 5글자 미만이어야 한다”는 요구사항은 Car 객체가 아닌 더 작은 Name 객체의 책임임을 알게 되었습니다.
  - 객체가 작아지니 다양한 테스트 케이스를 부담 없이 작성할 수 있었습니다.

### 4. 고쳐야 할 개발 습관을 많이 있다는 것을 알게 되었습니다.

아래 내용에 대해 피드백을 받았습니다.

- 숫자는 의미를 부여해서 매직넘버로 표현한다
- 불필요하게 오픈된 접근제어자를 변경한다.
- 클래스와 멤버 변수를 개행으로 구분한다.
- 테스트에서 사용되는 파일은 테스트 패키지에 생성한다.

아무리 객체의 크기가 작고 테스트 코드를 잘 작성해도, 기본적인 원칙을 지키지 않으면 가독성이 좋은 코드라고 할 수 있을까요?

이번 미션을 통해 부족한 점을 많이 느꼈습니다. 피드백을 계속 생각하며 연습해야겠다는 다짐을 하게 되었습니다.

---
## 글 쓰는데 걸린 시간
초안작성  : 8시간

리팩토링  : 8시간
