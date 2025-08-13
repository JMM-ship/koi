/**
 * 调试配置文件
 * 控制调试面板的显示和行为
 */

export const debugConfig = {
  // 是否启用调试面板
  enabled: true, // 生产环境设置为 false 或直接注释掉 DebugProvider
  
  // 只在开发环境显示
  developmentOnly: false, // 设置为 true 则只在开发环境显示
  
  // 允许通过URL参数控制 (例如: ?debug=true)
  allowUrlParam: true,
  
  // 调试面板的热键 (例如: Ctrl+Shift+D)
  hotkey: 'ctrl+shift+d',
  
  // 默认展开状态
  defaultExpanded: false,
  
  // 要排除的敏感字段
  excludeFields: [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
  ],
  
  // 自定义数据收集器
  customCollectors: {
    // 可以添加自定义的数据收集函数
    // example: () => ({ customData: 'value' })
  },
};

/**
 * 检查是否应该显示调试面板
 */
export function shouldShowDebugPanel(): boolean {
  // 如果禁用，直接返回 false
  if (!debugConfig.enabled) {
    return false;
  }
  
  // 如果只在开发环境显示
  if (debugConfig.developmentOnly && process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // 检查URL参数（仅在客户端）
  if (typeof window !== 'undefined' && debugConfig.allowUrlParam) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      return true;
    }
    if (urlParams.get('debug') === 'false') {
      return false;
    }
  }
  
  return true;
}