---
title: "TypeScript 기초: 타입 시스템과 객체지향 프로그래밍 활용법"
description: "타입스크립트의 핵심 개념, 타입 정의, 인터페이스, 제네릭, 구조적 타입 시스템 등 자바스크립트 개발자를 위한 타입스크립트 입문 가이드"
categories: etc frontend
tags: [typescript, javascript, 타입시스템, 인터페이스, 제네릭, 객체지향, 정적타입, 타입추론, 웹개발]

---

## 타입스크립트란?
### 자바스크립트
타입스크립트를 알아보기 전 우선 자바스크립트의 히스토리에 대해 간략히 알아보겠습니다.

우선, 자바스크립트(ECMAScript)는 처음에 브라우저를 위한 스크립팅 언어로 만들어졌습니다. 자바스크립트는 점점 유명해지면서 실행 엔진을 최적화 시키고, 최적화 된 것을 이용해 할 수 있는 확장하여 웹 개발자가 더 많은 것을 할 수 있게 되었습니다. 또한, node.js를 사용하여 브라우저 외의 환경에서도 자바스크립트 언어를 사용하기 시작하였습니다.

이런 배경에서 자바스크립트 언어를 사용한 개발의 문제점이 보이기 시작하였습니다.

예로 자바스크립트의 `==` 는 두 피연산자 타입이 다를 경우 자동으로 일부 피연산자의 타입을 변환하여 비교하기 때문에 예기치 않은 동작을 유발합니다.

```javascript
if ("" == 0) {
  // 참을 실행합니다.
}
if (1 < x < 3) {
  // *어떤* x 값이던 참이게 됩니다.
}
```

또한, 자바스크립트는 존재하지 않는 프로퍼티의 접근을 허용합니다.
대부분의 프로그래밍 언어는 아래와 같이 오타가 나면 컴파일 중에 오류를 알려주게 되지만, 자바스크립트는 NaN을 area에 담게 됩니다.
많은 라인의 코드 중에 이런 문제점이 숨어 있으면 찾기가 어렵겠죠?
```javascript
const obj = { width: 10, height: 15 };
// height에 오타가 있기 때문에 area는 NaN이 되지만, 사전에 알 수 있는 방법이 없습니다.
const area = obj.width * obj.heigth;
```

### 왜 타입스크립트를 사용할까?
**정적 타입 검사자**

프로그램을 실행시키지 않으면서 코드의 오류를 검출하는 것을 정적 검사라고 합니다. 타입스크립트는 정적 타입 검사자(A Static Type Checker)로 앞서 살펴본 heigth를 오타로 heigth로 쳤을 경우  2551 에러를 발생시킵니다.

**런타임 특성**

자바스크립트에서 0으로 나누는 연산은 런타임 예외로 처리하지 않고 `Infinity` 값을 반환합니다. 논리적으로 타입스크립트는 자바스크립트 코드의 런타임 특성을 절대 변화시키지 않습니다. 그렇기 때문에 타입스크립트는 코드에 타입 오류가 있음을 검출해도 자바스크립트 코드를 타입스크립트 코드로 이동시키는 것은 같은 방식으로 실행시킬 것을 보장합니다.

만약 런타임 동작이 다르다면, 자바스크립트 언어를 타입스크립트 언어로 전환할 때 아주 걱정이 되겠죠?

**삭제된 타입**

타입스크립트의 컴파일러가 코드 검사를 마치며 타입을 삭제해서 컴파일된 코드를 생성합니다. 즉, 결과인 자바스크립트 코드에는 타입에 대한 정보가 없습니다. 이는 위에서 살펴본 런타임 특성을 변화시키지 않는 것을 보장하는 것과 관련이 있습니다. 

---
## 타입 정의하기
타입을 명시하는 경우 아래와 같이 인터페이스에 타입을 명시하여 사용합니다.
```javascript
interface User {
  name: string;
  id: number;
}
// ---cut---
const user: User = {
  name: "Hayes",
  id: 0,
};

// @errors: 2322
interface User {
  name: string;
  id: number;
}
// username은 User에 없기 때문에 에러 발생 
const user: User = {
  username: "Hayes",
  id: 0,
};
```

타입을 명시한 인터페이스는 함수의 매개 변수와 리턴 값을 명시하는데도 사용 할 수 있습니다.

```javascript
// @noErrors
interface User {
  name: string;
  id: number;
}
// ---cut---
function getAdminUser(): User {
  //...
}

function deleteUser(user: User) {
  // ...
}
```

자바스크립트에서 사용할 수 있는 boolean, bigint, null, number, string, symbol, object, undefined 는 인터페이스에 추가할 수 있습니다. 그 외에도 몇가지 타입을 사용할 수 있습니다.

- any : 무엇이든 허용
- unknown : 모른다. any타입과 동일하게 모든 값을 허용은 하지만, 어떤 타입이 될지 모르기 때문에 함부로 프로퍼티나 연산을 할 수 있다. 조건문으로 타입검사를 하는 경우 정상 동작 
- never : 이 타입은 발생될 수 없음
- void : undefined를 리턴하거나 리턴 값이 없는 함수
```javascript
// never를 반환하는 함수는 함수의 마지막에 도달할 수 없다.
function error(message: string): never {
    throw new Error(message);
}

// 반환 타입이 never로 추론된다.
function fail() {
    return error("Something failed");
}

// never를 반환하는 함수는 함수의 마지막에 도달할 수 없다.
function infiniteLoop(): never {
    while (true) {
    }
}

function warnUser(): void {
    console.log("This is my warning message");
}
```


### 타입 구성(Composing Types)
여러가지 타입을 이요하여 새 타입을 작성할 수 있습니다. 가장 많이 사용되는 두 가지는 `Union`과 `Generic`입니다.

**Union**

타입이 여러 타입 중 하나일 수 있음을 선언하는 방법입니다.
```javascript
type WindowStates = "open" | "closed" | "minimized";
type LockStates = "locked" | "unlocked";
type OddNumbersUnderTen = 1 | 3 | 5 | 7 | 9;

unction wrapInArray(obj: string | string[]) {
  if (typeof obj === "string") {
    return [obj];
  } else {
    return obj;
  }
}
```


**Generics**

타입에 변수를 제공하는 방법입니다. 
```javascript
type StringArray = Array<string>;
type NumberArray = Array<number>;
type ObjectWithNameArray = Array<{ name: string }>;
```

---
## 구조적 타입 시스템(Structual Type System)
타입 검사가 값이 있는 형태에 집중합니다. 때로는 이 것을 `덕(duck)타이핑` 또는 `구조적타이핑`이라고 부릅니다.

구조적 타입 시스템에서 두 객체가 같은 형태를 가지면 같은 것으로 간주합니다.

```javascript
interface Point {
  x: number;
  y: number;
}

function printPoint(p: Point) {
  console.log(`${p.x}, ${p.y}`);
}

// "12, 26"를 출력합니다
const point = { x: 12, y: 26 };
printPoint(point);
```
위 코드에서 `point`는 `Point`타입으로 선언된 적이 없지만 타입스크립트는 타입검사에서 point와 Point의 형태를 비교하고 둘 다 같은 형태이기 때문에 통과를 시킵니다.

형태 일치에는 일치시킬 객체의 필드의 하위 집합만 필요합니다.

구조적으로 클래스와 객체가 형태를 따르는 방법에는 차이가 없습니다. 객체 또는 클래스에 필요한 모든 속성이 존재한다면, 타입스크립트는 구현 세부 정보에 관계없이 일치하게 봅니다.
```javascript
// @errors: 2345
interface Point {
  x: number;
  y: number;
}

function printPoint(p: Point) {
  console.log(`${p.x}, ${p.y}`);
}
// ---cut---
class VirtualPoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

const newVPoint = new VirtualPoint(13, 56);
printPoint(newVPoint); // prints "13, 56"
```

---
## 타입스크립트 사용
타입스크립트를 설치하는 방법은 크게 두가지가 있습니다.
1. `npm`을 이용한 설치(Node.js 패키지 매니저)
2. 타입스크립트의 `Visual Studio`플러그인 설치 

타입스크립트는 확장자 파일명을 `ts`로 사용합니다.
이 타입스크립트 파일을 타입스크립트 컴파일로 컴파일해주어야 합니다.
```shell
tsc 파일명.ts
```

다음은 클래스 사용예제입니다.
생성자의 인수에 `public` 을 사용하는 것은 그 인수의 이름으로 프로퍼티를 자동적으로 생성하는 축약형입니다.

```javascript
class Student {
    fullName: string;
    constructor(public firstName: string, public middleInitial: string, public lastName: string) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person: Person) {
    return "Hello, " + person.firstName + " " + person.lastName;
}

let user = new Student("Jane", "M.", "User");

document.body.textContent = greeter(user);
```

---
## 인터페이스
### 선택적 프로퍼티
선택적 프로퍼티는 객체 안의 몇 개의 프로퍼티만 채워서 함수에 전달하는 `option bags`와 같은 패턴을 만들 때 유리합니다.
```javascript
interface SquareConfig {
    color?: string;
    width?: number;
}

function createSquare(config: SquareConfig): {color: string; area: number} {
    let newSquare = {color: "white", area: 100};
    if (config.color) {
        newSquare.color = config.color;
    }
    if (config.width) {
        newSquare.area = config.width * config.width;
    }
    return newSquare;
}

let mySquare = createSquare({color: "black"});
```
선택적 프로퍼티는 선언에서 이름끝에 `?`를 붙여 표시합니다. 장점은 인터페이스에 속하지 않는 프로퍼티를 방지하면서 사용 가능한 속성을 기술하는 것입니다.

### 읽기 전용 프로퍼티 
```javascript
interface Point {
    readonly x: number;
    readonly y: number;
}
```

### 함수 타입
인터페이스로 함수 타입을 기술하기 위해서는 인터페이스에 호출 서명 (call signature)를 전달합니다.
```javascript
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(src: string, sub: string): boolean {
    let result = src.search(sub);
    return result > -1;
}

//타입스크립트의 문맥상 타이핑이 인수 타입을 추론할 수도 있습니다.
let mySearch: SearchFunc;
mySearch = function(src, sub) {
    let result = src.search(sub);
    return result > -1;
}

```

### 인덱서블 타입
`a[10]`이나 `ageMap["daniel"]`처럼 타입을 인덱스로 기술할 수 있습니다.

인덱서블 타입은 인덱싱 할때 해당 반환 유형과 함께 객체를 인덱싱하는 데 사용할 수 있는 타입을 기술하는 인덱스 시그니처(index signature)를 가지고 있습니다.
```javascript
interface StringArray {
    [index: number]: string;
}

let myArray: StringArray;
myArray = ["Bob", "Fred"];

let myStr: string = myArray[0];
```
인덱스 서명을 지원하는 타입은 문자열과 숫자가 있습니다.
두 타입의 인덱서를 모두 지원하는 것은 가능하지만, 숫자 인덱서에서 반환된 타입은 반드시 문자열 인덱서에서 반환된 타입의 하위 타입이여야 합니다. `nubmer`로 인덱싱할 때 자바스크립트는 실제로 객체를 인덱싱하기 전에 `string`으로 변환하기 때문입니다.
```javascript
class Animal {
    name: string;
}
class Dog extends Animal {
    breed: string;
}

// 오류: 숫자형 문자열로 인덱싱을 하면 완전히 다른 타입의 Animal을 얻게 될 것입니다!
interface NotOkay {
    [x: number]: Animal;
    [x: string]: Dog;
}

```
### 클래스 타입
**인터페이스 구현하기**

클래스가 특정 계약을 충족시키도록 명시적으로 강제하는 자바와 같은 언어에서 인터페이스를 사용하는 가장 일반적인 방법은 타입스크립트에서도 가능합니다.

```javascript
interface ClockInterface {
    currentTime: Date;
    setTime(d: Date): void;
}

class Clock implements ClockInterface {
    currentTime: Date = new Date();
    setTime(d: Date) {
        this.currentTime = d;
    }
    constructor(h: number, m: number) { }
}
```
인터페이스는 클래스의 public과 private 모두보다는 public을 기술합니다. 그래서 클래스 인스턴스의 private에서는 특정 타입이 있는지 검사가 불가합니다.

**클래스의 스태틱과 인스턴스의 차이점**

클래스와 인터페이스를 다룰 때, 클래스는 두 가지 타입을 가진다는 것을 기억하는게 좋습니다. 
1. 스태틱 타입
2. 인스턴스 타입

생성 시그니쳐 (`construct signature`)로 인터페이스를 생성하고, 클래스를 생성하려고 한다면 인터페이스를 implements할 때 에러가 발생합니다.
```javascript
interface ClockConstructor {
    new (hour: number, minute: number);
}

class Clock implements ClockConstructor {
    currentTime: Date;
    constructor(h: number, m: number) { }
}
```
클래스가 인터페이스를 implements할 때, 클래스의 인스턴스만 검사하기 때문입니다. 생성자가 static이기 때문에 이 검사에 포함되지 않습니다. 대신에 클래스의 스태틱 부분을 직접적으로 다뤄야합니다. 
아래는 `ClockConstructor`는 생성자를 정의하고, ClockInterface는 인스턴스 메서드를 정의하는 두 인터페이스를 정의합니다. 그리고 편의를 위해 전달된 타입의 인스턴스를 생성하는 `createClock` 생성자 함수를 정의합니다.

```javascript
interface ClockConstructor {
    new (hour: number, minute: number): ClockInterface;
}
interface ClockInterface {
    tick(): void;
}

function createClock(ctor: ClockConstructor, hour: number, minute: number): ClockInterface {
    return new ctor(hour, minute);
}

class DigitalClock implements ClockInterface {
    constructor(h: number, m: number) { }
    tick() {
        console.log("beep beep");
    }
}
class AnalogClock implements ClockInterface {
    constructor(h: number, m: number) { }
    tick() {
        console.log("tick tock");
    }
}

let digital = createClock(DigitalClock, 12, 17);
let analog = createClock(AnalogClock, 7, 32);
```
`createClock`의 첫 번째 매개변수는 `createClock(AnalogClock, 7, 32)`안에 `ClockConstructor` 타입이므로, `AnalogClock`이 올바른 생성자 시그니처를 갖고 있는지 검사합니다.

또 다른 쉬운 방법은 클래스 표현을 사용하는 것입니다.
```javascript
interface ClockConstructor {
  new (hour: number, minute: number);
}

interface ClockInterface {
  tick();
}

const Clock: ClockConstructor = class Clock implements ClockInterface {
  constructor(h: number, m: number) {}
  tick() {
      console.log("beep beep");
  }
}
```

### 인터페이스 확장하기
클래스처럼 인터페이스들도 확장이 가능합니다.
```javascript
interface Shape {
    color: string;
}

interface PenStroke {
    penWidth: number;
}

interface Square extends Shape, PenStroke {
    sideLength: number;
}

let square = {} as Square;
square.color = "blue";
square.sideLength = 10;
square.penWidth = 5.0;
```

## 참고
[TypeScript-Handbook 한글 문서](https://typescript-kr.github.io/pages/tutorials/ts-for-the-new-programmer.html)

[TypeScript의 소개와 개발 환경 구축](https://poiemaweb.com/typescript-introduction)