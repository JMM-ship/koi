"use client";

import { useEffect, useState } from "react";
import AdminGuard from "./AdminGuard";
import { AdminStats } from "@/app/types/admin";
import { FiUsers, FiShoppingCart, FiKey, FiDollarSign } from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 100); // 假设金额以分为单位存储
  };

  return (
    <AdminGuard>
      <div className="admin-dashboard">
        <div className="content-header mb-4">
          <h2 className="content-title">管理员仪表板</h2>
          <p className="text-muted">系统概览和统计数据</p>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div>
            {/* 用户统计 */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-primary bg-opacity-10 rounded">
                          <FiUsers className="text-primary fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">总用户数</p>
                        <h4 className="mb-0">{formatNumber(stats.users.total)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-success bg-opacity-10 rounded">
                          <FiUsers className="text-success fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">活跃用户</p>
                        <h4 className="mb-0">{formatNumber(stats.users.active)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-info bg-opacity-10 rounded">
                          <FiUsers className="text-info fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">今日新增</p>
                        <h4 className="mb-0">{formatNumber(stats.users.newToday)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-warning bg-opacity-10 rounded">
                          <FiUsers className="text-warning fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">本周新增</p>
                        <h4 className="mb-0">{formatNumber(stats.users.newThisWeek)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 订单统计 */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-primary bg-opacity-10 rounded">
                          <FiShoppingCart className="text-primary fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">总订单数</p>
                        <h4 className="mb-0">{formatNumber(stats.orders.total)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-success bg-opacity-10 rounded">
                          <FiDollarSign className="text-success fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">总收入</p>
                        <h4 className="mb-0">{formatCurrency(stats.orders.totalRevenue)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-info bg-opacity-10 rounded">
                          <FiDollarSign className="text-info fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">今日收入</p>
                        <h4 className="mb-0">{formatCurrency(stats.orders.todayRevenue)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-warning bg-opacity-10 rounded">
                          <FiShoppingCart className="text-warning fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">待处理订单</p>
                        <h4 className="mb-0">{formatNumber(stats.orders.pending)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡密统计 */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-primary bg-opacity-10 rounded">
                          <FiKey className="text-primary fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">总生成卡密</p>
                        <h4 className="mb-0">{formatNumber(stats.codes.totalGenerated)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-success bg-opacity-10 rounded">
                          <FiKey className="text-success fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">已使用</p>
                        <h4 className="mb-0">{formatNumber(stats.codes.totalUsed)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-info bg-opacity-10 rounded">
                          <FiKey className="text-info fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">未使用</p>
                        <h4 className="mb-0">{formatNumber(stats.codes.active)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="avatar-sm bg-warning bg-opacity-10 rounded">
                          <FiKey className="text-warning fs-4 d-block mx-auto mt-2" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1">已过期</p>
                        <h4 className="mb-0">{formatNumber(stats.codes.expired)}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">快速操作</h5>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/dashboard?tab=admin-users'}
                  >
                    <FiUsers className="me-2" />
                    管理用户
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => window.location.href = '/dashboard?tab=admin-codes'}
                  >
                    <FiKey className="me-2" />
                    生成卡密
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}