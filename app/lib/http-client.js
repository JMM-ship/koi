// 获取 HTTP 代理配置
export function getHttpOptions() {
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  const options = {
    timeout: 30000, // 30 秒超时
  };

  // 如果设置了代理
  if (httpsProxy || httpProxy) {
    const proxyUrl = httpsProxy || httpProxy;
    console.log('[HTTP Client] Using proxy:', proxyUrl);
    
    // 动态导入 https-proxy-agent（如果可用）
    try {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      options.agent = new HttpsProxyAgent(proxyUrl);
    } catch (e) {
      console.warn('[HTTP Client] https-proxy-agent not installed. Install it with: npm install https-proxy-agent');
      console.warn('[HTTP Client] Proxy settings will be ignored.');
    }
  }

  return options;
}