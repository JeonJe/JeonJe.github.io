---
title: "EnumMap으로 성능 개선하기: 로또 게임 TDD 리팩토링 여정"
description: "로또 게임 구현 과정에서 EnumMap 활용, 원시값 포장, 전략 패턴 적용을 통한 코드 품질 향상과 성능 최적화 경험 공유"
categories: 글또 성능최적화
tags: [TDD, 클린 코드, java, 리팩토링, 객체지향, EnumMap, 전략 패턴, 원시값 포장, 성능 최적화]
---



## 요약

- Next-step의 "TDD, 클린 코드 with Java " 과정 중 로또 게임 미션을 통해 TDD와 클린코드에 대해 학습한 내용입니다.

---

## 이 글의 목적

- 이 글을 통해 스스로 어떤 부분이 개선 되었는지를 인식하는 것이 첫 번째 목표이고, 이 경험을 공유하는 것이 두 번째 목표입니다.
- [상세한 목적은 자동차 경주 미션에서 확인 할 수 있습니다.☺️](https://jeonje.github.io/posts/geultto_racing_car_game_with_tdd_and_clean_code/)

---

## 로또 게임 (자동)

### 1) 미션 요구사항 개발

로또 게임의 요구사항입니다.

- 로또 구입 금액을 입력하면 구입 금액에 해당하는 로또를 발급해야 한다.
- 로또 1장의 가격은 1000원이다.

```
구입금액을 입력해 주세요.
14000
14개를 구매했습니다.
[8, 21, 23, 41, 42, 43]
	...
[3, 8, 27, 30, 35, 44]

지난 주 당첨 번호를 입력해 주세요.
1, 2, 3, 4, 5, 6

당첨 통계
---------
3개 일치 (5000원)- 1개
4개 일치 (50000원)- 0개
5개 일치 (1500000원)- 0개
6개 일치 (2000000000원)- 0개
총 수익률은 0.35입니다.(기준이 1이기 때문에 결과적으로 손해라는 의미임)
```

도메인 지식이 없는 상태로 개발하면, 객체의 책임과 역할을 정의하는 것이 가장 어렵다고 생각합니다.

고민 끝에 로또 미션은 아래와 같은 객체 구조로 구현하였습니다.

---

1. `LottoGame`
  - 로또 게임을 실행합니다.
  - InputView를 통해 사용자로부터 입력을 받고, ResultView를 통해 결과를 출력합니다.
  - 입력받은 금액을 로또 기계에 전달해 로또 티켓을 발행합니다.
  - 발행된 로또 티켓과 당첨번호를 LottoResultCalculator에 전달해 당첨 결과를 확인합니다.
  - 로또 결과와 상금정보를 LottoProfitCalculator로 전달해 수익률을 계산합니다.
2. `LottoMachine`
  - 로또를 발행합니다. 로또 번호를 발행할 전략을 주입받습니다.
3. `LottoTicket`
  - 로또 번호를 가지고 있습니다.
4. `WinningNumber`
  - 당청번호를 가지고 있습니다. 로또 티켓 번호와 당첨번호를 비교할 수 있습니다.
5.  `LottoPrize`
  - 로또 당첨 등수에 따른 당첨금액을 가지고 있습니다.
6.  `LottoResult`
  - 로또에서 맞힌 번호의 개수를 저장합니다.
7.  `LottoResultCalculator`
  - 티켓과 당첨번호를 통해 로또의 당첨 등수와 횟수를 계산합니다.
8. `LottoProfitCalculator`
  - 로또 당첨 등수와 횟수, 당첨 금액으로 수익률을 계산합니다.
9. `LottoNumberStrategy`
  - `RandomNumberStrategy`
    - 로또 번호를 랜덤하게 생성합니다.
  - `FixedNumberStrategy`
    - 테스트용으로 로또 번호를 지정할 수 있습니다.

---

자동차 경주 미션처럼 테스트하기 어려운 랜덤 값은 외부에서 전달받도록 처리했습니다.

이번 단계에서는 로또 당첨 수익률을 계산하는 것이 가장 어려웠습니다. 처음에는 `statistics` 객체를 만들어 로또 게임의 결과와 수익률을 함께 계산하려 했으나, 객체의 책임이 커지고 코드가 복잡해졌습니다. 결국 `resultCalculator`와 `profitCalculator`로 역할을 분리해야겠다고 판단했습니다.

### 2) 개선하기

**1. enum을 활용하자.**

로또 당첨 등수에 따른 당첨금액을 가지고 있는 `LottoPrize`객체 입니다.

```java
public class LottoPrize {
    private static final int DEFAULT_PRIZE = 0;
    private static final int MATCHED_THREE_LOTTO_NUMBER = 3;
    private static final int MATCHED_THREE_LOTTO_NUMBER_PRIZE = 5000;
			...
    private static final int MATCHED_SIX_LOTTO_NUMBER = 6;
    private static final int MATCHED_SIX_LOTTO_NUMBER_PRIZE = 2000000000;

    private final Map<LottoResult, Integer> prizeMap = new TreeMap<>();

    public LottoPrize() {
        prizeMap.put(new LottoResult(MATCHED_THREE_LOTTO_NUMBER), MATCHED_THREE_LOTTO_NUMBER_PRIZE);
        ...
        prizeMap.put(new LottoResult(MATCHED_SIX_LOTTO_NUMBER), MATCHED_SIX_LOTTO_NUMBER_PRIZE);
    }

    public int getLottoPrize(LottoResult lottoResult) {
        return prizeMap.getOrDefault(lottoResult, DEFAULT_PRIZE);
    }
}
```

위와 같이 클래스 내부의 인스턴스 변수로 관리하게 되면 값을 한눈에 파악하기 어려워지고, 다른 클래스에서 해당 클래스를 의존하여 사용하는 문제가 발생합니다.

리뷰어님의 피드백을 반영하여 `LottoPrize`를`Enum`으로 변경했습니다. 아래 코드를 확인하면 코드의 가독성이 훨씬 좋아진 것을 확인할 수 있습니다.

그리고 static 메소드`getPrizeAmount`럴 정의하여 외부에서 쉽게 당첨 등수별 당첨 금액을 쉽게 가져올 수 있도록 변경했습니다.

```java
public enum LottoPrize {
    FIRST(6, 2_000_000_000, "로또 번호 6개를 다 맞은 경우"),
    SECOND(5, 1_500_000, "로또 번호 5개를 맞은 경우"),
    THIRD(4, 50_000, "로또 번호 4개를 맞은 경우"),
    FOURTH(3, 5_000, "로또 번호 3개를 맞은 경우");

    private final int matchedLottoNumbers;
    private final int prizeAmount;
    private final String description;
    
	  ...
	 
    public static int getPrizeAmount(int matchedLottoNumbers) {
        return Arrays.stream(LottoPrize.values())
                .filter(p -> p.matchedLottoNumbers == matchedLottoNumbers)
                .findFirst()
                .map(LottoPrize::getPrizeAmount)
                .orElse(0);
    }

}
```

아래 `PrizeCount`객체는 로또 당첨 횟수를 카운팅하는 객체입니다.

예를 들어, 로또 번호를 6개 맞춘 횟수가 1번이라면 `prizeCount`에는 <1, 1>이 저장됩니다.

```java
public class PrizeCount {
    private static final int ZERO = 0;

    private final Map<Integer, Integer> prizeCount;
    
		 ...
		 
		public int calculateTotalPrize() {
		    return prizeCountMap.entrySet().stream()
		            .mapToInt(entry -> LottoPrize.getPrizeAmount(entry.getKey()) * entry.getValue())
		            .sum();
		}
```

`PrizeCount`객체와 `LottoPrize`의 static 메소드를 활용하면 로또 당첨 등수와 횟수 곱한 총 수익률을 쉽게 계산할 수 있습니다. 

따라서, 로또에서 몇 개를 맞췄는지 기록하는 기존의 `LottoResult` 객체와 당첨 횟수를 계산하는 `LottoResultCalculator`, 수익률을 계산했던 `LottoProfitCalculator`는 불필요한 객체가 되어 제거하였습니다.

**2. 공통된 부분을 객체로 묶어보자**

로또 당첨 번호 6개를 가지고 있는 `WinningNumber`와 사용자가 구입한 로또 번호 6개를 가진 `LottoTicket`은 사용 목적은 다르지만 **로또 번호를 6개 보유하고 있다는 공통점**이 있습니다.

```java
public class WinningNumber {
	private final List<Integer> winningNumbers;
	
	...
}

...

public class LottoTicket {
    public static final int NUMBER_OF_LOTTO_NUMBERS = 6;
    public static final int MIN_LOTTO_NUMBER = 1;
    public static final int MAX_LOTTO_NUMBER = 45;

    private final List<Integer> lottoNumbers;
```

두 객체의 공통된 부분을 아래와 같이 `LottoBalls`객체로 묶을 수 있습니다.

```java
public class LottoBalls {
    public static final int NUMBER_OF_BALLS = 6;

    private final Set<LottoNumber> balls;
```

추가로, 6개의 로또 번호를 `List<Integer>` 에서 `LottoNumber` 객체로 포장했습니다.

이로 인해 다음과 같은 장점이 생겼습니다.

- 로또 번호의 유효성 검사(1부터 45까지)는 `LottoNumber` 객체의 책임으로 분리되었습니다.
- 로또 번호 6개를 가진 `LottoBalls` 객체는 로또 번호 갯수와 중복을 검증하는 것에 집중할 수 있게 되었습니다.

```java
public class LottoNumber {
    public static final int MIN_LOTTO_NUMBER = 1;
    public static final int MAX_LOTTO_NUMBER = 45;

    private final Integer number;

    public LottoNumber(Integer number) {
        if (number < MIN_LOTTO_NUMBER || number > MAX_LOTTO_NUMBER) {
            throw new IllegalArgumentException("로또 번호는 " + MIN_LOTTO_NUMBER + "부터 " + MAX_LOTTO_NUMBER + "까지 입니다.");
        }
        this.number = number;
		}
    
```

### 3) 개선 전 /후 비교
- 로또 당첨 금액 관리 간소화: 등수별 당첨 금액을 관리하기 위해 enum을 사용하여 코드의 가독성을 높였습니다. (TIP: 천 단위 구분을 위해 _를 사용하여 금액을 더 쉽게 읽을 수 있도록 했습니다.)
- 객체 래핑을 통한 책임 분리 명확화:
  - LottoNumber 객체화: 기존에는 번호를 Integer로 사용했으나, 이를 LottoNumber 객체로 래핑하여 유효성 검증이 더 용이해졌습니다. 또한 로또 숫자의 최소값인 1과 최댓값인 45를 나타내는 상수를 LottoNumber 객체에 포함시켜, 로또 번호의 특성을 더 적절히 표현할 수 있었습니다.
  - LottoBalls의 역할 강화: LottoBalls 객체는 로또 번호의 중복 여부와 로또 번호 개수(6개) 등의 유효성 검증에 집중하도록 역할을 변경하여, 로또 묶음에 대한 검증이 더 체계적이고 명확해졌습니다.

## 로또 보너스볼

### 1) 미션 요구사항 개발

이번 미션은 2등을 위해 추가 번호를 하나 더 추첨하고, 당첨 통계에도 2등을 추가합니다.

```
2등을 위해 추가 번호를 하나 더 추첨한다.
당첨 통계에 2등도 추가해야 한다.

[... 생략 ...]

지난 주 당첨 번호를 입력해 주세요.
1, 2, 3, 4, 5, 6
보너스 볼을 입력해 주세요.
7

당첨 통계
---------
3개 일치 (5000원)- 1개
4개 일치 (50000원)- 0개
5개 일치 (1500000원)- 0개
5개 일치, 보너스 볼 일치(30000000원) - 0개
6개 일치 (2000000000원)- 0개
총 수익률은 0.35입니다.(기준이 1이기 때문에 결과적으로 손해라는 의미임)
```

- 로또 번호 6자리를 가지고 있는 `LottoBalls`와 보너스 숫자를 함께 관리하기 위해 `WinningNumbers라는` 객체를 만들었습니다.
- PrizeCountMap에서 사용하던 키 값을 **로또 번호를 맞춘 갯수(Integer)에서 당첨 등수, 당첨 금액을 가지고 있는 `LottoPrize`**로 변경하였습니다.

이전 미션에서 `WinningNumbers`는 `LottoTicket` 객체와 유사한 기능이 많아 `LottoBalls` 객체로 묶여 제거 되었는데, 이번 미션에서 보너스 번호를 담기 위한 `WinningNumber`객체가 다시 필요해졌습니다.

```java
public class WinningNumbers {
    private final LottoBalls winNumbers;
    private final LottoNumber bonusNumber;
```

당첨 금액을 계산하는 부분에서 변경이 있었습니다.

- 보너스 번호를 맞춘 경우 true, 못 맞춘 경우 false를 전달받습니다.
- 로또 번호를 맞춘 개수가 5개일 때는 보너스 번호를 함께 고려하여 당첨 금액을 계산합니다.

```java
public static LottoPrize getPrize(int matchedLottoNumbers, boolean matchBonus) {
        if (matchedLottoNumbers == MATCH_FIVE_NUMBERS) {
            return matchBonus ? SECOND : THIRD;
        }

        return Arrays.stream(values())
                .filter(p -> p.matchedLottoNumbers == matchedLottoNumbers)
                .findFirst()
                .orElse(MISS);
    }
```

이전 미션에서 객체를 적절하게 분리해둔 덕분에, 이번 요 구 사항을 쉽게 만족할 수 있었습니다. 😁

![image.png](/assets/img/2024-11-05-geultto_lotto_game_with_tdd_and_clean_code/image.png)
(소소한 자랑으로 리뷰어님께서 남겨준 칭찬 피드백 남겨봅니다.)
### 2) 개선하기

**1. EnumMap을 사용해보자.**


```java
public class PrizeCountMap {
    private static final int ZERO = 0;
		//Map -> EnumMap
    //private final Map<LottoPrize, Integer> prizeCount;
    private final EnumMap<LottoPrize, Integer> prizeCount;
```
PrizeCountMap에서 `Map`을 `EnumMap`으로 사용하면 다음과 같은 장점이 있습니다 (참고: [링크](https://yeonyeon.tistory.com/195))

- EnumMap은 Enum 타입만 키로 사용하도록 제약을 둘 수 있습니다.
  - null을 키로 넣는 경우 `NullPointerException`이 발생합니다.
- EnumMap**은 내부적으로 배열을 이용하므로 성능적으로 더 빠릅니다.**
  - 해싱 과정이 필요 없어 `HashMap`보다 빠릅니다.
  - HashMap과 달리 충돌 가능성도 없습니다.

EnumMap의 생성자를 살펴보면 new Object[] 로 배열을 사용한 것을 확인할 수 있습니다.
```java
public EnumMap(Class<K> keyType) {
    this.keyType = keyType;
    keyUniverse = getKeyUniverse(keyType);
    vals = new Object[keyUniverse.length];
}
```

단, 로또 게임의 출력은 당첨 등수가 낮은 순서에서 높은 순서로 이루어져야 합니다. 이때 `stream`을 사용하면 등수가 낮은 순으로 EnumMap을 다시 정렬하여 출력할 수 있습니다.

### 3) 개선 전 /후 비교
- 이번 단계에서는 기존의 Map을 EnumMap으로 변경하여 성능과 코드의 안정성을 강화했습니다.
  - 성능 개선: EnumMap은 내부적으로 배열을 사용하여 Map보다 빠른 키 조회가 가능하므로, 성능 측면에서 유리합니다.
  - 안정성 향상: EnumMap은 null과 같은 잘못된 값을 키로 허용하지 않아, 불필요한 오류를 방지하고 코드의 안정성을 높였습니다.

---

## 로또 수동 번호

### 1) 미션 요구사항 개발

로또 미션의 마지막 단계로, 수동으로 로또 번호를 생성하는 요구 사항이 추가되었습니다.

```

구입금액을 입력해 주세요.
14000

수동으로 구매할 로또 수를 입력해 주세요.
3

수동으로 구매할 번호를 입력해 주세요.
8, 21, 23, 41, 42, 43
3, 5, 11, 16, 32, 38
7, 11, 16, 35, 36, 44

수동으로 3장, 자동으로 11개를 구매했습니다.
[8, 21, 23, 41, 42, 43]
...
[3, 8, 27, 30, 35, 44]

지난 주 당첨 번호를 입력해 주세요.
1, 2, 3, 4, 5, 6
보너스 볼을 입력해 주세요.
7

당첨 통계
---------
3개 일치 (5000원)- 1개
4개 일치 (50000원)- 0개
5개 일치 (1500000원)- 0개
5개 일치, 보너스 볼 일치(30000000원) - 0개
6개 일치 (2000000000원)- 0개
총 수익률은 0.35입니다.(기준이 1이기 때문에 결과적으로 손해라는 의미임)
```

수동 로또 번호 생성을 구현하는 과정에서, 아래와 같이 총 당첨 금액이 int형 자료형이 표현할 수 있는 범위를 넘어가 **수익률이 음수로 계산되는 경우를 발견했습니다.**

![image.png](/assets/img/2024-11-05-geultto_lotto_game_with_tdd_and_clean_code/image 1.png)

당첨 금액을 합산할 때 사용 중인 int형 변수를 `long`형으로 변경했습니다.

또한, 사용자가 수동으로 로또 번호를 입력받아 출력하는 과정에서 정렬이 되지 않는 버그도 발견되었습니다.

![image.png](/assets/img/2024-11-05-geultto_lotto_game_with_tdd_and_clean_code/image 2.png)

LottoBalls는 로또 번호 6개를 저장하기 위해 Set 자료형을 사용했으나, 중복을 허용하지 않는 대신 정렬되지 않은 상태로 번호를 저장하는 문제가 있었습니다. 중복 검증이 필요할 때만 Set을 사용하고, 로또 번호 6개를 담기 위해 List 자료형으로 변경하여 번호를 순서대로 저장할 수 있도록 개선했습니다.

### 2) 개선하기

**1. 원시 값 포장**

이번 미션에는 아래 요구사항도 포함이 되어있었습니다.

- 규칙 3: 모든 원시값과 문자열을 포장한다.
  - 로또 숫자 하나는 int 타입이다. 이 숫자 하나를 추상화한 LottoNo 객체를 추가해 구현한다.

이전 단계에서 원시 값을 `LottoNumber`로 포장하여 사용했기 때문에 더 이상 포장할 값이 없다고 생각했습니다. 

```java
   public void validateManualLottoCount(int amount, int manualLottoCount) {
```
그러나 피드백을 통해 사용자로부터 입력받은 `금액`도 객체로 포장할 수 있다는 점을 깨달았습니다. 

```java
public Money(int value) {
    if(value < ZERO) {
        throw LottoIllegalArgumentException.NEGATIVE_AMOUNT;
    }
    this.value = value;
}
```
int amount을 Money라는 객체로 포장하여 금액에 대한 유효성 검증과 관련 로직을 객체 내부에 담아, 코드의 가독성과 유지보수성을 더욱 향상할 수 있었습니다.


**2.수동 번호를 생성할 땐 수동번호 전략을 사용한다.**

처음에 구현한 수동 로또 번호 생성 메소드입니다.

```java
private List<LottoBalls> generateManualLottoNumber(List<List<Integer>> manualLottoNumbers) {
    return manualLottoNumbers.stream()
            .map(LottoBalls::new)
            .collect(Collectors.toUnmodifiableList());
}

private List<LottoBalls> generateAutoLottoNumber(int numberOfTickets) {
    List<LottoBalls> autoLottos = new ArrayList<>();
    for (int i = 0; i < numberOfTickets; i++) {
        autoLottos.add(new LottoBalls(lottoNumberStrategy.generate()));
```

로또 머신이 로또 번호 생성 전략을 갖고 있지만 자동 로또 번호 생성에만 사용되고 있다는 피드백을 받았습니다. 
수동 로또 번호의 경우 사용자가 직접 입력하기 때문에 별도의 생성 전략 없이도 로또 번호를 가져올 수 있어, 전략을 활용해야 한다는 생각을 미처 하지 못했습니다.
피드백을 통해 일관된 전략을 적용해 로또 번호를 생성하도록 개선하였습니다.

```java
//개선v1 
ManualLottoMachine manualLottoMachine = new ManualLottoMachine(inputView.getManualLottoNumbers(manualLottoCount));
lottoTickets.addAll(manualLottoMachine.generateLottoTicket());
		...

AutoLottoMachine autoLottoMachine = new AutoLottoMachine(autoLottoCount);
lottoTickets.addAll(autoLottoMachine.generateLottoTicket());
```
위 코드에서는 피드백을 잘못 이해하여 자동 번호 생성 로또 머신과 수동 번호 생성 로또 머신을 별도로 구현했습니다. 
최종적으로는 개선v2 버전과 같이 로또 머신에 원하는 로또 번호 생성 전략을 주입하여, 로또 번호를 생성 전략에 따라 생성하는 일관성 있는 코드로 변경했습니다.

```java
//개선v2
LottoMachine lottoMachine = new LottoMachine(new ManualLottoNumberGenerateStrategy(inputView.getManualLottoNumbers(manualLottoCount)));
lottoTickets.addAll(lottoMachine.generateLottoTicket());

AutoLottoMachine lottoMachine = new LottoMachine(new AutoLottoNumberStrategy(autoLottoCount));
lottoTickets.addAll(lottoMachine.generateLottoTicket());
```

### 3) 개선 전 /후 비교

- `int amount`를 `Money` 객체로 포장함으로써 마이너스 금액에 대한 유효성 검증과 티켓 구매와 같은 비즈니스 로직을 포함할 수 있게 되었습니다. 이를 통해 로또 티켓의 책임이 줄어들고, 로또 머신의 역할이 더욱 명확해졌습니다.
- 일관적인 로또 번호 생성으로 코드 가독성 향상:
  - 코드에 일관성이 있을 때 새로운 구현을 추가하거나 기존 코드를 이해하기 쉬워집니다. 오브젝트 14장 `일관성 있는 협력`에서도 일관성 있는 코드의 중요성을 강조하고 있습니다.

```
//Object 14장 일관성 있는 협력 중 
각 방식을 구현 할 때 일관성이 없으면 두 가지 상황에서 문제가 발생한다.

1. 새로운 구현을 추가하는 상황
    - 새로운 구현을 추가할 때 어떤 방식으로 하던 구현은 가능하다. 그러나 새로운 정책을 추가하면 추가할 수록 일관성이 더 어긋나게 된다
2. 기존의 구현을 이해하는 상황 
    - 일관성이 없으면 어느 한 구현을 이해한다고 해서 다른 방식의 구현을 쉽게 이해할 수 없다. 오히려 코드를 이해 하는데 오히려 더 방해가 된다.

즉, 유사한 기능은 유사한 방식으로 구현해야한다.
```

## 느낀 점

이번 미션에서 가장 기억에 남는 부분은 로또 당첨 등수별 당첨 금액을 enum을 활용해 관리하도록 개선한 점입니다.

이 과정에서 "아, 여기서 enum을 사용해야겠구나"라는 생각을 미처 떠올리지 못한 아쉬움이 있었고, `EnumMap` 자료구조도 새롭게 알게 되면서 아직 공부할 게 많다고 느꼈습니다.

그리고, 피드백을 통해 "다양한 개발자분들과 협업 해 보는 경험이 있으면 좋겠다" 는 생각이 들었습니다.
![image.png](/assets/img/2024-11-05-geultto_lotto_game_with_tdd_and_clean_code/image 3.png)

예를 들어 파일 끝에 개행을 추가하는 것은 POSIX 표준 중 하나로, 파일의 끝에 개행을 하지 않고 `Pull Request`를 보내면, 버전 관리 시스템에서 파일 끝에 개행이 없다는 경고를 표시합니다.
만약, 표준을 지키지 않으면 해당 기준을 따르는 개발자들과 불필요한 코드 충돌이 발생할 수 있습니다.

이 피드백 덕분에 이런 표준과 설정이 있다는 사실을 새롭게 알게 되었고, 즉시 IntelliJ에서 파일 저장 시 마지막에 개행이 자동으로 추가되도록 설정했습니다. (이후 사내에 해당 정보를 공유하기도 했습니다.)

이처럼, 다양한 개발자들과 협업할 때 얻을 수 있는 지식과 배움이 많다는 것을 느꼈습니다. 사이드 프로젝트나 오픈소스 참여를 통해 여러 개발자들과 협업하며 더 다양한 경험을 쌓고 싶다는 생각이 들었습니다.

---

## 글 쓰는데 걸린 시간

초안 작성 5시간

리팩토링 2시간
