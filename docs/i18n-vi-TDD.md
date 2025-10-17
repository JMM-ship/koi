# 越南语（vi）接入计划（TDD）

本计划在不改变现有路由结构的前提下，为网站新增越南语（vi）支持，并坚持“测试先行”的实施方式：每个里程碑先提交失败测试，再实现功能使其通过，最后做小结复核。

## 已确认策略
- 语言代码与标签：`vi`（切换器按钮文字使用 `vi`）。
- 翻译基准与语气：从英文（en）到越南语（vi），正式且亲和；品牌与专有名词（如 KOI、模型名）保留英文。
- 本地化：数字/日期采用 `vi-VN`；货币显示以 USD 为主（格式遵循 `vi-VN`）。
- URL 与 SEO：继续使用 Cookie 决定语言，不引入 `/<locale>` 前缀；SEO 的 `hreflang`/`canonical` 可作为后续增强（非本次必做）。
- 字体：在 `app/layout.tsx` 的谷歌字体 `Libre_Franklin`、`Rubik` 中新增 `vietnamese` 子集以避免缺字。
- 覆盖范围：全站所有已存在的 namespace（common/header/auth/dashboard/reasons/buckets/toasts/sidebar/packages/home/onboarding/admin）。

## 目录结构与关键文件
- `config/i18n.ts`：新增 `vi` 至 `SUPPORTED_LOCALES`；`parseAcceptLanguage` 支持 `vi`/`vi-VN`。
- `lib/i18n/server.ts`：
  - `formatCurrency` 支持 `vi-VN`；
  - `getDictionary` 维持现有加载逻辑（预打包优先，文件回退）。
- `locales/vi/*.json`：新增与 `locales/en/*.json` 键一致的 vi 版本。
- `locales/index.ts`：预打包 `vi` 的各 namespace。
- `components/common/LanguageSwitcher.tsx`：新增 `vi` 选项，按钮文案为 `vi`。
- `app/layout.tsx`：加载 `vi` 字典，注入至 `I18nClientProvider`。
- `app/api/profile/locale/route.ts`：沿用现有校验（`isSupportedLocale`），无需修改。

## 里程碑与测试计划

### 里程碑 1｜核心解析与格式化（不动 UI）
- 新增测试：
  - `tests/i18n/resolve-locale.vi.test.ts`
    - `isSupportedLocale('vi')` 为 true；
    - `resolveLocaleFrom({ acceptLanguage: 'vi-VN,vi;q=0.9' })` 返回 `vi`；
    - 当 user/cookie 未设置且 `Accept-Language` 为法语等，仍回退默认 `en`（回归保障）。
  - `tests/i18n/format.vi.test.ts`
    - `formatCurrency(1234.5, 'vi', 'USD')` 返回 `vi-VN` 风格字符串（与 `en` 有所不同，做形态断言）。
- 实现点：
  - `config/i18n.ts`：`SUPPORTED_LOCALES` 添加 `vi`；`parseAcceptLanguage` 增加对 `vi` 的匹配。
  - `lib/i18n/server.ts`：`formatCurrency` 增加 `vi-VN`。
- 验收：上述测试绿。

### 里程碑 2｜字典加载（最小集）
- 新增测试：
  - `tests/i18n/dictionary.vi.test.ts`
    - `getDictionary('vi', ['header'])` 结果中 `header.signIn` 存在；
    - `vi.header.signIn` 与 `en.header.signIn` 不同（烟测差异）。
- 实现点：
  - 新建 `locales/vi/header.json`、`locales/vi/common.json`（先最小集以通过测试）。
  - `locales/index.ts` 预打包新增 `vi` 的 `common`、`header`。
- 验收：上述测试绿。

### 里程碑 3｜语言切换器（客户端）
- 新增测试：
  - `tests/components/LanguageSwitcher.vi.test.tsx`
    - 未登录：点击 `vi` 后仅写入 `LOCALE=vi` Cookie，不触发 API；
    - 已登录：点击 `vi` 后写 Cookie 且调用 `POST /api/profile/locale`，请求体 `{"locale":"vi"}`。
- 实现点：
  - `components/common/LanguageSwitcher.tsx` 新增第三个按钮（文案 `vi`），逻辑复用现有分支；
  - API 端无需修改（`isSupportedLocale` 放行 `vi`）。
- 验收：上述测试绿。

### 里程碑 4｜RootLayout 接入与字体
- 新增测试：
  - `tests/i18n/layout-html-lang.vi.test.tsx`
    - 通过构造 Cookie/headers，验证解析为 `vi` 时，Provider 能读取到 `vi` 字典项（例如 `header.signIn`）；
    - `<html lang>` 的断言可作为轻量快照/字符串包含测试（如通过渲染函数或对返回片段做断言）。
- 实现点：
  - `app/layout.tsx` 中 `dicts` 增加 `vi`；
  - `Libre_Franklin`、`Rubik` 字体的 `subsets` 新增 `vietnamese`。
- 验收：上述测试绿 + 手工打开页面验证越南语渲染无方块字形。

### 里程碑 5｜完整翻译覆盖与对齐校验
- 新增测试：
  - `tests/i18n/dictionary-coverage.vi.test.ts`
    - 读取 `locales/en/*.json` 与 `locales/vi/*.json`，校验 `vi` 侧文件存在且键集合与 `en` 一致；
    - 若存在缺失键，给出明确的测试失败信息（指出文件与键名）。
  - 关键 UI 冒烟：挑选若干页面/组件对 `vi` 进行文案存在性断言（如 Home 英雄区按钮、登录页按钮、Dashboard 主标题）。
- 实现点：
  - 新增并完善 `locales/vi/*.json` 的全量翻译，确保键结构对齐 `en`；
  - 术语统一：把控“API Key、Credits、Plan”等关键字的一致译法。
- 验收：上述覆盖测试绿；人工抽样页面文案正确、语义通顺。

## 可选增强（非本次必做）
- SEO：在各页面元信息中注入 `alternate` `hreflang` 与 `canonical`（需梳理 URL；若继续无前缀策略，则按域名+路径生成对应 `en/zh/vi` 的关系）。
- 错误回退：当 `vi` 某个键缺失时可回退到 `en`（当前 Provider 已能以 key 原文兜底，可按需增强自动回退到 `en`）。

## 术语与翻译约定（节选）
- KOI（品牌名）：不翻译。
- API Key：`Khóa API`（保留大写 `API`）。
- Credits：`Tín dụng`（上下文为点数/用量额度；在 UI 中保持简洁）。
- Plan（套餐/方案）：`Gói`。
- Sign in：`Đăng nhập`；Sign up：`Đăng ký`；Copy：`Sao chép`。

## 推进节奏与回滚
- 每个里程碑独立提交：先测后码，全部测试通过后再进入下一里程碑。
- 任一里程碑可单独回滚，不影响其他功能；每次合并前产出简要变更说明与验证步骤。

