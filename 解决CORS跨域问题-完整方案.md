# 🔧 解决 CORS 跨域问题 - 完整方案

## 🎯 问题说明

当点击"预览结果"时，浏览器可能会阻止下载 ZIP 文件，并显示错误：

```
无法下载结果文件（跨域限制）
这是浏览器的安全限制。
```

这是因为：
- **浏览器的 CORS（跨域资源共享）安全策略**
- MinerU 的 OSS 存储可能没有配置允许所有来源的跨域访问
- 浏览器会阻止 JavaScript 直接下载跨域资源

---

## ✅ 解决方案

### 方案1：后端代理服务器（推荐 ⭐⭐⭐⭐⭐）

**优点：** 
- ✅ 完全解决 CORS 问题
- ✅ 适合开发和生产环境
- ✅ 安全可靠

**步骤：**

#### 1. 安装依赖

```powershell
cd mapView-main
npm install
```

这会自动安装：
- `express` - Node.js Web 服务器
- `cors` - CORS 中间件
- `node-fetch` - 下载文件

#### 2. 启动代理服务器（新终端窗口）

**打开一个新的 PowerShell 窗口：**

```powershell
cd mapView-main
npm run proxy
```

**看到这个表示成功：**
```
🚀 CORS 代理服务器运行在 http://localhost:3001
📝 使用方式: http://localhost:3001/proxy/download?url=<ZIP文件URL>
```

⚠️ **重要：** 保持这个窗口运行！

#### 3. 启动开发服务器（另一个终端窗口）

**在原来的 PowerShell 窗口：**

```powershell
cd mapView-main
npm run dev
```

#### 4. 测试预览功能

1. 打开浏览器访问 `http://localhost:5173`
2. 导航到"地质文档数字化"
3. 解析一个文档
4. 点击"预览结果" ✨

**工作原理：**
```
浏览器 → 代理服务器(localhost:3001) → MinerU OSS → 返回 ZIP → 浏览器
              ↑ 绕过 CORS 限制
```

---

### 方案2：浏览器扩展（临时测试用 ⭐⭐⭐）

**优点：** 
- ✅ 快速简单
- ✅ 无需代码修改

**缺点：** 
- ❌ 仅限开发测试
- ❌ 不能用于生产环境
- ❌ 可能有安全风险

**步骤：**

#### Chrome/Edge 用户：

1. **安装 CORS 扩展**
   - 打开 [Chrome Web Store](https://chrome.google.com/webstore)
   - 搜索 "CORS Unblock" 或 "Allow CORS: Access-Control-Allow-Origin"
   - 点击"添加到 Chrome"

2. **启用扩展**
   - 点击浏览器右上角的扩展图标
   - 找到 CORS 扩展并启用

3. **刷新页面并测试**
   - 刷新应用页面
   - 尝试预览功能

#### Firefox 用户：

1. **安装 CORS Everywhere**
   - 打开 Firefox Add-ons
   - 搜索 "CORS Everywhere"
   - 安装并启用

⚠️ **注意：** 使用完毕后记得禁用扩展！

---

### 方案3：直接下载（始终可用 ⭐⭐⭐⭐）

**如果预览功能不可用，直接下载 ZIP 文件：**

1. 解析完成后
2. 点击"下载 ZIP"按钮
3. 手动解压查看内容

**ZIP 文件包含：**
- 📝 `xxx.md` - Markdown 格式文本
- 🖼️ `images/` - 提取的图片
- 📊 `tables/` - 提取的表格数据
- 📄 `xxx.json` - 结构化数据

---

## 🎯 推荐使用流程

### 开发环境（最佳体验）

**打开两个终端窗口：**

**终端 1 - 代理服务器：**
```powershell
cd mapView-main
npm run proxy
```

**终端 2 - 开发服务器：**
```powershell
cd mapView-main
npm run dev
```

**然后：**
- 访问 `http://localhost:5173`
- 享受完整的预览功能 ✨

---

### 快速测试（使用浏览器扩展）

1. 安装 CORS 扩展
2. 启用扩展
3. 运行 `npm run dev`
4. 测试预览功能

---

### 生产环境

**需要配置真正的后端服务器：**

可以使用：
- **Node.js + Express**（参考 `proxy-server.js`）
- **Nginx** 反向代理
- **云函数**（阿里云/腾讯云）

**示例 Nginx 配置：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 代理前端
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # 代理 ZIP 下载
    location /proxy/download {
        proxy_pass https://mineru.oss-cn-shanghai.aliyuncs.com;
        proxy_set_header Host mineru.oss-cn-shanghai.aliyuncs.com;
        add_header Access-Control-Allow-Origin *;
    }
}
```

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **后端代理** | 完美解决，适合生产 | 需要额外服务器 | ⭐ 推荐用于所有环境 |
| **浏览器扩展** | 简单快速 | 仅限测试，有安全风险 | 快速测试 |
| **直接下载** | 始终可用 | 无法在线预览 | 备用方案 |

---

## 🐛 常见问题

### Q1: 代理服务器启动失败

**错误：** `Error: listen EADDRINUSE: address already in use :::3001`

**解决：** 端口 3001 被占用

```powershell
# 查找占用 3001 端口的进程
netstat -ano | findstr :3001

# 结束进程（替换 PID）
taskkill /PID <进程ID> /F
```

### Q2: 代理服务器运行，但预览仍失败

**检查：**

1. **代理服务器是否真的在运行？**
   ```
   访问: http://localhost:3001/health
   应该看到: {"status":"ok","message":"CORS 代理服务器运行中"}
   ```

2. **浏览器控制台有什么错误？**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签页

3. **重启两个服务器**
   - Ctrl+C 停止代理服务器
   - Ctrl+C 停止开发服务器
   - 重新启动两者

### Q3: 预览显示"未找到 Markdown 文件"

**原因：** ZIP 文件结构可能不同

**解决：**
1. 下载 ZIP 文件
2. 手动解压查看文件结构
3. 如果确实没有 `.md` 文件，说明解析失败

### Q4: 生产环境如何部署？

**选项 1：使用 Node.js 后端**
- 将 `proxy-server.js` 部署到服务器
- 修改前端代码中的代理 URL

**选项 2：使用 Nginx**
- 配置 Nginx 反向代理（见上文）
- 无需运行 Node.js 服务

**选项 3：使用云函数**
- 阿里云函数计算 / 腾讯云云函数
- 按需执行，成本低

---

## 🚀 快速开始命令

**复制粘贴即可运行：**

```powershell
# 1. 进入项目目录
cd mapView-main

# 2. 安装依赖（首次使用）
npm install

# 3. 启动代理服务器（新窗口）
# 打开新的 PowerShell 窗口运行：
npm run proxy

# 4. 启动开发服务器（原窗口）
npm run dev
```

**然后访问：** `http://localhost:5173`

---

## 📝 总结

✅ **推荐方案：** 后端代理服务器（`npm run proxy`）

✅ **快速测试：** 浏览器 CORS 扩展

✅ **备用方案：** 直接下载 ZIP 文件

🎉 **享受流畅的文档数字化体验！**


