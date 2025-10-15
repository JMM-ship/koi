"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { FiCopy, FiX, FiChevronDown, FiChevronUp, FiCode, FiInfo } from "react-icons/fi";

/**
 * 调试面板组件
 * 用于收集和复制页面数据，方便调试
 * 生产环境可以通过注释掉组件引用来禁用
 */
export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debugData, setDebugData] = useState<any>({});
  const [consoleErrors, setConsoleErrors] = useState<any[]>([]);
  
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 捕获控制台错误
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args) => {
      // 避免重复记录相同的错误
      setConsoleErrors(prev => {
        const newError = {
          type: 'error',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
        };
        
        // 检查是否已存在相同的错误消息（忽略时间戳）
        const exists = prev.some(err => err.message === newError.message && err.type === newError.type);
        if (exists) {
          return prev;
        }
        
        // 限制错误数量，最多保留最近的20个
        const updated = [...prev, newError];
        return updated.slice(-20);
      });
      originalError.apply(console, args);
    };
    
    // 捕获未处理的错误
    const handleError = (event: ErrorEvent) => {
      setConsoleErrors(prev => {
        const newError = {
          type: 'uncaught',
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          timestamp: new Date().toISOString(),
        };
        
        // 检查是否已存在相同的错误
        const exists = prev.some(err => 
          err.message === newError.message && 
          err.filename === newError.filename &&
          err.line === newError.line
        );
        if (exists) {
          return prev;
        }
        
        // 限制错误数量
        const updated = [...prev, newError];
        return updated.slice(-20);
      });
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
    };
  }, []);

  // 收集调试数据
  useEffect(() => {
    const collectDebugData = () => {
      const data = {
        // 基本信息
        timestamp: new Date().toISOString(),
        url: window.location.href,
        pathname: pathname,
        searchParams: Object.fromEntries(searchParams.entries()),
        
        // 用户信息
        user: {
          isLoggedIn: !!session,
          sessionStatus: sessionStatus,
          email: session?.user?.email || null,
          role: session?.user?.role || null,
          uuid: session?.user?.uuid || null,
          name: session?.user?.name || null,
        },
        
        // 浏览器信息
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
        },
        
        // localStorage 数据（过滤敏感信息）
        localStorage: (() => {
          const items: any = {};
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && !key.includes('token') && !key.includes('secret')) {
                items[key] = localStorage.getItem(key);
              }
            }
          } catch (e) {
            items.error = 'Unable to access localStorage';
          }
          return items;
        })(),
        
        // sessionStorage 数据（过滤敏感信息）
        sessionStorage: (() => {
          const items: any = {};
          try {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && !key.includes('token') && !key.includes('secret')) {
                items[key] = sessionStorage.getItem(key);
              }
            }
          } catch (e) {
            items.error = 'Unable to access sessionStorage';
          }
          return items;
        })(),
        
        // 页面性能数据
        performance: (() => {
          if (typeof window !== 'undefined' && window.performance) {
            const perfData = window.performance.getEntriesByType('navigation')[0] as any;
            return {
              loadTime: perfData?.loadEventEnd - perfData?.fetchStart,
              domReady: perfData?.domContentLoadedEventEnd - perfData?.fetchStart,
              resourceCount: window.performance.getEntriesByType('resource').length,
            };
          }
          return null;
        })(),
        
        // DOM 信息
        dom: {
          title: document.title,
          referrer: document.referrer,
          cookie: document.cookie ? 'Cookies present (hidden for security)' : 'No cookies',
          readyState: document.readyState,
        },
        
        // React/Next.js 特定信息
        framework: {
          nextjsVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
          nodeEnv: process.env.NODE_ENV,
          publicUrl: process.env.NEXT_PUBLIC_WEB_URL,
          projectName: process.env.NEXT_PUBLIC_PROJECT_NAME,
        },
        
        // 错误信息（如果有）
        errors: consoleErrors,
        
        // 额外的调试信息
        debug: {
          componentMounted: true,
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: window.screen.orientation?.type,
          },
          network: {
            online: navigator.onLine,
            connection: (navigator as any).connection?.effectiveType,
            downlink: (navigator as any).connection?.downlink,
          },
          memory: (performance as any).memory ? {
            usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1048576) + 'MB',
            totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1048576) + 'MB',
            limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576) + 'MB',
          } : null,
        },
      };
      
      return data;
    };
    
    setDebugData(collectDebugData());
  }, [session, sessionStatus, pathname, searchParams]);

  // 复制调试数据
  const copyDebugData = async () => {
    try {
      const dataString = JSON.stringify(debugData, null, 2);
      await navigator.clipboard.writeText(dataString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy debug data:', error);
      // 降级方案：创建临时文本区域
      const textarea = document.createElement('textarea');
      textarea.value = JSON.stringify(debugData, null, 2);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 开发环境才显示（可以根据需要调整条件）
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }

  return (
    <>
      {/* 浮动按钮 */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            title="打开调试面板"
          >
            <FiCode size={24} />
          </button>
        )}
      </div>

      {/* 调试面板 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 面板头部 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f9fafb',
              borderRadius: '8px 8px 0 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCode size={20} color="#6366f1" />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>调试面板</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                }}
                title={isExpanded ? '收起' : '展开'}
              >
                {isExpanded ? <FiChevronDown size={18} /> : <FiChevronUp size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                }}
                title="关闭"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* 面板内容 */}
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              display: isExpanded ? 'none' : 'block',
            }}
          >
            {/* 快速信息 */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                快速信息
              </h4>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                <div>📍 路径: {pathname}</div>
                <div>👤 用户: {session?.user?.email || '未登录'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔑 角色: {session?.user?.role || 'N/A'}
                  {session?.user?.role === 'user' && (
                    <span style={{ color: '#f59e0b', fontSize: '11px' }}>
                      (需要重新登录刷新权限)
                    </span>
                  )}
                  {session?.user?.role === 'admin' && (
                    <span style={{ color: '#10b981', fontSize: '11px' }}>
                      ✓ 管理员
                    </span>
                  )}
                </div>
                <div>🌐 状态: {sessionStatus}</div>
                <div>⏰ 时间: {new Date().toLocaleString('zh-CN')}</div>
                {consoleErrors.length > 0 && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>⚠️ 错误: {consoleErrors.length} 个</span>
                    <button
                      onClick={() => setConsoleErrors([])}
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 数据预览 */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                数据预览
              </h4>
              <pre
                style={{
                  fontSize: '10px',
                  backgroundColor: '#f3f4f6',
                  padding: '8px',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  margin: 0,
                }}
              >
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>

            {/* 操作按钮 */}
            <button
              onClick={copyDebugData}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: copied ? '#10b981' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.3s ease',
              }}
            >
              <FiCopy size={16} />
              {copied ? '已复制到剪贴板!' : '复制调试数据'}
            </button>

            {/* 提示信息 */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#92400e',
              }}
            >
              💡 提示：调试数据已过滤敏感信息，可安全分享用于调试。
            </div>
            
            {/* 角色提示 */}
            {session?.user?.role === 'user' && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#991b1b',
                }}
              >
                ⚠️ 注意：数据库中您的角色已是管理员，但session缓存仍是普通用户。
                <a 
                  href="/api/auth/signout?callbackUrl=/auth/signin"
                  style={{ 
                    color: '#dc2626', 
                    textDecoration: 'underline',
                    marginLeft: '4px',
                    fontWeight: 600,
                  }}
                >
                  点击重新登录
                </a>
                以刷新权限。
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}