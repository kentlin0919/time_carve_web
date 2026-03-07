# TimeCarve 功能盤點與權限/跳轉分析

> 更新日期：2026-03-07（Asia/Taipei）  
> 分析來源：`src/app` 路由、`src/app/actions`、`src/lib/supabase/middleware.ts`、各角色 `layout/sidebar`、`stitch_screens/*`

## 1. 專案現況總覽

- 架構：Next.js App Router + Supabase + Clean Architecture（Domain/Application/Infrastructure）
- 角色：`admin`（identity_id=1）、`teacher`（identity_id=2）、`student`（identity_id=3）
- 已實作頁面（`page.tsx`）數量：57
- Stitch 匯出畫面（`stitch_screens/index.json`）數量：153

## 2. 功能清單（依角色）

### 2.1 Public / Auth（訪客與驗證）

核心入口與頁面：
- `/`：Landing
- `/teachers`、`/teachers/[teacherCode]`、`/teachers/[teacherCode]/portfolio`
- `/courses`
- `/portfolio/[portfolioId]`
- `/auth/login`、`/auth/forgot-password`、`/auth/reset-password`、`/auth/verify`、`/auth/onboarding`
- `/legal/privacy`、`/legal/terms`

已落地能力：
- 登入/註冊（註冊需 `teacher_code` 驗證）
- Email 驗證提示（未驗證會被擋）
- 首登導流（教師首登強制 reset password；其他角色進 onboarding）
- 公開教師/課程/作品集瀏覽

### 2.2 Student（學生）

主要頁面：
- `/student/dashboard`
- `/student/courses`、`/student/courses/[courseId]`
- `/student/booking`、`/student/booking/create`、`/student/booking/success`、`/student/booking/error`
- `/student/bookings`、`/student/bookings/[bookingId]`、`/student/bookings/[bookingId]/reschedule`
- `/student/progress`
- `/student/notifications`
- `/student/profile`

已落地能力（對應 actions）：
- 我的預約查詢：`getStudentBookings`
- 建立預約：`createBooking`
- 改期申請：`requestReschedule`
- 我的學習進度：`getMyCourseProgress`、`getMyCoursesWithProgress`
- 課程購買：`purchaseCourse`、`getStudentPurchases`
- 通知讀取/已讀：`getMyNotifications`、`markNotificationAsRead`

### 2.3 Teacher（教師）

主要頁面：
- `/teacher/dashboard`
- `/teacher/bookings`
- `/teacher/courses`、`/teacher/courses/preview/[courseId]`
- `/teacher/portfolio`、`/teacher/portfolio/[portfolioId]`、`/teacher/portfolio/types`
- `/teacher/students`
- `/teacher/profile`
- `/teacher/availability`
- `/teacher/payments`
- `/teacher/reports`、`/teacher/reports/revenue`
- `/teacher/notifications`
- `/teacher/settings`
- `/teacher/lesson-plans`

已落地能力（對應 actions）：
- 可預約時段查詢/儲存（availability action/usecase）
- 預約管理：`getTeacherBookings`、`updateBookingStatus`、`updateBookingFeedback`
- 學生進度管理：`getStudentCourseProgress`、`updateProgress`、`initializeProgress`
- 作品集 CRUD + 媒體上傳：`portfolio.ts`
- 支付與報表：`getTeacherPayments`、`reports.ts` 全組

### 2.4 Admin（管理員）

主要頁面：
- `/admin/dashboard`
- `/admin/users`
- `/admin/teachers`、`/admin/teachers/new`
- `/admin/students`
- `/admin/bookings`
- `/admin/class-types`（`/admin/course-types` 會 redirect 過來）
- `/admin/tags`
- `/admin/modules`
- `/admin/settings`

已落地能力：
- 使用者/教師/學生列表與編修（頁面 + API）
- 模組開關與 route/icon/label 編輯（`system_modules`）
- 依角色模組管理（identity=1/2/3）

## 3. 權限結構（AuthN / AuthZ）

## 3.1 第一層：Middleware（未登入擋下）

檔案：`src/lib/supabase/middleware.ts`
- 針對 `/student`、`/teacher`、`/admin` 做登入檢查
- 未登入統一跳轉：`/auth/login?redirect=<原路徑>`

## 3.2 第二層：Role Layout（身份強制）

檔案：
- `src/app/admin/layout.tsx`
- `src/app/teacher/layout.tsx`
- `src/app/student/layout.tsx`

規則：
- 以 `user_info.identity_id` 作為最終身份判斷
- 若身份不符，導向對應 dashboard（例如學生進 teacher 區會被送到 `/student/dashboard`）

Identity 對照：
- `1` = Admin
- `2` = Teacher
- `3` = Student

## 3.3 第三層：功能模組開關（Module-level）

檔案：
- `src/lib/store/systemStore.ts`
- `src/hooks/useSystemModules.ts`
- `src/app/admin/modules/page.tsx`
- `src/components/AuthGuard.tsx`

機制：
- `system_modules` 以 `identity_id + route + is_active` 控制可見/可用功能
- Sidebar 依 `getModulesByIdentity()` 動態顯示
- `AuthGuard` 會在 client 端檢查當前路由對應模組是否啟用，未啟用則導回 `/`

## 3.4 第四層：Server Action 保護

常見保護手法：
- 先取 `supabase.auth.getUser()`，無 user 則 `Unauthorized`
- 業務關聯檢查（例：`createBooking` 需 user 為 teacher 或 student 其一）
- 讀單筆資料後再驗擁有權（例：`getBookingById` 檢查 teacherId/studentId）

目前觀察到的風險點（建議後續補強）：
- `updateBookingStatus`、`updateBookingFeedback` 目前僅更新資料，未顯式驗證操作者是否為該 booking 關係人
- `progress` 類 action 目前是「有登入即可呼叫」，權限依賴 RLS/上層頁面，建議明確加 teacher/student ownership guard

## 4. 路由跳轉流程

## 4.1 全域跳轉（入口）

- `/admin` -> `/admin/dashboard`
- `/teacher` -> `/teacher/dashboard`
- `/student` -> `/student/dashboard`

## 4.2 登入後跳轉

檔案：`src/app/(public)/auth/login/page.tsx`

流程：
1. 驗證帳密
2. 檢查 `emailConfirmedAt`
3. 檢查 `user_info.is_active`
4. 首登判斷：
   - 教師且 `is_first_login=false` -> `/auth/reset-password?type=first_login`
   - 非 admin 且 `is_first_login=false` -> `/auth/onboarding`
5. 依 `identity_id` 導向 dashboard：
   - 1 -> `/admin/dashboard`
   - 2 -> `/teacher/dashboard`
   - 3 -> `/student/dashboard`

## 4.3 主要業務流程（Booking / Reschedule / Progress）

Booking（學生）:
1. 進入 `/student/booking` 或課程頁
2. 呼叫 `getAvailableSlots`
3. 送出 `createBooking`
4. 成功導向 `/student/booking/success`（失敗 `/student/booking/error`）

Reschedule（雙方）:
1. 從 booking 詳細頁進 `/student/bookings/[bookingId]/reschedule`
2. 送 `requestReschedule`
3. 對方在管理頁審核 `reviewReschedule(approved/rejected)`

Progress（教師更新 / 學生查看）:
1. 教師在 `/teacher/students` 查詢 `getStudentCourseProgress`
2. 更新 `updateProgress`
3. 學生在 `/student/progress` 查詢 `getMyCoursesWithProgress`

## 5. Stitch MCP 資料分析摘要（根據本地匯出）

來源：
- `stitch_screens/index.json`
- `stitch_screens/rename_plan.md`
- `stitch_screens/analyze.js`

觀察：
- 畫面總數 153，存在大量重複標題與語意不清命名
- `rename_plan.md` 已依「身份 - 功能」產生建議命名，但仍有 `未知 - ...` 類別
- 一部分 Stitch 命名與實際程式路由不一致（例如同名多版、角色混用）

建議落地做法：
1. 先以「路由為主鍵」建立畫面對照表（Stitch 畫面 -> `src/app` route）
2. 對 `未知 - ...` 項目逐一指定角色與用途，避免後續誤串接
3. 只保留每個流程一份「主版」設計，其餘標為 archive
4. 將 `system_modules.key` 與 Stitch 畫面命名規範統一（如：`teacher_bookings` 對應 `Teacher - 預約管理`）

## 6. 建議補文件（下一步）

可再補兩份實務文件：
- `docs/route-permission-matrix.md`：逐路由列出可訪問角色、模組 key、對應 action
- `docs/flow-booking-e2e.md`：預約/改期/進度的 API、狀態流轉、例外處理（含 Google Calendar 後續擴充點）
