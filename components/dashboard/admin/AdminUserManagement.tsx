"use client";

import { useEffect, useState } from "react";
import AdminGuard from "./AdminGuard";
import { AdminUser, PaginatedResponse } from "@/app/types/admin";
import { formatUserStatus, formatPlanType } from "@/app/lib/admin/utils";
import AdminUserEditModal from "./AdminUserEditModal";
import AdminCreditAdjustModal from "./AdminCreditAdjustModal";
import { FiEdit, FiDollarSign, FiSearch, FiRefreshCw } from "react-icons/fi";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // 搜索和筛选
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  
  // 模态框
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [creditUser, setCreditUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter, planFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan_type', planFilter);
      
      const response = await fetch(`/api/admin/users?${params}`);
      const data: PaginatedResponse<AdminUser> = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <AdminGuard>
      <div className="admin-user-management">
        <div className="content-header mb-4">
          <h2 className="content-title">用户管理</h2>
          <p className="text-muted">管理所有用户账户和权限</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="搜索邮箱或UUID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <FiSearch />
                    </button>
                  </div>
                </div>
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">所有状态</option>
                    <option value="active">正常</option>
                    <option value="suspended">暂停</option>
                    <option value="deleted">已删除</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                  >
                    <option value="">所有套餐</option>
                    <option value="free">免费版</option>
                    <option value="basic">基础版</option>
                    <option value="pro">专业版</option>
                    <option value="enterprise">企业版</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      setPlanFilter('');
                      fetchUsers();
                    }}
                  >
                    <FiRefreshCw className="me-2" />
                    重置
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>用户ID</th>
                        <th>邮箱</th>
                        <th>昵称</th>
                        <th>角色</th>
                        <th>状态</th>
                        <th>套餐</th>
                        <th>积分</th>
                        <th>到期时间</th>
                        <th>注册时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const statusInfo = formatUserStatus(user.status);
                        const planInfo = formatPlanType(user.planType);
                        
                        return (
                          <tr key={user.id}>
                            <td>
                              <small className="text-muted">
                                {user.uuid.substring(0, 8)}...
                              </small>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.nickname || '-'}</td>
                            <td>
                              <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}`}>
                                {user.role === 'admin' ? '管理员' : '用户'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${planInfo.color}`}>
                                {planInfo.label}
                              </span>
                            </td>
                            <td>{user.totalCredits}</td>
                            <td>{formatDate(user.planExpiredAt)}</td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => setEditUser(user)}
                                  title="编辑用户"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => setCreditUser(user)}
                                  title="调整积分"
                                >
                                  <FiDollarSign />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {pagination.totalPages > 1 && (
                  <nav className="mt-4">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          上一页
                        </button>
                      </li>
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          下一页
                        </button>
                      </li>
                    </ul>
                    <div className="text-center text-muted">
                      第 {pagination.page} 页，共 {pagination.totalPages} 页，总计 {pagination.total} 条记录
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>

        {/* 编辑用户模态框 */}
        {editUser && (
          <AdminUserEditModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSuccess={() => {
              setEditUser(null);
              fetchUsers();
            }}
          />
        )}

        {/* 积分调整模态框 */}
        {creditUser && (
          <AdminCreditAdjustModal
            user={creditUser}
            onClose={() => setCreditUser(null)}
            onSuccess={() => {
              setCreditUser(null);
              fetchUsers();
            }}
          />
        )}
      </div>
    </AdminGuard>
  );
}