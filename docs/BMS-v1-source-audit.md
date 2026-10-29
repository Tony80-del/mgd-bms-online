# BMS v1 源码审计报告

**扫描时间**：2026-10-28 15:45（GMT+7）
**扫描对象**：`~/Desktop/mgd-bms-github/` 全部 5 个源文件
**扫描方式**：脚本全量正则提取 + 人工核对关键区块。所有行号可直接跳转验证。
**扫描脚本**：`/tmp/bms_audit_scan.py`（可重跑，结果确定，不含猜测）

> 这份报告只写"代码里查得到的东西"。凡是我推断的，都标了「推断」。凡是我没验证的，标了「未验证」。

---

## 0. 结论摘要

| 指标 | 数值 |
|---|---|
| 源文件 | 5 个（不含 `mr001.css` / `sw.js`），合计 14,861 行 / 1,176,272 字节 |
| 顶层函数定义 | 589 个（`index.html`）· 唯一名 588 个 |
| 全部函数定义点（含嵌套/赋值式） | 776 个 · 唯一名 756 个 |
| 真·顶层重复定义 | **1 个**：`showToast`（7545 / 9697） |
| DOM id | 464 个 |
| 重复 HTML id | 3 个：`searchInput`(2872/8695) · `pmomMain`(9901/9902) · `rfiMain`(10317/10318) |
| `data` 顶层键 | 15 个 |
| localStorage 键 | 17 个 |
| Firestore 路径 | 4 条（1 主文档 + 3 子集合/文档） |
| 弹窗容器 | 13 个 |
| 空 `catch(e){}` | **137 处** |
| 只 console 不提示的 `catch` | 10 处 |
| 隐藏子模块（此前未记录） | **5 个**：CAN · CRA · PIF · Project MOM · RFI |

**一句话**：系统不是 10 个模块，是 **10 个主模块 + 5 个藏在跟进页里的子表单**。之前漏掉的细节主要在 PFU 那 900 行里。

---

## 1. 文件层

| 文件 | 行数 | 字节 | 角色 |
|---|---|---|---|
| `index.html` | 12,988 | 1,049,449 | 主系统。全部 10 个模块 + 5 个子表单 + 全部 CSS/JS 都在这一个文件 |
| `pfu-verify.html` | 853 | 57,410 | Stage 1 项目验证页，被 `index.html` 用 iframe 嵌入（`#bidsVerifyFrame`，`data-src="pfu-verify.html?v=20261008b"`） |
| `approve.html` | 228 | 11,583 | 审批页，外部链接打开。用 Firestore REST（不加载 SDK） |
| `mgd-bms-mobile.html` | 447 | 28,875 | 手机版，独立应用，与主系统**不共享数据** |
| `mr001.js` | 345 | 28,955 | 共享层（`pfu-verify` / `approve` 用） |
| `mr001.css` | 146 | — | 同上 |
| `sw.js` | 40 | — | Service Worker，**只缓存 `mgd-bms-mobile.html`**，主系统不经过它 |

**关键事实**：`index.html` 一个文件承担 90% 的功能。结构顺序是：1–1404 行全部 CSS → 1405–2900 行 HTML 骨架（含 Annual Target 整页）→ 2900 行之后全部 JS。

---

## 2. 模块层

### 2.1 侧边栏 10 个主模块（`<aside id="sb">`，857–865 行）

| # | 菜单文案 | `sm()` 键 | 主容器 | 数据键 |
|---|---|---|---|---|
| 1 | 综合统计 | `summary` | `sum` + `win123Container` | 只读全部 |
| 2 | 投标项目追踪 | `bids` | `bs` `bf` `.tc` + 5 个子容器 | `bids` `verify` `projectTracking` `projectMOM` `projectRFI` |
| 3 | 客户管理 | `customers` | `cs` `cf` `yf` | `customers` |
| 4 | 客户互动 | `projects` | `custCalContainer`（默认日历） | `projects` |
| 5 | 商会信息 | `chambers` | `chf` | `chambers` |
| 6 | Annual Target | `annualtarget` | `annualTargetContainer` | 只读汇总 |
| 7 | 计划2026 / PLAN 2026 | `plan2026` | `plan2026Section` | `planTracking` |
| 8 | Weekly Report | `weeklyreport` | `weeklyReportContainer` | `weeklyReports` `meetingMinutes` |
| 9 | Documentation Storage | `docstorage` | `docstorageContainer` | `docSECTIONS` `docDeletedSections` |
| 10 | Documents Collection | `docscollect` | `dcApp`（全屏，隐藏侧边栏） | 云端 `doc_dc` |

### 2.2 投标模块的 6 个子页签（`bidsApplyView()`，10553 行）

| 页签 | `bidsView` 值 | 容器 | 说明 |
|---|---|---|---|
| 📊 投标列表 | `table` | `.tc` | 主表格 |
| ✅ Project verification | `verify` | `bidsVerifyContainer` | iframe → `pfu-verify.html` |
| 📋 Approvals | `approvals` | `bidsApprovalsContainer` | 读云端 `approvals` 集合 |
| 🏗️ Project Follow-up | `tracking` | `bidsTrackingContainer` | **PFU 主页面，5 个子表单都挂在这里** |
| 📝 Project MOM | `mom` | `bidsMomContainer` | 会议纪要 |
| 📄 RFI | `rfi` | `bidsRfiContainer` | 询价单 |

### 2.3 此前漏掉的 5 个隐藏子表单

这 5 个没有侧边栏入口，全部挂在 Project Follow-up 里，靠弹窗或内嵌面板打开。

| 子表单 | 函数前缀 | 行号区间 | 打开方式 | 写回字段 |
|---|---|---|---|---|
| **Close Analysis Report**（丢标分析） | `can*` | 11997–12150 | `canOpen()` → `#canModal` | `projectTracking[].analysis` |
| **Cancellation Report**（取消分析） | `cra*` | 12152–12228 | `craOpen()` → `#craModal` | `projectTracking[].cancel` |
| **PIF**（Project Information Form） | `pif*` | 11409–11462 | `pifOpen()` → `#pifModal` | 写入 PFU 记录 |
| **Project MOM** | `pmom*` | 9769–10190 | 页签 `mom` | `projectMOM` |
| **RFI** | `rfi*` | 10191–10548 | 页签 `rfi` | `projectRFI` |

**`can` 的字段**（`canCollect()`，约 12104 行）：`closeDate` `notifiedBy` `closeStage` `ourPrice` `unitPrice` `area` `pic` `winner` `winnerType` `winnerPrice` `lessons[3]` `chance` `followPic` `nextContact` `revisit` `notes` `keys[]` `adv[]` `mist[]` `gapr[]` `cmp{}` `savedAt`

**`cra` 的字段**（`craCollect()`，约 12220 行）：`cancelDate` `notifiedBy` `cancelStage` `estValueLost` `area` `pic` `reallyDead` `notes` `costIncurred` `claim` `opportunity` `docs` `reasons[]`

**这两个表单只有丢标 / 取消的项目才有内容。** 打赢的项目这一栏是空的。

---

## 3. 函数层

`index.html` 589 个顶层函数，按区段分布：

| 行号区间 | 区段 | 函数数 | 主要内容 |
|---|---|---|---|
| 1–1404 | CSS | — | 样式，含 `@media print` |
| 1405–2110 | Annual Target HTML | — | 年度目标页骨架 |
| 2110–2680 | **Annual Target 计算** | 22 | `resolveProj` `allProjects` `realRegisterFor` `syncQ1Achieved` `syncRevenueAchieved` `syncBiddingAchieved` `renderAll` |
| 2682–3110 | 日历/农历/多语言 | 7 | `cal*`（12509–12872）· `t()` `sl()` `updateUI()` |
| 3110–3596 | 数据加载/迁移 | — | `loadData` `saveData` `momSeedRecords` |
| 3596–3900 | **MOM 渲染打印** | 26 | `mom*` |
| 3900–4400 | **周报任务** | 19 | `wr*` |
| 4400–5100 | **图表/PDF** | 11 | `renderWin1Chart` `renderWin2Chart` `renderChamberChart` `renderCustomerChart` `renderBidChart` `renderJuneChambers` `pfuWonRevenue` |
| 5108–5560 | 统计/筛选/切换 | 5 | `updateStats` `recsVisibleList` `renderTable` `renderRow` `sm` |
| 5560–6100 | 表格操作/备份 | 27 | `openAddModal` `saveInlineEdit` `deleteItem` `export*` `backupAll` `restoreAll` |
| 6100–6660 | 导入导出/搜索 | 10 | `exportCSV` `importData` `hs` `doSave` `doColResize` |
| 6660–7110 | **计划2026** | 7 | `renderPlanTracking` `savePlanTracking` `checkPlanSpelling` |
| 7110–7800 | **Firebase/云同步** | 13 | `cloudPayload` `listenToCloud` `syncFromCloud` `cloudWarn` `showToast`(旧) |
| 7800–8937 | **文档库** | 40 | `doc*` |
| 8937–9760 | **Documents Collection** | 55 | `dc*` + `init` `renderList` `doCheckout` `confirmDownload` |
| 9769–10190 | Project MOM | 52 | `pmom*` |
| 10191–10548 | RFI | 45 | `rfi*` |
| 10549–10800 | PFU 基础 | 75 | `pfu*` + `bidStageIdx` |
| 10800–11400 | PFU 明细/任务 | 33 | `pfuRenderDetail` `pfuSetResult` `pfuFinalizeStage` |
| 11400–11960 | PIF + 审批 REST | 45 | `pif*` `apv*` |
| 11997–12228 | CAN + CRA | 30 | 丢标/取消分析 |
| 12509–12891 | 日历主视图 | 40 | `cal*` `calx*` `custSwitchView` |
| 12911–12986 | `[object Object]` 隐藏脚本 | — | 2026-10-28 新增，76 行 |

### 3.1 重复定义（只有 1 个是真的）

```
showToast   7545  function showToast(msg)                    ← 失效
showToast   9697  function showToast({title,body,cls})       ← 胜出
```

后果：任何按旧签名调用的地方都会显示 `undefined`。已确认两处：
- `3820` `momSave()` → `showToast('✅ Meeting Minutes saved')`
- `10249` `rfiNote(t)` → `showToast(t)`

**其余看起来重复的函数名（`pt` `arc` `rpmGauge` `barRow` `gv` `done` `V` `go`）全部是嵌套在不同父函数里的局部函数，作用域隔离，不影响运行。** 我一开始用宽松正则把它们误判成重复，用严格 `^function` 复核后确认只有 `showToast` 一条。

### 3.2 空 catch

**137 处 `catch(e){}`** —— 出错时完全无声。分布：
- 云同步相关约 40 处（最危险：写云端失败但界面显示成功）
- 渲染函数约 35 处
- 数据迁移约 20 处
- 打印/导出约 25 处
- 其余分散

另有 **10 处 `catch(e){console.log(...)}`** —— 只进控制台，用户看不到。

---

## 4. 数据层

### 4.1 `data` 对象 15 个键（按引用次数）

| 键 | 引用 | 类型 | 内容 |
|---|---|---|---|
| `bids` | 32 | Array | 投标项目 |
| `verify` | 31 | Object | Stage 1 验证快照，键 = bidId |
| `weeklyReports` | 29 | Object | `{users:{tony:{28:{...}},quoc:{},huong:{}}}` |
| `projectTracking` | 26 | Array | **Project Follow-up 全部记录** |
| `projects` | 25 | Array | 客户互动记录 |
| `customers` | 21 | Array | 客户 |
| `chambers` | 18 | Array | 商会 |
| `docSECTIONS` | 16 | Array | 文档库 9 大章节（同时存 localStorage） |
| `docDeletedSections` | 14 | Array | 已删章节回收站 |
| `meetingMinutes` | 10 | Object | `{seq, records:[], migVersion:3}` |
| `planTracking` | 9 | Array | 计划 2026 |
| `docItems` | 4 | Array | 文档条目（旧结构，已迁移） |
| `projectMOM` | 4 | Object | 项目会议纪要 |
| `projectRFI` | 3 | Object | 询价单 |
| `quarterly` | 2 | — | **已废弃**，`loadData()` 里 `delete data.quarterly` |

### 4.2 `projectTracking` 单条记录完整字段（`pfuSeed()`，10627 行）

```
{
  id, name, badge, badgeCls, type, client, ref,
  stage,                        // 6 阶段之一
  estValue, landArea, pic, start, target, progress,
  filledFromBid,                // ← 软链接到 bids[].projectName
  tasks: [ {stage, task, pic, date, note, status} ],
  log:   [ {date, type, title, note} ],
  contacts: [ ... ],            // pfuAddContact
  notes: [ ... ],               // pfuAddNote
  result: {status, dateISO, reason},   // Won / Lost / Cancelled
  analysis: { ... },            // can* 写入（丢标分析）
  cancel:   { ... }             // cra* 写入（取消分析）
}
```

**这是全系统字段最多的对象。** 一条记录最多能带 6 个子结构。

### 4.3 `bids` 单条记录字段

`id` `customerName` `projectName` `location` `landArea` `trackDate`（阶段日期）`stage`（阶段 1–6）`nextActionDate` `nextActionContent` `notes` `personInCharge` `email` `category`（A/B）`estimatedValue` `startDate`（任务建立日期）`stageContent`（已激活内容）`inactive`

### 4.4 `verify` 单条记录字段

```
data.verify[bidId] = {
  bidId, st:{...}, ko:[...], meta:{...}, note, noteAt,
  approval: { token, decision, decidedBy, decidedAt, reason, at }
}
```

`approval` 是**只增不改**的（注释 11621 行明确写 "ADDITIVE. No existing key is touched"）。

---

## 5. 存储层

### 5.1 localStorage 17 个键

| 键 | 次数 | 内容 | 丢了的后果 |
|---|---|---|---|
| `bms_logged_in` | 13 | `'1'` | 要重新登录 |
| `bms_doc_data` | 12 | 文档库 `docSECTIONS` | 文档库回到内置默认 9 章节 |
| `bms_data` | 4 | **全部主数据 JSON** | 本机数据全丢（云端还有） |
| `bms_lang` | 4 | `zh` / `en` | 回中文 |
| `wr_last_week` | 3 | 周报周号 | 回到当前周 |
| `_bms_restored` | 2 | 恢复标记 | — |
| `bms_options` | 2 | 表单下拉历史值 | 历史选项丢失 |
| `bms_mom_last` | 2 | 最后查看的 MOM id | 回到第一份 |
| `bms_wr_sub` | 2 | 周报子页签 | 回 Report |
| `bms_doc_migrated` | 2 | 迁移标记 | 会重跑迁移 |
| `shopping_mode_v2_members` | — | **Documents Collection 成员**（`MEMBERS_KEY`，9019 行） | 成员和 PIN 全丢 |
| `bms_plan_reset_done_v2` | 1 | 计划重置标记 | 可能重置计划 |
| `bms_plan_reset_done` | 1 | 旧标记 | — |
| `weeklyReports` | 1 | 旧版周报（遗留） | — |
| `_bms_backup_code` | 1 | 备份授权码 | — |
| `bms_clients` | 1 | 客户列表缓存 | — |
| `bms_cust_view` | 1 | 客户视图偏好 | — |

**注意**：`shopping_mode_v2_members` 是我第一次扫描漏掉的，因为它写在常量 `MEMBERS_KEY` 里而不是直接写在 `getItem()` 里。这类间接写法可能还有。

### 5.2 Firestore 路径 4 条（项目 `mgd-bms`）

| 路径 | 内容 | 写入方式 |
|---|---|---|
| `bms_data/master` | 整个 `data` 对象 | **全量覆盖**，1 MiB 硬上限 |
| `bms_data/master/snapshots/{YYYYMMDD_HHmmss}` | 每次覆盖前的自动快照 | `saveData()` 包装器里，覆盖前写 |
| `bms_data/doc_dc` | `{members, state:{cart,pickHistory}, docData, updatedAt, updatedBy}` | `dcCloudPush()`，400ms 防抖 |
| `approvals/{token}` | 审批单（冻结快照，30 天过期） | `apv*` 写，`approve.html` 读 |

---

## 6. 界面层

- **464 个 DOM id**
- **13 个弹窗**：`addModal` `adminModal` `calxModal` `canModal` `checkoutModal` `craModal` `downloadModal` `historyDetailModal` `locModal` `pifModal` `pinModal` `secModal` `subEditModal`
- **3 组重复 id**：
  - `searchInput` 2872（文档库）/ 8695（Documents Collection）→ 两个模块都有，`getElementById` 永远返回 2872 那个
  - `pmomMain` 9901 / 9902 → 同一段模板里出现两次
  - `rfiMain` 10317 / 10318 → 同上

**关于「221 个 id 没被 `getElementById` 引用」**：不能当死代码看。很多 id 是给 CSS、`querySelector`、打印模板或动态拼接用的。要判断真死代码需要逐个人工核，本次没做。

---

## 7. 缺陷清单

### A 级 · 会导致功能出错

| # | 位置 | 问题 |
|---|---|---|
| A1 | 7545 / 9697 | `showToast` 重复定义，旧签名调用显示 `undefined`（`momSave` 3820、`rfiNote` 10249） |
| A2 | 2872 / 8695 | `searchInput` id 重复，`getElementById` 只拿到文档库那个 |
| A3 | 137 处 | 空 `catch(e){}`，云端写入失败也不报错，界面照显示成功 |
| A4 | 3483 | `cInteractTotal = 125 + projInteractCount` —— 互动数永远多 125 |
| A5 | 2376 vs 4925 | 中标金额去重口径不一致：`resolveProj()` 说不看 Bid 的中标标记，`pfuWonRevenue()` 去重时却看它 → 同一项目可能被算两次 |

### B 级 · 数字会误导人

| # | 位置 | 问题 |
|---|---|---|
| B1 | 1630–1649 | `DB` 对象代码注释自己写着 `QUARTERLY SAMPLE DATA (demo only)`。Annual Target 页的合同数、中标率、毛利率、管道、线索、4 个 owner（Alex/Bella/Chris/Dana）、行业拆分全是写死的 |
| B2 | 4489 · 4938–4939 | `TARGET=1400`、`BUSINESS=250` 各硬编码在两处（4489 是合并声明，4938/4939 是分开声明），改目标要改代码 |
| B3 | 5111 | 综合统计「项目信息」= `bids.length`，**不排除已取消、不排除已完成**，跟其他卡口径不一致 |
| B4 | 5119 | 6 张阶段卡里，凡有 `result.status` 的全部塞进第 6 张 Result，不管实际停在哪个阶段 |

### C 级 · 脏但暂时不致命

| # | 位置 | 问题 |
|---|---|---|
| C1 | 3180 | `data.quarterly` 每次加载都 `delete`，但代码里还有 2 处引用 |
| C2 | 7108–7133 | 文档库有**双写**：既进 `bms_doc_data` 又进 `data.docSECTIONS`，靠 `bms_doc_migrated` 标记防重 |
| C3 | 9901 / 10317 | `pmomMain`、`rfiMain` 在同一段模板里重复出 id |
| C4 | `mgd-bms-mobile.html` | 手机版与主系统**不共享数据**，`sw.js` 也只缓存它。它现在是独立孤岛 |

---

## 8. 需要你确认 / 我还没做的

### 需要你确认

1. **`pfu-verify.html` 和 `approve.html` 算「内嵌子系统」还是「独立系统」？** 它们被 iframe 嵌进来，跟 `mgd-bms-mobile.html`（完全独立）性质不同。
2. **A4 的 125 是不是有意为之？** 如果是有意的历史基数，我在文档里标注；如果是 bug，要改。
3. **Annual Target 那页 demo 数据要不要换真数据？** 现在只有营收和投标数是真的，其余六项指标是假数字。

### 我还没做（第二步）

- **云端数据形状扫描**：每个集合的真实字段、空值率、异常值、`filledFromBid` 断链统计（多少投标在跟进表找不到对应）
- **localStorage 实际体积**：需要你在 Console 跑一句
- **死代码判定**：221 个未被 `getElementById` 引用的 id 逐个核

### 我需要你给的（第三步）

在浏览器按 F12：

1. Console 里所有红色报错
2. 控制台粘贴：`JSON.stringify(localStorage).length`
3. Network 面板过滤 `firestore`，看有没有红色失败

---

*本报告由脚本扫描生成，全部行号可在 `index.html` 中直接定位。*
