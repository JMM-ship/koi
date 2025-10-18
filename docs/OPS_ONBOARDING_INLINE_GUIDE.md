# Onboarding 内联引导（运维手册）

本手册描述将“欢迎与新手引导”改为 Dashboard 内联 todolist 的实现方案、配置、发布与回滚步骤、验证方法与常见问题。

## 变更总览

- 展示位置改为“Dashboard 主内容区内联展示”，不再使用独立路由。
- 默认逻辑：
  - 非管理员且服务端 `done=false` 时，进入 `'/dashboard'` 默认只显示“todolist 引导”，不渲染任何面板。
  - 用户在侧栏再次点击“Dashboard”后，仅当前会话显示真实面板；刷新仍未完成时，默认回到引导。
  - 管理员始终显示真实面板。
- 引导交互：
  - 取消自动探测（是否已有 API Key/有用量）；全部由用户自测勾选。
  - 不允许“跳过”；只有“我已完成”可用，四项全部勾选后底部“完成”按钮才可点。
  - CTA（如“去创建”）会在当前页面正常切到对应 Tab（不拦截导航）。
- 服务端状态：
  - `done` 持久化在服务端（`user_meta.onboarding.done`），跨设备/清缓存不回到引导。
  - 客户端仅保存步骤勾选进度与首次可见时间用于 UI。
- 独立路由 `/onboarding` 已移除，不再跳转。

## 关键文件

- 页面与内联逻辑
  - `app/dashboard/page.tsx`
    - 拉取服务端完成态，决定渲染“引导”或“面板”（二选一）。
    - 点击侧栏 Dashboard 时，在本会话内切换为显示真实面板（`sessionShowPanel`）。
- 引导组件（todolist 样式）
  - `components/dashboard/WelcomeGuide.tsx`
    - 改为自上而下的待办清单（序号/完成态/CTA/手动“我已完成”）。
    - 取消自动探测、取消“跳过”、仅手动完成时 `POST /api/onboarding/state { done:true }`。
- 注册后落点
  - `app/auth/signin/page.tsx`
    - 注册成功 + 自动登录后，回 `'/dashboard'`（由内联引导控制展示）。
- 中间件
  - `middleware.ts`
    - 仅保护 `'/dashboard'`；移除 `'/onboarding'` 相关逻辑。
- 服务端状态 API（保持不变）
  - `app/api/onboarding/state/route.ts`（GET/POST）
    - 在 `user_meta` 的 `data.onboarding` 中读写 `{ done, steps, firstSeenAt }`。

## 行为细节

- 判定来源：`GET /api/onboarding/state` 返回的 `data.done`。
  - `true`：显示真实面板。
  - `false`：默认显示引导（todolist），除非用户在本会话点击过 Dashboard。
  - GET 非 200（如会话尚未就绪导致 401）：按 `done=false` 处理，优先显示引导，避免“引导+面板”双渲染。
- 管理员豁免：管理员永远显示真实面板，不显示引导。
- 完成方式：仅当四项全部勾选后，点击“完成”→ `POST /api/onboarding/state { done:true }`；之后任何设备刷新均显示真实面板。

## 发布步骤（零停机）

1) 部署：
   - 常规构建与发布（Vercel/自建均可），无数据库结构变更。
2) 配置：
   - 无新增必需 env；可选 `NEXT_PUBLIC_ONBOARDING_TRACKING=1|true` 开启 Sentry 事件。
3) 预验证（preview 环境）：
   - 新注册账号访问 `'/dashboard'`：默认显示 todolist 引导，不渲染面板。
   - 点击侧栏 “Dashboard”：本会话显示真实面板；刷新且未完成→默认回引导。
   - CTA 正常切到对应 Tab（API Keys/Plans/Profile）。
   - 管理员账号：直接显示真实面板。

## 回滚/热修复

- 回滚：
  - 最简：回退到上一个版本（撤销对 `app/dashboard/page.tsx` 与 `WelcomeGuide.tsx` 的改动）。
  - 临时绕过：将受影响用户的 `done` 直接设为 `true`（见下）。
- 手动修复用户状态：
  - 以该用户身份登录后，调用 `POST /api/onboarding/state`：
    ```json
    { "done": true, "steps": {"createKey": true, "firstCall": true, "choosePlan": true, "setLocale": true}, "firstSeenAt": null }
    ```
  - 刷新 `'/dashboard'`，应直接显示真实面板。

## 验收清单（生产）

- 新注册普通用户：
  - 初次进入 `'/dashboard'` 仅显示 todolist 引导，不显示面板。
  - 点击侧栏 Dashboard → 本会话显示真实面板；刷新且未完成 → 回引导。
  - 在引导页面全部勾选并点击“完成”，刷新后仍显示真实面板。
- 管理员：
  - 任何时候进入 `'/dashboard'` 直接看到真实面板，不显示引导。
- CTA 导航：
  - “去创建”→ 切到 API Keys；“去选择”→ 切到 Plans；“去设置”→ 切到 Profile。

## 监控与日志

- 可选 Sentry 追踪：`NEXT_PUBLIC_ONBOARDING_TRACKING=1|true` 时启用。
  - `onboarding_started`：引导显示。
  - `onboarding_step_done`：用户勾选某步。
  - `onboarding_completed`：用户点击完成。
- 服务端错误：
  - `GET /api/onboarding/state` 返回非 200 时，前端按 `done=false` 渲染引导；关注 401/5xx 比例（登陆会话/接口稳定性）。

## 常见问题（FAQ）

1) 进入 Dashboard 出现“顶部引导 + 底部面板”的双渲染？
   - 现版本已修复：当 `GET /api/onboarding/state` 非 200 时按 `done=false` 渲染引导，避免误判。
   - 若仍出现，先清 `.next`、硬刷新；确认 `app/dashboard/page.tsx` 的 `serverDone === false && !sessionShowPanel` 分支仅返回引导，不拼接面板。

2) 用户清空本地缓存或换设备后会回到引导吗？
   - 不会。是否显示引导以服务端 `done` 判定，客户端缓存仅影响 UI 小细节（比如步骤勾选本地回显）。

3) 能否强制展示引导？
   - 可以。以该用户身份 `POST /api/onboarding/state { done:false, steps:{}, firstSeenAt: null }`，刷新后将默认显示引导。

## 兼容性与注意事项

- 独立路由 `/onboarding` 已移除；中间件仅保护 `'/dashboard'`。
- 引导 UI 为纵向 todolist，取消自动探测与“跳过”，保持手动完成闭环。
- 旧版本的 “welcome=1” 参数已无效（只保留在文档中）。

## 相关文件一览

- 页面：
  - app/dashboard/page.tsx
- 引导组件：
  - components/dashboard/WelcomeGuide.tsx
- 注册落点：
  - app/auth/signin/page.tsx
- 中间件：
  - middleware.ts
- 服务端状态：
  - app/api/onboarding/state/route.ts

