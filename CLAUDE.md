# 202610nagoya — 名古屋-高山 旅遊行程 Web App

## 專案概要

**旅遊日期：** 2026/10/01–10/06（6天5夜）
**目的地：** 名古屋 → 高山
**成員：** 思菡、俊毅、金燕、國峯、安安（共5人）
**用途：** 家人共同編輯行程的 Web App，透過 Firebase 即時同步

## 技術棧

- **框架：** React + Vite
- **樣式：** Tailwind CSS
- **資料庫：** Firebase Realtime Database（即時共編）
- **部署：** GitHub Pages（自動 CI/CD via GitHub Actions）

## Firebase 設定

金鑰放在 `.env.local`（不進 git）：
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 功能模組

| 模組 | 說明 |
|------|------|
| 每日行程時間軸 | Day 1（10/1）～ Day 6（10/6），可新增/編輯景點、標籤 |
| 預算追蹤 | 分類記帳（交通、住宿、餐食、購物、票券），顯示總計 |
| 打包清單 | 可勾選 checklist，支援即時同步 |
| 景點卡片 | 地點資訊卡，含標籤、備註、地圖連結 |

## 行程 Tag 對照

景點 / 交通 / 早餐 / 午餐 / 晚餐 / 點心 / 備案 / 裝備出租 / 教練 / 票券 / 住宿

## 資料來源

Notion 行程表（唯讀參考）：
https://www.notion.so/vanessa0715/a11610d27627835089d581fe63738df9

## 部署設定

- **平台：** GitHub Pages
- **Repo：** `Vanessa0715/202610nagoya`
- **CI/CD：** `.github/workflows/deploy.yml`，push to `main` 自動 build & deploy
- **發布網址：** https://vanessa0715.github.io/202610nagoya/
- **base path：** `vite.config.js` 已設 `base: '/202610nagoya/'`
- **GitHub Secrets：** 7 個 `VITE_FIREBASE_*` 已設定完成
- **GitHub Pages：** 已啟用（Source: GitHub Actions）

## 注意事項

- **絕對不修改 Notion 行程表**，Notion 僅作唯讀資料參考
- Firebase 金鑰由 Vanessa 自行填入 `.env.local`
- `.env.local` 已加入 `.gitignore`，不會進 git
- 家人透過 GitHub Pages 網址使用，不需要 `.env.local`（金鑰在 GitHub Secrets 裡）
