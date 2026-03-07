## 4. Student：預約課程

### Sequence Diagram
```mermaid
sequenceDiagram
    actor Student
    participant UI as BookingPage
    participant Slot as getAvailableSlots
    participant Create as createBooking
    participant Notify as NotificationRepo

    Student->>UI: 選擇日期/時段
    UI->>Slot: getAvailableSlots()
    Slot-->>UI: 可預約時段
    Student->>UI: 送出預約
    UI->>Create: createBooking(data)
    Create->>Notify: 建立通知
    Create-->>UI: booking result
    UI-->>Student: 成功或失敗頁
```

### Class Diagram
```mermaid
classDiagram
    class BookingPage
    class GetAvailableSlotsUseCase
    class CreateBookingUseCase
    class BookingRepository
    class AvailabilityRepository
    class NotificationRepository

    BookingPage --> GetAvailableSlotsUseCase
    BookingPage --> CreateBookingUseCase
    CreateBookingUseCase --> BookingRepository
    CreateBookingUseCase --> AvailabilityRepository
    CreateBookingUseCase --> NotificationRepository
```

### Activity Diagram
```mermaid
flowchart TD
    A([開始]) --> B[選教師/課程]
    B --> C[查詢可預約時段]
    C --> D[選擇時段]
    D --> E[送出預約]
    E --> F{成功?}
    F -- 否 --> G[導向 booking/error]
    F -- 是 --> H[導向 booking/success]
```

### Use Case Diagram
```mermaid
flowchart LR
    Student([學生])
    Student --> UC1(["查看可預約時段"])
    Student --> UC2(["建立預約"])
    Student --> UC3(["查看預約結果"])
```

