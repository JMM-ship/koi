# 调试面板使用说明

## 功能介绍

调试面板是一个独立的模块，用于在开发和调试过程中快速获取页面状态和数据。它可以：

- 🔍 实时显示页面数据和用户状态
- 📋 一键复制所有调试信息
- 🔒 自动过滤敏感信息
- 🎨 浮动按钮设计，不影响页面布局
- ⌨️ 支持快捷键切换（Ctrl+Shift+D）

## 使用方法

### 1. 显示调试面板

有三种方式显示调试面板：

1. **点击浮动按钮**：页面右下角的虫子图标
2. **使用快捷键**：`Ctrl + Shift + D`
3. **URL参数**：在网址后添加 `?debug=true`

### 2. 收集的数据

调试面板会自动收集以下信息：

- **基本信息**：URL、路径、查询参数、时间戳
- **用户信息**：登录状态、邮箱、角色、UUID
- **浏览器信息**：User Agent、语言、屏幕分辨率、窗口大小
- **存储数据**：localStorage 和 sessionStorage（已过滤敏感信息）
- **性能数据**：页面加载时间、DOM 准备时间、资源数量
- **框架信息**：Next.js 版本、环境变量等

### 3. 复制调试数据

点击"复制调试数据"按钮，所有收集的信息会以 JSON 格式复制到剪贴板，方便分享给开发者进行调试。

## 配置选项

在 `/config/debug.config.ts` 中可以配置：

```typescript
{
  enabled: true,              // 是否启用调试面板
  developmentOnly: false,     // 只在开发环境显示
  allowUrlParam: true,        // 允许URL参数控制
  hotkey: 'ctrl+shift+d',     // 快捷键设置
  defaultExpanded: false,     // 默认展开状态
}
```

## 在生产环境禁用

有以下几种方式在生产环境禁用调试面板：

### 方法1：修改配置文件
```typescript
// /config/debug.config.ts
export const debugConfig = {
  enabled: false, // 设置为 false
  // 或
  developmentOnly: true, // 只在开发环境显示
}
```

### 方法2：注释掉组件
```tsx
// /app/layout.tsx
<Providers>
  {/* <DebugProvider> */}
    {children}
  {/* </DebugProvider> */}
</Providers>
```

### 方法3：环境变量控制
```typescript
// /components/debug/DebugProvider.tsx
const showPanel = process.env.NODE_ENV === 'development';
```

## 安全性

- ✅ 自动过滤包含 `token`、`secret`、`password` 等敏感字段
- ✅ 不会收集 Cookie 内容
- ✅ 可以完全禁用或移除
- ✅ 不会影响生产环境性能（动态导入）

## 扩展功能

可以在 `DebugPanel.tsx` 中添加更多数据收集：

```typescript
// 添加自定义数据
const customData = {
  // 你的自定义数据
  apiCalls: window.apiCallHistory,
  reduxState: store.getState(),
  // ...
};
```

## 文件结构

```
/components/debug/
├── DebugPanel.tsx      # 主要调试面板组件
├── DebugProvider.tsx   # 提供者组件，控制显示逻辑
└── README.md          # 使用说明

/config/
└── debug.config.ts    # 配置文件
```

## 注意事项

1. 调试面板仅用于开发和调试，生产环境应禁用
2. 虽然已过滤敏感信息，但仍应谨慎分享调试数据
3. 大量数据可能影响复制操作，必要时可以限制数据量

## 快速禁用

如果需要快速禁用调试面板，只需：

```typescript
// /config/debug.config.ts
export const debugConfig = {
  enabled: false, // <- 改为 false
  // ...
}
```

或者直接注释掉 layout.tsx 中的 `<DebugProvider>`。