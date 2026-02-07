# TimeCarve (刻時) - Project Context & Rules

> **最後更新時間**: 2026-02-07
> **核心架構**: 基於 Clean Architecture 的 **「時數充值信用制 (Credit Model)」** 家教預約平台。

## 1. 專案概述 (Project Overview)
TimeCarve 是一個專注於「學習歷程連續性」的家教預約平台。不同於傳統以「單次課程」為單位的系統，本專案以 **「時數資產 (Credits)」** 與 **「學習進度 (Progress)」** 為核心，打造流暢的「預約即扣點」體驗。

## 2. 技術堆疊 (Tech Stack)
-   **Framework**: Next.js 16.0.10 (App Router)
-   **Database**: Supabase (PostgreSQL) + RLS Policies
-   **Storage**: Supabase Storage (用於作品集媒體與富文本圖片)
-   **State**: Zustand v5
-   **Styling**: Tailwind CSS v4

## 3. 全功能規格詳解 (Functional Specifications)

### 3.1 核心引擎：預約與充值 (Booking & Recharge Engine)

#### 3.1.1 預約建立 (Create Booking)
*   **進入點**: `/student/booking/create`
*   **邏輯分支**:
    *   **情境 A: 餘額充足 (Direct Booking)**: 直接扣除時數並建立預約。
    *   **情境 B: 餘額不足，隨單購買 (Book & Buy)**: 自動建立新方案充值紀錄並同步預約。
    *   **情境 C: 僅購買方案 (Purchase Only)**: 若老師尚未排班，支援「先買時數、後約時間」，並自動初始化進度。

#### 3.1.2 時數充值 (Credit Recharge)
*   **進入點**: `/student/progress` (自定義充值彈窗)
*   **功能**: 學生可自訂購買小時數，系統即時試算金額，並建立線下付款申請。

### 3.2 作品集與內容管理 (Portfolio & Content Management)

#### 3.2.1 進階富文本編輯器 (Enhanced Rich Text Editor)
*   **功能**: 基於 TipTap 實作，支援完整的樣式編輯。
*   **圖片上傳**: 支援 **拖放 (Drag & Drop)**、**剪貼簿貼上 (Paste)** 與檔案選擇。
*   **背景處理**: 圖片自動上傳至 `portfolio-media` bucket，並返回持久化公開 URL。

#### 3.2.2 作品集藝廊 (Gallery UI)
*   **位置**: `/teachers/[code]/portfolio`
*   **設計**: 採用回應式網格佈局 (4:3 比例)，具備細緻的陰影 (Shadow) 與懸停 (Hover) 動畫效果。
*   **互動**: 支援按分類 (Category) 快速篩選作品。

### 3.3 教師營運中心 (Teacher Operations)

#### 3.3.1 預約與審核 (Booking Review)
*   **功能**: 儀表板一鍵 `Confirm` 或 `Reject`。確認預約即視為雙方已達成線下付款共識。

#### 3.3.2 營收報表與匯出 (Financial Reports)
*   **報表維度**: 提供本月預估收入、實收金額、逾期款項統計。
*   **進階匯出**: 支援匯出詳細 CSV 報表，包含教師資訊、課程收入分佈佔比、以及完整的交易明細與狀態。

### 3.4 學生端功能 (Student Scope)

#### 3.4.1 學習進度儀表板 (Progress Dashboard)
*   **視覺化**: 雙環圖表顯示總體完成率，課程卡片整合了「時數餘額」與「單元檢核表」。
*   **快速入口**: 時數充足時顯示「預約下次課程」，時數耗盡時自動變更為「續購方案」。

#### 3.4.2 教師諮詢 (Teacher Consultation)
*   **功能**: 在作品集與教師頁面提供「諮詢老師」按鈕，透過 Modal 顯示老師的聯繫 Email 與電話。

---

## 4. 資料庫與存取架構 (Database & Storage)

### 4.1 核心實體
-   **`course_purchases`**: 紀錄時數資產，包含 `total_hours` 與 `remaining_hours`。
-   **`student_course_progress`**: 紀錄學習狀態，與課程包購買行為深度連動。
-   **`portfolio-media` (Storage)**: 儲存作品集封面、富文本插圖等媒體檔案。

### 4.2 開發規則
-   **Server Actions 優先**: 涉及時數計算 (Remaining Hours) 與狀態變更的邏輯必須封裝於 Server Action。
-   **圖片處理**: 嚴禁在資料庫儲存 Base64，所有圖片必須通過 `uploadContentImage` 上傳至 Storage。

## 5. 記憶庫 (Memory Bank)
-   **Language**: Traditional Chinese (繁體中文).
-   **Operational Flow**: 學生瀏覽 -> 隨預約充值 -> 自動建立進度 -> 老師線下收費後確認預約 -> 雙方追蹤進度。
-   **Last Update**: 已實作富文本圖片上傳與作品集介面美化。