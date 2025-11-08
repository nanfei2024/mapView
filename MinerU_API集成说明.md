# MinerU API 集成说明

## 概述

已成功集成 MinerU 文档解析 API 到地质文档数字化系统。系统支持本地文件上传和 URL 在线文档解析两种方式。

## API 配置

### API Token
- **当前Token**: 已配置在 `src/api/mineruApi.ts` 中
- **Token有效期**: 至 2025年（从JWT解析）
- **更新方式**: 修改 `mineruApi.ts` 文件中的 `API_TOKEN` 常量

### API限制
- 单个文件大小：最大 200MB
- 文件页数：最多 600 页
- 每日免费额度：2000 页最高优先级解析
- 支持格式：PDF、DOC、DOCX、PPT、PPTX、PNG、JPG、JPEG

## 功能说明

### 1. URL 在线文档解析
- 输入文档 URL 地址
- 系统自动创建解析任务
- 实时显示解析进度
- 完成后自动下载结果

**处理流程**:
1. 提交 URL → `createExtractTask()`
2. 获取 task_id
3. 轮询任务状态 → `pollTaskUntilComplete()`
4. 显示进度：已解析页数/总页数
5. 完成后提供下载链接

### 2. 本地文件上传解析

#### 单个文件处理
- 点击"选择文件"或拖拽上传
- 点击"开始解析"按钮
- 实时显示上传和解析进度

**处理流程**:
1. 申请上传链接 → `createBatchUploadUrls()`
2. 上传文件到 OSS → `uploadFileToUrl()`
3. 等待系统自动触发解析任务
4. 轮询批量任务状态 → `pollBatchTaskUntilComplete()`
5. 显示进度和结果

#### 批量文件处理
- 选择多个文件后点击"批量解析"
- 系统自动批量上传并处理
- 每个文件独立显示状态

**处理流程**:
1. 批量申请上传链接
2. 并行上传所有文件
3. 轮询批量任务状态
4. 更新每个文件的处理结果

## 文件状态说明

| 状态 | 说明 | 颜色 |
|------|------|------|
| pending | 待处理 | 灰色 |
| uploading | 上传中 | 紫色 |
| processing | 解析中 | 蓝色 |
| completed | 已完成 | 绿色 |
| error | 失败 | 红色 |

## API 接口说明

### mineruApi.ts 提供的方法

#### 1. `createExtractTask(params)`
创建单个 URL 文档解析任务
```typescript
const response = await createExtractTask({
  url: 'https://example.com/document.pdf',
  model_version: 'vlm',
  enable_formula: true,
  enable_table: true,
  language: 'ch'
});
```

#### 2. `getTaskResult(taskId)`
查询单个任务结果
```typescript
const result = await getTaskResult(taskId);
```

#### 3. `createBatchUploadUrls(params)`
批量申请文件上传链接
```typescript
const response = await createBatchUploadUrls({
  files: [{ name: 'doc.pdf', data_id: 'id_1' }],
  model_version: 'vlm'
});
```

#### 4. `uploadFileToUrl(url, file)`
上传文件到指定 URL
```typescript
const success = await uploadFileToUrl(uploadUrl, file);
```

#### 5. `pollTaskUntilComplete(taskId, onProgress)`
轮询单个任务直到完成
```typescript
const result = await pollTaskUntilComplete(taskId, (progress) => {
  console.log('进度:', progress.extract_progress);
});
```

#### 6. `pollBatchTaskUntilComplete(batchId, onProgress)`
轮询批量任务直到完成
```typescript
const result = await pollBatchTaskUntilComplete(batchId, (progress) => {
  console.log('批量进度:', progress.extract_result);
});
```

#### 7. `getErrorMessage(code)`
获取错误码对应的错误信息
```typescript
const message = getErrorMessage(-60005);
// 返回: "文件大小超出限制（最大200MB）"
```

## 解析结果说明

### 结果文件
解析完成后会返回一个 ZIP 压缩包，包含以下内容：
- **Markdown** 文件：文档转换后的 Markdown 格式
- **JSON** 文件：结构化数据
- **图片文件**：提取的图片和图表
- 可选格式：DOCX、HTML、LaTeX（需要在请求时指定）

### 下载结果
- 点击"下载结果"按钮自动下载 ZIP 文件
- 文件命名格式：`原文件名_result.zip`

## 配置参数

### 解析参数（在代码中可调整）

```typescript
{
  model_version: 'vlm',        // 模型版本: pipeline 或 vlm
  enable_formula: true,         // 是否启用公式识别
  enable_table: true,           // 是否启用表格识别
  language: 'ch',               // 文档语言: ch(中文)
  is_ocr: false,                // 是否启用OCR（仅pipeline模型）
  page_ranges: '1-10',          // 指定页码范围（可选）
  extra_formats: ['docx']       // 额外导出格式（可选）
}
```

### 轮询参数（在代码中可调整）

```typescript
{
  maxAttempts: 300,    // 最大轮询次数（5分钟）
  interval: 1000       // 轮询间隔（1秒）
}
```

## 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| A0202 | Token 错误 | 检查 Token 是否正确配置 |
| A0211 | Token 过期 | 更新 Token |
| -60005 | 文件大小超出限制 | 确保文件 ≤ 200MB |
| -60006 | 文件页数超过限制 | 确保页数 ≤ 600 页 |
| -60008 | 文件读取超时 | 检查 URL 是否可访问 |
| -60009 | 任务队列已满 | 稍后重试 |

完整错误码列表请参考 `mineruApi.ts` 中的 `getErrorMessage()` 方法。

## 性能优化

### 1. 批量处理优化
- 一次性上传多个文件可以共享批次 ID
- 减少网络请求次数
- 提高处理效率

### 2. 轮询优化
- 单个任务：每秒轮询一次
- 批量任务：每2秒轮询一次
- 最多轮询5分钟（可配置）

### 3. 错误处理
- 自动重试机制（通过 MinerU 服务端实现）
- 详细的错误信息提示
- 状态实时更新

## 使用示例

### 示例1：解析在线 PDF
```typescript
// 在 URL 输入框输入
https://example.com/geology-report.pdf

// 系统会自动：
// 1. 创建解析任务
// 2. 显示进度：12/50 页
// 3. 完成后提供下载
```

### 示例2：上传本地文件
```typescript
// 1. 拖拽或选择本地 PDF 文件
// 2. 选择文档类型：地质报告
// 3. 点击"开始解析"
// 4. 等待处理完成
// 5. 点击"下载结果"
```

### 示例3：批量处理
```typescript
// 1. 选择多个本地文件（如 5 个 PDF）
// 2. 点击"批量解析"
// 3. 系统自动批量上传和处理
// 4. 每个文件独立显示进度
// 5. 全部完成后分别下载结果
```

## 注意事项

1. **Token 安全**：当前 Token 直接写在代码中，生产环境建议使用环境变量
2. **文件大小**：上传前建议检查文件大小，避免超出限制
3. **网络环境**：GitHub、AWS 等国外 URL 可能访问超时
4. **额度管理**：注意每日 2000 页的免费额度
5. **结果保存**：下载的结果文件建议及时保存，链接可能有有效期

## 技术架构

```
前端页面 (DocumentDigitalizationPage.vue)
    ↓
API 封装层 (mineruApi.ts)
    ↓
MinerU API 服务 (https://mineru.net/api/v4)
    ↓
文档解析服务
    ↓
返回结果（ZIP 压缩包）
```

## 更新日志

### 2025-11-07
- ✅ 集成 MinerU API
- ✅ 实现 URL 在线文档解析
- ✅ 实现本地文件上传解析
- ✅ 实现批量文件处理
- ✅ 添加实时进度显示
- ✅ 添加错误处理和提示
- ✅ 支持结果下载

## 后续优化建议

1. **Token 管理**：使用环境变量或配置文件管理 Token
2. **结果预览**：在线预览 Markdown 和 JSON 结果
3. **历史记录**：保存解析历史，方便查询
4. **文件校验**：上传前校验文件格式和大小
5. **进度条**：添加可视化进度条显示
6. **通知系统**：添加解析完成通知
7. **结果管理**：提供结果文件的管理界面

## 技术支持

- MinerU 官网：https://mineru.net
- API 文档：https://mineru.net/api/docs
- 问题反馈：根据错误码查询解决方案

