# 學生購買時數規則分析（文件版）

> 更新日期：2026-03-07（Asia/Taipei）
> 範圍：僅分析現況與建議規則，不變更程式碼

## 1. 目前實作現況（As-Is）

## 1.1 入口與參數流

- 學生在課程詳情頁調整 `selectedHours`，再跳轉至：
  - `/student/booking/create?courseId=<id>&hours=<selectedHours>`
- 預約頁初始化時數：
  - `hours = Math.max(1, hoursParam)`
- 購買時，前端直接呼叫：
  - `purchaseCourse(courseId, hours, totalPrice)`

## 1.2 後端購買邏輯

檔案：`src/app/actions/purchase.ts`
- 僅驗證登入
- 直接使用前端傳入的：`totalHours`、`pricePaid`
- 建立購買紀錄後初始化 progress（若不存在）

檔案：`src/lib/application/purchase/PurchaseCourseUseCase.ts`
- 未做時數/價格商業驗證
- 直接建立購買：`remainingHours = totalHours`

檔案：`src/lib/infrastructure/purchase/SupabasePurchaseRepository.ts`
- 新增購買狀態寫死：`status = 'pending_payment'`

## 1.3 預約扣時邏輯

檔案：`src/lib/application/booking/CreateBookingUseCase.ts`
- 扣時前要求 `purchase.status === 'active'`
- 若 `remainingHours < durationHours` 會拒絕預約
- 扣完若 `remainingHours <= 0` 設為 `completed`

## 2. 已識別規則缺口

## 2.1 後端信任前端金額（高風險）

- 目前 `pricePaid` 由 client 傳入，server 未重算
- 風險：可被篡改，造成低價購買或對帳不一致

## 2.2 時數範圍缺少強制規則

- 缺少 server-side 規則（整數、上下限、最小購買時數）
- 目前主要靠 UI 控制，不足以防止非預期請求

## 2.3 購買狀態與可扣時狀態有語義落差

- 購買寫入 `pending_payment`
- 預約扣時只接受 `active`
- 若沒有其他流程把 `pending_payment -> active`，預約會失敗

## 2.4 狀態 enum/constraint 文件不一致風險

- `src/types/database.types.ts` 含 `pending_payment`
- migration `course_purchases_status_check` 顯示僅 `active/completed/expired`
- 需確認線上 DB 最終約束，避免資料寫入失敗或環境差異

## 2.5 「購買時數」與「本次預約時數」語意混用

- 預約頁使用同一個 `hours` 同時影響：
  - 預約時長
  - 買新方案時數
- 若產品預期支援「先買 10 小時，但本次只預約 2 小時」，現況不完整

## 3. 建議的正式規則（To-Be）

以下是建議寫入 PRD/Spec 的明確規則：

1. 購買時數必須為整數（單位：小時）。
2. 購買時數最小值：`max(1, ceil(course.duration_minutes / 60))`。
3. 購買時數最大值：40 小時（可改為平台設定）。
4. `price_paid` 一律由後端計算：`course.price * totalHours`，前端金額僅供顯示。
5. 僅 `active` 狀態可被預約扣時；`pending_payment` 不可扣時。
6. 購買成功進入可用狀態的條件需明確：
   - 若當下即完成付款：直接 `active`
   - 若有金流待入帳：先 `pending_payment`，入帳後轉 `active`
7. 扣時後 `remaining_hours <= 0` 自動標記 `completed`。
8. 若採拆分預約，總扣時 = 各 booking 時長合計，且不可超過 `remaining_hours`。

## 4. 建議流程（文字版）

1. Student 發起購買（帶 `courseId`, `requestedHours`）。
2. Server 讀取課程單價與最短時數，驗證 `requestedHours`。
3. Server 重算應付金額並建立 `course_purchases`。
4. 若付款完成，狀態設為 `active`；否則 `pending_payment`。
5. 建立/初始化 `student_course_progress`。
6. 後續預約僅可用 `active` purchase 扣時。

## 5. 驗收測試案例（文件）

1. `hours=0` 應被拒絕。
2. `hours=1.5` 應被拒絕（若規則為整數小時）。
3. `hours>40` 應被拒絕。
4. 前端傳入低價 `pricePaid`，後端仍應用正確價格寫入。
5. `pending_payment` purchase 不可預約扣時。
6. `active` purchase 且剩餘時數不足，預約應失敗並回傳可理解錯誤訊息。
7. 扣時後剩餘剛好為 0，狀態應轉 `completed`。

## 6. 建議補充文件

- `docs/route-permission-matrix.md` 增加購買/扣時相關 action 權限列
- `docs/flow-booking-e2e.md` 補上 purchase status 流轉（pending_payment -> active -> completed）
