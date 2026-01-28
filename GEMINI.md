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
-   **Strict Migration Policy**: 禁止手動修改線上/本地資料庫結構。
-   **Process**:
    1.  使用 `supabase migration new <description>` 建立 migration 檔案。
    2.  撰寫 SQL。
    3.  執行 `supabase db reset` 或 `supabase db push` 應用變更。
    4.  執行 `supabase gen types typescript --local > src/types/database.types.ts` 更新型別。

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
    -   產品介紹/首頁
    -   教師列表
    -   課程列表
    -   使用者認證（登入/驗證/忘記密碼/重設）
    -   法務頁面（隱私/條款）
-   **教師端（Supply-side Ops）**
    -   教師儀表板（總覽）
    -   個人品牌頁面（Profile/Portfolio）
    -   課程管理（建立/管理/預覽）
    -   可預約時段管理
    -   預約管理
    -   學生管理（CRM）
    -   教案管理
    -   收款/付款管理
    -   報表（含營收）
    -   通知與設定
-   **學生端（Demand-side Ops）**
    -   學生儀表板（總覽）
    -   課程探索與詳情
    -   預約流程（建立/成功/失敗）
    -   預約列表與詳情
    -   學習進度
    -   通知
    -   個人資料
-   **管理員端（Platform Ops）**
    -   管理員儀表板
    -   用戶管理（含教師/學生）
    -   教師審核/新增
    -   課程分類/類型管理
    -   標籤管理
    -   模組開關
    -   系統設定

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
-   **User Context**:
    -   目前在台北 (大安區) 尋找租屋，看房日期 2025/12/30, 31 (Historic context).
    -   專案開發環境為 macOS (Darwin).
-   **Project Specifics**:
    -   使用 `pnpm` 進行套件管理。
    -   目前正在開發「教師個人檔案編輯」與「課程管理」功能。
    -   DB Schema 包含 `user_info` (通用), `teacher_info` (教師詳情), `student_info`, `courses`, `bookings`.
    -   **Test Credentials**:
        -   Account: `teacher@test.com`
        -   Password: `Kent0919`

## 7. Agent 行為準則 (Agent Directives)
1.  **優先使用 Context7**: 回答複雜問題前，先查詢相關文檔。
2.  **資料驅動**: 分析問題時，優先查看資料庫 Schema (`src/types/database.types.ts`) 確認欄位。
3.  **代碼一致性**: 產生程式碼時，必須遵循 Clean Architecture 分層結構。
4.  **繁體中文回應**: 所有對話與解釋預設使用繁體中文。
