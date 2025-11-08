const BASE_URL = 'http://localhost:8080';

async function handleApiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.success) {
      const err = new Error(data.message || '操作失败');
      // @ts-ignore
      err.detail = data.detail;
      throw err;
    }
    return data;
  } catch (error) {
    // 统一输出错误
    console.error('[API错误]', error);
    throw error;
  }
}

export const plateRegionApi = {
  importSingle(file: File, level: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', String(level));
    return handleApiRequest(`${BASE_URL}/api/shp-import/single`, {
      method: 'POST', body: formData
    });
  },
  importBatch(files: File[], levelSettings: Record<string, number>) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('levelSettings', JSON.stringify(levelSettings));
    return handleApiRequest(`${BASE_URL}/api/shp-import/batch`, {
      method: 'POST', body: formData
    });
  },
  getImportStatus() {
    return handleApiRequest(`${BASE_URL}/api/shp-import/status`);
  },
  clearLevel(level: number) {
    return handleApiRequest(`${BASE_URL}/api/shp-import/level/${level}`, { method: 'DELETE' });
  },
  clearAll() {
    return handleApiRequest(`${BASE_URL}/api/shp-import/all`, { method: 'DELETE' });
  },
  getGeoJsonByLevel(level: number) {
    // 直接返回GeoJSON，不用handleApiRequest
    return fetch(`${BASE_URL}/api/map-regions/level/${level}/geojson`).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    });
  },
  getStatistics() {
    return handleApiRequest(`${BASE_URL}/api/map-regions/statistics`);
  }
}; 