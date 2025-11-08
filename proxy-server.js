/**
 * 简单的代理服务器 - 解决 CORS 问题
 * 使用 Node.js + Express
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// 允许所有跨域请求
app.use(cors());

// 代理 ZIP 文件下载
app.get('/proxy/download', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少 URL 参数' });
    }
    
    console.log('📥 代理下载请求:', url);
    
    // 从 MinerU OSS 下载文件
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'application/zip';
    const contentLength = response.headers.get('content-length');
    
    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // 流式传输文件
    response.body.pipe(res);
    
    console.log('✅ 代理下载完成');
    
  } catch (error) {
    console.error('❌ 代理下载失败:', error);
    res.status(500).json({ 
      error: '代理下载失败', 
      message: error.message 
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CORS 代理服务器运行中' });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 使用方式: http://localhost:${PORT}/proxy/download?url=<ZIP文件URL>`);
});


