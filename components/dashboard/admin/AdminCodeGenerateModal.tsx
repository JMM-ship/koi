"use client";

import { useState } from "react";
import { CodeGenerateRequest } from "@/app/types/admin";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";

interface AdminCodeGenerateModalProps {
  onClose: () => void;
  onSuccess: (codes: string[]) => void;
}

export default function AdminCodeGenerateModal({ onClose, onSuccess }: AdminCodeGenerateModalProps) {
  const { showSuccess, showError, showInfo } = useToast();
  const { t } = useT()
  const [formData, setFormData] = useState<CodeGenerateRequest>({
    codeType: 'credits',
    codeValue: '',
    quantity: 10,
    validDays: 30,
    prefix: 'KOI',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codeValue) {
      setError(t('toasts.pleaseEnterCodeValue') || '请输入卡密值');
      showError(t('toasts.pleaseEnterCodeValue') || 'Please enter code value');
      return;
    }
    
    if (formData.quantity < 1 || formData.quantity > 1000) {
      setError(t('toasts.quantityBetween') || '生成数量必须在1-1000之间');
      showError(t('toasts.quantityBetween') || 'Quantity must be between 1-1000');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedCodes(data.data.codes);
        showSuccess(t('admin.generate.successSummary', { count: data.data.codes.length }) || `Successfully generated ${data.data.codes.length} codes`);
        // 不立即关闭，让用户可以复制卡密
      } else {
        setError(data.error || (t('toasts.failedGenerateCodes') || 'Failed to generate codes'));
        showError(data.error || (t('toasts.failedGenerateCodes') || 'Failed to generate codes'));
      }
    } catch (err) {
      setError(t('toasts.failedGenerateCodes') || 'Failed to generate codes');
      showError(t('toasts.failedGenerateCodes') || 'Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const text = generatedCodes.join('\n');
    
    try {
      // 优先使用 navigator.clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showSuccess(t('toasts.codesCopied') || '卡密已复制到剪贴板');
      } else {
        // 降级方案：使用传统的 execCommand
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showSuccess(t('toasts.codesCopied') || '卡密已复制到剪贴板');
          } else {
            showError(t('toasts.copyFailedManual') || '复制失败，请手动选择复制');
          }
        } catch (err) {
          console.error('复制失败:', err);
          showError(t('toasts.copyFailedManual') || '复制失败，请手动选择复制');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('复制到剪贴板失败:', err);
      // 最后的降级方案：显示文本让用户手动复制
      showError(t('toasts.autoCopyFailed') || '自动复制失败，请手动选择文本复制');
    }
  };

  const downloadCodes = () => {
    const text = generatedCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codes_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(t('toasts.codesDownloaded') || 'Codes downloaded successfully');
  };

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t('admin.generate.title') || '批量生成卡密'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            {generatedCodes.length === 0 ? (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.generate.type') || '卡密类型'}</label>
                      <select 
                        className="form-select"
                        value={formData.codeType}
                        onChange={(e) => setFormData({ ...formData, codeType: e.target.value as 'credits' | 'plan' })}
                      >
                        <option value="credits">{t('admin.generate.credits') || '积分卡'}</option>
                        <option value="plan">{t('admin.generate.plan') || '套餐卡'}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        {formData.codeType === 'credits' ? (t('admin.generate.credits') || '积分数量') : (t('admin.generate.plan') || '套餐类型')}
                      </label>
                      {formData.codeType === 'credits' ? (
                        <input 
                          type="number" 
                          className="form-control" 
                          value={formData.codeValue}
                          onChange={(e) => setFormData({ ...formData, codeValue: e.target.value })}
                          placeholder={t('admin.generate.value') || '输入积分数量'}
                          min="1"
                          required
                        />
                      ) : (
                        <select 
                          className="form-select"
                          value={formData.codeValue}
                          onChange={(e) => setFormData({ ...formData, codeValue: e.target.value })}
                          required
                        >
                          <option value="">{t('admin.generate.plan') || '选择套餐'}</option>
                          <option value="basic">Plus</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Max</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.generate.quantity') || '生成数量'}</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="1000"
                        required
                      />
                      <small className="text-muted">1000 max</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.generate.prefix') || '卡密前缀'}</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.prefix}
                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                        maxLength={10}
                      />
                    </div>
                    {formData.codeType === 'plan' && (
                      <div className="col-md-4">
                        <label className="form-label">{t('admin.generate.validDays') || '有效天数'}</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={formData.validDays}
                          onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 30 })}
                          min="1"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('admin.generate.notes') || '备注（可选）'}</label>
                    <textarea 
                      className="form-control" 
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="输入备注信息..."
                    />
                  </div>

                  <div className="alert alert-info" role="alert">
                    <strong>{t('admin.generate.tips.title') || '提示：'}</strong>
                    <ul className="mb-0">
                      <li>{t('admin.generate.tips.t1') || '积分卡可用于增加用户积分余额'}</li>
                      <li>{t('admin.generate.tips.t2') || '套餐卡可用于升级用户套餐'}</li>
                      <li>{t('admin.generate.tips.t3') || '生成的卡密将自动保存到数据库'}</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    {t('admin.generate.cancel') || '取消'}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (t('admin.generate.generating') || '生成中...') : (t('admin.generate.submit') || '生成卡密')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body">
                  <div className="alert alert-success" role="alert">
                    {(t('admin.generate.successSummary', { count: generatedCodes.length }) || `成功生成 ${generatedCodes.length} 个卡密！`)}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">{t('admin.generate.listLabel') || '生成的卡密列表'}</label>
                    <div 
                      className="border rounded p-3" 
                      style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        backgroundColor: '#f8f9fa',
                        userSelect: 'text',
                        cursor: 'text'
                      }}
                    >
                      <textarea
                        className="form-control font-monospace border-0 bg-transparent"
                        value={generatedCodes.join('\n')}
                        readOnly
                        rows={10}
                        style={{ 
                          resize: 'none',
                          userSelect: 'text',
                          cursor: 'text'
                        }}
                        onClick={(e) => {
                          e.currentTarget.select();
                        }}
                      />
                    </div>
                    <small className="text-muted">{t('admin.generate.hintSelectAll') || '提示：点击文本框可全选内容，支持手动复制'}</small>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={copyToClipboard}
                    >
                      {t('admin.generate.copy') || '复制到剪贴板'}
                    </button>
                    <button 
                      className="btn btn-outline-success"
                      onClick={downloadCodes}
                    >
                      {t('admin.generate.download') || '下载为文本文件'}
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => {
                      onSuccess(generatedCodes);
                      onClose();
                    }}
                  >
                    {t('admin.generate.done') || '完成'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
