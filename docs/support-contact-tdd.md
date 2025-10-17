## 客服援助与联系我们（Discord 二维码）— 测试先行（TDD）文档

> 目标：在 Landing 页的“联系我们”相关文案处与 Dashboard 侧边栏新增“客服援助”入口，统一以弹窗展示 Discord 客服二维码。严格采用“测试先行”的里程碑流程，每一步独立可验收，并且仅运行本次修改相关的测试。

### 范围与约定（已确认）
- 二维码图片：从根目录复制到静态目录 `public/support/WechatIMG853.jpg`（长期有效）。
- 展示位置：
  - Landing：页脚版权行旁新增“联系客服（扫码）”触发按钮。
  - Dashboard：侧边栏在 “推荐计划（Referral Program）” 下方新增“客服援助”。
- 交互方式：点击后以弹窗展示二维码。
- 文案与 i18n：本次新增键值：
  - `sidebar.support`：中文“客服援助”、英文“Support”。
  - `common.support.{modalTitle, modalSubtitle, qrAlt, actionLink}`。
- 无障碍与移动端：为图片添加 `alt` 文案，自适应缩放，遮罩可键盘 ESC 关闭。

### 里程碑与 TDD
> 每个里程碑遵循“先写测试 → 实现功能 → 仅跑相关测试验证”的流程。

#### M1：客服弹窗组件（可复用）
- 测试（新增）
  - 路径：`tests/components/SupportContactModal.test.tsx`
  - 断言：
    - 关闭时不渲染；
    - 打开时显示标题与二维码 `<img alt="Discord support QR">`。
- 实现
  - 新增组件：`components/common/SupportContactModal.tsx`（基于 `ModalPortal`）。
  - 资源：`public/support/WechatIMG853.jpg`。

#### M2：Dashboard 侧边栏新增“客服援助”
- 测试（新增）
  - 路径：`tests/components/DashboardSidebar.support.test.tsx`
  - 断言：
    - 出现文案“客服援助”；
    - 点击后弹出弹窗并显示二维码。
- 实现
  - 修改：`components/dashboard/Sidebar.tsx`
    - 引入 `FiHelpCircle` 图标；
    - 在 “推荐计划” 下方新增菜单项，点击打开 `SupportContactModal`。
  - i18n：`locales/zh/sidebar.json`、`locales/en/sidebar.json` 增加 `support`。

#### M3：Landing 页脚入口
- 测试（新增）
  - 路径：`tests/components/Footer.contact-support.test.tsx`
  - 断言：
    - 页脚出现“联系客服（扫码）”；
    - 点击后弹出弹窗并显示二维码。
- 实现
  - 修改：`components/layout/footer/Footer.tsx`
    - 在版权行旁增加按钮，点击打开 `SupportContactModal`。
  - i18n：`locales/*/common.json` 增加 `common.support.*` 键值。

### 本次仅运行的相关测试
为满足“只测试本次修改相关的测试”的要求，使用如下命令仅运行新增/相关用例：

```
npm run -s test -- \
  tests/components/SupportContactModal.test.tsx \
  tests/components/DashboardSidebar.support.test.tsx \
  tests/components/Footer.contact-support.test.tsx
```

期望结果：3 个测试套件全部通过。

### 代码改动清单
- 新增
  - `components/common/SupportContactModal.tsx`
  - `public/support/WechatIMG853.jpg`
  - `tests/components/SupportContactModal.test.tsx`
  - `tests/components/DashboardSidebar.support.test.tsx`
  - `tests/components/Footer.contact-support.test.tsx`
- 修改
  - `components/dashboard/Sidebar.tsx`（新增菜单项与弹窗实例）
  - `components/layout/footer/Footer.tsx`（新增入口与弹窗实例）
  - `locales/en/sidebar.json`、`locales/zh/sidebar.json`（新增 `support`）
  - `locales/en/common.json`、`locales/zh/common.json`（新增 `common.support.*`）

### 手动验收建议
- Landing：打开主页底部，点击“联系客服（扫码）”，弹窗出现，二维码清晰可见，ESC 可关闭。
- Dashboard：登录后，在侧边栏“推荐计划”下方出现“客服援助”，点击后弹出二维码弹窗。
- 移动端：弹窗宽度自适应，图片等比缩放，遮罩可点击关闭。
- 无障碍：图片 `alt` 为中英文对应描述。

### 后续可扩展点（如需）
- 在首页 FAQ 中的“技术支持”相关问答旁也增加“扫码联系”触发点（复用同一组件与测试模式）。
- 若要提供无法扫码用户的备用渠道，可在弹窗内追加 Discord 邀请链接按钮。

### 回滚方案
- 删除/注释页脚按钮与侧边栏菜单项；
- 保留 `SupportContactModal` 组件（可后续复用），或按需移除及对应测试。

