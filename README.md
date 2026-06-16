# EXCT-Vexor - EVE Online 舰船配置展示网站 / EVE Online Fit Viewer

一个基于 XML 驱动的静态舰船配置展示网站生成器，专为 EVE Online 玩家设计，具有中英文双语支持、装备替代选择、截图分享、EFT 格式导入导出等功能。

A static fit viewer website generator powered by XML, designed for EVE Online players with bilingual support (Chinese/English), equipment alternative selection, screenshot sharing, and EFT format import/export.

---

## 功能特点 / Features

- **📋 配置系列** — 将散落的配置按照合集 → 系列 → 变种 → 版本分层，更科学高效的组织形式
- **🔧 装备替代** — 支持 `==` 语法一键切换替代装备，同时包含植入体显示
- **📸 截图分享** — 一键生成配置卡片截图，静态链接分享
- **📤 EFT 导出** — 选择替代装备后一键导出标准 EFT 格式文本
- **⚙️ 基于 XML 的生成器** — 任何人都可以轻松 Fork，修改 `fits/` 文件夹生成属于你的配置站
- **📱 移动端 · 🌙 双色 · 🌍 双语** — 响应式设计、亮/暗主题、中英文切换

---

## 数据组织 / Data Organization

### 层级结构 / Hierarchy

```
_main.xml                    → 主配置（标题、页脚、联系方式）
  └── _collection.xml        → 合集（url, name, description）
       └── _series.xml       → 系列（url, name, description）
            └── {name}.xml   → 配置（装备列表）
                 └── branch  → 分支（bname, note, alert）
                      └── fit → 版本（version）
```

### XML 装备格式 / Equipment Format

```xml
<fit version="1">
  [Ship Name]
  [low]
  Damage Control II
  Gyrostabilizer II == Republic Fleet Gyrostabilizer    <!-- == 表示替代 -->
  1400mm 'Scout' Artillery I , Republic Fleet EMP L    <!-- 逗号后为弹药 -->
  Ballistic Control System II #                         <!-- # 表示离线 -->
  [drone]
  Hornet I x5                                          <!-- 无人机数量 -->
  [cargo]
  Republic Fleet EMP L x4000                           <!-- 货舱弹药数量 -->
</fit>
```

## 添加新配置 / Adding New Fits

1. 在对应系列的目录下创建 `{url}.xml`
2. 按上述格式填写装备（可以参考现有配置文件和仿写）
3. 运行 `npm run compile` 自动编译到 `fitsData.ts`
4. 运行 `npm run dev` 即可预览

---

## 快速开始 / Getting Started

```bash
# 安装依赖 / Install dependencies
npm install

# 需要 SDE 数据文件（首次构建）
# 将 https://github.com/EX-CT/EVESDE 的 types_zh.jsonl 放到项目根目录

# 开发模式 / Start dev server
npm run dev

# 构建 / Build for production
npm run build

# 预览 / Preview build
npm run preview

# 部署到 GitHub Pages / Deploy to GitHub Pages
npm run deploy
```

---


## 许可证 / License

MIT License

Copyright (c) 2025 Elwina

---

## 游戏内捐款 / In-Game Donation

游戏人物 / Character: **Vardal**

欢迎在 EVE Online 内向 Vardal 捐款 ISK，您的支持是我们持续开发的动力！

Feel free to donate ISK to Vardal in-game. Your support keeps this project going!
