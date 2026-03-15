## 4. Student：預約課程

### 預約狀態生命週期 (Booking Status Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> pending : 學生送出預約
    pending --> confirmed : 教師確認預約
    pending --> cancelled : 學生/教師取消

    confirmed --> completed : 課程結束,教師標記完成
    confirmed --> cancelled : 學生/教師取消

    completed --> paid : 教師確認已收款
    completed --> cancelled : 爭議取消 (管理員)

    paid --> [*]
    cancelled --> [*]
```

> **狀態說明**
>
> | 狀態 | 說明 | 可執行操作 |
> |---|---|---|
> | `pending` | 學生送出預約，等待教師確認 | 教師確認 / 取消 |
> | `confirmed` | 教師已確認，等待上課 | 改期 / 取消 / 教師標記完成 |
> | `completed` | 課程已結束，等待收款確認 | 教師標記已收款 |
> | `paid` | 教師已確認收款，流程完結 | — |
> | `cancelled` | 預約已取消 | — |

---

### Sequence Diagram — 直接預約 (含未收款阻擋)

```mermaid
sequenceDiagram
    actor Student
    participant UI as BookingPage
    participant Action as ServerActions
    participant BookingRepo as BookingRepository
    participant Avail as AvailabilityRepo
    participant BookingUC as BookingUseCase
    participant Notify as NotificationRepo

    Student->>UI: 點擊查看預約
    UI->>Action: checkUnpaidBookings(studentId)
    Action->>BookingRepo: 查詢 status=completed 且未付款紀錄

    alt 存在未收款預約
        BookingRepo-->>UI: 回傳未收款預約資料
        UI-->>Student: 彈出提示「您有未完成付款的課程，請先完成繳費後再進行新預約」
        Note over Student, UI: 流程中斷,無法進入預約頁面
    else 無未收款預約
        BookingRepo-->>UI: 無阻擋
        UI->>Action: getAvailableSlots(teacherId, date)
        Action->>Avail: 查詢教師該日開放時段
        Avail-->>UI: 回傳可預約時段清單

        alt 有合適時段
            Student->>UI: 點選時段並填寫備註
            Student->>UI: 送出預約
            UI->>Action: createBooking(data)
            Action->>BookingUC: 驗證時段並建立預約 (status=pending)
            BookingUC->>Notify: 通知教師有新預約
            BookingUC-->>UI: booking result
            UI-->>Student: 顯示預約成功
        else 無合適時段
            Student->>UI: 點擊「申請上課時間」
            Note over Student, UI: 進入偏好時段申請流程
        end
    end
```

### Sequence Diagram — 偏好時段申請 (三順位申請)

```mermaid
sequenceDiagram
    actor Student
    actor Teacher
    participant UI as RequestPage
    participant Action as ServerActions
    participant ReqRepo as SlotRequestRepo
    participant Notify as NotificationRepo

    Student->>UI: 填寫三個偏好時段 (第1~3順位)
    Student->>UI: 送出申請
    UI->>Action: createSlotRequest(preferences[3])
    Action->>ReqRepo: 建立申請紀錄 (status=pending)
    Action->>Notify: 通知教師收到時段申請
    Notify-->>Teacher: 推送通知

    Teacher->>Action: 檢視申請內容與三個順位
    alt 有合適順位
        Teacher->>Action: approveSlotRequest(requestId, selectedRank)
        Action->>ReqRepo: 更新申請 (status=approved, selectedRank)
        Action->>Notify: 通知學生已核准
        Notify-->>Student: 推送通知 (含確認時段)
    else 三個時段皆不可行
        Teacher->>Action: rejectSlotRequest(requestId, reason?)
        Action->>ReqRepo: 更新申請 (status=rejected)
        Action->>Notify: 通知學生已駁回
        Notify-->>Student: 推送通知 (含駁回原因)
    end
```

### Sequence Diagram — 課後確認與收款 (教師端)

```mermaid
sequenceDiagram
    actor Teacher
    participant UI as TeacherBookingPage
    participant Action as ServerActions
    participant BookingRepo as BookingRepository
    participant Notify as NotificationRepo

    Teacher->>UI: 查看已確認課程列表
    UI->>Action: getTeacherBookings(confirmed)
    Action->>BookingRepo: 取得 confirmed 預約
    BookingRepo-->>UI: 預約清單

    Teacher->>UI: 課程結束，點擊「標記完成」
    UI->>Action: updateBookingStatus(bookingId, completed)
    Action->>BookingRepo: 更新 status=completed
    Action->>Notify: 通知學生課程已完成請繳費
    Notify-->>UI: 更新成功

    Note over Teacher, UI: 學生完成繳費後

    Teacher->>UI: 點擊「確認已收款」
    UI->>Action: updateBookingStatus(bookingId, paid)
    Action->>BookingRepo: 更新 status=paid
    Action->>Notify: 通知學生收款確認
    Notify-->>UI: 流程完結
```

### Class Diagram

```mermaid
classDiagram
    class BookingPage {
        +selectedDate: Date
        +selectedSlot: TimeSlot
        +notes: string
        +hasUnpaidBooking: boolean
        +handleBooking()
        +handleRequestSlot()
    }

    class BookingActions {
        +getAvailableSlots()
        +createBooking()
        +getStudentBookings()
        +getBookingById()
        +checkUnpaidBookings()
        +updateBookingStatus()
    }

    class SlotRequestActions {
        +createSlotRequest()
        +approveSlotRequest()
        +rejectSlotRequest()
        +getMySlotRequests()
    }

    class RescheduleActions {
        +requestReschedule()
    }

    class BookingUseCase
    class GetAvailableSlotsUseCase

    class BookingRepository {
        +getStudentBookings(id)
        +createBooking(data)
        +getBookingById(id)
        +getUnpaidBookings(studentId)
        +updateStatus(id, status)
    }

    class AvailabilityRepository
    class NotificationRepository

    class SlotRequestRepository {
        +createRequest(data)
        +updateRequestStatus(id, status)
        +getRequestsByStudent(id)
        +getRequestsByTeacher(id)
    }

    class RescheduleRepository

    BookingPage --> BookingActions
    BookingPage --> SlotRequestActions

    BookingActions --> GetAvailableSlotsUseCase
    BookingActions --> BookingUseCase
    BookingActions --> BookingRepository

    SlotRequestActions --> SlotRequestRepository
    SlotRequestActions --> NotificationRepository

    RescheduleActions --> RescheduleRepository

    GetAvailableSlotsUseCase --> AvailabilityRepository
    GetAvailableSlotsUseCase --> BookingRepository

    BookingUseCase --> BookingRepository
    BookingUseCase --> AvailabilityRepository
    BookingUseCase --> NotificationRepository
```

### Activity Diagram

```mermaid
flowchart TD
    A([開始]) --> B[點擊查看預約]
    B --> C{檢查是否有未收款預約?}

    C -- 有未收款 --> D[彈出提示: 請先完成繳費]
    D --> E([結束 — 阻擋])

    C -- 無未收款 --> F[進入預約頁面,選擇日期]
    F --> G[載入教師該日開放時段]
    G --> H{是否有合適時段?}

    H -- 是 --> I[選擇時段並填寫備註]
    I --> J[送出預約 status=pending]
    J --> K[通知教師]
    K --> L[教師確認 status=confirmed]

    H -- 否 --> M[點擊「申請上課時間」]
    M --> N[填寫 3 個偏好時段順位]
    N --> O[送出申請]
    O --> P[通知教師審核]
    P --> Q{教師決定}
    Q -- 核准某順位 --> R[建立預約 status=confirmed]
    Q -- 全部駁回 --> S[通知學生,可重新申請]
    S --> M

    L --> T[課程結束]
    R --> T
    T --> U[教師標記完成 status=completed]
    U --> V[通知學生繳費]
    V --> W[學生完成繳費]
    W --> X[教師確認收款 status=paid]
    X --> Y([結束 — 流程完結])
```

### Use Case Diagram

```mermaid
flowchart LR
    Student([學生])
    Teacher([教師])

    subgraph 預約建立
        UC1(["選擇日期查看開放時段"])
        UC2(["直接預約開放時段"])
        UC3(["申請上課時間 三順位"])
    end

    subgraph 預約管理
        UC4(["查看即將到來課程"])
        UC5(["查看歷史紀錄"])
        UC6(["提出改期申請"])
    end

    subgraph 教師審核與收款
        UC7(["審核時段申請"])
        UC8(["確認預約"])
        UC9(["標記課程完成"])
        UC10(["確認已收款"])
    end

    subgraph 系統檢查
        UC11(["未收款預約阻擋檢查"])
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6

    Teacher --> UC7
    Teacher --> UC8
    Teacher --> UC9
    Teacher --> UC10

    UC2 -.->|include| UC11
    UC3 -.->|include| UC1
    UC6 -.->|extend| UC4
```

---

### 操作流程 (Operation Flow)

#### 1. 直接預約教師開放時段 (Direct Booking)

1. **點擊查看預約**：學生從儀表板或側邊導覽列點擊「查看預約」。
2. **未收款阻擋檢查**：系統呼叫 `checkUnpaidBookings(studentId)` 檢查是否有 `status=completed`（已完成但未收款）的預約。
   - **有未收款紀錄**：彈出提示訊息「您有未完成付款的課程，請先完成繳費後再進行新預約」，**阻擋進入預約頁面**。
   - **無未收款紀錄**：正常進入預約頁面。
3. **選擇日期**：在月曆上選擇一個日期，系統呼叫 `getAvailableSlots(teacherId, date)` 查詢教師當日的開放時段。
4. **瀏覽可用時段**：已被預約的時段會標示為不可選取 (greyed out)。
5. **選擇時段並送出**：學生點選時段、填寫備註，送出後系統建立 `status=pending` 的預約紀錄並通知教師。
6. **結果**：成功後導向預約列表 (`/student/bookings`)。

#### 2. 申請上課時間 — 三順位偏好 (Slot Request)

> 當教師開放的時段都不符合學生需求時，學生可以主動提出偏好時段申請。

1. **發起申請**：學生在預約頁面點擊「申請上課時間」按鈕。
2. **填寫三個順位**：依序填入三個偏好時段（含日期與時間），依優先順序排列。
3. **送出申請**：系統建立 `status=pending` 的時段申請紀錄，並通知教師。
4. **教師審核**：
   - **核准**：教師選擇其中一個順位，系統自動建立預約紀錄並通知學生。
   - **駁回**：教師駁回並附上原因，學生可重新發起申請。

#### 3. 課後確認與收款流程 (Post-Lesson Confirmation)

1. **教師標記完成**：課程結束後，教師在預約管理頁點擊「標記完成」，預約狀態變為 `completed`，系統通知學生進行繳費。
2. **學生繳費**：學生透過線下（轉帳、現金等）方式完成付款。
3. **教師確認收款**：教師收到款項後，在預約管理頁點擊「確認已收款」，狀態變為 `paid`，流程完結。
4. **未收款阻擋**：若學生有任何 `completed`（已完成但未收款）的預約，系統將阻擋其建立新預約，直到繳清為止。

#### 4. 查看已預約與提出改期 (View Bookings & Reschedule)

1. **進入預約列表**：學生從側邊導覽列進入「我的預約」(`/student/bookings`)。
2. **取得資料**：系統呼叫 `getStudentBookings()` 取得所有預約紀錄。
3. **頁籤切換**：
   - **即將到來 (Upcoming)**：顯示 `pending` / `confirmed` 狀態的預約。學生可發起改期申請 (`requestReschedule`)。
   - **歷史紀錄 (History)**：顯示 `completed` / `paid` / `cancelled` 狀態的紀錄，可回顧課程回饋。
   - **每張預約卡片**會根據狀態顯示不同標籤色：待確認 (amber)、已確認 (green)、已完成待收款 (blue)、已收款 (teal)、已取消 (grey)。
