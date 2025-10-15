# 多语言（i18n）实施计划（TDD）

> 目标：为现有 Next.js 14 App Router 项目引入多语言能力，首批覆盖 Header + 登录页 + CreditsHistory，遵循“测试先行”的里程碑式交付，每个里程碑均可独立验收。

## 已确认策略
- 支持语言：`en`、`zh`（可扩展），默认语言：`en`。
- URL 策略：采用 `/<locale>/...` 前缀，但默认语言省略前缀（即 `/` 等价于 `/en`）。
- 语言解析优先级：`user.locale`（登录） → `cookie(LOCALE)` → `Accept-Language` → 默认语言。
- 首批覆盖范围：仅 Header + 登录页 + CreditsHistory（最小可用闭环），其余页面分批推进。
- 依赖：允许将来采用 `next-intl` 等库，但当前 A 阶段以轻量自研为主（网络受限保障可落地）。
- 用户设置：允许（登录用户可持久化 `locale` 至数据库；未登录使用 Cookie）。

## 总体设计（A 阶段）
- 资源组织
  - `locales/<lang>/<namespace>.json`：按命名空间拆分（如 `common`、`header`、`auth`、`dashboard`）。
- 运行时
  - 服务端解析 locale（读取 session/cookie/Accept-Language），在 RootLayout 注入 `<html lang>`，并为客户端上下文提供字典。
  - 客户端通过 `I18nProvider + useT()` 进行取词，支持占位符插值、缺失键回退和开发态告警。
- 持久化
  - 未登录：语言切换写入 Cookie `LOCALE`。
  - 已登录：同时调用 `/api/profile/locale`（或扩展 `profile/update`）更新 `user.locale`。

## 里程碑与 TDD

> 注：每个里程碑均采用“先写测试 → 实现 → 复测与小结”的流程；里程碑间可独立验收。

### 里程碑 1｜i18n 基础设施（不改页面）
- 测试（新增）
  - `tests/i18n/resolve-locale.test.ts`
    - 解析顺序覆盖：session.user.locale、cookie、Accept-Language、默认值。
    - Cookie 写入/读取规范：名称 `LOCALE`、合法值限制（`en|zh`）。
  - `tests/i18n/dictionary.test.ts`
    - `getDictionary(lang, ns[])` 能加载命名空间并合并；缺失键回退为 key 并在 dev 下告警。
  - `tests/i18n/format.test.ts`
    - 使用 `Intl` 在 `en/zh` 下日期/数字格式化结果符合预期（仅做 smoke）。
- 实现（新增文件，不影响现有 UI）
  - `config/i18n.ts`：受支持语言、默认语言、Cookie 名称常量。
  - `lib/i18n/server.ts`：`resolveLocale(req?)`、`getDictionary(lang)`、`isSupportedLocale()`。
  - `contexts/I18nContext.tsx`：`I18nProvider`、`useT()`；支持命名空间与占位符插值。
- 验收
  - 以上测试全部通过；未改动 UI 的情况下构建与其它测试不受影响。

### 里程碑 2｜SSR 注入与中间件协作（仍不改 UI 文案）
- 测试（新增）
  - `tests/i18n/layout-html-lang.test.tsx`
    - 渲染 RootLayout 时 `<html lang>` 与解析到的 locale 一致。
  - `tests/i18n/middleware-resolve.test.ts`
    - 对中间件使用的解析纯函数进行单元测试（不直接测 Next 中间件）。
- 实现（小改）
  - `app/layout.tsx`：使用服务端 `resolveLocale()` 设置 `<html lang>`，将 `locale` 向下游 Provider 透传。
  - `middleware.ts`：复用解析工具（保持现有鉴权逻辑与路由行为不变）。
- 验收
  - 页面源代码中可见正确的 `<html lang>`；既有功能无回归。

### 里程碑 3｜首批界面接入（Header + 登录页 + CreditsHistory）
- 测试（新增/改造）
  - `tests/components/Header.i18n.test.tsx`
    - `en/zh` 下 Header 的“Sign in/登录”等文案分别正确。
  - `tests/pages/Signin.i18n.test.tsx`
    - 登录页 Tab 文案（Login/Register）、按钮与少量提示在 `en/zh` 渲染正确（mock `next/navigation` 与 `next-auth`，参考现有 `signin.invite-input.test.tsx` 风格）。
  - `tests/components/CreditsHistory.i18n.test.tsx`
    - 将 `components/dashboard/CreditsHistory.tsx` 中硬编码的中英映射迁移为字典驱动；兼容历史中文 `reason` 字段（含“{服务}服务消耗”类模式）。
- 实现（最小范围替换）
  - `components/layout/header/Header.tsx`：以 `useT()` 替换 `sign in` 等硬编码。
  - `app/auth/signin/page.tsx`：替换核心 UI 字符串（Login/Register/Email/Password/Verification Code/Send Code/or/Sign in with Google 等）。
  - `components/dashboard/CreditsHistory.tsx`：删除 `mapReasonToEnglish / mapBucketToEnglish` 的硬编码表，改为查字典（同时保留对历史中文文案的容错匹配）。
  - `locales/en/*.json`、`locales/zh/*.json`：补齐上述三个模块的基础文案。
- 验收
  - 新增测试全部通过；手动修改 Cookie `LOCALE` 可观察到界面切换效果。

### 里程碑 4｜语言切换与持久化（Header 内置）
- 测试（新增）
  - `tests/components/LanguageSwitcher.test.tsx`
    - 切换后写入 Cookie；若为登录态，调用 `/api/profile/locale` 更新成功；UI 触发文案刷新。
  - `tests/api/profile.locale.test.ts`
    - 鉴权校验（未登录 401）；参数校验（非法 `locale` 422）；成功更新用户 `locale`。
- 实现（新增）
  - 新增 `components/common/LanguageSwitcher.tsx`，默认放置在 Header（不影响移动端导航逻辑）。
  - 新增 `app/api/profile/locale/route.ts`（POST）：更新登录用户 `locale`；或扩展 `app/api/profile/update/route.js` 支持 `locale` 字段（择一，下方“变更清单”给出推荐）。
- 验收
  - 未登录与已登录两条路径独立可测；刷新后语言偏好保持。

### 里程碑 5（可选）｜URL 前缀化与 SEO
- 测试（新增）
  - `tests/i18n/routing-prefix.test.ts`
    - `/` 解析到默认语言；`/en/...` 与 `/zh/...` 可访问；无前缀路径对默认语言等价。
  - `tests/i18n/metadata-alternate.test.ts`
    - `[locale]/layout` 注入 `alternate` hreflang 与 `canonical` 正确。
- 实现（逐步迁移）
  - 新增 `app/[locale]/layout.tsx`、`app/[locale]/page.tsx` 作为过渡层，引用现有页面与 Provider。
  - 在 `middleware.ts` 中识别/回退 locale 前缀（保持默认语言无前缀的同时兼容前缀访问）。
- 验收
  - 测试通过；SEO 结构成型；其余页面逐步迁移。

## 变更清单（按里程碑）
- 新增
  - `config/i18n.ts`
  - `lib/i18n/server.ts`
  - `contexts/I18nContext.tsx`
  - `locales/en/{common,header,auth,dashboard}.json`
  - `locales/zh/{common,header,auth,dashboard}.json`
  - `components/common/LanguageSwitcher.tsx`（里程碑 4）
  - `app/api/profile/locale/route.ts`（里程碑 4；或在 `app/api/profile/update/route.js` 中支持 `locale`）
- 修改
  - `app/layout.tsx`：注入 `<html lang>`
  - `middleware.ts`：复用解析工具（不改变既有鉴权/路由行为）
  - `components/layout/header/Header.tsx`：取词替换
  - `app/auth/signin/page.tsx`：取词替换
  - `components/dashboard/CreditsHistory.tsx`：移除硬编码映射，改字典驱动

## 示例字典（首批）
- header（节选）
  - `header.signIn`: en=`Sign in`，zh=`登录`
- auth（节选）
  - `auth.login`: `Login` / `登录`
  - `auth.register`: `Register` / `注册`
  - `auth.email`: `Email` / `邮箱`
  - `auth.password`: `Password` / `密码`
  - `auth.verificationCode`: `Verification Code` / `验证码`
  - `auth.sendCode`: `Send Code` / `发送验证码`
  - `auth.or`: `or` / `或`
  - `auth.signInWithGoogle`: `Sign in with Google` / `使用 Google 登录`
- dashboard（CreditsHistory 节选）
  - `dashboard.creditsHistory.title`: `Credits History` / `积分流水`
  - `dashboard.creditsHistory.loading`: `Loading...` / `加载中...`
  - `dashboard.creditsHistory.empty`: `No records` / `暂无记录`
  - `reasons.dailyReset`: `Daily credits reset` / `每日积分重置`
  - `reasons.purchasedIndependent`: `Purchased independent credits` / `购买独立积分`
  - `reasons.activatedPackage`: `Activated package credits` / `激活套餐积分`
  - `reasons.packagePurchaseReset`: `Package purchase reset` / `购买套餐重置积分`
  - `reasons.orderRefundPackage`: `Order refund deduction (package)` / `订单退款扣减积分（套餐）`
  - `reasons.orderRefundIndependent`: `Order refund deduction (independent)` / `订单退款扣减积分（独立）`
  - `reasons.newUserBonus`: `New user signup bonus` / `新用户注册奖励`
  - `reasons.autoRecoveryHourly`: `Auto recovery (hourly)` / `自动恢复（每小时恢复）`
  - `reasons.manualResetToCap`: `Manual reset to cap` / `手动重置到上限`
  - `reasons.referralInviter`: `Referral reward - inviter` / `推荐奖励-邀请人`
  - `reasons.referralInvitee`: `Referral reward - invitee` / `推荐奖励-被邀请人`
  - `buckets.package`: `Package` / `套餐`
  - `buckets.independent`: `Independent` / `独立`
  - 兼容模式：对形如“{服务}服务消耗”的中文字符串做正则翻译为 `Service usage - {服务}`。

## 测试与运行说明
- 单测命令：`npm test` / `npm run test:watch`
- 约定
  - 组件测试采用 jsdom 环境，参考现有 `tests/pages/signin.invite-input.test.tsx` 的 mock 方式。
  - 中间件逻辑以纯函数测试为主，避免耦合 Next 运行时；E2E 行为可在后续阶段补充。

## 验收标准
- 每个里程碑都能在不影响现有主要功能的情况下通过新增测试；
- Cookie/Session/Accept-Language 的解析顺序符合预期；
- 首批覆盖范围中的 UI 文案在 `en/zh` 下切换正确；
- CreditsHistory 兼容历史中文流水原因字段；
- 语言切换持久化在未登录/已登录两种场景均可验证。

## 风险与回滚
- 风险
  - 硬编码文案替换量较大，建议分模块推进；
  - 现有测试中对中文的断言需要改为“按 locale 断言”。
- 回滚
  - 每个里程碑变更相互独立；出现问题可回滚到上一个已通过测试的里程碑。

## 后续（B 阶段）
- 引入 `app/[locale]/...` 路由前缀并逐步迁移页面；
- 注入 SEO 友好的 `alternate` hreflang 与 `canonical`；
- 视网络与依赖状况，评估迁移至 `next-intl` 等生态方案以减少自研维护成本。

---

如无异议，我将按本文档从“里程碑 1：先提交测试，再实现基建”开始推进，并在每个里程碑完成后提交简要变更说明与验收记录。

