Sentry Performance 集成 TDD 实施文档（SaaS‑US）

一、背景与目标
- 背景
  - 现状：Next.js 部署在 Vercel（Serverless），数据库为 Supabase（us‑west‑1）。用户操作（创建/删除 API Key）后，前端反馈与数据刷新存在明显延迟，缺乏端到端可观测性，无法快速定位瓶颈（函数冷启动/跨区网络/DB 排队/慢查询/业务阶段）。
- 目标
  - 以最小侵入方式接入 Sentry Performance（SaaS‑US），获得“浏览器 → Vercel 函数 → Prisma/PG → 外部 HTTP”的完整 Trace 瀑布。
  - 建立性能 SLO 与告警（P95 > 1000ms），采样策略 dev/preview=100%，prod=20%，错误事务=100%。

二、范围与不做的事
- 范围：观测与诊断（SDK 初始化、自动/自定义 spans、采样、source maps、告警）。
- 不做：修改业务逻辑或数据库结构（后续若由观测数据驱动，可另开任务）。

三、关键决策（已确认）
- 托管方式：Sentry SaaS‑US（与现有 Region 对齐）。
- 采样：dev/preview=1.0；prod=0.2；错误事务=1.0。
- 慢阈值：1000ms。
- 数据范围：记录 SQL 文本；上报所有请求/响应头（当前无隐私约束）。
- Prisma/DB spans：方案 B（OpenTelemetry + Prisma Instrumentation + Sentry OTel 桥接）。
- Region 对齐：Vercel Functions 设为 sfo1，与 Supabase us‑west‑1 一致。

四、前置条件
- 账号与集成
  - 我方创建 Sentry 组织/项目（SaaS‑US），提供 SENTRY_DSN、SENTRY_AUTH_TOKEN、SENTRY_ORG、SENTRY_PROJECT。
  - Vercel ↔ Sentry 集成（用于自动上传 source maps）。
- 环境与连接
  - Vercel Functions Region：sfo1。
  - Supabase 连接池：DATABASE_URL 使用 pooler 且 connection_limit=10。

五、环境变量（示例）
- Sentry：SENTRY_DSN、SENTRY_ORG、SENTRY_PROJECT、SENTRY_AUTH_TOKEN、SENTRY_ENV（可由 VERCEL_ENV 映射）。
- Release：VERCEL_GIT_COMMIT_SHA。
- 诊断：KOI_DIAG（诊断窗口内开启业务自定义 spans）。
- 既有：NEXTAUTH_SECRET、DATABASE_URL、DIRECT_URL、API_KEYS_ATREST_KEY。

六、依赖
- @sentry/nextjs
- @sentry/opentelemetry、@opentelemetry/sdk-node、@opentelemetry/instrumentation-http、@opentelemetry/instrumentation-undici、@opentelemetry/instrumentation-pg、@prisma/instrumentation

七、TDD 里程碑（先写测试，再实现，每步可独立验收）
1) 基础初始化（仅初始化）
   - 测试：
     - tests/obs/sentry.init.test.ts（校验 dsn/environment/release/tracesSampler）。
     - tests/obs/sentry.tags.test.ts（校验全局 tags：region、service）。
   - 实施：新增 sentry.client.config.ts / sentry.server.config.ts / instrumentation.ts。
   - 验收：preview 环境访问页面与 /api/apikeys，Sentry 出现 Page/API 事务。

2) 请求/响应头与采样策略
   - 测试：
     - tests/obs/sentry.headers.test.ts（事件包含 request/response 全部 headers）。
     - tests/obs/sentry.sampling.test.ts（环境采样率与错误采样）。
   - 实施：server 端 sendDefaultPii=true；beforeSend 合并请求/响应头。
   - 验收：事件中可见完整头部；采样分布正确。

3) 浏览器→服务端 Trace 关联
   - 测试：
     - tests/obs/sentry.browser-link.test.ts（fetch 带 sentry-trace、baggage 头）。
   - 实施：客户端 SDK 启用 tracing（默认注入 trace headers）。
   - 验收：Trace 同时包含前端页面与后端 API 事务。

4) OTel + Prisma/PG instrumentation（方案 B）
   - 测试：
     - tests/obs/sentry.otel.register.test.ts（instrumentation 注册）。
     - tests/obs/sentry.prisma-span.test.ts（出现 db.sql.prisma 子 span，含 db.statement SQL 文本）。
   - 实施：instrumentation.ts 初始化 NodeSDK，注册 http/undici/pg/prisma 并桥接到 Sentry。
   - 验收：Sentry 事务内可见 http/undici/pg/prisma 子 spans 与 SQL 文本。

5) 业务关键段自定义 spans（仅 KOI_DIAG=1）
   - 测试：
     - tests/obs/sentry.business-span.test.ts（/api/apikeys 的 findAvailable/claim/fetchResult 出现 biz.apikeys.* spans）。
   - 实施：将既有诊断计时点替换为 Sentry.startSpan 包裹（仅 KOI_DIAG=1 时启用）。
   - 验收：Trace 内清晰展示关键阶段耗时分布。

6) Vercel ↔ Sentry 集成与 Source Maps 上传
   - 测试：
     - tests/obs/sentry.release.test.ts（release 使用 VERCEL_GIT_COMMIT_SHA）。
   - 实施：Vercel 控制台安装 Sentry 集成或 CI 上传 source maps；next.config.mjs 使用 withSentryConfig。
   - 验收：Sentry 堆栈可源码级定位；事件含 release 与 environment。

7) SLO 仪表盘与告警
   - 测试（文档驱动）：
     - tests/obs/sentry.alerts.md.test.ts（验证告警规则说明文档存在）。
   - 实施：Sentry UI 配置 Performance Alert：/api/apikeys、/api/dashboard P95>1000ms 持续 5 分钟告警；错误率阈值、抑制策略、通知通道。
   - 验收：压测可触发/恢复告警；仪表盘显示关键路由耗时。

八、部署与验证清单
1) 区域与连接
   - Vercel Functions Region= sfo1；DATABASE_URL 的 connection_limit=10 已生效。
   - curl 端到端计时确认 TTFB 与 total 改善：
     - curl -w 'namelookup:%{time_namelookup} connect:%{time_connect} appconnect:%{time_appconnect} starttransfer:%{time_starttransfer} total:%{time_total}\n' -o /dev/null -s https://<vercel>/api/apikeys

2) 预发验证（Preview）
   - 完成里程碑 1–4：部署后访问页面与 /api/apikeys，Sentry 可见 http/pg/prisma spans。
   - 短时开启 KOI_DIAG=1，验证业务关键 spans（里程碑 5）。

3) 生产推广（Prod）
   - 合并部署后确认：采样（prod=0.2）、source maps、SLO 告警已开启。
   - 用“创建 API Key → 列表刷新 → 删除 API Key”的真实链路导出 Trace，作为瓶颈分析依据。

九、回滚与降噪
- 关闭观测：置空 SENTRY_DSN 或设置 SENTRY_ENABLED=false。
- 降噪：关闭 KOI_DIAG 或调低采样（prod=0.1 或更低）。
- 隐私（若将来需要）：将 sendDefaultPii=false，或在 beforeSend 清理敏感头/字段。

十、风险与缓解
- 事件体过大：记录 SQL 与全头部可能增大体积；通过采样与仅在诊断期启用 KOI_DIAG 控制成本。
- Serverless 冷启动：区域对齐、连接池优化，必要时 keep‑warm/Edge（依据观测数据评估）。
- OTel 开销：NodeSDK 初始化仅在 server 冷启动一次，影响可控。

十一、时间线与职责
- D1：完成里程碑 1–2（测试→实现→Preview 验证）。
- D2：完成里程碑 3–5（测试→实现→Preview 压测与诊断窗口）。
- D3：完成里程碑 6–7（测试→实现→Prod 上线 + 告警）。
- 职责：
  - 我方：编写/维护测试与初始化代码、配置文档；
  - 你方：提供/配置 Sentry 项目与 Vercel 集成、设置环境变量与 Region、执行发布与压测。

附录 A：与自托管对比（择要）
- SaaS（US/EU）：0 维护、集成完善、付费订阅、数据驻留在供应商侧；
- 自托管：数据自有、可控性高、运维复杂、初期接入成本高。

