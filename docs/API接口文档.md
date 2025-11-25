# 书籍知识图谱系统 - API 接口文档

## 基础配置

**Base URL**: `http://localhost:8080/api`

**认证方式**: JWT Token (可选)

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**统一响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**错误码**:
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器错误

---

## 1. 书籍管理接口

### 1.1 获取所有书籍

```http
GET /api/books
```

**查询参数**:
- `page`: number - 页码（默认 1）
- `pageSize`: number - 每页数量（默认 10）
- `keyword`: string - 搜索关键词（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "books": [
      {
        "id": "book1",
        "name": "板块构造与地貌形迹",
        "author": "陈志明",
        "coverUrl": "/images/板块构造与地貌形迹.jpg",
        "description": "详细阐述板块构造理论与地貌形成的关系",
        "publishYear": 2020,
        "tags": ["地质学", "板块构造"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 10
  }
}
```

### 1.2 获取单本书籍详情

```http
GET /api/books/:bookId
```

**路径参数**:
- `bookId`: string - 书籍ID

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "book1",
    "name": "板块构造与地貌形迹",
    "author": "陈志明",
    "coverUrl": "/images/板块构造与地貌形迹.jpg",
    "isbn": "978-7-xxx-xxxxx-x",
    "publishYear": 2020,
    "publisher": "地质出版社",
    "description": "详细阐述板块构造理论与地貌形成的关系",
    "tags": ["地质学", "板块构造", "地貌"],
    "metadata": {
      "pageCount": 350,
      "language": "zh-CN"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 创建书籍

```http
POST /api/books
```

**请求体**:
```json
{
  "name": "新书名称",
  "author": "作者姓名",
  "coverUrl": "/images/cover.jpg",
  "isbn": "978-7-xxx-xxxxx-x",
  "publishYear": 2024,
  "publisher": "出版社",
  "description": "书籍描述",
  "tags": ["标签1", "标签2"]
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "book_new_123",
    "name": "新书名称",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 1.4 更新书籍信息

```http
PUT /api/books/:bookId
```

**请求体**:
```json
{
  "name": "修改后的书名",
  "description": "修改后的描述",
  "tags": ["新标签"]
}
```

### 1.5 删除书籍

```http
DELETE /api/books/:bookId
```

**查询参数**:
- `cascade`: boolean - 是否删除关联的知识图谱（默认 true）

---

## 2. 知识图谱接口

### 2.1 获取书籍的完整知识图谱

```http
GET /api/knowledge-graph/books/:bookId
```

**查询参数**:
- `includeCollapsed`: boolean - 是否包含收起的节点（默认 true）
- `maxDepth`: number - 最大深度（默认 3）
- `format`: string - 返回格式（tree/flat，默认 tree）

**响应示例（tree 格式）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "bookId": "book1",
    "bookName": "板块构造与地貌形迹",
    "graph": {
      "id": "book1",
      "name": "板块构造与地貌形迹",
      "category": "书籍",
      "level": 1,
      "symbolSize": 80,
      "coverUrl": "/images/板块构造与地貌形迹.jpg",
      "collapsed": true,
      "children": [
        {
          "id": "book1_catalog",
          "name": "目录",
          "category": "目录",
          "level": 2,
          "symbolSize": 45,
          "collapsed": true,
          "children": [
            {
              "id": "book1_catalog_1",
              "name": "第一章：劳亚区系",
              "category": "章节",
              "level": 3,
              "symbolSize": 28,
              "description": "劳亚区系的地质特征与演化",
              "metadata": {
                "pageNumber": 15
              }
            }
          ]
        }
      ]
    },
    "metadata": {
      "totalNodes": 25,
      "totalEdges": 24,
      "lastUpdated": "2024-01-01T00:00:00Z",
      "version": "1.0"
    }
  }
}
```

### 2.2 保存知识图谱

```http
POST /api/knowledge-graph/books/:bookId
PUT /api/knowledge-graph/books/:bookId
```

**请求体**:
```json
{
  "graph": {
    "id": "book1",
    "name": "板块构造与地貌形迹",
    "children": [...]
  },
  "metadata": {
    "version": "1.1",
    "description": "更新了第三章内容"
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "保存成功",
  "data": {
    "bookId": "book1",
    "version": "1.1",
    "savedNodes": 25,
    "savedEdges": 24,
    "savedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 添加节点

```http
POST /api/knowledge-graph/books/:bookId/nodes
```

**请求体**:
```json
{
  "parentId": "book1_catalog",
  "name": "第四章：新章节",
  "category": "章节",
  "level": 3,
  "symbolSize": 28,
  "description": "章节描述",
  "order": 4,
  "metadata": {
    "pageNumber": 100
  }
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "节点创建成功",
  "data": {
    "id": "book1_catalog_4",
    "parentId": "book1_catalog",
    "name": "第四章：新章节",
    "category": "章节",
    "level": 3,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2.4 更新节点

```http
PUT /api/knowledge-graph/nodes/:nodeId
PATCH /api/knowledge-graph/nodes/:nodeId
```

**请求体**:
```json
{
  "name": "修改后的名称",
  "description": "修改后的描述",
  "metadata": {
    "pageNumber": 105
  }
}
```

### 2.5 删除节点

```http
DELETE /api/knowledge-graph/nodes/:nodeId
```

**查询参数**:
- `cascade`: boolean - 是否级联删除子节点（默认 true）

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "deletedNodeId": "book1_catalog_4",
    "deletedCount": 1,
    "cascadeDeleted": []
  }
}
```

### 2.6 批量操作节点

```http
POST /api/knowledge-graph/nodes/batch
```

**请求体**:
```json
{
  "operations": [
    {
      "action": "create",
      "data": {
        "parentId": "book1_catalog",
        "name": "新节点1",
        "category": "章节"
      }
    },
    {
      "action": "update",
      "nodeId": "book1_catalog_1",
      "data": {
        "name": "修改后的名称"
      }
    },
    {
      "action": "delete",
      "nodeId": "book1_catalog_2"
    }
  ]
}
```

---

## 3. 智能问答接口

### 3.1 提问（本地问答）

```http
POST /api/qa/ask
```

**请求体**:
```json
{
  "question": "板块构造与地貌形迹这本书讲了什么？",
  "bookId": "book1",
  "context": {
    "conversationId": "conv_123",
    "previousQuestions": []
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": "《板块构造与地貌形迹》这本书详细阐述了板块构造理论与地貌形成的关系，重点研究劳亚区系、冈瓦纳区系和特提斯陆间带的地质特征及其演化过程。",
    "relatedNodes": [
      {
        "id": "book1",
        "name": "板块构造与地貌形迹",
        "category": "书籍",
        "level": 1,
        "relevance": 0.95
      }
    ],
    "sources": [
      {
        "nodeId": "book1",
        "nodeName": "板块构造与地貌形迹",
        "excerpt": "详细阐述了板块构造理论..."
      }
    ],
    "confidence": 0.85,
    "responseTime": 120
  }
}
```

### 3.2 AI 增强问答

```http
POST /api/qa/ai-ask
```

**请求体**:
```json
{
  "question": "比较劳亚区系和冈瓦纳区系的异同",
  "bookId": "book1",
  "aiConfig": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 500
  },
  "context": {
    "conversationId": "conv_123"
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": "劳亚区系和冈瓦纳区系是泛大陆的两个主要组成部分...",
    "relatedNodes": [
      {
        "id": "book1_catalog_1",
        "name": "第一章：劳亚区系",
        "category": "章节"
      },
      {
        "id": "book1_catalog_2",
        "name": "第二章：冈瓦纳区系",
        "category": "章节"
      }
    ],
    "aiMetadata": {
      "model": "gpt-4",
      "tokensUsed": 350,
      "processingTime": 1.2,
      "confidence": 0.92
    }
  }
}
```

### 3.3 获取对话历史

```http
GET /api/qa/conversations/:conversationId
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "conversationId": "conv_123",
    "messages": [
      {
        "role": "user",
        "content": "什么是劳亚区系？",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "role": "assistant",
        "content": "劳亚区系是古生代晚期...",
        "relatedNodes": [...],
        "timestamp": "2024-01-01T00:00:01Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 4. 搜索接口

### 4.1 全文搜索

```http
GET /api/search
```

**查询参数**:
- `q`: string - 搜索关键词（必填）
- `bookId`: string - 限定书籍ID（可选）
- `category`: string - 限定节点类型（可选）
- `limit`: number - 返回数量（默认 10）
- `offset`: number - 偏移量（默认 0）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "results": [
      {
        "id": "book1_catalog_1",
        "name": "第一章：劳亚区系",
        "category": "章节",
        "level": 3,
        "bookId": "book1",
        "bookName": "板块构造与地貌形迹",
        "highlight": "...劳亚区系是古生代晚期...",
        "score": 0.92,
        "path": ["板块构造与地貌形迹", "目录", "第一章：劳亚区系"]
      }
    ],
    "total": 15,
    "took": 23,
    "query": "劳亚"
  }
}
```

### 4.2 高级搜索

```http
POST /api/search/advanced
```

**请求体**:
```json
{
  "query": "劳亚",
  "filters": {
    "bookIds": ["book1"],
    "categories": ["章节", "引用"],
    "levels": [2, 3],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  },
  "sort": {
    "field": "relevance",
    "order": "desc"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 5. 导入导出接口

### 5.1 导出知识图谱

```http
GET /api/knowledge-graph/books/:bookId/export
```

**查询参数**:
- `format`: string - 导出格式（json/xml/graphml/csv，默认 json）
- `includeMetadata`: boolean - 是否包含元数据（默认 true）

**响应**: 文件下载

### 5.2 导入知识图谱

```http
POST /api/knowledge-graph/books/:bookId/import
```

**请求体**: multipart/form-data
- `file`: File - 图谱文件
- `mode`: string - 导入模式（merge/replace，默认 merge）

**响应示例**:
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "importedNodes": 25,
    "importedEdges": 24,
    "skippedNodes": 0,
    "errors": [],
    "warnings": ["节点 book1_catalog_1 已存在，已跳过"]
  }
}
```

---

## 6. 统计分析接口

### 6.1 获取图谱统计信息

```http
GET /api/knowledge-graph/books/:bookId/stats
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalNodes": 25,
    "totalEdges": 24,
    "nodesByCategory": {
      "书籍": 1,
      "目录": 3,
      "章节": 15,
      "图表": 3,
      "引文": 3
    },
    "nodesByLevel": {
      "1": 1,
      "2": 3,
      "3": 21
    },
    "maxDepth": 3,
    "avgChildrenPerNode": 2.4,
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "field": "name",
    "reason": "名称不能为空"
  }
}
```

### 常见错误码

| 错误码 | 说明 | 处理建议 |
|-------|------|---------|
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 未授权 | 检查 Token 是否有效 |
| 403 | 禁止访问 | 检查用户权限 |
| 404 | 资源不存在 | 检查资源 ID 是否正确 |
| 409 | 资源冲突 | 资源已存在或状态不允许操作 |
| 429 | 请求过于频繁 | 降低请求频率 |
| 500 | 服务器错误 | 联系技术支持 |

---

## 接口调用示例

### JavaScript/TypeScript

```typescript
// 获取书籍列表
const getBooks = async () => {
  const response = await fetch('http://localhost:8080/api/books');
  const data = await response.json();
  return data.data.books;
};

// 获取知识图谱
const getGraph = async (bookId: string) => {
  const response = await fetch(`http://localhost:8080/api/knowledge-graph/books/${bookId}`);
  const data = await response.json();
  return data.data.graph;
};

// 提问
const askQuestion = async (question: string, bookId: string) => {
  const response = await fetch('http://localhost:8080/api/qa/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question, bookId })
  });
  const data = await response.json();
  return data.data;
};
```

### Python

```python
import requests

BASE_URL = 'http://localhost:8080/api'

# 获取书籍列表
def get_books():
    response = requests.get(f'{BASE_URL}/books')
    return response.json()['data']['books']

# 获取知识图谱
def get_graph(book_id):
    response = requests.get(f'{BASE_URL}/knowledge-graph/books/{book_id}')
    return response.json()['data']['graph']

# 提问
def ask_question(question, book_id):
    response = requests.post(f'{BASE_URL}/qa/ask', json={
        'question': question,
        'bookId': book_id
    })
    return response.json()['data']
```

---

## 版本历史

- v1.0.0 (2024-01-01): 初始版本
- v1.1.0 (2024-02-01): 添加 AI 问答接口
- v1.2.0 (2024-03-01): 添加批量操作接口

---

## 联系方式

如有问题，请联系技术支持团队。
