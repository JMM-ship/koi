"use client";

import { useState } from "react";
import { AdminUser } from "@/app/types/admin";

interface AdminCreditAdjustModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminCreditAdjustModal({ user, onClose, onSuccess }: AdminCreditAdjustModalProps) {
  const [formData, setFormData] = useState({
    action: 'add' as 'add' | 'subtract' | 'set',
    amount: 0,
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      setError('积分数量必须大于0');
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('请填写调整原因');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.uuid}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to adjust credits');
      }
    } catch (err) {
      setError('Failed to adjust credits');
    } finally {
      setLoading(false);
    }
  };

  const getNewBalance = () => {
    switch (formData.action) {
      case 'add':
        return user.totalCredits + formData.amount;
      case 'subtract':
        return Math.max(0, user.totalCredits - formData.amount);
      case 'set':
        return formData.amount;
      default:
        return user.totalCredits;
    }
  };

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">调整用户积分</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label">用户信息</label>
                  <div className="form-control-plaintext">
                    <strong>{user.email}</strong>
                    <br />
                    <small className="text-muted">当前积分：{user.totalCredits}</small>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">操作类型</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="action" 
                        id="actionAdd" 
                        value="add"
                        checked={formData.action === 'add'}
                        onChange={(e) => setFormData({ ...formData, action: 'add' })}
                      />
                      <label className="form-check-label" htmlFor="actionAdd">
                        增加积分
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="action" 
                        id="actionSubtract" 
                        value="subtract"
                        checked={formData.action === 'subtract'}
                        onChange={(e) => setFormData({ ...formData, action: 'subtract' })}
                      />
                      <label className="form-check-label" htmlFor="actionSubtract">
                        减少积分
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="action" 
                        id="actionSet" 
                        value="set"
                        checked={formData.action === 'set'}
                        onChange={(e) => setFormData({ ...formData, action: 'set' })}
                      />
                      <label className="form-check-label" htmlFor="actionSet">
                        设置积分
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">积分数量</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                  <small className="text-muted">
                    调整后积分：<strong>{getNewBalance()}</strong>
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">调整原因</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="请输入调整原因..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '处理中...' : '确认调整'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}