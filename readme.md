# 微信小程序解码、反编译、接口统计工具
用于统计微信小程序源代码、反编译代码中所使用到的API、组件及样式，统计结果为json文件

## 使用方法
1. 打开此工具根目录下的index.js文件，配置
   1.1  需要解包的小程序路径参数：rootPath
   1.2  小程序信息：wxapkgInfos
2. 以上参数配置完后，cmd 
```
 node index.js
```
### 文件结构说明
api-collect: API/组件/样式，统计工具
cma: 解码、反编译工具
outjson: 最终输出结果
wxpack： 解码/反编输出结果

## 注意事项

1. 运行环境为node.js = v18.2.0，如果机器上未安装node.js，需要提前安装

## 统计结果

统计完成后会在报告路径下创建一个report目录，里面存放了api.json，style.json和xml.json，请将这三个文件打包后发给我们，谢谢!

## 修订记录

### 1.0.1 2021-03-24
- 支持扫描使用到的微信API, 样式, 基础组件及其属性

### 1.0.2 2021-03-25
- 支持扫描使用到的WeUI自定义组件及其属性
- 支持扫描app.json和page.json中的配置项

### 1.0.3 2021-03-25
- 支持统计UpdateManager.applyUpdate()这类非wx开头的API
- 支持统计生命周期函数

### 1.0.4 2021-03-29
- 修复API统计遗漏的问题

### 1.0.5 2021-4-27
- 解决在采集小游戏时，WXSS/WXML数量为0导致采集工具崩溃

### 1.0.6 2021-5-12
- 增加扫描package.json中声明依赖的三方件

### 1.0.7 2021-6-11
- 完善css采集，采集css selector类型和样式值枚举列表