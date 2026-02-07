# TimeCarve (刻時) - Project Context & Rules

> **最後更新時間**: 2026-02-07
> **核心架構**: 基於 Clean Architecture 的 **「時數充值信用制 (Credit Model)」** 家教預約平台。

## 1. 專案概述 (Project Overview)
TimeCarve 是一個專注於「學習歷程連續性」的家教預約平台。不同於傳統以「單次課程」為單位的系統，本專案以 **「時數資產 (Credits)」** 與 **「學習進度 (Progress)」** 為核心，打造流暢的「預約即扣點」體驗。

## 2. 技術堆疊 (Tech Stack)
-   **Framework**: Next.js 16.0.10 (App Router)
-   **Database**: Supabase (PostgreSQL) + RLS Policies
-   **State**: Zustand v5
-   **Styling**: Tailwind CSS v4

## 3. 全功能規格詳解 (Functional Specifications)

本章節詳細定義系統各模組的行為邏輯、資料流向與邊界條件。

---

### 3.1 核心引擎：預約與充值 (Booking & Recharge Engine)

#### 3.1.1 預約建立 (Create Booking)
*   **進入點**: `/student/booking/create`
*   **輸入**: `courseId`, `bookingDate`, `startTime`, `endTime`
*   **前置檢核**:
    1.  **時段可用性**: 檢查 `teacher_availability_weekly` 與 `overrides`，確認該時段是否被老師設為開放。
    2.  **衝突檢核**: 檢查 `bookings` 表，確認該時段未被佔用。
*   **邏輯分支**:
    *   **情境 A: 餘額充足 (Direct Booking)**
        *   **條件**: 學生持有該課程的 `active` Purchase，且 `remaining_hours >= 預約時數`。
        *   **動作**:
            1.  建立 `bookings` (status: `pending`)。
            2.  扣除 `course_purchases.remaining_hours`。
            3.  記錄 `bookings.purchase_id`。
    *   **情境 B: 餘額不足，隨單購買 (Book & Buy)**
        *   **條件**: 無 Purchase 或餘額不足。
        *   **動作**:
            1.  建立新的 `course_purchases` (依課程定價與總時數)。
            2.  初始化 `student_course_progress` (若尚未存在)。
            3.  執行上述「情境 A」的動作 (扣除新 Purchase 的時數)。
    *   **情境 C: 僅購買方案 (Purchase Only)**
        *   **條件**: 老師當日無開放時段，但學生仍想購買。
        *   **動作**: 僅建立 `course_purchases` 與初始化進度，不建立 `bookings`。

#### 3.1.2 時數充值 (Credit Recharge)
*   **進入點**: `/student/progress` (自定義充值)
*   **邏輯**:
    *   學生可自由輸入欲購買的小時數 (不限於教案預設)。
    *   系統計算總價 (單價 x 小時數)。
    *   建立 `course_purchases` (status: `active`)。
    *   **注意**: 這是「線下付款」，系統不處理金流，僅記錄應收帳款。

---

### 3.2 學習進度系統 (Progress Tracking System)

#### 3.2.1 進度初始化 (Initialization)
*   **觸發點**: 學生首次購買某課程的時數 (`Purchase` Created)。
*   **行為**: 系統自動在 `student_course_progress` 表中建立一筆紀錄。
*   **初始狀態**: `status='not_started'`, `percentage=0`, `completed_sections=[]`。

#### 3.2.2 進度儀表板 (Student Dashboard)
*   **頁面**: `/student/progress`
*   **資料聚合**:
    *   **時數**: 加總該課程所有 `active` Purchase 的 `remaining_hours`。
    *   **進度**: 讀取 `progress_percentage` 與 `completed_section_ids`。
    *   **課程**: 關聯 `courses` 表取得單元列表。
*   **視覺化**: 雙環圖表顯示「總體完成率」，卡片顯示個別課程的「時數水位」與「單元檢核表」。

---

### 3.3 教師營運中心 (Teacher Operations)

#### 3.3.1 預約審核 (Booking Review)
*   **頁面**: `/teacher/dashboard` (首頁)
*   **功能**:
    *   **一鍵確認**: 點擊 `Check` 按鈕 -> 更新 `bookings.status` 為 `confirmed`。此動作代表老師確認「時間無誤」且「款項已處理(若為新購)」。
    *   **一鍵婉拒**: 點擊 `Close` 按鈕 -> 更新 `bookings.status` 為 `cancelled` -> 觸發時數退還邏輯 (若已扣點)。

#### 3.3.2 排班管理 (Availability Management)
*   **頁面**: `/teacher/availability`
*   **雙層邏輯**:
    1.  **Base Layer (每週規則)**: 設定通用的上班時間 (e.g., 週一 09:00-18:00)。
    2.  **Override Layer (例外調整)**: 針對特定日期 (e.g., 2026-02-10) 設定「休假」或「加開時段」。
*   **優先權**: 預約檢核時，優先讀取 Override，若無則讀取 Weekly。

#### 3.3.3 帳務報表 (Financial Reports)
*   **頁面**: `/teacher/payments`
*   **資料來源**: 唯讀。完全由 `bookings` 資料表衍生。
*   **計算邏輯**:
    *   **應收 (Projected)**: 所有 `pending` + `confirmed` + `completed` 的預約/購買總額。
    *   **實收 (Received)**: 僅 `confirmed` + `completed` 的總額。
    *   **逾期**: 預約時間已過但狀態仍為 `pending` 的款項。

---

### 3.4 公開與導流 (Public & Acquisition)

#### 3.4.1 真實課程展示 (Real-time Catalog)
*   **頁面**: `/courses`, `/teachers/[code]`
*   **資料**: 直接讀取 `courses` 表中 `is_active=true` 且老師 `is_public=true` 的資料。
*   **導流**: 點擊預約按鈕時，會檢查 `Supabase Auth` 狀態。
    *   **未登入**: 跳轉至 `/auth/login`，並攜帶 `?redirect=...` 參數，登入後自動導回預約頁。
    *   **已登入**: 直接進入 `/student/booking/create`。

---

## 4. 資料庫架構 (Database Schema)

### 4.1 核心實體關聯
-   **`user_info`**: 使用者基底 (ID, Email, Name)。
-   **`teacher_info`**: 擴充資料 (Bio, Pricing, Availability 設定)。
-   **`courses`**: 課程定義 (Title, Price, Sections JSON)。
-   **`course_purchases`**: **(關鍵)** 學生持有的時數資產。
    -   `total_hours`: 購買量。
    -   `remaining_hours`: 餘額 (隨 `bookings` 扣除)。
-   **`bookings`**: 預約紀錄 (消耗資產)。
    -   `purchase_id`: FK -> `course_purchases`。
-   **`student_course_progress`**: 學習狀態。
    -   `completed_section_ids`: JSON Array，紀錄已完成的單元 ID。

## 5. 開發守則 (Dev Guidelines)

### 5.1 狀態機規則 (State Machine Rules)
-   **Booking Status**:
    -   `pending`: 初始狀態。
    -   `confirmed`: 老師已核准 (款項/時間無誤)。
    -   `cancelled`: 取消 (需退還時數)。
    -   `completed`: 課程結束 (系統排程或手動標記)。
-   **Purchase Status**:
    -   `active`: 可用。
    -   `completed`: `remaining_hours` 歸零。
    -   `expired`: 超過有效期限 (未來功能)。

### 5.2 安全性 (Security)
-   **RLS Policies**: 所有資料庫存取必須通過 Row Level Security。
    -   學生只能讀取自己的 Purchase/Booking。
    -   老師只能讀取自己學生的相關資料。
-   **Server Actions**: 涉及金錢與時數修改的邏輯，必須在 Server Action 中執行，嚴禁在 Client 端直接操作 `course_purchases`。

## 6. 記憶庫 (Memory Bank)
-   **Language**: Traditional Chinese (繁體中文).
-   **Current State**: 核心「信用制」邏輯已實作完成。公開端已對接真實數據。
