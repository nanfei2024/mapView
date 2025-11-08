# CORS 跨域问题解决方案

## 问题说明

在开发环境中，浏览器会阻止跨域访问，主要有两个 CORS 问题：

### 问题 1：MinerU API 访问被阻止 ✅ 已解决

**错误信息：**
```
Access to fetch at 'https://mineru.net/api/v4/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**解决方案：** 通过 Vite 代理已解决

### 问题 2：阿里云 OSS 文件上传被阻止 ⚠️ 无法完全解决

**错误信息：**
```
Access to fetch at 'https://mineru.oss-cn-shanghai.aliyuncs.com/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**原因：** MinerU 的文件上传流程是：
1. ✅ 申请上传链接（已通过代理解决）
2. ❌ 浏览器直接上传文件到阿里云 OSS（CORS 限制）
3. 系统自动解析文件

第2步需要浏览器直接访问 OSS，这个我们无法通过前端代理解决。

## 已实施的解决方案

### ✅ 方案：Vite 开发服务器代理

通过配置 Vite 的开发服务器代理，将 API 请求转发到 MinerU 服务器，从而绕过浏览器的 CORS 限制。

### 修改内容

#### 1. Vite 配置文件 (`vite.config.ts`)

添加了代理配置：

```typescript
server: {
  proxy: {
    '/api/mineru': {
      target: 'https://mineru.net',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/mineru/, '/api/v4')
    }
  }
}
```

**工作原理：**
- 浏览器发送请求到：`http://localhost:5173/api/mineru/extract/task`
- Vite 代理服务器将其转发到：`https://mineru.net/api/v4/extract/task`
- 响应通过代理服务器返回给浏览器

#### 2. API 文件 (`src/api/mineruApi.ts`)

修改了 API 基础 URL：

```typescript
const isDevelopment = import.meta.env.DEV;
const MINERU_API_BASE = isDevelopment 
  ? '/api/mineru'  // 开发环境使用代理
  : 'https://mineru.net/api/v4';  // 生产环境
```

## 🔄 应用修复

### 重要：必须重启开发服务器！

Vite 配置文件的修改需要重启服务器才能生效。

#### 操作步骤：

1. **停止当前服务器**
   ```bash
   # 在终端按 Ctrl+C 停止
   ```

2. **重新启动**
   ```bash
   npm run dev
   ```

3. **刷新浏览器页面**
   ```bash
   按 F5 或 Ctrl+R 刷新
   ```

4. **测试功能**
   - ✅ **推荐：使用 URL 上传方式**
   - ⚠️ 本地文件上传会有浏览器安全限制

## 📌 当前推荐使用方式

### ✅ 方式 1：URL 上传（推荐）

**步骤：**
1. 将文件上传到可公开访问的位置：
   - 百度网盘（获取直链）
   - 阿里云 OSS
   - 腾讯云 COS
   - 七牛云
   - 或任何支持直链的网盘/存储

2. 在页面切换到"URL 上传"标签

3. 输入文件的直链 URL

4. 点击"提交"，等待解析完成

**优点：**
- ✅ 无 CORS 限制
- ✅ 稳定可靠
- ✅ 支持大文件

### ⚠️ 方式 2：本地文件上传（有限制）

**限制说明：**
- 由于浏览器安全策略，直接上传文件到云端存储会被阻止
- 点击"开始解析"时会弹出提示
- 可能会失败，建议改用 URL 上传方式

**适用场景：**
- 配置了后端服务器代理
- 或作为功能演示（可能失败）

## ✅ 验证修复

### 成功的标志：

1. **控制台不再有 CORS 错误**
2. **可以看到代理日志**（如果配置了）
   ```
   代理请求: POST /api/mineru/extract/task
   ```

3. **文件上传成功**
   - 状态变为"上传中"→"解析中"→"已完成"
   - 可以下载结果

### 检查网络请求

打开浏览器开发者工具（F12）→ Network（网络）标签：

**修复前：**
```
请求: https://mineru.net/api/v4/...
状态: (failed) CORS error
```

**修复后：**
```
请求: http://localhost:5173/api/mineru/...
状态: 200 OK
```

## 🚀 生产环境部署

### ⚠️ 注意

Vite 代理只在开发环境有效！生产环境需要其他方案。

### 生产环境方案

#### 方案 A：后端服务器代理（推荐）

创建一个后端服务（Node.js/Python/Java 等）：

**示例（Node.js + Express）：**

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use('/api/mineru/*', async (req, res) => {
  const mineruUrl = `https://mineru.net/api/v4${req.params[0]}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: mineruUrl,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      data: req.body
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.listen(3000);
```

#### 方案 B：Nginx 反向代理

在 Nginx 配置中添加：

```nginx
location /api/mineru/ {
    proxy_pass https://mineru.net/api/v4/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### 方案 C：Serverless 函数

使用 Vercel/Netlify 的 Serverless 函数作为代理：

```javascript
// api/mineru-proxy.js
export default async function handler(req, res) {
  const { path, ...params } = req.query;
  const url = `https://mineru.net/api/v4/${path}`;
  
  const response = await fetch(url, {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization,
      'Content-Type': 'application/json'
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

## 📝 配置说明

### Vite 代理配置参数

```typescript
{
  target: 'https://mineru.net',  // 目标服务器
  changeOrigin: true,             // 修改请求源
  secure: true,                   // 验证 SSL 证书
  rewrite: (path) => ...         // 重写请求路径
}
```

### 环境变量配置（可选）

创建 `.env` 文件：

```env
# 开发环境
VITE_API_BASE_URL=/api/mineru

# 生产环境
# VITE_API_BASE_URL=https://your-backend.com/api/mineru
```

修改 `mineruApi.ts`：

```typescript
const MINERU_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/mineru';
```

## 🐛 故障排查

### 问题 1：重启后仍然报 CORS 错误

**解决方案：**
1. 确认真的重启了服务器（不是热更新）
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 硬刷新页面（Ctrl+Shift+R）
4. 检查 `vite.config.ts` 语法是否正确

### 问题 2：代理请求 404

**可能原因：**
- 路径重写规则错误
- API 端点变更

**解决方案：**
检查路径转换：
```
/api/mineru/extract/task 
  ↓ (rewrite)
/api/v4/extract/task
  ↓ (proxy)
https://mineru.net/api/v4/extract/task
```

### 问题 3：代理请求超时

**解决方案：**
增加超时时间：

```typescript
proxy: {
  '/api/mineru': {
    target: 'https://mineru.net',
    changeOrigin: true,
    secure: true,
    timeout: 60000,  // 60秒
    rewrite: (path) => path.replace(/^\/api\/mineru/, '/api/v4')
  }
}
```

### 问题 4：生产环境打包后无法使用

**原因：**
Vite 代理只在开发环境有效，打包后的静态文件需要真实的后端服务。

**解决方案：**
- 参考上面的"生产环境方案"
- 或者联系 MinerU 申请 CORS 白名单（不太可能）

## 📊 请求流程对比

### 修复前（直接请求）

```
浏览器 → 🚫 CORS 阻止 → ❌ 失败
  ↓
https://mineru.net/api/v4/...
```

### 修复后（代理请求）

```
浏览器 → Vite代理 → MinerU服务器 → ✅ 成功
  ↓         ↓              ↓
本地:5173  本地:5173    mineru.net
/api/mineru  →proxy→   /api/v4
```

## 🎯 测试清单

使用以下清单验证修复是否成功：

- [ ] 停止并重启了开发服务器
- [ ] 浏览器控制台没有 CORS 错误
- [ ] Network 标签显示请求发送到 `localhost:5173/api/mineru/...`
- [ ] 请求状态码为 200（或其他正常状态码，非 CORS 错误）
- [ ] 能够成功上传文件
- [ ] 能够看到解析进度
- [ ] 能够下载结果文件

## 📚 相关资源

- [Vite 服务器选项文档](https://vitejs.dev/config/server-options.html)
- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [MinerU API 文档](https://mineru.net/api/docs)

## 🎉 总结

**立即操作：**

1. 确认文件已修改（`vite.config.ts` 和 `src/api/mineruApi.ts`）
2. **重启开发服务器**（重要！）
3. 刷新浏览器页面
4. 测试文档上传功能

如果仍有问题，请检查：
- 服务器是否真的重启了
- 浏览器缓存是否清除
- 网络请求是否发送到正确的地址

**需要帮助？** 查看控制台的错误信息或网络请求详情。

