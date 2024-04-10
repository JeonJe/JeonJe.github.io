---
title: 코드 리팩토링1
categories: refactoring
tags: [refactoring]
---

##  코드 리뷰 
연동 프로젝트를 시작한지 1달 정도가 지나고 있다. 그동안 혼자 프로젝트를 진행하다보니 설계, 기능 구현, 테스트에 집중하여 코드 품질을 미처 챙기지 못하였다. 이번에 동료 개발자분께서 프로젝트에 합류하게 되면서 구현했던 코드에 대해 리뷰 받을 기회가 있어서 변경 전과 변경 후 코드에 대해 비교하는 글을 써보고자 한다.

> 리팩토링한 실제 코드를 작성할 수 없기 때문에 비슷한 예제로 대체하여 작성하였다.


## 정적 메소드를 활용한 생성자 리팩토링

### 변경 전 

```java
MappingService.inserttMapping( new MappingVO.Insert(
	param1,
	param2,
	param3
	param4,
	param5,
	param6,
	param7,
	...
	)
)
```

매개변수가 많아 빌더 패턴을 쓸 수도 있으나, 해당 객체를 생성할 때 꼭 필요한 매개변수를 전달 받을 수 있도록 강제하고 싶은 마음이 커 생성자 패턴을 사용하였다.
하지만 매개변수가 많아지다보니 가독성이 좋지 못한 코드가 작성되었다.

### 변경 후 
```java
public static Insert Create(ParamObject1 paramObject1,  
                            ParamObject2 paramObject2,  
                            ParamObject3 paramObject3) {  
    return new MappingVO.Insert(
		paramObject1.getParam1,
		paramObject1.getParam2,
		paramObject2.getParam3,
		paramObject2.getParam4,
		paramObject3.getParam5,
		paramObject3.getParam6,
		paramObject3.getParam7,
	...
	);
}
```
객체 안에 Create라는 정적 메소드 활용하도록 변경하였다. 필요한 매개변수는 묶음으로 전달하고, 내부에서 필요한 인자를 꺼내 생성자를 반환한다.

```java
MappingVO.Insert create = MappingVO.Insert.Create(  paramObject1, paramObject2, paramObject3 );
```
비지니스 로직을 구현하는 서비스 레이어에서 굳이 보지 않아도 되는 생성자 코드가 없어지니 비지니스 로직의 파악이 더 원활해졌다.



## 정적 메소드를 활용한 예외 조건 확인

### 변경 전 
```java
MappingVO.Detail mapping = mappingService.findMappingBySeqAndType(item.Seq(), item.getType());  
if ( mapping == null ){
	throw new Exception(ErrorType, "Mapping Exeception!!");
}
```
Mapping을 조회 했을 때 조건에 맞는 Mapping이 없다면 예외 상황이 발생하는 코드이다. 이런 예외를 체크하는 코드가 무수히 많아지다 보면 코드를 한 눈에 파악하기 어려워 진다.


### 변경 후 
```java
MappingVO.Detail napping = MappingService.findMappingBySeqAndType(item.Seq(), Mapping.getType());  
MappingVO.Detail.validate(mapping);
```

이번에도 정적 메소드를 활용하여 예외처리를 메소드 안으로 숨겨버릴 수 있다. 또한, null뿐만 아니라 다양하게 조건을 추가해 줄 수 있는 장점도 있다.

```java
public static class Detail extends MappingVO {  
  
    public static void validate(Detail detail) {  
        if (detail == null){  
           throw new Exception(ErrorType, "Mapping Exeception!!");
        }  
    }  
}
```

## 조회한 객체와 업데이트 할 객체의 멤버 필드를 비교하여 같으면 넘어가기 

### 변경 전 
```java

	MappingVO detail = mappingService.findMappingByIdAndType(id, type);  
	if(detail == null) {  
		mappingService.insertMapping(new MappingVO.Insert(  
				param1,
				param2,
				param3,
				param4,
				param5,
				param6,
				param7,
		);  
	} else if ("Y".equals(detail.getUpdateYn())) {  
		mappingService.updateMapping(new MappingVO.Update(  
				param1,
				param2,
				param3,
				param4,
				param5,
				param6,
				param7,
				detail.getSeq()
		); 
	}  
```

위 코드는 맵핑을 조회하여 맵핑이 없으면 새로운 맵핑을 데이터베이스에 추가하고, 이미 존재한다면 업데이트 한다는 코드이다. 
연동은 모든 데이터에 대해 하루에 1회 이상 실행되므로 불필요한 업데이트는 최대한 피해주는 것이 좋다.


### 변경 후 
```java
  
    MappingVO detail = mappingService.findMappingByIdAndType(id, type);  
    if (detail == null) {  
        mappingService.insertMapping(MappingVO.Insert.Create(paramObject1, paramObject2, paramObject3));  
    } else if ("Y".equals(detail.getUpdateYn())) {  
        MappingVO.Update update = MappingVO.Update.Create(paramObject1, paramObject2, paramObject3, detail);  
        if (detail.hasChanges(update)) {  
            mappingService.updateMapping(update);  
        }  
    }  
```


detail과 update 객체의 `멤버 필드의 값을 비교`할 수 있도록 MappingVO에 메소드 추가하여 특정 멤버 변수들이 변화 했음을 확인한다.

```java
public boolean hasChanges(MappingVO other) {  
    if (this == other) return false;  
    if (other == null) return true;  
  
    return this.seq != other.seq  
            || !Objects.equals(this.Name, other.Name)  
            || this.Id != other.Id  
            ....
}
```


## 반복문안에서 예외가 발생해도 나머지 반복문을 처리할 수 있도록 변경
### 변경 전
```java
 public void 연동() throws Exception {
        MappingSearchCondition search = new MappingSearchCondition();
        
        List<MappingVO.Simple> mappinglList = mappingService.findAllMapping(search);
        for (MappingVO.Simple mapping : mappinglList) {
            List<ResponseVO.Info> externalInfos = externalService.getExternalInfo(mapping.getId, mapping.getType);
            
     
            List<String> externalNames = externalInfos
                    .stream()
                    .map(ResponseVO.Info::getName)
                    .collect(Collectors.toList());
                    
            List<InternalInfo> InternalInfos = mappingService.findInternalInfoByExternalNamesAndSeq(externalNames, mapping.Seq());
            for (InternalInfo internalInfo : InternalInfos) {
                mappingService.createMapping(mapping, externalNames, internalInfo);
            }
	}
```
위 코드는 맵핑이 필요한 타겟들을 모두 조회하여, 각 타겟의 id와 type으로 외부 데이터를 가져오고 이름 데이터로 추출하여 내부 정보와 맵핑하는 로직이다.

여기서 문제점이 있는데 맵핑 과정에서 `예외`가 발생할 경우 나머지 정보들이 맵핑이 되지 않는다.

### 변경 후
```java

 public void 연동() throws Exception {
        MappingSearchCondition search = new MappingSearchCondition();
    
		List<String> externalNames = new ArrayList<>();  
	    Map<String, ResponseVO.Info> externalMapInfoMap = new HashMap<>();  

        List<MappingVO.Simple> mappinglList = mappingService.findAllMapping(search);
        for (MappingVO.Simple mapping : mappinglList) {
            List<ResponseVO.Info> externalInfos = externalService.getExternalInfo(mapping.getId, mapping.getType);
		
		for (ResponseVO.Info externalInfo : externalInfos) {  
		    externalNames.add(externalInfo.getName());  
		    externalMapInfoMap.putIfAbsent(externalInfo.getName(), externalInfo);  
		}
                   
		List<InternalInfo> InternalInfos = mappingService.findInternalInfoByExternalNamesAndSeq(externalNames, mapping.Seq());
	    
	    InternalInfos.forEach(internalInfo -> {  
	    ResponseVO.Info externalInfo = externalMapInfoMap.getOrDefault(internalInfo.getName(), null);  
	    if(externalInfo == null) {  
	        return;  
		}  
  
		try{  
			mappingService.createMapping(mapping, internalInfo, externalInfo);
		} catch (Exception e) {  
			log.error("[맵핑 실패] " + e.getMessage());  
		}  
	});
}
```

이번 리팩토링에서는 2가지 개선점 포함되어 있다.
- 변경 전 코드는 createMapping 메소드에 externalNames를 전달하고, 메소드 내부에서 반복문으로 이름이 같은 정보를 찾는다. 메소드 내부에서도 externalNames에 internalInfo와 같은 이름이 있는지 확인 후 없다면 insert, 있다면 update를 수행한다. 즉, 이중 반복문으로 `O(N^2)`의 시간복잡도 수행하고 있었다. 이 부분을 `Map`을 이용해 `O(N)`으로 줄일 수 있다. 

>  이 코드는 이름이 같은 사람이 2명 이상일 경우 가장 처음에 찾은 데이터를 맵핑에 사용한다. 이름을 Key로 사용하고 있기 때문에 동일 이름에 대해 두 번 넣으면 예외가 터지니 `putIfAbsent `메소드로 처리한다.

- 두 번째 개선점은  `try-catch`로 하위 메소드에서 발생한 예외를 잡아 로깅을 하고 다음 맵핑을 계속 진행할 수 있도록 변경하였다.


## 그 외
위 리팩토링들을 적용하였을 때 코드의 가독성이 많이 향상 된 것을 느낄 수 있었다. 하지만 앞으로 개선해야할 부분들이 아직 많이 남아있다.
- 외부 정보 맵핑의 상태를 int형 status code로 전달한다. 이 상태가 무엇을 나타내는지 동료 개발자를 위해 데이터베이스 `코멘트`로 남기도록 하였다.
-  현재는 외부 요청 API 주소와 버전을 `properties`에서 관리 중인데, 지금은 외부 연동 하는 곳이 적어 관리의 어려움이 없지만 확장성을 위해 데이터베이스에 외부 연동지에 대한 정보와 함께 관리하도록 한다. 특히 버전관리는 현재 공용으로 사용하고 있기 때문에 분리가 필요한 구조이다.

