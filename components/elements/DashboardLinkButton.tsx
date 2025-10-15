"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLinkButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // 阻止默认跳转
    setLoading(true);
    router.push("/dashboard"); // 手动跳转
  };

  return (
    <Link
      href="/dashboard"
      prefetch={true}
      onClick={handleClick}
      className={`btn btn-linear hover-up d-none d-md-flex ${loading ? "opacity-70 pointer-events-none" : ""}`}
    >
      <span>{loading ? "Loading..." : "dashboard"}</span>
    </Link>
  );
}