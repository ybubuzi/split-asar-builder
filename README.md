# split-asar-builder

一个用于分隔 asar 文件的构建工具同时支持第三方模块别名
使业务代码与node_modules依赖的代码分离，程序打包后将在输出路径下生成`app.asar`和`deps_x.asar`文件
> `app.asar`为业务代码，`deps_x.asar`为依赖代码,`x`为可变数字，用于区分不同版本的依赖
> 后续计划，当项目依赖更新后通过分多个deps_x.asar文件来减少第三方依赖更新包的大小，避免全量更新

## 安装
```shell
npm install @bubuzi/split-asar-builder -D
```
## 使用
修改`electron.vite.config.ts`文件

```typescript
import { splitAsarPlugin } from "@bubuzi/split-asar-builder";

export default defineConfig(() => {
  return {
    main: {
      plugins: [splitAsarPlugin()],
    },
  };
});
```
修改`package.json`文件中的打包命令,将`electron-builder`替换为`split-asar-builder`
```json
{
  "scripts": {
    "build:win": "npm run build && split-asar-builder --win",
    "build:mac": "npm run build && split-asar-builder --mac",
    "build:linux": "npm run build && split-asar-builder --linux"
  }
}
```



## 模块别名
增加第三方模块的别名，如以下代码
```typescript
splitAsarPlugin({
  moduleAlias: {
    "better-sqlite3": "better-sqlite3-multiple-ciphers",
  },
});
```
这样在开发中使用`require("better-sqlite3")`在编译后实际引入的是`require("better-sqlite3-multiple-ciphers")`
