/**
 * 文档数字化后端 API 接口
 * 
 * 功能：
 * 1. 文件上传和解析
 * 2. 解析结果存储
 * 3. 历史记录查询
 * 4. 结果详情获取
 */

import axios from 'axios';

// API 基础地址配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟超时（解析可能需要较长时间）
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== 类型定义 ====================

/**
 * 文档解析任务状态
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 文档解析记录
 */
export interface DocumentRecord {
  id: string;                    // 记录ID
  fileName: string;              // 文件名
  fileSize: number;              // 文件大小（字节）
  fileType: string;              // 文件类型（pdf, docx等）
  status: TaskStatus;            // 任务状态
  sourceType: 'local' | 'url';   // 来源类型
  sourceUrl?: string;            // 源URL（如果是URL上传）
  uploadTime: string;            // 上传时间（ISO格式）
  completedTime?: string;        // 完成时间
  resultUrl?: string;            // 解析结果ZIP文件URL
  markdownUrl?: string;          // Markdown文件URL
  errorMessage?: string;         // 错误信息
  progress?: {                   // 解析进度
    extractedPages: number;
    totalPages: number;
  };
  metadata?: {                   // 元数据
    author?: string;
    title?: string;
    pageCount?: number;
  };
}

/**
 * 文档列表查询参数
 */
export interface QueryParams {
  page?: number;                 // 页码（从1开始）
  pageSize?: number;             // 每页数量
  status?: TaskStatus;           // 按状态筛选
  keyword?: string;              // 关键词搜索
  startDate?: string;            // 开始日期
  endDate?: string;              // 结束日期
  sortBy?: 'uploadTime' | 'fileName' | 'fileSize';  // 排序字段
  sortOrder?: 'asc' | 'desc';    // 排序方向
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];                     // 数据列表
  total: number;                 // 总数
  page: number;                  // 当前页
  pageSize: number;              // 每页数量
  totalPages: number;            // 总页数
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== API 接口函数 ====================

/**
 * 1. 上传本地文件并开始解析
 * 
 * @param file - 文件对象
 * @param fileType - 文件类型（pdf, book等）
 * @returns 创建的文档记录
 */
export async function uploadAndParseDocument(
  file: File,
  fileType: string = 'pdf'
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  formData.append('sourceType', 'local');

  const response = await apiClient.post<ApiResponse<DocumentRecord>>(
    '/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // 上传进度回调
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`上传进度: ${percentCompleted}%`);
        }
      },
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '上传失败');
  }

  return response.data.data!;
}

/**
 * 2. 通过URL解析文档
 * 
 * @param url - 文档URL
 * @param fileType - 文件类型
 * @returns 创建的文档记录
 */
export async function parseDocumentByUrl(
  url: string,
  fileType: string = 'pdf'
): Promise<DocumentRecord> {
  const response = await apiClient.post<ApiResponse<DocumentRecord>>(
    '/documents/parse-url',
    {
      url,
      fileType,
      sourceType: 'url',
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '解析失败');
  }

  return response.data.data!;
}

/**
 * 3. 查询文档解析任务状态
 * 
 * @param documentId - 文档记录ID
 * @returns 文档记录
 */
export async function getDocumentStatus(
  documentId: string
): Promise<DocumentRecord> {
  const response = await apiClient.get<ApiResponse<DocumentRecord>>(
    `/documents/${documentId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '查询失败');
  }

  return response.data.data!;
}

/**
 * 4. 获取文档列表（分页）
 * 
 * @param params - 查询参数
 * @returns 分页结果
 */
export async function getDocumentList(
  params: QueryParams = {}
): Promise<PaginatedResponse<DocumentRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<DocumentRecord>>>(
    '/documents',
    { params }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '查询失败');
  }

  return response.data.data!;
}

/**
 * 5. 获取文档详情
 * 
 * @param documentId - 文档记录ID
 * @returns 文档详情
 */
export async function getDocumentDetail(
  documentId: string
): Promise<DocumentRecord> {
  const response = await apiClient.get<ApiResponse<DocumentRecord>>(
    `/documents/${documentId}/detail`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '查询失败');
  }

  return response.data.data!;
}

/**
 * 6. 删除文档记录
 * 
 * @param documentId - 文档记录ID
 * @returns 删除结果
 */
export async function deleteDocument(
  documentId: string
): Promise<boolean> {
  const response = await apiClient.delete<ApiResponse<boolean>>(
    `/documents/${documentId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '删除失败');
  }

  return response.data.data!;
}

/**
 * 7. 重新解析文档
 * 
 * @param documentId - 文档记录ID
 * @returns 更新后的文档记录
 */
export async function retryParseDocument(
  documentId: string
): Promise<DocumentRecord> {
  const response = await apiClient.post<ApiResponse<DocumentRecord>>(
    `/documents/${documentId}/retry`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '重新解析失败');
  }

  return response.data.data!;
}

/**
 * 8. 获取解析结果文件（Markdown内容）
 * 
 * @param documentId - 文档记录ID
 * @returns Markdown内容
 */
export async function getMarkdownContent(
  documentId: string
): Promise<string> {
  const response = await apiClient.get<ApiResponse<{ content: string }>>(
    `/documents/${documentId}/markdown`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '获取内容失败');
  }

  return response.data.data!.content;
}

/**
 * 9. 下载解析结果（ZIP文件）
 * 
 * @param documentId - 文档记录ID
 * @returns Blob对象
 */
export async function downloadDocumentResult(
  documentId: string
): Promise<Blob> {
  const response = await apiClient.get(
    `/documents/${documentId}/download`,
    {
      responseType: 'blob',
    }
  );

  return response.data;
}

/**
 * 10. 批量删除文档
 * 
 * @param documentIds - 文档ID数组
 * @returns 删除结果
 */
export async function batchDeleteDocuments(
  documentIds: string[]
): Promise<{ success: number; failed: number }> {
  const response = await apiClient.post<ApiResponse<{ success: number; failed: number }>>(
    '/documents/batch-delete',
    { documentIds }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '批量删除失败');
  }

  return response.data.data!;
}

/**
 * 11. 获取统计信息
 * 
 * @returns 统计数据
 */
export async function getDocumentStatistics(): Promise<{
  total: number;
  completed: number;
  processing: number;
  failed: number;
  totalSize: number;
}> {
  const response = await apiClient.get<ApiResponse<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
    totalSize: number;
  }>>('/documents/statistics');

  if (!response.data.success) {
    throw new Error(response.data.error || '查询统计失败');
  }

  return response.data.data!;
}

// ==================== 导出所有接口 ====================

export default {
  uploadAndParseDocument,
  parseDocumentByUrl,
  getDocumentStatus,
  getDocumentList,
  getDocumentDetail,
  deleteDocument,
  retryParseDocument,
  getMarkdownContent,
  downloadDocumentResult,
  batchDeleteDocuments,
  getDocumentStatistics,
};

