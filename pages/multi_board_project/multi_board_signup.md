---
title: 회원가입
tags: [multi board, signup]
keywords: multi board, signup
sidebar: mydoc_sidebar
permalink:  multi_board_signup.html
folder: multi_board_project
last_updated: 2023-06-28
---

## DB Schema & table 생성
### multi_board 스키마 생성
스키마를 새로 생성 시 아래와 같은 오류가 발생하였습니다.

```sql
Operation failed: There was an error while applying the SQL script to the database.
Executing:
CREATE SCHEMA `multi_board` ;

ERROR 1044: Access denied for user 'whssodi'@'localhost' to database 'multi_board'
SQL Statement:
CREATE SCHEMA `multi_board`

```
권한이 없어 발생한 오류로 mysql에 접속하여 아이디에 대해 권한을 추가하였습니다.
```shell
grant all privileges on *.* to whssodi@localhost
```
권한 추가 후 SQL을 재시작합니다(MAC OS)
```shell
mysql.server restart
```

지난번에 설계한 ERD을 토대로 테이블을 생성해주었습니다.
![v3](https://github.com/JeonJe/Free_Board/assets/43032391/92a41ced-116c-47fd-89a3-628547351477)



