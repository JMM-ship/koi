"use client";

import { useState } from "react";
import { AdminUser } from "@/app/types/admin";

interface AdminUserEditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminUserEditModal({ user, onClose, onSuccess }: AdminUserEditModalProps) {
  const [formData, setFormData] = useState({
    status: user.status,
    planType: user.planType,
    planExpiredAt: user.planExpiredAt ? new Date(user.planExpiredAt).toISOString().split('T')[0] : '',
    role: user.role,
    nickname: user.nickname || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          planExpiredAt: formData.planExpiredAt ? new Date(formData.planExpiredAt).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">编辑用户信息</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">用户邮箱</label>
                    <input type="text" className="form-control" value={user.email} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">用户UUID</label>
                    <input type="text" className="form-control" value={user.id} disabled />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">昵称</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">角色</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                    >
                      <option value="user">用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">账户状态</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AdminUser['status'] })}
                    >
                      <option value="active">正常</option>
                      <option value="suspended">暂停</option>
                      <option value="deleted">已删除</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">套餐类型</label>
                    <select
                      className="form-select"
                      value={formData.planType}
                      onChange={(e) => setFormData({ ...formData, planType: e.target.value as AdminUser['planType'] })}
                    >
                      <option value="free">免费版</option>
                      <option value="basic">基础版</option>
                      <option value="pro">专业版</option>
                      <option value="enterprise">企业版</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">套餐到期时间</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.planExpiredAt}
                      onChange={(e) => setFormData({ ...formData, planExpiredAt: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">当前积分</label>
                    <input type="text" className="form-control" value={user.totalCredits} disabled />
                    <small className="text-muted">积分调整请使用单独的积分管理功能</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}