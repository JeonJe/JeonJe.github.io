---
title: Composition API with TypeScript
categories: composition API
tags: [composition API]

---

>  [Vue.js 공식홈페이지](https://ko.vuejs.org/guide/typescript/composition-api.html#typing-reactive)에서 TypeScript와 Composition API 사용의 일부를 정리한 내용입니다.




최근 Vue2로 작성된 사내 서비스를 Vue3 Composition API + Nuxt + TypeScript 형태로 
전환을 진행 중에 있습니다. 

Composition API의 장점은 Options API와 달리 분산되어 있는 코드들을 그룹핑하기 때문에 관련 코드들을 좀 더 쉽게 파악할 수 있고, Composables을 활용하여 재사용성을 개선할 수 있습니다. 또한, 타입스크립트의 최적화와 타입 추론 성능 개선에서도 이점이 있습니다.


## 컴포넌트 Props의 타이핑
### `<script setup>` 사용하기

`<script setup>`을 사용할 때, `defineProps()` 매크로는 작성된 인수를 기반으로 Props 타입을 추론할 수 있습니다.
```javascript
<script setup lang="ts">
const props = defineProps({
  foo: { type: String, required: true },
  bar: Number
})

props.foo // string
props.bar // number | undefined
</script>
```
이를 **런타임 선언** 이라고 부르는데, 보통은 제네릭 타입 인수를 사용하여 순수 타입으로 Props를 정의하는 것이 더 직관적입니다.

```javascript
<script setup lang="ts">
const props = defineProps<{
  foo: string
  bar?: number
}>()
</script>
```
위 같은 선언을 **타입 기반 선언** 이라고 합니다. 여기서 주의할 점은 두 선언을 동시에는 사용할 수 없습니다. Props 타입은 아래 코드처럼 별도의 인터페이스로 분리하여 사용할 수 있습니다.
```javascript
<script setup lang="ts">
interface Props {
  foo: string
  bar?: number
}

const props = defineProps<Props>()
</script>
```

### Props 기본값
타입 기반 선언을 사용할 때, Props에 대한 기본값을 선언할 수 없지만, `withDefaults` 컴파일러 매크로를 사용하여 초기값을 줄 수 있습니다.
```javascript
export interface Props {
  msg?: string
  labels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  labels: () => ['one', 'two']
})
```

## 컴포넌트 이벤트의 타이핑
`<script setup>`에서 `emit` 함수도 런타임 선언이나 타입 선얼을 통해 타이핑 할 수 있습니다.

```javascript
<script setup lang="ts">
// 런타임 선언
const emit = defineEmits(['change', 'update'])

// 타입 기반 선언
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()

// 3.3+: 대체, 더 간결한 문법
const emit = defineEmits<{
  change: [id: number]
  update: [value: string]
}>()
</script>
```

타입 인수는 다음 중 하나일 수 있습니다.
1. 호출 가능한 함수 타입
   -  `Call Signatures`와 함께 타입 리터럴로 작성되고, 반환된 emit 함수의 타입으로 사용됩니다.
2. 키가 이벤트 이름이가 값이 추가 허용되는 이벤트의 매개변수를 나타내는 배열 또는 튜플 타입인 타입 리터럴 입니다. 위 코드는 명명된 튜플을 사용하였기 때문에 각 인수에 명시적인 이름을 부여할 수 있습니다.


## `ref()` 의 타이핑
`ref`는 초기 값에서 타입을 추론합니다. ref 내부 값에 대해 복잡한 유형을 지정해야 하는 경우엔 Ref 타입을 사용할 수 있습니다. 또는, ref()를 호출할 때 제네릭 인수를 전달하여 기본 추론을 덮어 쓸 수 있습니다.
```javascript
import { ref } from 'vue'
import type { Ref } from 'vue'

const year: Ref<string | number> = ref('2020')

year.value = 2020 // 정상적인 동작!
// =======================================
// 결과 타입: Ref<string | number>
const year = ref<string | number>('2020')

year.value = 2020 // 정상적인 동작!
```

만약, 제네릭 유형 인수를 지정할 때 초기값을 생략하면, 결과 타입은 `undefined`를 포함한 유니온 타입이 됩니다.


## `computed()`의 타이핑
`computed()` 는 getter의 반환 값에 따라 타입을 추론합니다.
```javascript
import { ref, computed } from 'vue'

const count = ref(0)

// 추론된 타입: ComputedRef<number>
const double = computed(() => count.value * 2)

// => TS 에러: 'number'에는 'split' 속성이 존재하지 않습니다.
const result = double.value.split('')
```

제네릭 인수를 사용하여 명시적인 타입을 지정도 가능합니다.
```javascript
const double = computed<number>(() => {
  // 반환 값이 number가 아니면 타입 에러
})
```


## 템플릿 Ref의 타이핑
템플릿 ref는 명시적인 제네릭 타입 인수와 `null` 을 초기 값으로 사용하여 생성합니다.
```javascript
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const el = ref<HTMLInputElement | null>(null)

onMounted(() => {
  el.value?.focus()
})
</script>

<template>
  <input ref="el" />
</template>
```
엄격한 타입 안전성을 위해서 위 코드에서는 el.value에 접근할 때 옵셔널 체이닝 또는 타입 가드를 사용했습니다. 이렇게 사용하는 이유는 처음에 `ref`값이 컴포넌트가 마운트 될 때까지는 `null`이며, 참조된 요소가 v-if에 의해 마운트 해제 될 수 있기 때문입니다.


## 컴포넌트 템플릿 Ref의 타이핑
자식 컴포넌트에 대한 템플릿 ref를 주석으로 지정하여 공개 메서드를 호출하기 위한 템플릿 ref를 타입으로 지정할 수 있습니다.

예로, MyModal 자식 컴포넌트가 모달을 열기 위한 메서드를 가지고 있다고 가정하겠습니다.

```javascript
<!-- MyModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const isContentShown = ref(false)
const open = () => (isContentShown.value = true)

defineExpose({
  open
})
</script>
```
`MyModal`의 인스턴스 타입을 가져오기 위해 `typeof`로 해당 컴포넌트의 유형을 먼저 얻은 다음, TypeScript의 내장 `InstanceType` 유틸리티를 사용하여 해당 인스턴스 타입을 추출해야 합니다.

```javascript
<!-- App.vue -->
<script setup lang="ts">
import MyModal from './MyModal.vue'

const modal = ref<InstanceType<typeof MyModal> | null>(null)

const openModal = () => {
  modal.value?.open()
}
</script>
```

참고사항으로, vue SFC 대신 TypeScript 파일에서 이 기법을 사용하려면 Volar의 TakeOverMode를 활성화해야합니다.

만약, 컴포너너트의 정확한 유형 사용이 불가하거나 중요하지 않다면 ComponentPublicInstance를 사용할 수도 있습니다. 이는 $el과 같은 모든 컴포넌트에서 공유하는 속성만 포함합니다.
```javascript
import { ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

const child = ref<ComponentPublicInstance | null>(null)
```

