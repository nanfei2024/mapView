/**
 * MinerU API 服务
 * 文档解析API接口封装
 */

// 开发环境使用代理，避免 CORS 问题
// 生产环境需要配置后端服务器代理或使用服务端调用
const isDevelopment = import.meta.env.DEV;

// 获取后端地址（从环境变量或使用默认值）
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const MINERU_API_BASE = isDevelopment 
  ? '/api/mineru'  // 开发环境通过 Vite 代理到后端
  : `${BACKEND_BASE_URL}/api/mineru`;  // 生产环境直接调用后端代理

console.log('🔧 MinerU API 配置:', {
  isDevelopment,
  MINERU_API_BASE,
  BACKEND_BASE_URL,
  env: import.meta.env.MODE
});

const API_TOKEN = 'eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI1MDEwOTU0OCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MjQ4Mjk2MSwiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiMTM5NjY5MTQ0MjciLCJvcGVuSWQiOm51bGwsInV1aWQiOiI0NDNlNTZjNi1hZTJkLTQ3NzQtODI5OC1jYTlkZTM2ZmUxYzEiLCJlbWFpbCI6IiIsImV4cCI6MTc2MzY5MjU2MX0.YuiQpcmfgZ9BsYm2qjq_ys3SiML-cx3lbuGpcb9fOJANSME68TuzIhI-j5l5MbR4fTpOhlKYMKpJ5-supq8X_g';

// 通用请求头
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

/**
 * 单个文件URL解析 - 创建解析任务
 */
export interface CreateTaskParams {
  url: string;
  model_version?: 'pipeline' | 'vlm';
  is_ocr?: boolean;
  enable_formula?: boolean;
  enable_table?: boolean;
  language?: string;
  data_id?: string;
  page_ranges?: string;
  extra_formats?: string[];
}

export interface CreateTaskResponse {
  code: number;
  msg: string;
  trace_id: string;
  data: {
    task_id: string;
  };
}

export const createExtractTask = async (params: CreateTaskParams): Promise<CreateTaskResponse> => {
  console.log('📤 调用 createExtractTask:', {
    url: `${MINERU_API_BASE}/extract/task`,
    params,
    isDevelopment
  });

  const response = await fetch(`${MINERU_API_BASE}/extract/task`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_version: 'vlm', // 默认使用vlm模型
      ...params
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API请求失败:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ API请求成功:', result);
  return result;
};

/**
 * 获取单个任务结果
 */
export interface TaskResult {
  code: number;
  msg: string;
  trace_id: string;
  data: {
    task_id: string;
    data_id?: string;
    state: 'pending' | 'running' | 'done' | 'failed' | 'converting';
    full_zip_url?: string;
    err_msg?: string;
    extract_progress?: {
      extracted_pages: number;
      total_pages: number;
      start_time: string;
    };
  };
}

export const getTaskResult = async (taskId: string): Promise<TaskResult> => {
  const response = await fetch(`${MINERU_API_BASE}/extract/task/${taskId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`获取任务结果失败: ${response.status}`);
  }

  return await response.json();
};

/**
 * 批量文件上传 - 申请上传链接
 */
export interface BatchUploadParams {
  files: Array<{
    name: string;
    data_id?: string;
    is_ocr?: boolean;
    page_ranges?: string;
  }>;
  model_version?: 'pipeline' | 'vlm';
  enable_formula?: boolean;
  enable_table?: boolean;
  language?: string;
  extra_formats?: string[];
}

export interface BatchUploadResponse {
  code: number;
  msg: string;
  trace_id: string;
  data: {
    batch_id: string;
    file_urls: string[];
  };
}

export const createBatchUploadUrls = async (params: BatchUploadParams): Promise<BatchUploadResponse> => {
  const response = await fetch(`${MINERU_API_BASE}/file-urls/batch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_version: 'vlm',
      ...params
    })
  });

  if (!response.ok) {
    throw new Error(`申请上传链接失败: ${response.status}`);
  }

  return await response.json();
};

/**
 * 上传文件到指定URL
 */
export const uploadFileToUrl = async (url: string, file: File): Promise<boolean> => {
  const response = await fetch(url, {
    method: 'PUT',
    body: file
  });

  return response.ok;
};

/**
 * 批量URL解析
 */
export interface BatchTaskParams {
  files: Array<{
    url: string;
    data_id?: string;
    is_ocr?: boolean;
    page_ranges?: string;
  }>;
  model_version?: 'pipeline' | 'vlm';
  enable_formula?: boolean;
  enable_table?: boolean;
  language?: string;
  extra_formats?: string[];
}

export interface BatchTaskResponse {
  code: number;
  msg: string;
  trace_id: string;
  data: {
    batch_id: string;
  };
}

export const createBatchTask = async (params: BatchTaskParams): Promise<BatchTaskResponse> => {
  const response = await fetch(`${MINERU_API_BASE}/extract/task/batch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_version: 'vlm',
      ...params
    })
  });

  if (!response.ok) {
    throw new Error(`批量任务创建失败: ${response.status}`);
  }

  return await response.json();
};

/**
 * 批量获取任务结果
 */
export interface BatchTaskResult {
  code: number;
  msg: string;
  trace_id: string;
  data: {
    batch_id: string;
    extract_result: Array<{
      file_name: string;
      state: 'waiting-file' | 'pending' | 'running' | 'done' | 'failed' | 'converting';
      full_zip_url?: string;
      err_msg?: string;
      data_id?: string;
      extract_progress?: {
        extracted_pages: number;
        total_pages: number;
        start_time: string;
      };
    }>;
  };
}

export const getBatchTaskResult = async (batchId: string): Promise<BatchTaskResult> => {
  const response = await fetch(`${MINERU_API_BASE}/extract-results/batch/${batchId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`获取批量任务结果失败: ${response.status}`);
  }

  return await response.json();
};

/**
 * 轮询任务状态直到完成
 */
export const pollTaskUntilComplete = async (
  taskId: string,
  onProgress?: (progress: TaskResult['data']) => void,
  maxAttempts = 300, // 最多轮询5分钟（每秒一次）
  interval = 1000 // 轮询间隔1秒
): Promise<TaskResult> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getTaskResult(taskId);

    if (onProgress) {
      onProgress(result.data);
    }

    // 任务完成或失败，返回结果
    if (result.data.state === 'done' || result.data.state === 'failed') {
      return result;
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('任务轮询超时');
};

/**
 * 轮询批量任务状态直到完成
 */
export const pollBatchTaskUntilComplete = async (
  batchId: string,
  onProgress?: (progress: BatchTaskResult['data']) => void,
  maxAttempts = 300,
  interval = 2000 // 批量任务轮询间隔2秒
): Promise<BatchTaskResult> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getBatchTaskResult(batchId);

    if (onProgress) {
      onProgress(result.data);
    }

    // 检查是否所有任务都完成
    const allComplete = result.data.extract_result.every(
      task => task.state === 'done' || task.state === 'failed'
    );

    if (allComplete) {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('批量任务轮询超时');
};

/**
 * 阶段一：上传文件到后端
 */
export interface UploadFileResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    fileName: string;
    fileSize: number;
    filePath: string;
    savedFilename: string;
  };
}

export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${MINERU_API_BASE}/upload`;
  console.log('📤 调用 uploadFile:', {
    url,
    fileName: file.name,
    fileSize: file.size,
    isDevelopment
  });

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: '上传失败', detail: errorText };
    }
    
    console.error('❌ 文件上传失败:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      errorText
    });
    
    throw new Error(errorData.message || errorData.detail || `上传失败: ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ 文件上传成功:', result);
  return result;
};

/**
 * 阶段二：触发解析（传入文件ID）
 */
export interface ParseDocumentParams {
  model_version?: 'pipeline' | 'vlm';
  enable_formula?: boolean;
  enable_table?: boolean;
  language?: string;
}

export interface ParseDocumentResponse {
  success: boolean;
  message: string;
  data: {
    state: string;
    full_zip_url?: string;
    batchId?: string;
    markdownPath?: string;
  };
}

export const parseDocument = async (
  fileId: string,
  params: ParseDocumentParams = {}
): Promise<ParseDocumentResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('model_version', params.model_version || 'vlm');
  queryParams.append('enable_formula', String(params.enable_formula !== false));
  queryParams.append('enable_table', String(params.enable_table !== false));
  queryParams.append('language', params.language || 'ch');

  const url = `${MINERU_API_BASE}/parse/${fileId}?${queryParams}`;
  console.log('📤 调用 parseDocument:', {
    url,
    fileId,
    params,
    isDevelopment
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: '解析失败', detail: errorText };
    }
    
    const errorMessage = errorData.message || `解析失败: ${response.status}`;
    const errorDetail = errorData.detail || '';
    
    console.error('❌ 解析文档失败:', {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage,
      detail: errorDetail,
      fullError: errorData,
      errorText
    });
    
    throw new Error(errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage);
  }

  const result = await response.json();
  console.log('✅ 解析文档成功:', result);
  return result;
};

/**
 * 阶段三：获取Markdown内容
 */
export interface MarkdownContentResponse {
  success: boolean;
  data: {
    content: string;
  };
}

export const getMarkdownContent = async (fileId: string): Promise<MarkdownContentResponse> => {
  const response = await fetch(`${MINERU_API_BASE}/markdown/${fileId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '获取Markdown内容失败' }));
    throw new Error(errorData.message || `获取Markdown内容失败: ${response.status}`);
  }

  return await response.json();
};

/**
 * 错误码解释
 */
export const getErrorMessage = (code: number | string): string => {
  const errorMap: { [key: string]: string } = {
    'A0202': 'Token错误，请检查API配置',
    'A0211': 'Token已过期，请更新Token',
    '-500': '传参错误，请检查参数',
    '-10001': '服务异常，请稍后再试',
    '-10002': '请求参数错误',
    '-60001': '生成上传URL失败，请稍后再试',
    '-60002': '文件格式不支持',
    '-60003': '文件读取失败，请检查文件是否损坏',
    '-60004': '空文件，请上传有效文件',
    '-60005': '文件大小超出限制（最大200MB）',
    '-60006': '文件页数超过限制（最多600页）',
    '-60007': '模型服务暂时不可用，请稍后重试',
    '-60008': '文件读取超时，请检查URL可访问性',
    '-60009': '任务提交队列已满，请稍后再试',
    '-60010': '解析失败，请稍后再试',
    '-60011': '获取有效文件失败，请确保文件已上传',
    '-60012': '找不到任务',
    '-60013': '没有权限访问该任务',
    '-60014': '运行中的任务不支持删除',
    '-60015': '文件转换失败，可以手动转为PDF再上传',
    '-60016': '文件转换为指定格式失败，可以尝试其他格式'
  };

  const codeStr = String(code);
  return errorMap[codeStr] || `未知错误 (${code})`;
};

