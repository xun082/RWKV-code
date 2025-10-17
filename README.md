# RWKV-code

React + Rsbuild 项目，适用于大屏展示场景。

## 🚀 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务 (http://localhost:3000)
pnpm dev
```

## 🧱 构建与预览

```bash
# 构建生产版本
pnpm build

# 本地预览生产版本
pnpm preview
```

构建产物默认在 `dist/` 目录。

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t rwkv-code .
```

### 运行容器

```bash
docker run -p 3000:3000 rwkv-code
```

或使用 **docker-compose** 运行：

```bash
docker compose up --build -d
```

访问：[http://localhost:3000](http://localhost:3000)

## ⚙️ 环境变量

在根目录创建 `.env` 文件：

```
PUBLIC_RWKV_API_URL = http://192.168.0.82:8000/v1/chat/completions
```

代码中使用：

## 🖥️ 大屏显示说明

本项目为 **大屏展示模式** 设计（建议分辨率 ≥1920×1080）。

在普通电脑上开发时：

- 请将浏览器缩放至 **33%** 以模拟大屏显示比例；

- 布局为定宽设计，非响应式；

- 字号和组件尺寸以大屏为基准；

- 调试时尽量在 1080p 或更高分辨率屏幕上查看。
