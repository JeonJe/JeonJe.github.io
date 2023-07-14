---
title: Project1 Thread
tags: [PintOS, Thread]
keywords: PintOS, Thread
sidebar: mydoc_sidebar
permalink:  pintos_thread.html
folder: pintos
last_updated: 2023-07-12
---

{% include note.html content='
크래프톤 정글 pintOS 프로젝트를 수행한 내용을 정리 
내용을 이해하는 용도로 참고
' %}

## 프로젝트 목표
### ✅ thread.h

- struct thread에 필드 추가

```c
int64_t tick_to_awake;
```

```c
/* thread_sleep & wake 관련 함수 추가 */
void thread_sleep(int64_t ticks);
void thread_awake(int64_t ticks);
void update_next_tick_to_awake(int64_t ticks);
int64_t get_next_tick_to_awake(void);

/* Priority Scheduling 관련 함수 추가 */
void test_max_priority(void);
bool cmp_priority(const struct list_elem *a, const struct list_elem *b, void *aux UNUSED);
bool cmp_donate_priority(const struct list_elem *a, const struct list_elem *b, void *aux UNUSED);

#endif /* threads/thread.h */
```

### ✅ timer.c

- timer_sleep 변경

```c
void
timer_sleep (int64_t ticks) {
	//시간이 음수거나 0 인 경우 예외처리
	if (ticks <= 0){
		return ;
	}

	// timer_ticks() : 인자로 주어진 ticks 동안 스레드를 block
	int64_t start = timer_ticks ();

	ASSERT (intr_get_level () == INTR_ON);

	 // busy waiting -> sleep & wake up
	 if (timer_elapsed(start) < ticks){
		thread_sleep(start + ticks);
	 }
}
```

- timer_interrupt 변경

```c
/* 
	sleep queue에서 깨어날 thread가 있는 지 확인 & sleep queue에서 
	가장 빨리 깨어날 쓰레드의 tick값 확인
	있다면 sleep queue 순회하며  thread_awake() 함수를 사용하여 깨움
*/
static void
timer_interrupt (struct intr_frame *args UNUSED) {
	ticks++;
	thread_tick ();

	int64_t next_tick = get_next_tick_to_awake();

	//추가 sleep list에서 꺠어나야할 thread가 있다면 awake 호출 
	if (next_tick <= ticks){
		thread_awake(ticks);
	}
}
```

## 프로젝트 구현

## 어려웠던 점 

## 고민한 점

## 배운 점 
