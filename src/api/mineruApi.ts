/**
 * MinerU API 服务
 * 文档解析API接口封装
 */

// 开发环境使用代理，避免 CORS 问题
// 生产环境需要配置后端服务器代理或使用服务端调用
const isDevelopment = import.meta.env.DEV;
const MINERU_API_BASE = isDevelopment 
  ? '/api/mineru'  // 开发环境通过 Vite 代理
  : 'https://mineru.net/api/v4';  // 生产环境（需要后端代理）

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
  const response = await fetch(`${MINERU_API_BASE}/extract/task`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model_version: 'vlm', // 默认使用vlm模型
      ...params
    })
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  return await response.json();
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
 * 错误码解释
 */
export const getErrorMessage = (code: number): string => {
  const errorMap: { [key: number]: string } = {
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

  return errorMap[code] || `未知错误 (${code})`;
};

