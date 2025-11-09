# 📦 Node.js 后端示例

这是一个简单的 Express.js 后端示例，实现了文档数字化所需的所有 API 接口。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run db:init
```

### 4. 启动服务器

```bash
npm run dev    # 开发模式
npm start      # 生产模式
```

## 📋 项目结构

```
backend-example-nodejs/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
├── uploads/             # 文件上传目录
├── .env.example         # 环境变量示例
├── package.json
└── README.md
```

## 🔧 技术栈

- Express.js
- SQLite/MySQL
- Multer (文件上传)
- Axios (HTTP客户端)

## 📝 API 文档

所有API端点详见：`后端API接口文档.md`

## ⚙️ 配置说明

```env
PORT=8080
MINERU_API_TOKEN=your_token_here
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
```

