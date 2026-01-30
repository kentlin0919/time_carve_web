# TimeCarve (刻時) - Project Context & Rules

## 1. 專案概述 (Project Overview)
TimeCarve 是一個現代化的家教預約與媒合平台，專注於提供高效的時間管理與課程預約體驗。專案採用 **Next.js 16 (App Router)** 結合 **Clean Architecture** 架構開發，並使用 **Supabase** 作為後端服務（Auth, DB, Storage）。

## 2. 技術堆疊 (Tech Stack)

### Core
- **Framework**: Next.js 16.0.10 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS v4.0 (PostCSS)
- **State Management**: Zustand v5.0.9

### Backend & Services
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **ORM/Client**: @supabase/supabase-js (v2.88), @supabase/ssr
- **Database Types**: Auto-generated via Supabase CLI (`src/types/database.types.ts`)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint v9, eslint-config-next
- **Formatting**: Prettier (implied)
- **Icons**: Material Symbols (via Google Fonts/CDN), Lucide React (optional)

## 3. 系統架構 (Architecture)

本專案嚴格遵循 **Clean Architecture (整潔架構)** 原則，將關注點分離：

### 目錄結構 (`src/lib/`)
1.  **Domain Layer (`src/lib/domain/`)**
    *   **Entities**: 定義核心業務物件與型別 (e.g., `TeacherProfile`, `Course`).
    *   **Repository Interfaces**: 定義資料存取介面 (e.g., `TeacherRepository`).
    *   *規則*: 純 TypeScript，不依賴外部框架 (React/Next.js) 或實作細節 (Supabase)。

2.  **Application Layer (`src/lib/application/`)**
    *   **Use Cases**: 封裝具體的業務邏輯 (e.g., `BookCourseUseCase`).
    *   *規則*: 依賴 Domain Layer，協調 Repository 進行操作。

3.  **Infrastructure Layer (`src/lib/infrastructure/`)**
    *   **Implementations**: 實作 Domain 定義的 Repository (e.g., `SupabaseTeacherRepository`).
    *   *規則*: 處理具體的 API 呼叫、資料庫查詢 (Supabase SDK)。

4.  **Presentation Layer (`src/app/`, `src/components/`)**
    *   **UI Components**: React 組件。
    *   **Pages**: Next.js App Router 頁面。
    *   *規則*: 透過 Repository 或 Use Case 取得資料，負責渲染與使用者互動。

### 路由結構 (`src/app/`)
-   **(public)**: 公開頁面 (Landing, Course Catalog, Auth)。
-   **student**: 學生專用後台 (需登入 + Role Check)。
-   **teacher**: 教師專用後台 (需登入 + Role Check)。
-   **admin**: 系統管理員後台 (需登入 + Role Check)。

## 4. 關鍵開發規範 (Development Rules)

### Database & Migrations

- **Strict Migration Policy**: 禁止手動修改線上/本地資料庫結構。

- **Process**:

    1.  使用 `supabase migration new <description>` 建立 migration 檔案。

    2.  撰寫 SQL。

    3.  執行 `supabase db reset` 或 `supabase db push` 應用變更。

    4.  執行 `supabase gen types typescript --local > src/types/database.types.ts` 更新型別。

- **Data Recovery**: 如果有重置資料庫，必須使用以下指令恢復資料：

    ```bash

    psql postgres://postgres:postgres@localhost:54322/postgres -f data.sql

    ```

### Routing & Auth
-   **Middleware**: `src/middleware.ts` 處理 Session 更新。
-   **Auth Guards**: 使用 `AuthGuard.tsx` 或 Higher-Order Components 在 Client 端保護私有路由。
-   **Role Based Access**: 檢查 `user_info` 表中的身份或 metadata。

### Styling
-   使用 **Tailwind CSS v4**。
-   支援 **Dark Mode** (class strategy)。
-   保持 UI 一致性，參考現有組件 (`src/components/ui`).

### UI Notifications
-   **禁止使用 `toast()`**：所有使用者通知必須使用 `showModal()` (來自 `useModal` hook)。
-   **用法**：
    ```tsx
    import { useModal } from "@/components/providers/ModalContext";
    const { showModal } = useModal();
    
    // 成功訊息
    showModal({ type: "success", title: "儲存成功", description: "資料已更新", confirmText: "確定" });
    
    // 錯誤訊息
    showModal({ type: "error", title: "操作失敗", description: "請稍後再試", confirmText: "確定" });
    ```

## 5. 功能盤點（PM 視角）

### 產品概覽
-   **定位**：家教與學生的預約媒合平台。
-   **目標**：教師建立專業品牌並管理課程/學生；學生快速找到合適教師並完成預約。

### 角色與使用情境
-   **教師**：建立個人品牌、上架課程、管理預約與學生、追蹤營收。
-   **學生**：搜尋教師、預約課程、追蹤學習歷程。
-   **管理員**：管理用戶與平台規則。

### 功能模組清單
-   **公開端（Acquisition & Onboarding）**
    -   產品介紹/首頁 (`/`)
    -   教師列表 (`/teachers`)
    -   課程列表 (`/courses`)
    -   教師個人作品集/履歷 (`/portfolio/[id]`)
    -   使用者認證 (`/auth`: 登入/註冊/驗證/重設密碼)
    -   法務頁面 (`/legal`: 隱私/條款)
-   **教師端（Supply-side Ops）** (`/teacher`)
    -   教師儀表板（Dashboard）
    -   個人品牌管理（Profile & Portfolio 編輯）
    -   課程管理（Courses: 建立/編輯/上下架）
    -   可預約時段管理（Availability）
    -   預約管理（Bookings: 查看/審核/取消）
    -   學生管理（Students CRM）
    -   學員課程進度管理（Progress Tracking: 依學生更新教學進度、章節完成度、教學筆記）
    -   教案管理（Lesson Plans）
    -   收款/付款設定（Payments）
    -   報表分析（Reports: 營收/教學時數）
    -   通知中心（Notifications: 包含課前自動提醒郵件設定）
    -   系統設定（Settings: 通知偏好設定）
-   **學生端（Demand-side Ops）** (`/student`)
    -   學生儀表板（Dashboard）
    -   課程探索與詳情（Courses）
    -   預約流程（Booking Flow）
    -   我的預約（Bookings: 歷史/即將到來）
    -   學習進度與歷程（Progress: 查看課程百分比、章節完成狀態、教師評語）
    -   個人資料設定（Profile）
    -   通知中心（Notifications: 接收課前提醒郵件）
-   **管理員端（Platform Ops）** (`/admin`)
    -   管理員儀表板（Dashboard）
    -   使用者管理（Users: 總覽/權限）
    -   教師管理（Teachers: 審核/詳情）
    -   學生管理（Students）
    -   預約管理（Bookings: 平台視角）
    -   課程類型管理（Course Types）
    -   班級類型管理（Class Types）
    -   標籤管理（Tags）
    -   系統模組開關（Modules）
    -   全域設定（Settings）

### 核心功能操作流程 (Operational Flows)

#### 1. 教師：建立與管理課程 (Course Management)
-   **新增課程**:
    1.  進入「課程管理」頁面 (`/teacher/courses`)。
    2.  點擊右上角「新增教案」按鈕。
    3.  填寫基本資訊（標題、價格、時長、類型）、詳細介紹與章節內容。
    4.  設定狀態（草稿/啟用）並儲存。
-   **編輯課程**:
    1.  在左側列表選擇欲編輯的課程。
    2.  點擊右側詳情頁的「編輯」按鈕。
    3.  修改資訊後點擊「儲存變更」。
-   **預覽**: 點擊詳情頁下方的「預覽學生端頁面」查看實際呈現效果。

#### 2. 學生：預約課程 (Booking Flow)
-   **探索**: 在首頁 (`/`)、教師列表 (`/teachers`) 或課程列表 (`/courses`) 瀏覽並點擊感興趣的項目。
-   **選擇時段**:
    1.  進入課程/教師詳情頁，點擊「立即預約」。
    2.  在行事曆上選擇可預約的日期與時段（系統自動過濾忙碌時段）。
-   **確認與付款**:
    1.  確認預約資訊（時間、價格、備註）。
    2.  送出預約請求（若需付款則進入金流流程）。
-   **完成**: 系統顯示預約成功通知，並可在「我的預約」中查看狀態。

#### 3. 教師：設定可預約時段 (Availability)
-   **常態排班**: 進入「可預約時段管理」 (`/teacher/availability`)，設定每週固定的可預約時間（如：每週一 09:00-12:00）。
-   **例外調整**: 針對特定日期設定「休假」或「加開時段」以覆蓋常態規則。

#### 4. 管理員：審核教師 (Teacher Verification)
-   **待審核列表**: 進入「教師管理」 (`/admin/teachers`)，篩選狀態為 `pending` 的教師。
-   **審查**: 檢視教師提交的個人資料、證照與介紹。
-   **決策**: 點擊「通過審核」開通權限，或「退回」並填寫原因。

#### 5. 教師：設定自動提醒 (Auto Reminders)
-   **功能開啟**: 進入「系統設定」或「通知中心」 (`/teacher/settings`)。
-   **設定時間**: 選擇「課前提醒時間」（如：30 分鐘前）。
-   **自動化流程**: 系統將根據設定，自動在課程開始前向學生與教師發送提醒郵件。

### 5.2 新增功能規劃：學員課程進度追蹤 (Student Course Progress Tracking)

此功能旨在讓教師能針對特定學生，依據其購買或參與的課程，紀錄教學進度與學習狀況。

#### 1. 資料庫變更 (Database Schema)
新增資料表 `student_course_progress` 以紀錄進度：
-   **`id`** (UUID, PK): 主鍵。
-   **`student_id`** (UUID, FK): 關聯至 `student_info`。
-   **`course_id`** (UUID, FK): 關聯至 `courses`。
-   **`teacher_id`** (UUID, FK): 關聯至 `teacher_info` (便於查詢與權限控制)。
-   **`status`** (String): 狀態 (e.g., `not_started`, `in_progress`, `completed`)。
-   **`progress_percentage`** (Integer): 整體進度百分比 (0-100)。
-   **`current_section_id`** (String): 目前所在的章節 ID (對應 Course `sections` JSON)。
-   **`completed_section_ids`** (JSONB): 已完成的章節 ID 列表。
-   **`teacher_notes`** (Text): 教師私密筆記（僅教師可見）。
-   **`updated_at`** (Timestamp): 最後更新時間。

#### 2. 後端邏輯 (Server Actions)
檔案路徑: `src/app/actions/progress.ts`
-   **`getStudentCourseProgress(studentId: string)`**: 取得特定學生的所有課程進度列表。
-   **`updateProgress(progressId: string, data: Partial<Progress>)`**: 更新進度（包含百分比、狀態、筆記）。
-   **`initializeProgress(studentId: string, courseId: string)`**: 當學生首次預約或購買課程時，初始化進度紀錄。

#### 3. UI 設計與流程 (UI/UX)
-   **教師端 (`/teacher/students`)**:
    -   在 **學生詳情頁** 新增「課程進度」頁籤 (Tab)。
    -   顯示該學生關聯的課程列表卡片。
    -   點擊卡片展開編輯區：
        -   **進度條**: 拖拉或輸入百分比。
        -   **章節檢核**: 勾選已完成的章節 (Mapping 課程的 `sections` 資料)。
        -   **教學筆記**: 文字輸入框 (Auto-save)。
-   **學生端 (`/student/progress`)**:
    -   查看自己所有課程的學習進度條與狀態。
    -   (未來擴充) 查看教師開放的評語或建議。

### 5.3 新增功能規劃：自動課前提醒郵件 (Automatic Course Reminder Emails)

此功能允許教師設定課程開始前的提醒時間，系統將自動寄送郵件提醒學生與教師，降低缺席率。

#### 1. 資料庫變更 (Database Schema)
-   **`teacher_info`** (新增設定欄位):
    -   **`reminder_minutes`** (Integer): 課程前幾分鐘發送提醒 (預設 30)。
    -   **`enable_email_reminders`** (Boolean): 是否啟用此功能。
-   **`bookings`** (新增狀態欄位):
    -   **`reminder_sent`** (Boolean): 是否已發送提醒 (預設 false)。
    -   **`reminder_sent_at`** (Timestamp): 實際發送時間。

#### 2. 後端邏輯 (Backend Logic)
-   **排程機制 (Cron Job)**:
    -   使用 **Supabase Edge Functions** 搭配 `pg_cron` (或外部 Cron 服務)。
    -   頻率：每 5 或 10 分鐘執行一次檢查。
    -   邏輯：
        1.  查詢 `bookings` 中 `status = 'confirmed'` 且 `reminder_sent = false` 的預約。
        2.  Join `teacher_info` 取得該教師設定的 `reminder_minutes`。
        3.  若 `now() >= booking.start_time - interval (reminder_minutes)`，則觸發發信。
        4.  發信成功後，更新 `bookings.reminder_sent = true`。
-   **郵件服務**:
    -   整合 Resend 或 SendGrid 發送 Transactional Emails。
    -   郵件內容包含：課程名稱、時間、Zoom/Meet 連結、注意事項。

#### 3. UI 設計與流程 (UI/UX)
-   **教師端 (`/teacher/settings`)**:
    -   新增「通知與提醒」區塊。
    -   設定選項：「課前提醒時間」(15分, 30分, 1小時, 2小時...)。
    -   預覽提醒信內容功能。

### 5.4 新增功能規劃：Google Calendar 雙向同步

此功能旨在串接 Google Calendar API，實現平台預約與外部行事曆的即時同步。

#### 1. 核心規範 (Core Rules)
- **自動同步**: 當預約狀態轉為 `confirmed` 時，自動在教師與學生的 Google Calendar 建立行程。
- **遠端教學連結**: 若課程標記為「遠端教學」，在建立行程時**必須透過 API 自動產生並附上 Google Meet 連結**。
- **異動通知**: 若平台上的預約時間異動或取消，需同步更新/刪除對應的 Google Calendar 行程。

#### 2. 技術重點 (Technical Points)
- 使用 Google Calendar API 的 `conferenceData` 欄位來生成 Google Meet。
- 儲存 `google_event_id` 於 `bookings` 表中以便追蹤與異動。

### 主要用戶流程
-   **教師**：註冊 → 建立個人品牌 → 上架課程 → 設定可預約時段 → 接收預約 → 授課 → 記錄學員/收入。
-   **學生**：瀏覽教師/課程 → 選擇時段 → 預約 → 上課 → 查看學習紀錄。
-   **管理員**：審核教師 → 管理分類/標籤 → 控制模組 → 監控平台運作。

### 功能狀態（README 標示）
-   **Google Calendar 雙向同步**：開發中。
-   **其他功能**：以現有頁面為準，細節需核對每頁 UI 與 API。

## 6. 記憶庫 (Memory Bank)
*此區域由 Agent 維護，記錄使用者偏好與重要決策*

-   **User Language**: Traditional Chinese (繁體中文).
-   **Project Specifics**:
    -   使用 `pnpm` 進行套件管理。
    -   目前正在開發「教師個人檔案編輯」與「課程管理」功能。
    -   DB Schema 包含 `user_info` (通用), `teacher_info` (教師詳情), `student_info`, `courses`, `bookings`.
    -   **Test Credentials**:
        -   Account: `teacher@test.com`
        -   Password: `Kent0919`

## 7. 測試與驗證流程 (Testing & Verification Workflows)

### 流程 A: 透過管理員新增教師帳號 (Create Teacher via Admin)
1.  **管理員登入 (Admin Login)**
    *   **URL**: `/auth/login`
    *   **帳號**: `kent900919@gmail.com`
    *   **密碼**: `0919`
2.  **建立帳號 (Create Account)**
    *   進入 **管理員後台** > **使用者管理** (`/admin/users`)。
    *   點擊「新增使用者」或類似按鈕。
    *   **姓名**: `new`
    *   **Email**: `teacher@test.com`
    *   **初始密碼**: `900919`
    *   **角色**: `teacher`
3.  **教師首次登入 (First Login)**
    *   登出管理員帳號。
    *   使用新帳號登入 (`teacher@test.com` / `900919`)。
    *   (若系統強制要求) **修改密碼**: 新密碼設定為 `Kent0919`。
4.  **建立學生帳號 (Create Student Account)**
    *   進入 **管理員後台** > **使用者管理** (`/admin/users`)。
    *   點擊「新增使用者」或類似按鈕。
    *   **姓名**: `new`
    *   **Email**: `student@test.com`
    *   **初始密碼**: `900919`
    *   **角色**: `student`
    *   **teacher_code**: 請尋找教師的 `teacher_code`。


## 8. Agent 行為準則 (Agent Directives)
1.  **優先使用 Context7**: 回答複雜問題前，先查詢相關文檔。
2.  **資料驅動**: 分析問題時，優先查看資料庫 Schema (`src/types/database.types.ts`) 確認欄位。
3.  **代碼一致性**: 產生程式碼時，必須遵循 Clean Architecture 分層結構。
4.  **繁體中文回應**: 所有對話與解釋預設使用繁體中文。
