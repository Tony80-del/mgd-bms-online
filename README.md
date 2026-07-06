# BMS - Business Management System 业务管理系统

## 完全备份说明 / Full Backup Instructions

### 📦 包含文件
| 文件 | 大小 | 说明 |
|------|------|------|
| `index.html` | 163 KB | 主应用文件（含所有 HTML/CSS/JS） |
| `logo.png` | 16 KB | Logo 图片 |
| `BMS_Full_localStorage_2026-07-06.json` | 113 KB | **完整真实数据备份** |
| `README.md` | — | 说明文件 |

### 📊 数据内容（完整）
```
bids:       29 items   (投标项目)
customers:  319 items  (客户)
projects:   3 items    (客户互动)
chambers:   23 items   (商会)
quarterly:  4 keys     (季度数据)
planTracking: 17 items (2026计划)
```

### 🚀 启动方式（100% 还原）
直接双击 `index.html` 用浏览器打开即可运行。

### 💾 数据恢复（导入完整数据）
1. 打开浏览器 DevTools（F12）→ Application → Local Storage
2. 找到你的 `index.html` 文件 URL
3. 点击 `bms_data` → Edit → 清除现有内容
4. 打开 `BMS_Full_localStorage_2026-07-06.json`，复制全部内容粘贴进去
5. 按回车 → 刷新页面

### 📁 GitHub 仓库结构
```
bms/
├── index.html
├── logo.png
├── BMS_Full_localStorage_2026-07-06.json
└── README.md
```
