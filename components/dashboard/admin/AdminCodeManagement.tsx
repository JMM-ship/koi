"use client";

import { useEffect, useState } from "react";
import AdminGuard from "./AdminGuard";
import { RedemptionCode, PaginatedResponse } from "@/app/types/admin";
import { formatCodeStatus, formatCodeType } from "@/app/lib/admin/utils";
import AdminCodeGenerateModal from "./AdminCodeGenerateModal";
import { FiPlus, FiSearch, FiRefreshCw, FiDownload, FiX } from "react-icons/fi";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useConfirm } from "@/hooks/useConfirm";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AdminCodeManagement() {
  const { showSuccess, showError } = useToast();
  const { t } = useT()
  const { confirmState, showConfirm } = useConfirm();
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
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
  const [typeFilter, setTypeFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  
  // 模态框
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, [pagination.page, statusFilter, typeFilter, batchFilter]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('code_type', typeFilter);
      if (batchFilter) params.append('batch_id', batchFilter);
      
      const response = await fetch(`/api/admin/codes?${params}`);
      const data: PaginatedResponse<RedemptionCode> = await response.json();
      
      if (data.success) {
        setCodes(data.data);
        setPagination(data.pagination);
      } else {
        setError(t('toasts.failedFetchCodesList') || 'Failed to fetch codes');
        showError(t('toasts.failedFetchCodesList') || 'Failed to fetch codes list');
      }
    } catch (err) {
      setError(t('toasts.failedFetchCodesList') || 'Failed to fetch codes');
      showError(t('toasts.failedFetchCodesList') || 'Failed to fetch codes list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCodes();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (code: string, newStatus: 'active' | 'cancelled') => {
    showConfirm(
      (newStatus === 'cancelled' ? (t('admin.codes.confirm.cancel') || 'Are you sure you want to cancel this code?') : (t('admin.codes.confirm.activate') || 'Are you sure you want to activate this code?')),
      async () => {
        try {
          const response = await fetch(`/api/admin/codes/${code}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });

          const data = await response.json();
          
          if (data.success) {
            showSuccess(newStatus === 'cancelled' ? (t('toasts.codeCancelledSuccess') || 'Code cancelled successfully') : (t('toasts.codeActivatedSuccess') || 'Code activated successfully'));
            fetchCodes();
          } else {
            showError(data.error || (t('toasts.failedUpdateCodeStatus') || 'Failed to update code status'));
          }
        } catch (err) {
          showError(t('toasts.failedUpdateCodeStatus') || 'Failed to update code status');
        }
      }
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(undefined);
  };

  const exportCodes = () => {
    // 生成CSV内容
    const headers = [t('admin.codes.table.code')||'卡密编码', t('admin.codes.table.type')||'类型', t('admin.codes.table.value')||'值', t('admin.codes.table.status')||'状态', t('admin.codes.table.batchId')||'批次ID', t('admin.codes.table.createdAt')||'创建时间', t('admin.codes.table.usedAt')||'使用时间', t('admin.codes.table.usedBy')||'使用者'];
    const rows = codes.map(code => [
      code.code,
      formatCodeType(code.codeType),
      code.codeValue,
      formatCodeStatus(code.status).label,
      code.batchId || '',
      formatDate(code.createdAt),
      formatDate(code.usedAt),
      code.usedBy || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    // 下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(t('toasts.codesListExported') || 'Codes list exported successfully');
  };

  return (
    <AdminGuard>
      <div className="admin-code-management">
        <div className="content-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="content-title">{t('admin.codes.title') || '卡密管理'}</h2>
              <p className="text-muted mb-0">{t('admin.codes.subtitle') || '生成和管理兑换卡密'}</p>
            </div>
            <div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowGenerateModal(true)}
              >
                <FiPlus className="me-2" />
                {t('admin.codes.generate') || '生成卡密'}
              </button>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('admin.codes.searchPlaceholder') || '搜索卡密编码...'}
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
                    <option value="">{t('common.all') || '所有状态'}</option>
                    <option value="active">{t('common.unused') || '未使用'}</option>
                    <option value="used">{t('common.used') || '已使用'}</option>
                    <option value="expired">{t('common.expired') || '已过期'}</option>
                    <option value="cancelled">{t('common.cancelled') || '已作废'}</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">{t('common.allTypes') || '所有类型'}</option>
                    <option value="credits">{t('admin.generate.credits') || '积分卡'}</option>
                    <option value="plan">{t('admin.generate.plan') || '套餐卡'}</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="批次ID"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <div className="btn-group w-100" role="group">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('');
                        setTypeFilter('');
                        setBatchFilter('');
                        fetchCodes();
                      }}
                    >
                      <FiRefreshCw className="me-2" />
                      {t('admin.codes.reset') || '重置'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-success"
                      onClick={exportCodes}
                      disabled={codes.length === 0}
                    >
                      <FiDownload className="me-2" />
                      {t('admin.codes.export') || '导出'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* 卡密列表 */}
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
                        <th>{t('admin.codes.table.code') || '卡密编码'}</th>
                        <th>{t('admin.codes.table.type') || '类型'}</th>
                        <th>{t('admin.codes.table.value') || '值'}</th>
                        <th>{t('admin.codes.table.status') || '状态'}</th>
                        <th>{t('admin.codes.table.batchId') || '批次ID'}</th>
                        <th>{t('admin.codes.table.createdAt') || '创建时间'}</th>
                        <th>{t('admin.codes.table.usedAt') || '使用时间'}</th>
                        <th>{t('admin.codes.table.usedBy') || '使用者'}</th>
                        <th>{t('admin.codes.table.actions') || '操作'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((code) => {
                        const statusInfo = formatCodeStatus(code.status);
                        
                        return (
                          <tr key={code.id}>
                            <td>
                              <code>{code.code}</code>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {formatCodeType(code.codeType)}
                              </span>
                            </td>
                            <td>
                              {code.codeType === 'credits' 
                                ? `${code.codeValue} ${(t('packages.credits') || '积分')}`
                                : code.codeValue
                              }
                            </td>
                            <td>
                              <span className={`badge bg-${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td>
                              {code.batchId ? (
                                <small className="text-muted">
                                  {code.batchId.substring(0, 20)}...
                                </small>
                              ) : '-'}
                            </td>
                            <td>{formatDate(code.createdAt)}</td>
                            <td>{formatDate(code.usedAt)}</td>
                            <td>
                              {code.usedBy ? (
                                <small className="text-muted">
                                  {code.usedBy.substring(0, 8)}...
                                </small>
                              ) : '-'}
                            </td>
                            <td>
                              {code.status === 'active' && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleStatusUpdate(code.code, 'cancelled')}
                                  title={t('admin.codes.confirm.cancel') || '作废卡密'}
                                >
                                  <FiX />
                                </button>
                              )}
                              {code.status === 'cancelled' && (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleStatusUpdate(code.code, 'active')}
                                  title={t('admin.codes.confirm.activate') || '激活卡密'}
                                >
                                  ✓
                                </button>
                              )}
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
                          {t('admin.codes.prev') || '上一页'}
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
                          {t('admin.codes.next') || '下一页'}
                        </button>
                      </li>
                    </ul>
                    <div className="text-center text-muted">
                      {(t('admin.codes.pageInfo', { page: pagination.page, pages: pagination.totalPages, total: pagination.total }) || `第 ${pagination.page} 页，共 ${pagination.totalPages} 页，总计 ${pagination.total} 条记录`)}
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>

        {/* 生成卡密模态框 */}
        {showGenerateModal && (
          <AdminCodeGenerateModal
            onClose={() => setShowGenerateModal(false)}
            onSuccess={() => {
              setShowGenerateModal(false);
              fetchCodes();
            }}
          />
        )}
      </div>
      <ConfirmDialog {...confirmState} />
    </AdminGuard>
  );
}
