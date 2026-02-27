# TimeCarve (刻時) - Project Context & Rules

> **最後更新時間**: 2026-02-27
> **核心模式**: 技術合夥人模式 (Technical Partnership) - 雙軌營收架構

## 1. 專案概述 (Project Overview)
TimeCarve 是一個以「學習歷程連續性」為核心的家教管理系統。本專案以 **「時數資產 (Credits)」** 與 **「學習進度 (Progress)」** 為核心，透過技術入股模式，由開發者與工作室共同負擔成本並共享營收紅利。

---

## 2. 商業模式與計費準則 (Business & Billing Rules)

### 2.1 雙軌營收結構 (Dual-Track Revenue)
系統自動計算以下兩項費用，作為平台營運與技術分潤：

#### 2.1.1 收入 A：教師端 (平台訂閱費)
依據當月**「活躍教師人數」**級距計費：
- **1 位**: $1,500 / 月
- **2-3 位**: $2,500 / 月
- **4-5 位**: $3,500 / 月
- **6 位以上**: 另行報價
- **活躍定義**: 當月有至少一筆狀態為「已付款」之預約紀錄之教師。

#### 2.1.2 收入 B：學生端 (預約分潤)
- **標準**: $150 TWD / 人次。
- **觸發條件**: 每成功完成一筆預約（狀態標記為「已付款」或「已完成」）。
- **保底機制**: 若單月分潤總額低於 $500 TWD，則以 **$500** 計收。

### 2.2 自動化停權機制 (Automated Enforcement)
- **結算流程**: 每月 1 號自動產出前月帳單，繳費期限為 **10 天**。
- **停權判定**: 若超過截止日 10 天仍未繳費（結算日後 20 天），系統自動將 `user_info.is_active` 設為 `false`。
- **鎖定範圍**: 全站功能鎖定，僅保留「聯繫管理員」與「帳單明細」查看功能。

---

## 3. 技術堆疊 (Tech Stack)
- **Framework**: Next.js 16.0.10 (App Router)
- **Database**: Supabase (PostgreSQL) + RLS Policies
- **Storage**: Supabase Storage (`portfolio-media` 用於媒體儲存)
- **State**: Zustand v5 / React Context
- **Styling**: Tailwind CSS v4

---

## 4. 頁面架構與功能詳解 (Page Analysis)

### 4.1 公開端 (Public Scope)
- **首頁 (`/`)**: 品牌願景、熱門教師推薦、平台特色介紹。
- **教師名錄 (`/teachers`)**: 全站教師列表與篩選。
- **教師個人頁 (`/teachers/[teacherCode]`)**: 教師介紹、**作品集藝廊**、可授課程列表。
- **課程詳情 (`/courses/[courseId]`)**: 單一課程的教學大綱與費用試算。
- **身分驗證 (`/auth`)**: 登入、註冊、忘記密碼、以及針對新用戶的 **Onboarding 引導流程**。

### 4.2 學生端 (Student Scope)
- **學生儀表板 (`/student/dashboard`)**: 學習進度雙環圖、時數餘額、今日課程提醒。
- **預約系統 (`/student/booking/create`)**: 選擇課程 -> 選擇時段 -> **餘額判斷 (不足則觸發隨單購買)**。
- **我的課程 (`/student/courses`)**: 紀錄所有購買過的課程方案與剩餘時數。
- **學習進度 (`/student/progress`)**: 針對單一課程的單元檢核表與歷史筆記。
- **通知中心 (`/student/notifications`)**: 課程異動、付款提醒。

### 4.3 教師端 (Teacher Scope)
- **教師儀表板 (`/teacher/dashboard`)**: 本月營收統計、待確認預約、今日課表。
- **課程管理 (`/teacher/courses`)**: 編輯課程內容、設定定價、上傳展示圖片。
- **排班系統 (`/teacher/availability`)**: 以週為單位的排班日曆，設定可供預約時段。
- **學生管理 (CRM) (`/teacher/students`)**: 查看學員名冊、編輯學生專屬學習進度、管理其時數資產。
- **作品集管理 (`/teacher/portfolio`)**: 基於 TipTap 的進階編輯器，展示教學成果。
- **營運報表 (`/teacher/reports`)**: 詳細的營收組成分析與 CSV 匯出。

### 4.4 管理員端 (Admin Scope)
- **管理儀表板 (`/admin/dashboard`)**: 全站數據總覽（總師生數、總預約、總營收）。
- **平台帳單 (`/admin/billing`)**: **核心對帳功能**，顯示每月底薪、分潤明細與收款狀態。
- **教師審核 (`/admin/teachers`)**: 審核新入駐教師身分、開關其營運權限。
- **系統設定 (`/admin/settings`)**: 全站模組配置與標籤管理。

---

## 5. 核心操作流程 (Operational Flows)

### 5.1 學生預約與學習流 (Student Journey)
1. **瀏覽與選擇**: 瀏覽首頁或教師頁 -> 選擇課程詳情。
2. **預約確認**: 選擇時段 -> 系統檢查時數餘額 -> (餘額不足) 進行隨單充值 -> (餘額充足) 扣抵時數建立預約。
3. **完成與評價**: 課程結束後，教師標記完成 -> 學生查看進度更新與教師回饋。

### 5.2 教師營運流 (Teacher Journey)
1. **內容建置**: 編輯個人資料 -> 建立課程方案 -> 撰寫作品集。
2. **時段發佈**: 在 Availability Calendar 開放可預約時間。
3. **預約管理**: 收到預約通知 -> 確認付款 (Confirm) -> 更新學生學習單元。

### 5.3 平台結算與自動執法流 (Admin & Platform Lifecycle)
1. **每月 1 號**: 系統自動抓取「上月已付款預約」，產出平台帳單。
2. **10 日緩衝**: 客戶查看帳單並進行線下繳款給開發者。
3. **收款確認**: 管理員點擊「確認收款」-> 帳單狀態變更為 `paid`。
4. **逾期懲罰**: 結算日後 20 天若帳單未結，系統自動鎖定全站 `is_active = false`。

---

## 6. 技術規則與記憶庫 (Technical Rules & Memory)
- **Server Actions 優先**: 所有金額扣抵、帳單計算、權限鎖定必須在後端執行。
- **資料庫誠信**: 嚴禁私下繞過系統預約，違者追回 5 倍分潤罰金。
- **Language**: 繁體中文 (Traditional Chinese)。
- **Exit Strategy**: 支持 10 萬 TWD 買斷原始碼退場合約。
