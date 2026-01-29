---
title: "재고 시스템으로 배우는 동시성 이슈 해결 전략: Synchronized, DB Lock, Redis 비교 분석"
description: "Java 멀티스레드 환경에서 발생하는 동시성 문제를 해결하기 위한 다양한 방법 - Synchronized, Pessimistic Lock, Optimistic Lock, Named Lock, Redis의 Lettuce와 Redisson을 활용한 분산 락 구현 및 성능 비교"
categories: concurrency
tags: [concurrency, synchronized, pessimistic_lock, optimistic_lock, Redis, 동시성이슈, 분산락, 재고시스템, 성능최적화]
---

>   [최상용님의 재고시스템으로 알아보는 동시성이슈 해결 방법](https://www.inflearn.com/course/%EB%8F%99%EC%8B%9C%EC%84%B1%EC%9D%B4%EC%8A%88-%EC%9E%AC%EA%B3%A0%EC%8B%9C%EC%8A%A4%ED%85%9C)에서 학습한 내용을 정리한 글입니다.


# 1. 쓰레드를 사용하여 재고 감소 테스트 하기

동시성을 고려하지 않고 재고 감소 기능을 구현할 할 경우, 경쟁상태 문제가 발생한다

```java
    @DisplayName("동시에 재고 감소를 요청한다.")
    @Test
    void decreaseWithThread() throws InterruptedException {
    	// given
        int threadCount = 100;
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        CountDownLatch latch = new CountDownLatch(threadCount);

        // when
        for (int i = 0 ; i < threadCount ; i++) {
            executorService.submit(() -> {
                try {
                    stockService.decrease(1L, 1L);
                } finally {
                    latch.countDown();

                }
            });
        }
        latch.await();

        // then
        Stock stock = stockRepository.findById(1L).orElseThrow();
        assertThat(stock.getQuantity()).isZero();
  }

```

**CountDownLatch latch = new CountDownLatch(threadCount);**

- CountDownLatch는 스레드들이 일정한 시점에 도달할 때까지 대기하도록 하기 위해 사용한다. 여기서는 100개의 작업이 모두 완료될 때까지 대기하는 데 사용된다.

**executorService.submit(() ->**

- 각 반복에서 executorService에 작업을 제출한다. 작업은 람다식으로 정의된 코드 블록으로, 스레드 풀에서 실행된다.

**latch.await();**

- latch의 카운트가 0이 될 때까지 현재 스레드를 대기시킨다.

**결과**

```jsx

   //org.opentest4j.AssertionFailedError: 
	 //expected: 0L
	 //but was: 94L
```

# 2. Synchronized로 동시성 문제 해결하기

자바에서 지원하는 `Synchronized`를 사용하면 1개의 쓰레드만 공유 자원에 접근이 가능 제한할 수 있다.

```java
    //@Transactional
    public synchronized void decrease(Long id, Long quantity){
        // stock 조회
        Stock stock = stockRepository.findById(id).orElseThrow();
        //재고 감소
        stock.decrease(quantity);
        //갱신 값 저장
        stockRepository.saveAndFlush(stock);
    }
```

주의해야 할 점은 `synchronized`과  `Transactional`을 같이 사용 하면 안된다.

`Transactional` 어노테이션을 사용하면 트랜잭션 안에서 재고를 감소한 뒤 데이터 베이스에 커밋하기 전에 다른 쓰레드에서 재고 감소를 요청할 수 있게 된다.

추가로, 자바의 `synchronized`는 각 프로세스 안에서만 보장이 되기 때문에 만약 서버가 2개 이상이라면 경쟁 상태 문제가 다시 발생한다.



# 3. Database를 이용해 동시성 문제 해결하기

## Pessimistic Lock(비관적 잠금)

- 실제 데이터에 Lock을 걸어 데이터 정합성을 맞춘다.
- exclusive lock을 걸면 다른 트랜잭션은 lock이 해제 될 때까지 기다리게 된다.
- 데드락이 걸릴 수 있다.

## Optimistic Lock(낙관적 잠금)

- 실제 데이터에 Lock을 걸지 않고, 버전 관리를 하여 데이터 정합성을 맞춘다.
- 데이터를 조회 후 업데이트를 하는 시점에 읽은 버전이 맞는지 확인한 뒤 업데이트를 한다.
- 만약 읽고 난 후 데이터에 수정사항이 있어 버전이 높아졌다면  데이터를 다시 읽고 작업을 수행하는 로직을 넣어줘야한다.

## Named Lock

- 이름을 가진 Lock을 획득한 후 해제 할 때까지 다른 세션은 해당 Lock을 사용하지 못한다.
- **트랜잭션이 종료될 때 Lock을 자동으로 해제하지 않기 때문에 주의해야한다.**
- 해제 명령어를 실행하거나 선점 시간이 끝나야 Lock을 해제한다.
- Pessimistic Lock과 다른점은 데이터베이스의 row나 table에 직접 Lock을 걸지 않는다는 것이다.

## 3.1 Pessimistic Lock

Spring date JPA를 사용하면 `@Lock` 어노테이션을 사용하여 Pessimistic Lock을 사용할 수 있다.

```java

public interface StockRepository extends JpaRepository<Stock, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stock s where  s.id = :id")
    Stock findByIdWithPessimisticLock(Long id);
}

```

Pessimistic Lock을 사용하면 아래와 같이 select for update 라는 쿼리가 나간다.

```sql
 select s1_0.id,s1_0.product_id,s1_0.quantity from stock s1_0 where s1_0.id=? for update
Hibernate: select s1_0.id,s1_0.product_id,s1_0.quantity from stock s1_0 where s1_0.id=? 
**for update**
```

Pessimistic Lock 장점은 **충돌이 빈번**하다면 Optimistic Lock보다 **성능이 좋을 수 있다.**

또한 데이터베이스의 락을 사용하기 때문에 데이터 정합성이 정확하다.

하지만 별도의 락을 사용하기 때문에 일반적인 경우  성능 저하가 있을 수 있다.

## 3.2 Optimistic Lock

버전관리를 위해 Stock 엔티티에 `version` 필드를 추가한다

```java
    @Version
    private Long version;
```

Spring date JPA를 사용하면 `@Lock` 어노테이션을 사용하여 Optimistic Lock을 사용할 수 있다.

```java
    @Lock(LockModeType.OPTIMISTIC)
    @Query("select s from Stock s where  s.id = :id")
    Stock findByIdWithOptimisticLock(Long id)
```

업데이트 시점에 조회 버전을 확인한다. 만약 버전이 달라졌다면 재 시도를 해야한다. 재시도를 위해 facade 서비스를 만들고 예외가 발생하면 다시 요청 할 수 있도록 개발자가 직접 로직을 구현한다.

```java
@RequiredArgsConstructor
@Component
public class OptimisticLockStockFacade {
    private final OptimisticLockStockService optimisticLockStockService;

    public void decrease(Long id, Long quantity) throws InterruptedException {
        while (true) {
            try {
                optimisticLockStockService.decrease(id, quantity);
                break;
            } catch (Exception e) {
                Thread.sleep(50);

            }
        }
    }
}
```

장점은 별도의 데이터베이스 락을 설정하지 않기 때문에 Pessimistic Lock보다 조금 더 빠르다.

하지만 별도의 재시도 로직을 직접 작성해야 하는 불편함이 있다.

충돌이 빈번하지 않을 때 사용하면 좋다.

## 3.3 Named Lock

`Native` 쿼리로 Lock을 획득하고 해제하는 쿼리를 작성한다.

```java
public interface LockRepository extends JpaRepository<Stock, Long> {
    @Query(value = "select get_lock(:key, 3000)", nativeQuery = true)
    void getLock(String key);

    @Query(value = "select release_lock(:key)", nativeQuery = true)
    void releaseLock(String key);
}

```

`get_lock(:key, 3000)`

- 3000초 동안 잠금을 얻으려고 시도한다.
- 만약 3000초 내 Lock을 얻지 못하면 0 또는 NULL 을 반환하고 Lock을 획득하면 1을 반환한다.

Lock을 획득하고 해제하는 과정이 필요하기 때문에 Facade 서비스를 활용한다.

```java
@RequiredArgsConstructor
@Component
public class NamedLockStockFacade {
    private final LockRepository lockRepository;
    private final StockService stockService;

    @Transactional
    public void decrease(Long id, Long quantity) {
        try {
            lockRepository.getLock(id.toString());
            stockService.decrease(id, quantity);
        } finally {
            lockRepository.releaseLock(id.toString());

        }
    }
}
```

decrease 로직은 부모 트랜잭션과 분리되어야 하기 때문에 `@Transactional(propagation = Propagation.REQUIRES_NEW)` 로 선언한다.

```java
@RequiredArgsConstructor
@Service
public class StockService {
    private final StockRepository stockRepository;

    **@Transactional(propagation = Propagation.REQUIRES_NEW)**
    public void decrease(Long id, Long quantity){
        // stock 조회
        Stock stock = stockRepository.findById(id).orElseThrow();
        //재고 감소
        stock.decrease(quantity);
        //갱신 값 저장
        stockRepository.saveAndFlush(stock);
    }
}

```

주로 분산락을 구현할 때, 데이터 삽입 시 정합성을 맞춰야 하는 경우 사용한다.

장점은 타임아웃을 쉽게 구현할 수 있다.  하지만, 트랜잭션 종료 시 락 해제와 세션 관리가 필요하기 때문에 주의해서 사용해야한다.

# 4. Redis를 활용해 경쟁상태 해결하기

## 4.1 Lettuce

`setnx` 명령어는 는 값이 존재하지 않을 때 만 값을 set 하는 명령어이다.

Redis는 싱글  쓰레드로 동작하기 때문에 쓰레드들이 동시에 공유 자원에 접근하여도 이전 쓰레드 작업이 끝날 때까지 대기한다. 따라서 setnx 명령어를 활용해서도 동시성 문제를 해결 할 수 있다.

```java
//docker exec -it 레디스 컨테이너 아이디 redis-cli
127.0.0.1:6379> setnx 1 lock
(integer) 1
127.0.0.1:6379> setnx 1 lock
(integer) 0
127.0.0.1:6379> del 1
(integer) 1
127.0.0.1:6379> setnx 1 lock
(integer) 1
```

Redis의 setnx 명령어를 lock과 unlock 메소드로 구현한다.

```java

@RequiredArgsConstructor
@Component
public class RedisLockRepository {
    private RedisTemplate<String, String> redisTemplate;

    public Boolean lock(Long key) {
        return redisTemplate
                .opsForValue()
                .setIfAbsent(generateKey(key), "lock", Duration.ofMillis(3_000));
    }

    public void unlock(Long key) {
        redisTemplate.delete(generateKey(key));
    }

    private String generateKey(Long key) {
        return key.toString();
    }

}
```

**opsForValue()**

- opsForValue()는 Redis에서 String 타입 값을 처리하는 작업을 제공하는 메서드이다.
- Redis의 String 타입은 가장 기본적인 데이터 타입으로, 간단한 키-값 저장에 사용된다.

Lettuce는 **스핀 락** 방식이다. 아래와 같이 잠금을 획득 하지 못하면 일정 텀을 두고 재시도하는 과정이 필요하다.

```java
@RequiredArgsConstructor
@Component
public class LettuceLockStockFacade {
    private final RedisLockRepository redisLockRepository;
    private final StockService stockService;

    public void decrease(Long id, Long quantity) throws InterruptedException {
        while (!redisLockRepository.lock(id)) {
            Thread.sleep(100); //텀을 두어 레디스 부하 감소
        }
        try {
            stockService.decrease(id, quantity);
        } finally {
            redisLockRepository.unlock(id);
        }

    }
}
```

Mysql의 Named Lock과 유사하게 동작하다. 장점은 구현이 간단하고 세션 관리에 신경을 쓰지 않아도 된다.

하지만 스핀 락 방식임으로 Redis에 부하를 줄 수 있다.

**실무에서는 재시도가 필요하지 않은 lock이 필요할 때 Lettuce로 사용한다.**

## 4.2 Redisson

별도의 라이브러리가 필요하다.

`build.gradle`

```java
implementation group: 'org.redisson', name: 'redisson-spring-boot-starter', version: '3.34.1'
```

Redis의 구독과 발행을 기능을 활용하여 Lock을 구현하는 방식이다.

```java
//sub
127.0.0.1:6379> subscribe ch1
1) "subscribe"
2) "ch1"
3) (integer) 1
```

```java
//pub
127.0.0.1:6379> publish ch1 hello
(integer) 1
127.0.0.1:6379>
```

```java
//sub
127.0.0.1:6379> subscribe ch1
1) "subscribe"
2) "ch1"
3) (integer) 1
1) "message"
2) "ch1"
3) "hello"
```

Lock을 획득하는 대기시간과 Lock을 얻고 자동으로 해지하는 `lease` 시간을 설정할 수 있다.

```java
@Component
public class RedissonLockStockFacade {

    private RedissonClient redissonClient;

    private StockService stockService;

    public RedissonLockStockFacade(RedissonClient redissonClient, StockService stockService) {
        this.redissonClient = redissonClient;
        this.stockService = stockService;
    }

    public void decrease(Long key, Long quantity) {
        RLock lock = redissonClient.getLock(key.toString());

        try {
            **boolean available = lock.tryLock(10, 1, TimeUnit.SECONDS);**

            if (!available) {
                System.out.println("lock 획득 실패");
                return;
            }

            stockService.decrease(key, quantity);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            lock.unlock();
        }
    }
}
```

장점은 Lettuce와 비교하였을 때 Redis 부하를 줄일 수 있다. 하지만 구현이 복잡하고 별도의 라이브러리를 사용해야한다는 단점이있다.

**실무에서는 재시도가 필요한 경우 redisson을 활용한다.**

# 5. 동시성 해결을 위한 Redis vs Mysql

## Mysql

- Mysql을 사용하고 있다면 별도의 비용이 필요없고, 어느정도 트래픽까지 문제없이 활용이 가능하다.
- 단, Redis보다는 성능이 좋지 않다.

## Redis

- Redis를 사용하고 있지 않다면 별도의 구축 비용, 관리비용이 필요하다.
- 단 Mysql보다는 성능이 좋다
