# 📡 地质文档数字化 - 后端 API 接口文档

## 🎯 概述

本文档定义了地质文档数字化功能所需的所有后端 API 接口。

**基础URL**: `http://localhost:8080/api`

**技术要求**:
- 支持文件上传（multipart/form-data）
- 支持长时间任务（异步处理）
- 支持跨域（CORS）
- 建议使用数据库存储记录（MySQL/PostgreSQL/MongoDB）

---

## 📋 接口列表

### 1. 上传本地文件并解析

**端点**: `POST /documents/upload`

**请求**:
- Content-Type: `multipart/form-data`
- 参数:
  - `file`: File（文件对象）
  - `fileType`: string（文件类型，如 "pdf", "book"）
  - `sourceType`: string（固定值 "local"）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567890",
    "fileName": "地质报告.pdf",
    "fileSize": 1048576,
    "fileType": "pdf",
    "status": "processing",
    "sourceType": "local",
    "uploadTime": "2024-01-15T10:30:00Z",
    "metadata": {
      "pageCount": 50
    }
  }
}
```

**实现要点**:
1. 接收文件并保存到服务器
2. 创建数据库记录，状态设为 `processing`
3. 调用 MinerU API 开始解析（异步）
4. 立即返回文档记录
5. 后台轮询 MinerU 状态并更新数据库

---

### 2. 通过URL解析文档

**端点**: `POST /documents/parse-url`

**请求**:
```json
{
  "url": "https://example.com/document.pdf",
  "fileType": "pdf",
  "sourceType": "url"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567891",
    "fileName": "document.pdf",
    "fileSize": 0,
    "fileType": "pdf",
    "status": "processing",
    "sourceType": "url",
    "sourceUrl": "https://example.com/document.pdf",
    "uploadTime": "2024-01-15T10:31:00Z"
  }
}
```

**实现要点**:
1. 验证URL有效性
2. 创建数据库记录
3. 调用 MinerU API（使用URL模式）
4. 后台轮询并更新状态

---

### 3. 查询文档状态

**端点**: `GET /documents/:documentId`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567890",
    "fileName": "地质报告.pdf",
    "status": "completed",
    "resultUrl": "https://your-server.com/results/doc_1234567890.zip",
    "markdownUrl": "https://your-server.com/results/doc_1234567890.md",
    "completedTime": "2024-01-15T10:35:00Z",
    "progress": {
      "extractedPages": 50,
      "totalPages": 50
    }
  }
}
```

---

### 4. 获取文档列表（分页）

**端点**: `GET /documents`

**查询参数**:
- `page`: number（页码，默认1）
- `pageSize`: number（每页数量，默认10）
- `status`: string（筛选状态：pending/processing/completed/failed）
- `keyword`: string（搜索关键词）
- `startDate`: string（开始日期）
- `endDate`: string（结束日期）
- `sortBy`: string（排序字段：uploadTime/fileName/fileSize）
- `sortOrder`: string（排序方向：asc/desc）

**响应**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "doc_1234567890",
        "fileName": "地质报告.pdf",
        "fileSize": 1048576,
        "status": "completed",
        "uploadTime": "2024-01-15T10:30:00Z",
        "completedTime": "2024-01-15T10:35:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**实现要点**:
1. 支持分页查询
2. 支持多条件筛选
3. 支持排序
4. 返回总数和分页信息

---

### 5. 获取文档详情

**端点**: `GET /documents/:documentId/detail`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567890",
    "fileName": "地质报告.pdf",
    "fileSize": 1048576,
    "fileType": "pdf",
    "status": "completed",
    "sourceType": "local",
    "uploadTime": "2024-01-15T10:30:00Z",
    "completedTime": "2024-01-15T10:35:00Z",
    "resultUrl": "https://your-server.com/results/doc_1234567890.zip",
    "markdownUrl": "https://your-server.com/results/doc_1234567890.md",
    "metadata": {
      "author": "张三",
      "title": "地质报告",
      "pageCount": 50
    }
  }
}
```

---

### 6. 删除文档记录

**端点**: `DELETE /documents/:documentId`

**响应**:
```json
{
  "success": true,
  "data": true,
  "message": "删除成功"
}
```

**实现要点**:
1. 删除数据库记录
2. 删除服务器上的文件
3. 删除解析结果

---

### 7. 重新解析文档

**端点**: `POST /documents/:documentId/retry`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567890",
    "status": "processing",
    "uploadTime": "2024-01-15T10:30:00Z"
  }
}
```

**实现要点**:
1. 重置状态为 `processing`
2. 清除之前的错误信息
3. 重新调用 MinerU API

---

### 8. 获取Markdown内容

**端点**: `GET /documents/:documentId/markdown`

**响应**:
```json
{
  "success": true,
  "data": {
    "content": "# 地质报告\n\n## 第一章\n\n..."
  }
}
```

**实现要点**:
1. 从ZIP文件中提取 Markdown 文件
2. 读取内容并返回

---

### 9. 下载解析结果

**端点**: `GET /documents/:documentId/download`

**响应**: 
- Content-Type: `application/zip`
- 返回ZIP文件流

**实现要点**:
1. 设置正确的响应头
2. 流式传输文件

---

### 10. 批量删除文档

**端点**: `POST /documents/batch-delete`

**请求**:
```json
{
  "documentIds": ["doc_1234567890", "doc_1234567891"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "success": 2,
    "failed": 0
  }
}
```

---

### 11. 获取统计信息

**端点**: `GET /documents/statistics`

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "completed": 85,
    "processing": 10,
    "failed": 5,
    "totalSize": 104857600
  }
}
```

---

## 🗄️ 数据库设计

### 文档表 (documents)

```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL,
    source_type ENUM('local', 'url') NOT NULL,
    source_url TEXT,
    upload_time DATETIME NOT NULL,
    completed_time DATETIME,
    result_url TEXT,
    markdown_url TEXT,
    error_message TEXT,
    extracted_pages INT DEFAULT 0,
    total_pages INT DEFAULT 0,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_upload_time (upload_time),
    INDEX idx_source_type (source_type)
);
```

---

## 🔧 实现建议

### 1. 文件存储策略

```
/uploads/
  /documents/          # 上传的原始文件
    doc_1234567890.pdf
  /results/            # 解析结果
    doc_1234567890.zip
    doc_1234567890/    # 解压后的文件
      auto/
        xxx.md
```

### 2. 异步任务处理

建议使用消息队列（如 Redis Queue、RabbitMQ）处理解析任务：

```python
# 伪代码
def upload_document(file):
    # 1. 保存文件
    file_path = save_file(file)
    
    # 2. 创建记录
    doc = create_document_record(file, status='pending')
    
    # 3. 添加到任务队列
    queue.add_task('parse_document', doc.id, file_path)
    
    return doc

def parse_document_task(doc_id, file_path):
    # 1. 更新状态为 processing
    update_status(doc_id, 'processing')
    
    try:
        # 2. 调用 MinerU API
        result = call_mineru_api(file_path)
        
        # 3. 下载结果并保存
        save_result(doc_id, result)
        
        # 4. 更新状态为 completed
        update_status(doc_id, 'completed', result_url=result_url)
    except Exception as e:
        # 5. 更新状态为 failed
        update_status(doc_id, 'failed', error=str(e))
```

### 3. MinerU API 集成

```python
import requests

MINERU_API_BASE = "https://mineru.net/api/v4"
API_TOKEN = "your_api_token"

def parse_with_mineru(file_path):
    # 1. 创建解析任务
    response = requests.post(
        f"{MINERU_API_BASE}/file-urls/batch",
        headers={"token": API_TOKEN},
        json={
            "model_version": "vlm",
            "parse_method": "auto"
        }
    )
    upload_url = response.json()["data"]["urls"][0]
    
    # 2. 上传文件
    with open(file_path, 'rb') as f:
        requests.put(upload_url, data=f)
    
    # 3. 轮询任务状态
    task_id = response.json()["data"]["task_id"]
    while True:
        status_response = requests.get(
            f"{MINERU_API_BASE}/tasks/{task_id}",
            headers={"token": API_TOKEN}
        )
        status = status_response.json()["status"]
        
        if status == "completed":
            return status_response.json()["result_url"]
        elif status == "failed":
            raise Exception("解析失败")
        
        time.sleep(5)
```

---

## 📝 环境变量配置

创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=document_db

# MinerU API
MINERU_API_BASE=https://mineru.net/api/v4
MINERU_API_TOKEN=your_api_token

# 文件存储
UPLOAD_DIR=/path/to/uploads
MAX_FILE_SIZE=100000000  # 100MB

# 服务器配置
PORT=8080
CORS_ORIGIN=http://localhost:5173
```

---

## 🧪 测试接口

可以使用以下工具测试接口：

### 使用 cURL

```bash
# 上传文件
curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@test.pdf" \
  -F "fileType=pdf" \
  -F "sourceType=local"

# 查询列表
curl http://localhost:8080/api/documents?page=1&pageSize=10

# 查询状态
curl http://localhost:8080/api/documents/doc_1234567890
```

### 使用 Postman

导入以下 collection 进行测试（可在 Postman 中使用）。

---

## 🚀 快速开始

### Python (Flask) 示例

参考 `backend-example-python/` 目录中的示例代码。

### Node.js (Express) 示例

参考 `backend-example-nodejs/` 目录中的示例代码。

---

## 📞 前端调用示例

```typescript
import documentApi from '@/api/documentApi';

// 上传文件
const file = event.target.files[0];
const record = await documentApi.uploadAndParseDocument(file, 'pdf');
console.log('文档ID:', record.id);

// 查询状态
const status = await documentApi.getDocumentStatus(record.id);
console.log('当前状态:', status.status);

// 获取历史记录
const history = await documentApi.getDocumentList({
  page: 1,
  pageSize: 10,
  sortBy: 'uploadTime',
  sortOrder: 'desc'
});
console.log('历史记录:', history.data);
```

---

## ⚠️ 注意事项

1. **文件大小限制**: 建议限制单个文件不超过 100MB
2. **并发控制**: 限制同时解析的任务数量
3. **定时清理**: 定期清理过期的解析结果文件
4. **错误处理**: 提供详细的错误信息
5. **安全性**: 验证文件类型，防止恶意文件上传
6. **CORS配置**: 允许前端跨域访问

---

**📌 重要提示**: 所有接口均已在前端 `src/api/documentApi.ts` 中定义好，后端只需按照此文档实现即可！

