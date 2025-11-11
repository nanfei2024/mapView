/**
 * 文件管理 API
 * 提供文件查询、上传、删除等功能
 */

// 获取后端地址（从环境变量或使用默认值）
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 文件数据类型定义
export interface FileItem {
  id: number;
  file_type: string;
  property: string;
  file_path: string;
  details?: string;
  is_directory?: boolean;
  book_id?: number;
  upload_time?: string;
  [key: string]: any;
}

export interface FileListResponse {
  content?: FileItem[];
  images?: FileItem[];
  totalRecords: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  bookId?: number;
}

export interface FileSearchParams {
  keyword?: string;
  fileType?: string;
  bookId?: number;
  page?: number;
  size?: number;
}

export interface FileSearchResponse {
  files: FileItem[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number;
}

export interface FileStatsResponse {
  typeStats: Array<{
    file_type: string;
    count: number;
  }>;
  totalFiles: number;
  recentFiles?: FileItem[];
}

// 通用请求处理
async function handleRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('[文件API错误]', url, error);
    throw error;
  }
}

// 文件管理 API
export const fileApi = {
  /**
   * 获取文件列表（按章节）
   * @param property 章节属性（如 "1.1"），如果为空则使用搜索接口获取所有文件
   * @param params 查询参数
   */
  async getFilesByProperty(
    property: string = '',
    params: {
      page?: number;
      size?: number;
      bookId?: number;
    } = {}
  ): Promise<FileListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.bookId) queryParams.append('bookId', params.bookId.toString());

    // 如果有 property，使用按章节查询接口
    if (property) {
      const url = `${BACKEND_BASE_URL}/api/files/${property}?${queryParams.toString()}`;
      return handleRequest<FileListResponse>(url);
    } else {
      // 如果没有 property，使用搜索接口（不传 keyword 获取所有文件）
      const url = `${BACKEND_BASE_URL}/api/files/search?keyword=&${queryParams.toString()}`;
      const searchResult = await handleRequest<FileSearchResponse>(url);
      // 转换为 FileListResponse 格式
      return {
        content: searchResult.files || [],
        totalRecords: searchResult.total || 0,
        totalPages: searchResult.totalPages,
        currentPage: searchResult.page,
        pageSize: searchResult.size,
        bookId: params.bookId,
      };
    }
  },

  /**
   * 搜索文件
   * @param params 搜索参数
   */
  async searchFiles(params: FileSearchParams): Promise<FileSearchResponse> {
    const queryParams = new URLSearchParams();
    // keyword 是必填参数，如果没有提供则传空字符串
    queryParams.append('keyword', params.keyword || '');
    if (params.fileType) queryParams.append('fileType', params.fileType);
    if (params.bookId) queryParams.append('bookId', params.bookId.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());

    const url = `${BACKEND_BASE_URL}/api/files/search?${queryParams.toString()}`;
    return handleRequest<FileSearchResponse>(url);
  },

  /**
   * 获取文件统计信息
   * @param bookId 书籍ID（可选）
   */
  async getFileStats(bookId?: number): Promise<FileStatsResponse> {
    const url = bookId
      ? `${BACKEND_BASE_URL}/api/files/stats?bookId=${bookId}`
      : `${BACKEND_BASE_URL}/api/files/stats`;
    return handleRequest<FileStatsResponse>(url);
  },

  /**
   * 获取文件详情
   * @param fileId 文件ID
   */
  async getFileDetails(fileId: number): Promise<FileItem> {
    const url = `${BACKEND_BASE_URL}/api/files/details/${fileId}`;
    return handleRequest<FileItem>(url);
  },

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async deleteFile(fileId: number): Promise<{ message: string }> {
    const url = `${BACKEND_BASE_URL}/api/files/${fileId}`;
    return handleRequest<{ message: string }>(url, {
      method: 'DELETE',
    });
  },

  /**
   * 批量删除文件
   * @param fileIds 文件ID数组
   */
  async batchDeleteFiles(fileIds: number[]): Promise<{ success: number; failed: number; message: string }> {
    const results = { success: 0, failed: 0, message: '' };
    
    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId);
        results.success++;
      } catch (error) {
        results.failed++;
        console.error(`删除文件 ${fileId} 失败:`, error);
      }
    }

    results.message = `成功删除 ${results.success} 个文件${results.failed > 0 ? `，失败 ${results.failed} 个` : ''}`;
    return results;
  },

  /**
   * 上传文件
   * @param files 文件数组
   * @param bookId 书籍ID（可选）
   */
  async uploadFiles(files: File[], bookId?: number): Promise<{ results: Record<string, string> }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (bookId) {
      formData.append('bookId', bookId.toString());
    }

    const url = `${BACKEND_BASE_URL}/api/upload/files`;
    return handleRequest<{ results: Record<string, string> }>(url, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * 上传图片文件夹
   * @param folderName 文件夹名称（如 "1.1"）
   * @param files 图片文件数组
   * @param bookId 书籍ID（可选）
   */
  async uploadImageFolder(
    folderName: string,
    files: File[],
    bookId?: number
  ): Promise<{ message: string; [key: string]: any }> {
    const formData = new FormData();
    formData.append('folderName', folderName);
    files.forEach(file => formData.append('files', file));
    if (bookId) {
      formData.append('bookId', bookId.toString());
    }

    const url = `${BACKEND_BASE_URL}/api/upload/folder`;
    return handleRequest<{ message: string; [key: string]: any }>(url, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * 上传摘要文件
   * @param property 章节属性（如 "1.1"）
   * @param file 摘要文件
   * @param bookId 书籍ID（可选）
   */
  async uploadSummary(
    property: string,
    file: File,
    bookId?: number
  ): Promise<{ message: string; [key: string]: any }> {
    const formData = new FormData();
    formData.append('property', property);
    formData.append('file', file);
    if (bookId) {
      formData.append('bookId', bookId.toString());
    }

    const url = `${BACKEND_BASE_URL}/api/upload/summary`;
    return handleRequest<{ message: string; [key: string]: any }>(url, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * 上传表格文件夹
   * @param folderName 文件夹名称（如 "1.1"）
   * @param files 表格文件数组
   * @param bookId 书籍ID（可选）
   */
  async uploadTableFolder(
    folderName: string,
    files: File[],
    bookId?: number
  ): Promise<{ message: string; [key: string]: any }> {
    const formData = new FormData();
    formData.append('folderName', folderName);
    files.forEach(file => formData.append('files', file));
    if (bookId) {
      formData.append('bookId', bookId.toString());
    }

    const url = `${BACKEND_BASE_URL}/api/upload/table-folder`;
    return handleRequest<{ message: string; [key: string]: any }>(url, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * 获取图片文件夹及其中的图片列表
   * @param property 章节属性（如 "1.1"）
   * @param bookId 书籍ID（可选）
   */
  async getImageFolder(property: string, bookId?: number): Promise<{
    folder: FileItem;
    images: Array<{ name: string; url: string }>;
    path?: string;
    warning?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (bookId) queryParams.append('bookId', bookId.toString());
    const url = `${BACKEND_BASE_URL}/api/files/chapter/${property}/images?${queryParams.toString()}`;
    return handleRequest<{
      folder: FileItem;
      images: Array<{ name: string; url: string }>;
      path?: string;
      warning?: string;
    }>(url);
  },

  /**
   * 获取表格文件夹及其中的表格列表
   * @param property 章节属性（如 "1.1"）
   * @param bookId 书籍ID（可选）
   */
  async getTableFolder(property: string, bookId?: number): Promise<{
    folder: FileItem;
    tables: Array<{
      name: string;
      path: string;
      url: string;
      size: number;
      lastModified: number;
    }>;
    path?: string;
    warning?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (bookId) queryParams.append('bookId', bookId.toString());
    const url = `${BACKEND_BASE_URL}/api/files/chapter/${property}/tables?${queryParams.toString()}`;
    return handleRequest<{
      folder: FileItem;
      tables: Array<{
        name: string;
        path: string;
        url: string;
        size: number;
        lastModified: number;
      }>;
      path?: string;
      warning?: string;
    }>(url);
  },

  /**
   * 预览表格文件（返回表格的前几行数据）
   * @param property 章节属性
   * @param fileName 文件名
   * @param maxRows 最大行数（默认10）
   */
  async previewTableFile(
    property: string,
    fileName: string,
    maxRows: number = 10
  ): Promise<{
    headers: string[];
    data: string[][];  // 注意：后端返回的是 data，不是 rows
    rowCount: number;
    fileName: string;
    isPartial?: boolean;
    message?: string;
    downloadUrl?: string;
  }> {
    const url = `${BACKEND_BASE_URL}/api/files/preview/table/${property}/${encodeURIComponent(fileName)}?maxRows=${maxRows}`;
    return handleRequest<{
      headers: string[];
      data: string[][];
      rowCount: number;
      fileName: string;
      isPartial?: boolean;
      message?: string;
      downloadUrl?: string;
    }>(url);
  },

  /**
   * 下载文件
   * @param property 章节属性
   * @param type 文件类型（images 或 tables）
   * @param fileName 文件名
   */
  async downloadFile(property: string, type: 'images' | 'tables', fileName: string): Promise<Blob> {
    const url = `${BACKEND_BASE_URL}/api/files/download/${property}/${type}/${encodeURIComponent(fileName)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }
    return await response.blob();
  },
};

export default fileApi;

