---
tags: [Spring Local Cache]
categories: java cache
tags: [java spring cache]
---

# 캐시의 필요성
외부 시스템과 연동하는 프로젝트를 진행 중인데, 연동하는 데이터들은 수정이 적고 조회는 빈번하기 때문에 캐시에 연동 정보를 저장하면 DB 조회를 줄여 성능을 개선할 수 있기에 캐시 도입을 알아보게 되었다.

# 스프링 캐시 특징  
- 스프링에서는 `Bean`의 메소드에 캐시를 적용할 수 있는 기능을 제공한다. 
- 스프링의 캐시 추상화는 AOP를 통해 적용되어 어플리케이션 코드를 수정하지 않고 캐시 기능을 추가하고 환경에 따라 변경이 가능하다.

기본캐시는 `concurrentMapCache`이며 Map타입으로 메모리에 저장하기 때문에 사용이 가장 간단하다. 하지만 TTL 등의 부가적인 캐시 기능이 빈약하다는 단점이 있다.


이런 단점을 보완하기 위해 스프링 로컬 캐시 라이브러리을 사용할 수 있는데 대표적으로 encache와 caffein이 있다. 
## ehcache vs caffein
로컬 캐시 라이브러리는 encache와 caffein이 있다.
단순 임시 저장/조회 용도의 캐시를 사용하기 때문에 상대적으로 더 높은 퍼포먼스를 보이는 caffein을 선택하였다.

세부 비교는 아래 블로그들에 잘 작성되어 있다.
- [encache vs caffein 비교 1](https://medium.com/naverfinancial/%EB%8B%88%EB%93%A4%EC%9D%B4-caffeine-%EB%A7%9B%EC%9D%84-%EC%95%8C%EC%95%84-f02f868a6192)
- [encache vs caffein 비교 2](https://gngsn.tistory.com/158)
- [카페인 라이브러리 적용 ](https://velog.io/@komment/%EC%BA%90%EC%8B%9C%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%98%EC%97%AC-%EB%B6%80%ED%95%98%EB%A5%BC-%EC%A4%84%EC%9D%B4%EA%B3%A0-%EC%84%B1%EB%8A%A5%EC%9D%84-%EA%B0%9C%EC%84%A0%ED%95%98%EC%9E%90)


# build.gradle.kts 추가
캐시를 사용하기 위해 gradle에 아래와 같이 추가한다.
```java
implementation ("org.springframework.boot:spring-boot-starter-cache")  
implementation ("com.github.ben-manes.caffeine:caffeine")
```

# Configuration 설정
Spring Boot Cache를 사용하기 위해서는 '캐시 활성화'가 필요하다  
`@EnableCaching` 어노테이션의 선언 위치는 `CacheManager()`를 구현한 `@Configuration`부분에서 선언하여 사용하였다.
캐시 매니저 객체를 생성하고 caffein 캐시를 설정하도록 set한다. 캐시 설정 부분에서는 캐시 이름, 만료 시간과 같은 세부사항을 설정 할 수 있다.

```java
@Configuration  
@EnableCaching  
public class CacheConfig {  
  
  @Bean  
  public List<CaffeineCache> caffeineCaches() {  
    return Arrays.stream(CacheType.values())  
        .map(  
            cache ->  
                new CaffeineCache(  
                    cache.getCacheName(),  
                    Caffeine.newBuilder()  
                        .recordStats()  
                        .expireAfterWrite(cache.getExpireAfterWrite(), TimeUnit.HOURS)  
                        .maximumSize(cache.getMaximumSize())  
                        .build()))  
        .toList();  
  }  
  
  @Bean  
  public CacheManager cacheManager(List<CaffeineCache> caffeineCaches) {  
    SimpleCacheManager cacheManager = new SimpleCacheManager();  
    cacheManager.setCaches(caffeineCaches);  
  
    return cacheManager;  
  }  
}
```
 캐시 설정은 확장성을 위해 enum으로 작성하여 관리한다.

```java


import lombok.Getter;

@Getter
public enum CacheType {
  HOSPITAL_MAPPING_PROFILE("이름");

  @Getter private String cacheName;
  private int expireAfterWrite;
  private int maximumSize;

  CacheType(String cacheName) {
    this.cacheName = cacheName;
    this.expireAfterWrite = ConstConfig.DEFAULT_TTL_HOUR;
    this.expireAfterWrite = ConstConfig.DEFAULT_MAX_SIZE;
  }

  static class ConstConfig {
    static final int DEFAULT_TTL_HOUR = 12;
    static final int DEFAULT_MAX_SIZE = 10000;
  }
}
```
- `cacheName` : 각 CacheType 상수에 대한 캐시의 이름
- `expireAfterWrite` :  캐시된 항목이 쓰기 작업 후에 만료되는 시간(유효기간)
- `maximumSize` : 캐시가 저장할 수 있는 최대 항목 수

# Cache 어노테이션

캐시 어노테이션은 메서드 단위의 AOP로 구현된다. 
주의점은 메소드의 리턴값이 캐싱된 경우 메서드는 아예 실행되지 않고 트랜잭션과 동일하게 `@Cacheable이` 된 클래스 내부 머세드를 호출하면 AOP가 동작하지 않는다.

## Cacheable
데이터를 캐시에 저장한다. 메서드를 호출할 때 캐시 이름(value)과 키(key)를 확인한다.
이미 저장된 데이터가 있으면 해당 데이터를 리턴하고 아니라면 메서드 수행 후 결과값을 저장한다.
## CachePut
Cacheable은 캐시에 데이터가 존재하면 메서드를 수행하지 않지만, `CachePut`은 항상 메서드를 수행한다. 
주로 캐시 데이터를 갱신할 때 사용한다.
## CacheEvict
캐시에 있는 데이터를 삭제한다.
## CacheConfig

메서드가 아닌 클래스에 붙여서 공통된 캐시 기능을 모을 수 있다.
예로 Repository에 `@CacheConfig(cacheNames = "이름")`을 붙여 "이름" 이라는 공통 캐시 이름을 설정할 수 있다.

## Caching
Cacheable, CachePut, CacheEvict를 여러개 사용 시 묶어 줄 때 사용 한다.


# 사용 방법

![](https://i.imgur.com/3AxVIif.png)

> 주의 : condition은 메서드를 호출하기전에, unldess는 메서드를 호출한 뒤에 평가한다. 즉, 메서드의 반환값 `#result`등의 조건은 unless로 확인해야한다.


## 조회 

`@Cacheable(key = "'all'")` 
`hospital::all `이라는 key 값에 데이터가 저장되고, 이후 조회 시 `hospital:all` 에서 데이터를 확인하고, 값이 존재시 바로 리턴한다.

`@Cacheable(key = "#Id", unless = "#result == null")` 
Id를 키값으로 사용한다. unless 조건은 DB에 없는 데이터는 캐싱하지 않도록 설정할 수 있다. 이 조건이 없으면 null도 캐싱한다. 

## 생성 및 변경
```java
@CachePut(key = "#member.id") 
@CacheEvict(key = "'all'") 
```

`CachePut`은 새로운 데이터를 저장하면 해당 데이터를 바로 캐싱하기 위해 추가한다. 캐싱하지 않아도 조회 시 캐싱되기 때문에 반드시 필요한 설정은 아니다.

`CacheEvict`을 통해 전체 조회 데이터를 삭제한다. 캐시를 갱신하지 않거나 비워주지 않으면 이전 데이터를 계속 보고 있기 때문에 캐시를 비워 줘야한다.
단건 조회라면 cacheput을 사용해서 갱신할 수 있지만 복수 조회라면 편의를 위해 findAll을 호출할 때 새로 캐싱하도록 비워준다.

## 삭제
```java
@Caching(evict = { @CacheEvict(key = "'all'"), @CacheEvict(key = "#member.id") })
```

삭제 시 전체 조회 캐시와 단건 조회 캐시를 모두 없애줘야한다.
중복된 어노테이션을 두 개 붙일 수 없기 때문에 `@Caching`으로 묶어서 적용한다.

# 예제
```java
@Slf4j  
@RequiredArgsConstructor  
@Service  
@CacheConfig(cacheNames = "이름")  
public class MappingService {  
  
private final MappingRepository MappingRepository;  
  
@Cacheable(key = "'MappingAll'")  
public List<Mapping> findAllMapping() {  
	log.info("[DB호출] findAllMapping");  
	return MappingRepository.findAll();  
}  
  
@Cacheable(key = "#hospitalSeq + ':' + #emrType")  
public Mapping findByHospitalSeqAndEmrType(int hospitalSeq, int emrType) {  
	log.info("[DB호출] findByHospitalSeqAndEmrType ");  
	return MappingRepository.findByHospitalSeqAndEmrType(hospitalSeq, emrType);  
}  
  
@Cacheable(key = "#Id + ':' + #emrType")  
public Mapping findByIdAndEmrType(String Id, int emrType) {  
	log.info("[DB호출] findByIdAndEmrType");  
	return MappingRepository.findByIdAndEmrType(Id, emrType);  
}  
  
@CacheEvict(allEntries = true)  
public void evictAllCaches() {}  
}
```
- 서비스 클래스 상단에 `@CacheConfig(cacheNames = "이름")` 어노테이션으로 캐시 이름을 설정한다.
- 처음 `findByHospitalSeqAndEmrType`을 호출하면 메소드 반환값을 지정해준 key 값의 이름을 가지고 캐싱한다. 첫 호출이기 때문에 메소드 내 작성한 로그남게 된다.
- 연속해서 `findByHospitalSeqAndEmrType` 을 호출할 경우엔 같은 key를 가진 데이터가 캐싱되었기 때문에 메소드가 실행 되지 않는다. 따라서 메소드 내 로그가 실행이 되지 않는다.


# 캐싱 테스트 코드

`@Cacheable` 어노테이션을 달아준 메소드는 10번 호출해도 정확히 1번만 실행될 것임을 테스트하여 캐싱이 정상적으로 되었는지 확인할 수 있다.

```java
// when
IntStream.range(0, 10).forEach((i) -> memberService.findMemberByNickname("TEST"))
// then
verify(memberRepository, times((1))).findMemberByNickname("TEST");
```


# 주의점

- `@cacheable` 을 이용해 설정한 메소드는 정상적으로 종료되어야 캐쉬가 저장된다.
- 해당 메소드 안에서 `throw new Exception()` 이 발생하면 캐쉬는 저장되지 않는다
- 만약, null로 반환되는 데이터를 cache하고 싶은 경우는 ==unless== 키워드를 사용한다.
- **하나의 Service 안에 메소드를 내부에서 call(동일 클래스 내 호출)하게 되면(self-invocation) proxy interceptor를 타지 않고,  바로 메소드를 호출하기 때문에 캐싱되지 않는다**
 - cache될 데이터가 직렬화(Serializable)가 가능해야 한다. 만약 직렬화(serializalbe)이 되지 않는다면, 캐시가 되지 않는다. 혹시 캐시가 되지 않는다면 데이터의 `implement Serializalbe`를 이용하자.
- Cache TTL time 을 활용한 `cache eviction` 기능을 활용 하는것을 추천한다.
- Cache Element 개수는 수치상으로 메모리가 충분하다는 가정하에 max 5000개 이하로 설정하는 것이 효율적이다. 단, One Thread / One instnace 환경 테스트에서는 entry 개수가 1000개 이하는 CPU usage가 큰 의미가 없다.


# 참고 
- [Spring Boot 에서 Cache 사용하기](https://bcp0109.tistory.com/385)
- [# Cache#1 스프링의 캐시 추상화(@Cacheable)](https://jiwondev.tistory.com/282)
- [Spring ehCache2와 달라진 ehCache3 사용](https://chati.tistory.com/147)



 

 