'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ToastDemoPage() {
  const { 
    showMessage, 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning, 
    showLoading, 
    showPromise,
    dismiss 
  } = useToast();
  const { confirmState, showConfirm } = useConfirm();
  
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 模拟异步操作
  const mockAsyncOperation = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve('操作成功完成');
        } else {
          reject('操作失败');
        }
      }, 2000);
    });
  };

  const handleBasicMessage = () => {
    showMessage('这是一条基础消息');
  };

  const handleSuccess = () => {
    showSuccess('操作成功完成！');
  };

  const handleError = () => {
    showError('发生了错误，请稍后重试');
  };

  const handleInfo = () => {
    showInfo('这是一条信息提示');
  };

  const handleWarning = () => {
    showWarning('请注意，这是一条警告信息');
  };

  const handleLoading = () => {
    const id = showLoading('正在处理，请稍候...');
    setLoadingId(id);
    
    setTimeout(() => {
      dismiss(id);
      showSuccess('处理完成！');
      setLoadingId(null);
    }, 3000);
  };

  const handlePromise = () => {
    showPromise(
      mockAsyncOperation(),
      {
        loading: '正在执行操作...',
        success: (data) => `成功: ${data}`,
        error: (err) => `错误: ${err}`,
      }
    );
  };

  const handleConfirm = () => {
    showConfirm(
      '您确定要执行这个操作吗？',
      () => {
        showSuccess('操作已确认');
      },
      () => {
        showInfo('操作已取消');
      }
    );
  };

  const handleMultiple = () => {
    showInfo('第一条消息');
    setTimeout(() => showWarning('第二条消息'), 500);
    setTimeout(() => showSuccess('第三条消息'), 1000);
    setTimeout(() => showError('第四条消息'), 1500);
  };

  const handleDismissAll = () => {
    dismiss();
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Toast 消息提示演示</h1>
          <p className="text-muted mb-4">类似 Ant Design 的 message 组件效果，使用 react-hot-toast 实现</p>
          
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-4">基础消息类型</h5>
              
              <div className="d-flex flex-wrap gap-3 mb-4">
                <button className="btn btn-outline-secondary" onClick={handleBasicMessage}>
                  <i className="bi bi-chat-dots me-2"></i>
                  基础消息
                </button>
                
                <button className="btn btn-success" onClick={handleSuccess}>
                  <i className="bi bi-check-circle me-2"></i>
                  成功提示
                </button>
                
                <button className="btn btn-danger" onClick={handleError}>
                  <i className="bi bi-x-circle me-2"></i>
                  错误提示
                </button>
                
                <button className="btn btn-info" onClick={handleInfo}>
                  <i className="bi bi-info-circle me-2"></i>
                  信息提示
                </button>
                
                <button className="btn btn-warning" onClick={handleWarning}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  警告提示
                </button>
              </div>

              <h5 className="card-title mb-4">高级功能</h5>
              
              <div className="d-flex flex-wrap gap-3 mb-4">
                <button className="btn btn-primary" onClick={handleLoading} disabled={!!loadingId}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  加载状态
                </button>
                
                <button className="btn btn-primary" onClick={handlePromise}>
                  <i className="bi bi-hourglass-split me-2"></i>
                  Promise 状态
                </button>
                
                <button className="btn btn-primary" onClick={handleConfirm}>
                  <i className="bi bi-question-circle me-2"></i>
                  确认对话框
                </button>
                
                <button className="btn btn-secondary" onClick={handleMultiple}>
                  <i className="bi bi-stack me-2"></i>
                  多个消息
                </button>
                
                <button className="btn btn-outline-danger" onClick={handleDismissAll}>
                  <i className="bi bi-x-lg me-2"></i>
                  清除所有
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title mb-4">使用说明</h5>
              <pre className="bg-light p-3 rounded overflow-auto">
{`import { useToast } from '@/hooks/useToast';

const { 
  showMessage,    // 基础消息
  showSuccess,    // 成功提示
  showError,      // 错误提示
  showInfo,       // 信息提示
  showWarning,    // 警告提示
  showLoading,    // 加载状态
  showPromise,    // Promise处理
  dismiss         // 关闭消息
} = useToast();

const { showConfirm } = useConfirm(); // 确认对话框使用独立的hook

// 基础用法
showSuccess('操作成功');
showError('操作失败');

// 加载状态
const id = showLoading('正在加载...');
// 稍后关闭
dismiss(id);

// Promise处理
showPromise(
  fetchData(),
  {
    loading: '正在获取数据...',
    success: '数据获取成功',
    error: '数据获取失败'
  }
);

// 确认对话框（使用独立的 useConfirm hook）
const { showConfirm } = useConfirm();
showConfirm(
  '确认删除？',
  () => console.log('已确认'),
  () => console.log('已取消')
);`}
              </pre>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title mb-4">特性</h5>
              <ul>
                <li>✨ 轻量级，优雅的动画效果</li>
                <li>🎨 可自定义样式和位置</li>
                <li>⏱️ 自动消失（可配置时长）</li>
                <li>🔄 支持 Promise 状态处理</li>
                <li>📱 响应式设计，移动端友好</li>
                <li>🎯 支持多个消息堆叠显示</li>
                <li>🔥 热更新，无需刷新页面</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog {...confirmState} />
    </div>
  );
}