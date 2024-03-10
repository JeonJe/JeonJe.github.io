---
title: LeetCode 56. Merge Intervals.md
tags: [leetcode, sorting]
keywords: LeetCode 56. Merge Intervals.md
sidebar: mydoc_sidebar
permalink: merge-intervals.html
folder: algorithm
last_updated: 2024-03-10
---

URL : https://leetcode.com/problems/merge-intervals/

Tags : 정렬

created: 2024-03-10 20:28

last-updated: 2024-03-10 20:28

## 문제
Given an arrayof`intervals`where`intervals[i] = [starti, endi]`, merge all overlapping intervals, and return_an array of the non-overlapping intervals that cover all the intervals in the input_.

**Example 1:**

```
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

```

**Example 2:**

```
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals [1,4] and [4,5] are considered overlapping.
```

## 제약 조건
- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= starti<= endi<= 10^4`

## 접근 방법
- 겹치는 부분을 확인을 하려면 각 인터벌의 `start` 값을 기준으로 오름차순 정렬이 필요하다.
- 현재 인터벌 값과 이전 인터벌 값을 비교한다.
    - 만약 이전 인터벌의 끝(`end`)보다 현재 인터벌 시작(`start`)이 크다면 이전 인터벌 값은 `non-overlapping` 인터벌이 된다.즉, Ouput에 이전 인터벌 정보가 추가된다.
    - 이전 인터벌의 끝(`end`)보다 현재 인터벌의 시작(`start`)이 같거나 작다면 `overlapping` 된 인터벌이다.
        - 만약 이전 인터벌 끝(`end`) 현재 인터벌 끝(`end`)보다 더 크다면 현재 확인 중인 인터벌의 끝(`end`)을 이전 인터벌의 끝(`overlapping`된 인터벌의 끝)으로 업데이트 한다.
- 마지막 인터벌 값도 빼놓지 않고 비교한다.

## 풀이

```java
public int[][] merge(int[][] intervals) {
          List<int[]> nonOverLappingList = new ArrayList<>();
        Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));

        int start = intervals[0][0];
        int end = intervals[0][1];

        for (int i = 1 ; i < intervals.length; i++){
            //현재 시작 값이 이전 끝 값보다 크다면 이전 값은 추가 되어야 함
            if(intervals[i][0] > end) {
                nonOverLappingList.add(new int[]{start, end});
                start = intervals[i][0];
                end = intervals[i][1];
            } else if (intervals[i][1] > end){
                end = intervals[i][1];
            }
        }
        int nonOverLappingSize = nonOverLappingList.size();
        if(nonOverLappingSize == 0 || (start > nonOverLappingList.get(nonOverLappingSize-1)[1])){
            nonOverLappingList.add(new int[]{start, end});
        }

        int[][] resultArray = new int[nonOverLappingList.size()][];
        for(int i = 0; i < nonOverLappingList.size(); i++){
            resultArray[i] = nonOverLappingList.get(i);
        }
        return resultArray;

    }
```
## 생각
`comparingInt` 메소드를 활용하여 첫 번째 인덱스를 기준으로 정렬 할 수 있다.

```java
   Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));
```

`List<int[]>` 을 `int[][]` 타입으로 변환하고 싶으면 이차원 배열 선언 시 첫번째 인덱스 부분에 List의 size 크기로 선언한다.

```java
   int[][] resultArray = new int[nonOverLappingList.size()][];
```