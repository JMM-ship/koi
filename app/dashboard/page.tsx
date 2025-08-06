"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 如果没有登录，重定向到登录页面
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 加载中状态
  if (status === "loading") {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 未认证状态（会被 useEffect 重定向）
  if (status === "unauthenticated") {
    return null;
  }

  // 已认证状态，显示 dashboard 内容
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">仪表板</h1>
          
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">欢迎回来！</h5>
              <div className="mt-3">
                <p><strong>用户信息：</strong></p>
                <ul className="list-unstyled">
                  <li>邮箱：{session?.user?.email}</li>
                  <li>昵称：{session?.user?.name || "未设置"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">快速操作</h5>
              <div className="d-flex gap-3 mt-3">
                <button className="btn btn-primary">查看服务</button>
                <button className="btn btn-secondary">账户设置</button>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    // 登出功能
                    import("next-auth/react").then(({ signOut }) => {
                      signOut({ callbackUrl: "/" });
                    });
                  }}
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}