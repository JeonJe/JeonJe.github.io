---
title: "[SOLVED] bundler failed to load command jekyll"
tags: [jekyll]
keywords: Blog, jekyll, Github, Git, Ruby
sidebar: mydoc_sidebar
permalink: issue_jekyll.html
folder: etc
last_updated: 2023-06-21
---


## 에러 발생 

- github blog에 [type-tyhme](https://github.com/rohanchandra/type-theme)를 적용하려고 가이드를 따라 명령어를 실행시켰으나 아래와 같은 오류가 발생하였습니다.

<img width="869" alt="webrick 설치 전" src="https://github.com/JeonJe/Algorithm/assets/43032391/58ee4b25-497a-425c-8db3-d7467bd811df">


## 원인 
- 위와 같은 에러가 발생한 이유는 webrick이 더 이상 Ruby 3.0의 번들이 아니기 때문입니다.([github issue](https://github.com/jekyll/jekyll/issues/8523))

## 해결 
- 아래 명령어로 webrick을 추가 후 다시 명령어를 실행합니다.
```
    bundle add webrick
``` 

<cneter><img width="546" alt="webrick 설치" src="https://github.com/JeonJe/Algorithm/assets/43032391/53cdb474-f703-4b13-99ca-605bedd18031"></cneter>

 <img width="558" alt="webrick 설치 후 " src="https://github.com/JeonJe/Algorithm/assets/43032391/214c58e8-204a-4656-9d9b-58baf2475fbe">

