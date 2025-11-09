# 📋 后端API接口清单

## 快速索引

| 模块 | 端口 | 数据库 | 接口数量 |
|------|------|--------|---------|
| 📄 文档管理 | 8080 | documents_db | 6个 |
| 🖼️ 图库管理 | 8081 | images_db | 6个 |
| 📊 表库管理 | 8082 | tables_db | 7个 |

---

## 📄 文档管理 API (8080)

### 基础URL: `http://localhost:8080/api/documents`

| 序号 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 1 | POST | `/from-digitalization` | ⭐ 保存数字化文档 | 🔴 高 |
| 2 | GET | `/` | 获取文档列表 | 🔴 高 |
| 3 | GET | `/{id}/details` | 获取文档详情 | 🟡 中 |
| 4 | GET | `/{id}/download` | 下载文档 | 🟡 中 |
| 5 | DELETE | `/{id}` | 删除文档 | 🟢 低 |
| 6 | POST | `/batch-delete` | 批量删除 | 🟢 低 |

---

## 🖼️ 图库管理 API (8081)

### 基础URL: `http://localhost:8081/api/images`

| 序号 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 1 | POST | `/from-extraction` | ⭐ 保存提取的图片 | 🔴 高 |
| 2 | GET | `/` | 获取图片列表 | 🔴 高 |
| 3 | POST | `/upload` | 上传图片 | 🟡 中 |
| 4 | GET | `/{id}` | 获取图片详情 | 🟢 低 |
| 5 | DELETE | `/{id}` | 删除图片 | 🟢 低 |
| 6 | POST | `/batch-delete` | 批量删除 | 🟢 低 |

---

## 📊 表库管理 API (8082)

### 基础URL: `http://localhost:8082/api/tables`

| 序号 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 1 | POST | `/from-extraction` | ⭐ 保存提取的表格 | 🔴 高 |
| 2 | GET | `/` | 获取表格列表 | 🔴 高 |
| 3 | POST | `/import` | 导入表格 | 🟡 中 |
| 4 | GET | `/{id}/details` | 获取表格详情 | 🟡 中 |
| 5 | GET | `/{id}/download` | 下载表格 | 🟡 中 |
| 6 | DELETE | `/{id}` | 删除表格 | 🟢 低 |
| 7 | POST | `/batch-delete` | 批量删除 | 🟢 低 |

---

## 🔴 高优先级接口（MVP必需）

### 1. POST `/api/documents/from-digitalization`

**请求体：**
```json
{
  "fileName": "地质报告.pdf",
  "fileType": "pdf",
  "fileSize": 2548000,
  "originalUrl": "https://example.com/source.pdf",
  "resultUrl": "https://oss.example.com/result.zip",
  "mineruTaskId": "task_123456",
  "status": "completed"
}
```

**响应：**
```json
{
  "code": 0,
  "msg": "文档保存成功",
  "data": {
    "documentId": "doc_20251109_001",
    "extractedImages": 5,
    "extractedTables": 3
  }
}
```

**后端需要做的：**
1. 保存文档记录到 `documents` 表
2. 下载 `resultUrl` 的ZIP文件
3. 解析ZIP，提取图片调用 `POST /api/images/from-extraction`
4. 解析ZIP，提取表格调用 `POST /api/tables/from-extraction`
5. 返回提取的图片和表格数量

---

### 2. GET `/api/documents?page=1&pageSize=10`

**响应：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "doc_20251109_001",
        "fileName": "地质报告.pdf",
        "fileType": "pdf",
        "fileSize": 2548000,
        "status": "completed",
        "source": "digitalization",
        "createdAt": "2025-11-09 10:30:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 3. POST `/api/images/from-extraction`

**请求体：**
```json
{
  "sourceDocumentId": "doc_20251109_001",
  "images": [
    {
      "imageName": "figure_1.jpg",
      "imageUrl": "https://oss.example.com/img_001.jpg",
      "thumbnailUrl": "https://oss.example.com/thumb_001.jpg",
      "category": "地貌",
      "fileSize": 458000,
      "width": 1920,
      "height": 1080,
      "format": "jpg"
    }
  ]
}
```

**响应：**
```json
{
  "code": 0,
  "msg": "图片保存成功",
  "data": {
    "savedCount": 1,
    "imageIds": ["img_001"]
  }
}
```

---

### 4. GET `/api/images?page=1&pageSize=12`

**响应：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "img_001",
        "imageName": "亚洲地貌圈.jpg",
        "imageUrl": "https://oss.example.com/img_001.jpg",
        "thumbnailUrl": "https://oss.example.com/thumb_001.jpg",
        "category": "地貌",
        "fileSize": 2548000,
        "source": "extraction",
        "sourceDocumentId": "doc_20251109_001",
        "createdAt": "2025-11-09 10:30:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 12
  }
}
```

---

### 5. POST `/api/tables/from-extraction`

**请求体：**
```json
{
  "sourceDocumentId": "doc_20251109_001",
  "tables": [
    {
      "tableName": "地质数据统计表",
      "description": "包含亚洲主要地质板块的分布数据",
      "category": "地质数据",
      "tableType": "CSV",
      "fileUrl": "https://oss.example.com/tbl_001.csv",
      "fileSize": 458000,
      "rowCount": 156,
      "columnCount": 12,
      "columns": ["板块名称", "面积", "运动速度"]
    }
  ]
}
```

**响应：**
```json
{
  "code": 0,
  "msg": "表格保存成功",
  "data": {
    "savedCount": 1,
    "tableIds": ["tbl_001"]
  }
}
```

---

### 6. GET `/api/tables?page=1&pageSize=9`

**响应：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "tbl_001",
        "tableName": "亚洲地质板块数据统计表",
        "description": "包含亚洲主要地质板块的分布数据",
        "category": "地质数据",
        "tableType": "Excel",
        "fileUrl": "https://oss.example.com/tbl_001.xlsx",
        "fileSize": 458000,
        "rowCount": 156,
        "columnCount": 12,
        "source": "extraction",
        "createdAt": "2025-11-09 10:30:00"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 9
  }
}
```

---

## 📊 数据库表结构（简化版）

### documents 表
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    original_url TEXT,
    result_url TEXT,
    source VARCHAR(50) DEFAULT 'digitalization',
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### images 表
```sql
CREATE TABLE images (
    id VARCHAR(50) PRIMARY KEY,
    image_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR(50),
    file_size BIGINT,
    source VARCHAR(50) DEFAULT 'extraction',
    source_document_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tables 表
```sql
CREATE TABLE tables (
    id VARCHAR(50) PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    table_type VARCHAR(20),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    row_count INT,
    column_count INT,
    source VARCHAR(50) DEFAULT 'extraction',
    source_document_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 后端实现建议

### 技术栈推荐
- **语言**: Java / Python / Node.js
- **框架**: Spring Boot / FastAPI / Express
- **数据库**: MySQL 8.0+ / PostgreSQL
- **对象存储**: 阿里云OSS / 腾讯云COS / MinIO

### 核心处理流程

```python
# Python示例
@app.post("/api/documents/from-digitalization")
async def save_digitalization_result(request: DigitalizationRequest):
    # 1. 保存文档记录
    document_id = generate_id()
    save_document_to_db(document_id, request)
    
    # 2. 下载并解析ZIP
    zip_path = download_file(request.result_url)
    
    # 3. 提取图片
    images = extract_images_from_zip(zip_path)
    if images:
        image_count = await save_images(document_id, images)
    
    # 4. 提取表格
    tables = extract_tables_from_zip(zip_path)
    if tables:
        table_count = await save_tables(document_id, tables)
    
    # 5. 返回结果
    return {
        "code": 0,
        "msg": "文档保存成功",
        "data": {
            "documentId": document_id,
            "extractedImages": image_count,
            "extractedTables": table_count
        }
    }
```

---

## 🎯 开发阶段建议

### 阶段一：基础接口（1-2天）
- ✅ 创建三个数据库
- ✅ 实现文档列表API
- ✅ 实现图片列表API
- ✅ 实现表格列表API

### 阶段二：核心功能（2-3天）
- ✅ 实现文档保存API
- ✅ 实现ZIP解析和分类存储
- ✅ 实现图片和表格关联

### 阶段三：完善功能（1-2天）
- ✅ 实现删除功能
- ✅ 实现下载功能
- ✅ 实现详情查询

### 阶段四：测试上线（1-2天）
- ✅ 端到端测试
- ✅ 性能优化
- ✅ 部署上线

---

## 📝 注意事项

### 1. ID生成规则
```javascript
// 文档ID: doc_20251109_001
// 图片ID: img_20251109_001
// 表格ID: tbl_20251109_001
```

### 2. 文件存储
- 使用对象存储服务（OSS）
- 生成唯一文件名避免冲突
- 图片需要生成缩略图

### 3. 错误处理
```json
{
  "code": -1,
  "msg": "错误信息",
  "error": "详细错误描述"
}
```

### 4. 分页参数
- page: 从1开始
- pageSize: 默认10，最大100

### 5. 跨域配置
```python
# 允许前端跨域请求
CORS(app, origins=[
    "http://localhost:5173",
    "https://your-domain.com"
])
```

---

## 🚀 快速启动命令

### 创建数据库
```sql
CREATE DATABASE documents_db CHARACTER SET utf8mb4;
CREATE DATABASE images_db CHARACTER SET utf8mb4;
CREATE DATABASE tables_db CHARACTER SET utf8mb4;
```

### 运行服务
```bash
# 文档服务
cd document-service && npm start

# 图库服务
cd image-service && npm start

# 表库服务
cd table-service && npm start
```

---

## 📞 前端对接人员

如有问题，请联系前端开发人员协调接口细节。

**接口文档详见：** `文档数字化与文件管理集成方案.md`

