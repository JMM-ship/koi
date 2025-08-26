"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { debugConfig, shouldShowDebugPanel } from "@/config/debug.config";

// 动态导入调试面板，避免影响首屏加载
const DebugPanel = dynamic(() => import("./DebugPanel"), {
  ssr: false, // 仅在客户端渲染
});

interface DebugProviderProps {
  children: React.ReactNode;
  enabled?: boolean; // 可以通过props控制是否启用
}

/**
 * 调试功能提供者
 * 可以通过环境变量或props控制是否显示调试面板
 */
export default function DebugProvider({ children, enabled = true }: DebugProviderProps) {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    // 在客户端检查是否应该显示调试面板
    setShowPanel(enabled && shouldShowDebugPanel());

    // 添加热键支持
    if (debugConfig.hotkey) {
      const handleHotkey = (e: KeyboardEvent) => {
        const keys = debugConfig.hotkey.toLowerCase().split('+');
        const ctrl = keys.includes('ctrl');
        const shift = keys.includes('shift');
        const alt = keys.includes('alt');
        const key = keys[keys.length - 1];

        if (
          (ctrl ? e.ctrlKey : true) &&
          (shift ? e.shiftKey : true) &&
          (alt ? e.altKey : true) &&
          e.key.toLowerCase() === key
        ) {
          e.preventDefault();
          setShowPanel(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleHotkey);
      return () => window.removeEventListener('keydown', handleHotkey);
    }
  }, [enabled]);

  return (
    <>
      {children}
      {/* 调试面板 - 生产环境可以直接注释掉这一行或在配置中禁用 */}
      {/* {showPanel && <DebugPanel />} */}
    </>
  );
}