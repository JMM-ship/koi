"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/auth/refresh-session');
      const data = await response.json();
      
      if (data.success) {
        // 更新 session
        await update();
        showSuccess('权限已更新，请刷新页面');
        // 刷新页面以应用新的权限
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showError('刷新权限失败');
      }
    } catch (error) {
      showError('刷新权限失败');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 加载中显示
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // 非管理员显示提示
  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">需要管理员权限</h4>
          <p>您当前没有访问此页面的权限。</p>
          <hr />
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  刷新权限中...
                </>
              ) : (
                '刷新权限'
              )}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard')}
            >
              返回仪表板
            </button>
            <button 
              className="btn btn-warning"
              onClick={() => router.push('/auth/signin')}
            >
              重新登录
            </button>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              提示：如果您的管理员权限刚刚被授予，请点击"刷新权限"按钮或重新登录。
            </small>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}