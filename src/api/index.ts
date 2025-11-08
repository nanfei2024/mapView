import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 尝试依次请求多个URL，返回第一个成功的响应。
 * @param urls URL数组
 * @param config axios配置
 */
export async function tryFetch<T = any>(urls: string[], config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  let lastError: any = null;
  for (const url of urls) {
    try {
      const response = await axios.get<T>(url, config);
      return response;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('所有API路径尝试失败');
}
