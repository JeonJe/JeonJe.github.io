---
title: Optional chaining
categories: optional chaning
tags: [optional chaning]

---
# 옵셔널 체이닝이 필요한 이유 
옵셔널 체이닝 `?.` 을 사용하면 프로퍼티가 없는 중첩 객체를 에러 없이 안전하게 접근할 수 있습니다.

옵셔널 체이닝이 추가 되기 전엔 `&&` 연산자로 연결해 실제 해당 객체나 프로퍼티가 있는지 확인해야하기 때문에 코드가 길어지는 단점이 존재하였습니다.
```javascript
let user = {}; // 주소 정보가 없는 사용자

alert( user && user.address && user.address.street ); // undefined, 에러가 발생하지 않습니다.
```


# 옵셔널 체이닝 동작
`?.` 앞의 평가 대상이 `undefined`나 `null`이면 평가를 멈추고 `undefined`를 반환합니다.
```javascript
let user = null;

alert( user?.address ); // undefined
alert( user?.address.street ); // undefined
```

user가 null이나 undefined가 아니고 실제 값이 존재하는 경우엔 반드시 street 프로퍼티가 있어야 합니다. 그렇지 않으면 user?.address.street 의 두 번째 점 연산에서 에러가 발생합니다.

> ?. 는 존재하지 않아도 괜찮은 대상에만 사용해야합니다. 위에서 user는 반드시 있어야 하는데 address는 필수가 아닙니다. 따라서 user.address?.street으로 사용하는 것이 바람직합니다. 만약, user에 값이 할당하지 않았다면 바로 알아낼 수 있도록 해야합니다.


# 단락 평가
`?.`는 왼쪽 평가 대상에 값이 없으면 평가를 즉시 멈춥니다. 이런 평가 방법을 단락 평가(`short-circuit`)이라고 합니다.
그렇기 때문에 함수 호출을 비롯한 `?.` 오른쪽에 있는 부가동작은 `?.` 평가가 멈췄을 때 더는 일어나지 않습니다.
```javascript
let x = 0;

user?.sayHi(x++); // 아무 일도 일어나지 않습니다.

alert(x); // 0, x는 증가하지 않습니다.
```

# ?.() 와 ?.[]
?. 은 연산자가 아닙니다. 함수나 대괄호와 함께 동작하는 특별한 문법 구조체(`syntax construct`)입니다.

```javascript
let user1 = {
  admin() {
    alert("관리자 계정입니다.");
  }
}

let user2 = {};

user1.admin?.(); // 관리자 계정입니다.
user2.admin?.();
```
user1엔 admin이 정의 되었기 때문에 메서드가 정상 호출되고, user2엔 admin 메서드가 없지만 에러없이 그냥 평가가 멈춥니다. 

. 대신 대괄호[] 를 사용해 객체 프로퍼티에 접근하는 경우엔 `?.[]`를 사용할 수 있습니다. 이 경우 객체 존재 여부가 확실하지 않은 경우에도 완전하게 프로퍼티를 읽을 수 있습니다.
```javascript
let user1 = {
  firstName: "Violet"
};

let user2 = null; // user2는 권한이 없는 사용자라고 가정해봅시다.

let key = "firstName";

alert( user1?.[key] ); // Violet
alert( user2?.[key] ); // undefined

alert( user1?.[key]?.something?.not?.existing); // undefined
```

# 요약

옵셔널 체이닝 문법 `?.`은 세 가지 형태로 사용할 수 있습니다.

1. `obj?.prop` – `obj`가 존재하면 `obj.prop`을 반환하고, 그렇지 않으면 `undefined`를 반환함
2. `obj?.[prop]` – `obj`가 존재하면 `obj[prop]`을 반환하고, 그렇지 않으면 `undefined`를 반환함
3. `obj?.method()` – `obj`가 존재하면 `obj.method()`를 호출하고, 그렇지 않으면 `undefined`를 반환함


`?.`를 계속 연결해서 체인을 만들면 중첩 프로퍼티들에 안전하게 접근할 수 있습니다.

`?.`은 `?.`왼쪽 평가대상이 없어도 괜찮은 경우에만 선택적으로 사용해야 합니다.

꼭 있어야 하는 값인데 없는 경우에 `?.`을 사용하면 프로그래밍 에러를 쉽게 찾을 수 없으므로 이런 상황을 만들지 않도록 합니다.


# 참고 
[모던 JavaScript 튜토리얼](https://ko.javascript.info/optional-chaining#ref-245)
