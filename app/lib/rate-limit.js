// 简单的内存存储，用于记录尝试次数
// 生产环境建议使用 Redis 或数据库
const attemptStore = new Map();

// 清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attemptStore.entries()) {
    if (data.resetAt < now) {
      attemptStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `rate-limit:${identifier}`;
  
  const data = attemptStore.get(key) || {
    attempts: 0,
    resetAt: now + windowMs
  };
  
  // 如果时间窗口已过，重置计数
  if (data.resetAt < now) {
    data.attempts = 0;
    data.resetAt = now + windowMs;
  }
  
  data.attempts += 1;
  attemptStore.set(key, data);
  
  if (data.attempts > maxAttempts) {
    const remainingTime = Math.ceil((data.resetAt - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetInSeconds: remainingTime
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: maxAttempts - data.attempts,
    resetInSeconds: Math.ceil((data.resetAt - now) / 1000)
  };
}

export function resetRateLimit(identifier) {
  const key = `rate-limit:${identifier}`;
  attemptStore.delete(key);
}