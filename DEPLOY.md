# 拍摄助手 PWA 部署说明

## 本地运行

```powershell
cd "D:\codex\抖音插件3\shooting-assistant-pwa"
npm.cmd install
npm.cmd run dev
```

作用：安装依赖并启动本地开发预览。

## 生产构建

```powershell
cd "D:\codex\抖音插件3\shooting-assistant-pwa"
npm.cmd run build
npm.cmd run preview
```

作用：生成上线文件，并在本地预览构建后的正式版本。

## Vercel 配置

- Framework Preset：Vite
- Build Command：`npm run build`
- Output Directory：`dist`
- Install Command：`npm install`

Vercel 默认提供 HTTPS，PWA 的添加到主屏幕和离线缓存需要 HTTPS。

## iPhone 安装

1. 用 iPhone 的 Safari 打开 Vercel 生成的网址。
2. 点击 Safari 底部分享按钮。
3. 选择「添加到主屏幕」。
4. 点击「添加」。
5. 回到桌面，点击「拍摄助手」图标打开。

注意：必须用 Safari，不要用微信、Chrome 或其他内置浏览器。
