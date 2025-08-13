"use client";

import { useState } from "react";
import { CodeGenerateRequest } from "@/app/types/admin";

interface AdminCodeGenerateModalProps {
  onClose: () => void;
  onSuccess: (codes: string[]) => void;
}

export default function AdminCodeGenerateModal({ onClose, onSuccess }: AdminCodeGenerateModalProps) {
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
      setError('请输入卡密值');
      return;
    }
    
    if (formData.quantity < 1 || formData.quantity > 1000) {
      setError('生成数量必须在1-1000之间');
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
        // 不立即关闭，让用户可以复制卡密
      } else {
        setError(data.error || 'Failed to generate codes');
      }
    } catch (err) {
      setError('Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = generatedCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('卡密已复制到剪贴板');
    });
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
  };

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">批量生成卡密</h5>
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
                      <label className="form-label">卡密类型</label>
                      <select 
                        className="form-select"
                        value={formData.codeType}
                        onChange={(e) => setFormData({ ...formData, codeType: e.target.value as 'credits' | 'plan' })}
                      >
                        <option value="credits">积分卡</option>
                        <option value="plan">套餐卡</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        {formData.codeType === 'credits' ? '积分数量' : '套餐类型'}
                      </label>
                      {formData.codeType === 'credits' ? (
                        <input 
                          type="number" 
                          className="form-control" 
                          value={formData.codeValue}
                          onChange={(e) => setFormData({ ...formData, codeValue: e.target.value })}
                          placeholder="输入积分数量"
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
                          <option value="">选择套餐</option>
                          <option value="basic">基础版</option>
                          <option value="pro">专业版</option>
                          <option value="enterprise">企业版</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">生成数量</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="1000"
                        required
                      />
                      <small className="text-muted">最多生成1000个</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">卡密前缀</label>
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
                        <label className="form-label">有效天数</label>
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
                    <label className="form-label">备注（可选）</label>
                    <textarea 
                      className="form-control" 
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="输入备注信息..."
                    />
                  </div>

                  <div className="alert alert-info" role="alert">
                    <strong>提示：</strong>
                    <ul className="mb-0">
                      <li>积分卡可用于增加用户积分余额</li>
                      <li>套餐卡可用于升级用户套餐</li>
                      <li>生成的卡密将自动保存到数据库</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '生成中...' : '生成卡密'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body">
                  <div className="alert alert-success" role="alert">
                    成功生成 {generatedCodes.length} 个卡密！
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">生成的卡密列表</label>
                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                      {generatedCodes.map((code, index) => (
                        <div key={index} className="font-monospace">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={copyToClipboard}
                    >
                      复制到剪贴板
                    </button>
                    <button 
                      className="btn btn-outline-success"
                      onClick={downloadCodes}
                    >
                      下载为文本文件
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
                    完成
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