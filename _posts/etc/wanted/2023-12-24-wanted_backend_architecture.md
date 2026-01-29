---
title: "백엔드 아키텍처 설계 기초: 동시성 제어와 네트워크 프로토콜"
description: "동시에 같은 DB 테이블 로우를 업데이트하는 상황 방어 방법, TCP와 UDP 차이점, 웹 브라우저 동작 원리, 자바 설계적 결함, HashMap 내부 동작 원리 분석"
categories: Architecture
tags: [wanted, Architecture, 동시성제어, 트랜잭션, 락, TCP, UDP, 네트워크, 웹브라우저, 자료구조, HashMap]

---

> 원티드 프리온보딩 백엔드 챌린지 아키텍쳐 설계을 정리한 내용입니다.

# 사전과제 
## 동시에 같은 DB Table row 를 업데이트 하는 상황을 방어하기 위해 어떻게 개발하실 건지 설명해주세요.
MySQL을 사용한다고 가정하였을 때 동시에 같은 DB Table row를 업데이트를 방지하기 트랜잭션 또는 락을 사용합니다.

**트랜잭션**
```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
START TRANSACTION; 
COMMIT; 
```

**LOCK** 
조회한 row가 update 후 commit 되기 전까지 다른 쿼리들은 해당 row를 수정하지 못하도록 Lock을 사용합니다.

`SELECT * FROM table WHERE id = ${seqId} FOR UPDATE;`



## TCP 와 UDP 의 차이를 작성해주세요.

`TCP`는 연결형/신뢰성 전송 프로토콜이고, `UDP`는 비연결형/비신뢰성 전송 프로토콜입니다.

`TCP`는  통신은 3-way handshaking을 통해 두 호스트의 전송 계층 사이에 논리적인 연결을 설정합니다.

신뢰성을 보장하기 위해 오류제어, 흐름제어, 혼잡제어을 사용하므로 UDP와 비교하여 상대적으로 더 큰 헤더 크기와, 그 크기에 반비례하여 전송 속도가 느립니다. TCP는 순서가 중요하며, 오류, 손실, 중복이 없이 데이터를 전송해야 할 때 사용됩니다.

`UDP`는 논리적인 연결 없이 데이터그램을 전송합니다. 

신뢰성보다는 실시간성이 중요한 서비스에 사용됩니다. 예를 들어 음성 통화나 인터넷 방송과 같이 패킷의 일부가 손실되어도 사용자가 큰 불편함을 느끼지 못하는 서비스에서 UDP가 사용됩니다.

## 웹 브라우저에 네이버 를 검색하고 화면에 네이버 화면이 출력이 될 때 까지 내부적으로 어떤 동작들이 수행이 되는지 설명해주세요.

1. **URL 입력**: 사용자가 웹 브라우저의 주소 표시줄에 "[www.naver.com](https://www.naver.com/)" 또는 "네이버"와 같은 검색어를 입력합니다.
   
2. **DNS 조회 (Domain Name System)**: 브라우저는 입력한 도메인 이름 "[www.naver.com"을](https://www.naver.xn--com%22-8040a/) IP 주소로 변환해야 합니다. 이를 위해 DNS 서버에 쿼리를 보내 IP 주소를 검색합니다.
   
3. **TCP 연결 설정**: 브라우저는 검색 결과로 얻은 네이버 서버의 IP 주소로 TCP/IP 연결을 설정합니다. 이것은 네이버 서버와의 통신을 위한 연결을 의미합니다.
   
4. **HTTP 요청**: TCP 연결이 설정되면 브라우저는 HTTP 요청을 네이버 서버로 보냅니다. 요청은 주로 HTTP GET 메서드를 사용하며, 요청 헤더에는 브라우저의 유저 에이전트, 헤더 정보 및 기타 데이터가 포함됩니다.
   
5. **서버의 응답**: 네이버 서버는 HTTP 요청을 받고 해당 요청에 따른 응답을 생성합니다. 이 응답은 HTML 페이지, CSS 스타일 시트, JavaScript 파일, 이미지 및 기타 웹 리소스를 포함할 수 있습니다.
   
6. **HTML 다운로드 및 렌더링**: 브라우저가 HTML 파일을 다운로드하면, HTML 페이지의 내용을 파싱하고 `DOM(Document Object Model)` 트리를 구성합니다. 이것은 웹페이지의 구조와 내용을 표현하는 계층적 트리입니다.
   
7. **CSS 로드 및 렌더링**: 브라우저는 CSS 스타일 시트를 다운로드하고 이를 사용하여 페이지를 스타일링합니다. 이 과정에서 렌더링 엔진은 요소의 크기, 위치, 색상 등을 계산하여 화면에 표시합니다.
   
8. **JavaScript 다운로드 및 실행**: 브라우저가 JavaScript 파일을 다운로드하면, JavaScript 엔진이 이 코드를 실행합니다. 이를 통해 페이지의 동적 기능과 상호작용이 가능해집니다.
   
9. **이미지 및 기타 리소스 다운로드**: HTML 페이지가 이미지, 비디오 또는 다른 외부 리소스를 포함하는 경우, 브라우저는 이러한 리소스를 다운로드하고 페이지에 표시합니다.
   
10. **웹페이지 렌더링**: 모든 리소스가 다운로드되고 페이지가 완전히 렌더링되면, 웹 브라우저는 화면에 네이버 홈페이지를 표시합니다. 사용자가 상호작용하거나 스크롤하면 페이지는 동적으로 업데이트됩니다.


## 본인이 주력으로 사용하는 언어에서 설계적 결함 한 가지를 작성해주세요.
`자바`에서는 배열 자체의 크기를 int 자료형으로 정의하고 있기 때문에 범위를 int형의 최대값인 `2^31-1`까지만 사용할 수 있습니다.

```
Max-Size: 2147483645
java.lang.OutOfMemoryError: Requested array size exceeds VM limit
	at com.example.demo.ArraySizeCheck.main(ArraySizeCheck.java:8)
```

위 에러는 자바 힙의 공간부족으로 인해 JVM이 오브젝트를 할당할 수 없을 때 발생하는 에러입니다.

```java
/**
+     * The maximum size of array to allocate.
+     * Some VMs reserve some header words in an array.
+     * Attempts to allocate larger arrays may result in
+     * OutOfMemoryError: Requested array size exceeds VM limit
+     */
+    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
```

파이썬에서는 배열의 크기에 대한 엄격한 한계가 없습니다. 파이썬은 동적으로 크기가 조절되는 리스트(List)를 사용하며, 이러한 리스트의 크기는 시스템 메모리가 허용하는 한 계속 확장될 수 있습니다.


### 참고 
https://shanepark.tistory.com/365

https://recordsoflife.tistory.com/1257


## 본인이 주력으로 사용하는 언어에서 자료구조와 관련 된 클래스가 내부적으로 어떻게 동작하는지 한 가지 사례를 정하여 작성해주세요. ex) ArrayList, HashMap 등등

자바에서 `HashMap` 동작은 아래 순서와 같습니다.

1. 해싱함수로 키를 해싱하여 int형 해시 값을 얻는다.
2. 해시 테이블의 버킷에 해싱된 키와 value로 값을 넣는다.
3. 해시 함수의 결과는 제한적이기 때문에 충돌이 일어난다.
4. 충돌을 관리하기 위해 Seperate Channing 방식을 사용한다.
5. Seperate Channing의 크기가 6개 이하라면 Linked-List로 관리하며, 8개 이상이라면 Red-Black Tree로 노드를 관리한다.
6. 버킷의 개수는 thread hold 도달시 2배로 resize된다.



```java
static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

...

  transient Node<K,V>[] table;
...

  static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;

...

    public HashMap(Map<? extends K, ? extends V> m) {
      this.loadFactor = DEFAULT_LOAD_FACTOR;
      putMapEntries(m, false);
  }

  static final float DEFAULT_LOAD_FACTOR = 0.75f;

```
key값을 해시 메소드 통해 해싱하고, 노드에 hash 값을 담아 table에 담아 사용합니다.
해시맵의 loadFactor는 `DEFAULT_LOAD_FACTOR=0.75`를 사용합니다.


```java
final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
        int s = m.size();
        if (s > 0) {
            if (table == null) { // pre-size
                float ft = ((float)s / loadFactor) + 1.0F;
                int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                         (int)ft : MAXIMUM_CAPACITY);
                if (t > threshold)
                    threshold = tableSizeFor(t);
            }
            else if (s > threshold)
                resize();
            for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
                K key = e.getKey();
                V value = e.getValue();
                putVal(hash(key), key, value, false, evict);
            }
        }
    }

```

테이블이 없으면 Map의 크기와 `loadFactor`로 초기 사이즈를 결정합니다. 만약 충돌을 줄이기 위해 크기가 `threshold`를 넘어가면 `resize` 메소드를 호출하여 해시맵의 크기를 2배 늘려줍니다.
해시맵에 값을 입력할 땐 putValue 메소드를 사용합니다.


```java
/**
  * Implements Map.put and related methods.
  *
  * @param hash hash for key
  * @param key the key
  * @param value the value to put
  * @param onlyIfAbsent if true, don't change existing value
  * @param evict if false, the table is in creation mode.
  * @return previous value, or null if none
  */
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }
```

위 코드는 해싱된 키와 값을 해시 테이블에 넣는 코드입니다. 


```java
 if ((p = tab[i = (n - 1) & hash]) == null)
    tab[i] = newNode(hash, key, value, null);
```
table의 크기가 0이 라면 resize 메소드를 통해 초기 크기를 정해줍니다.
만약 해시 index에 아무값이 들어가 있지 않다면, 노드를 만들어서 해시 테이블에 값을 넣어줍니다.


```java
Node<K,V> e; K k;
if (p.hash == hash &&
    ((k = p.key) == key || (key != null && key.equals(k))))
    e = p;
else if (p instanceof TreeNode)
    e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
else {
    for (int binCount = 0; ; ++binCount) {
        if ((e = p.next) == null) {
            p.next = newNode(hash, key, value, null);
            if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                treeifyBin(tab, hash);
            break;
        }
        if (e.hash == hash &&
            ((k = e.key) == key || (key != null && key.equals(k))))
            break;
        p = e;
    }
}
```

만약 index에 값이 있다면 충돌이 난 상황입니다. 3가지 경우에 대해 처리가 필요합니다.
1. 기존에 있던 값을 변경하는 경우
2. 트리노드에 넣어야 하는 경우
3. 새로운 값으로 Linked-list의 마지막에 넣어야 하는 경우 


```java
/**
    * Initializes or doubles table size.  If null, allocates in
    * accord with initial capacity target held in field threshold.
    * Otherwise, because we are using power-of-two expansion, the
    * elements from each bin must either stay at same index, or move
    * with a power of two offset in the new table.
    *
    * @return the table
    */
final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        if (oldCap > 0) {
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        ...
```

resize 후 threshold는 기존의 2배가 됩니다.

`newThr = oldThr << 1; // double threshold`

### 참고 

https://lordofkangs.tistory.com/78

https://sabarada.tistory.com/57
