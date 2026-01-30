"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";
import Link from "next/link";
// Removed EducationInputs as it is now in Profile page

export default function TeacherSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showModal } = useModal();

  // Profile Preview (Read-only)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Booking State
  const [bookingWindow, setBookingWindow] = useState("2 週內");
  const [bookingBuffer, setBookingBuffer] = useState("15 分鐘");
  const [cancelPolicy, setCancelPolicy] = useState("課程開始前 24 小時");
  const [limitFreq, setLimitFreq] = useState(false);

  // Notification State
  const [notifNewBooking, setNotifNewBooking] = useState({
    email: true,
    app: true,
    line: true,
  });
  const [notifReminder, setNotifReminder] = useState({
    email: false,
    app: true,
    line: true,
  });
  const [notifCancel, setNotifCancel] = useState({
    email: true,
    app: true,
    line: true,
  });
  const [notifSystem, setNotifSystem] = useState({
    email: true,
    app: true,
    line: false,
  });

  // New Reminder Config
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Integration State
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [lineToken, setLineToken] = useState("");

  // Account State
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch User Info
      const { data: userData } = await supabase
        .from("user_info")
        .select("name, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (userData) {
        setName(userData.name || "");
        setEmail(userData.email || "");
        setAvatarUrl(
          userData.avatar_url ||
          "https://ui-avatars.com/api/?name=" + (userData.name || "User")
        );
      }

      // Fetch Teacher Info
      const { data: teacherData } = await supabase
        .from("teacher_info")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (teacherData) {
        const bookingSettings = (teacherData.booking_settings as any) || {};
        setBookingWindow(bookingSettings.window || "2 週內");
        setBookingBuffer(bookingSettings.buffer || "15 分鐘");
        setCancelPolicy(bookingSettings.cancel_policy || "課程開始前 24 小時");
        setLimitFreq(bookingSettings.limit_freq || false);

        const notifSettings = (teacherData.notification_settings as any) || {};
        if (notifSettings.new_booking)
          setNotifNewBooking(notifSettings.new_booking);
        if (notifSettings.reminder) setNotifReminder(notifSettings.reminder);
        if (notifSettings.cancel) setNotifCancel(notifSettings.cancel);
        if (notifSettings.system) setNotifSystem(notifSettings.system);

        // Reminder settings (top-level fields)
        const td = teacherData as any;
        setReminderEmailEnabled(td.enable_email_reminders || false);
        setReminderMinutes(td.reminder_minutes || 30);

        setGoogleEnabled(teacherData.google_calendar_enabled || false);
        setLineEnabled(teacherData.line_notify_enabled || false);
        setLineToken(teacherData.line_notify_token || "");

        // Paused if NOT public
        setIsPaused(!teacherData.is_public);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update Teacher Info (Settings only)
      const { error: teacherError } = await supabase
        .from("teacher_info")
        .update({
          booking_settings: {
            window: bookingWindow,
            buffer: bookingBuffer,
            cancel_policy: cancelPolicy,
            limit_freq: limitFreq,
          },
          notification_settings: {
            new_booking: notifNewBooking,
            reminder: notifReminder,
            cancel: notifCancel,
            system: notifSystem,
          },
          enable_email_reminders: reminderEmailEnabled,
          reminder_minutes: reminderMinutes,
          google_calendar_enabled: googleEnabled,
          line_notify_enabled: lineEnabled,
          line_notify_token: lineToken,
          is_public: !isPaused,
        })
        .eq("id", user.id);

      if (teacherError) throw teacherError;

      showModal({
        title: "成功",
        description: "系統設定已儲存",
        confirmText: "確定",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      showModal({
        title: "錯誤",
        description: "儲存失敗: " + error.message,
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePauseService = async () => {
    const action = isPaused ? "恢復" : "暫停";
    // ... (Use same logic but simpler implementation if needed, or keep existing)
    // Re-implementing for clarity in replacement
    showModal({
      title: "確認",
      description: `確定要${action}服務嗎？`,
      confirmText: "確定",
      cancelText: "取消",
      showCancel: true,
      onConfirm: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from("teacher_info")
            .update({ is_public: isPaused } as any)
            .eq("id", user.id);

          if (error) throw error;

          setIsPaused(!isPaused);
          showModal({
            title: "成功",
            description: `服務已${action}`,
            confirmText: "確定",
          });
        } catch (error) {
          console.error(error);
          showModal({
            title: "錯誤",
            description: "操作失敗",
            confirmText: "確定",
          });
        }
      },
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">載入設定中...</div>;
  }

  return (
    <>
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            系統設定
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            管理預約規則、通知偏好與帳號狀態
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSettings()}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 border border-border-light dark:border-border-dark text-text-sub hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-all"
          >
            <span>重置更改</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">
              {saving ? "sync" : "save"}
            </span>
            <span>{saving ? "儲存中..." : "儲存設定"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-10">
          {/* Profile Navigation Card */}
          <section>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="size-16 rounded-full bg-white dark:bg-slate-700 bg-center bg-cover border-2 border-white dark:border-slate-600 shadow-sm"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                ></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    個人檔案資料
                  </h3>
                  <p className="text-sm text-text-sub max-w-md">
                    您的姓名、職稱、簡介、學歷與專長標籤等公開資訊，請至個人檔案頁面進行編輯。
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/profile"
                className="px-4 py-2 bg-white dark:bg-slate-700 text-primary font-bold rounded-lg shadow-sm border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <span>前往編輯</span>
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          </section>

          {/* Booking Settings */}
          <section className="flex flex-col gap-6" id="booking">
            {/* ... (Keep existing Booking UI structure but ensure correct state binding) ... */}
            <div className="flex items-center gap-3 pb-2 border-b border-border-light dark:border-border-dark">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined">
                  calendar_clock
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                預約與時間設定
              </h3>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-light dark:border-border-dark md:border-b-0">
                    <span className="material-symbols-outlined text-text-sub">
                      tune
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      預約規則設定
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        開放預約範圍
                      </label>
                      <select
                        value={bookingWindow}
                        onChange={(e) => setBookingWindow(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                      >
                        <option>1 週內</option>
                        <option>2 週內</option>
                        <option>1 個月內</option>
                        <option>3 個月內</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        預約間隔緩衝
                      </label>
                      <select
                        value={bookingBuffer}
                        onChange={(e) => setBookingBuffer(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                      >
                        <option>不設間隔</option>
                        <option>15 分鐘</option>
                        <option>30 分鐘</option>
                        <option>60 分鐘</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 md:pl-8 md:border-l md:border-border-light md:dark:border-border-dark">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-light dark:border-border-dark md:border-b-0">
                    <span className="material-symbols-outlined text-text-sub">
                      edit_calendar
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      取消與改期政策
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        最晚取消時間
                      </label>
                      <select
                        value={cancelPolicy}
                        onChange={(e) => setCancelPolicy(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                      >
                        <option>課程開始前 12 小時</option>
                        <option>課程開始前 24 小時</option>
                        <option>課程開始前 48 小時</option>
                      </select>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        checked={limitFreq}
                        onChange={(e) => setLimitFreq(e.target.checked)}
                        className="mt-1 rounded text-primary focus:ring-primary border-gray-300"
                        id="penalty"
                        type="checkbox"
                      />
                      <label
                        className="text-sm text-slate-600 dark:text-gray-300"
                        htmlFor="penalty"
                      >
                        啟用頻繁取消限制
                        <span className="block text-xs text-text-sub mt-0.5">
                          一週內取消超過 3 次將暫停預約權限
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="flex flex-col gap-6" id="notification">
            {/* ... (Simplified Notification UI matching existing style but cleaner code structure if possible, for now just pasting the existing UI block) ... */}
            <div className="flex items-center gap-3 pb-2 border-b border-border-light dark:border-border-dark">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined">
                  notifications_active
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                通知規則
              </h3>
            </div>
            {/* Same table structure as before, just ensuring variables match */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-border-light dark:border-border-dark">
                      <th className="px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">
                        觸發事件
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider text-center">
                        電子郵件
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider text-center">
                        站內信
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider text-center">
                        LINE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {/* Row 1 */}
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            新預約成立
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifNewBooking.email}
                          onChange={(e) =>
                            setNotifNewBooking({
                              ...notifNewBooking,
                              email: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifNewBooking.app}
                          onChange={(e) =>
                            setNotifNewBooking({
                              ...notifNewBooking,
                              app: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifNewBooking.line}
                          onChange={(e) =>
                            setNotifNewBooking({
                              ...notifNewBooking,
                              line: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                    </tr>
                    {/* Row 2 */}
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            課程前提醒
                          </span>
                          <span className="text-xs text-text-sub">
                            課程開始前 2 小時
                          </span>
                          {/* Specific Reminder Settings */}
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs text-text-sub">自動發信與提醒：</label>
                            <select
                              value={reminderMinutes}
                              onChange={e => setReminderMinutes(Number(e.target.value))}
                              className="text-xs px-2 py-1 rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-700 outline-none"
                            >
                              <option value={15}>15 分鐘前</option>
                              <option value={30}>30 分鐘前</option>
                              <option value={60}>1 小時前</option>
                              <option value={120}>2 小時前</option>
                              <option value={1440}>24 小時前</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifReminder.email}
                          onChange={(e) =>
                            setNotifReminder({
                              ...notifReminder,
                              email: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifReminder.app}
                          onChange={(e) =>
                            setNotifReminder({
                              ...notifReminder,
                              app: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          checked={notifReminder.line}
                          onChange={(e) =>
                            setNotifReminder({
                              ...notifReminder,
                              line: e.target.checked,
                            })
                          }
                          type="checkbox"
                          className="rounded text-primary focus:ring-primary border-gray-300"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Integrations (Keep logic and UI) */}
          <section className="flex flex-col gap-6" id="integrations">
            <div className="flex items-center gap-3 pb-2 border-b border-border-light dark:border-border-dark">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined">extension</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                其他平台整合
              </h3>
            </div>
            {/* ... Compact Integration UI ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-slate-600">
                    calendar_month
                  </span>
                  <div>
                    <h4 className="font-bold">Google 日曆</h4>
                    <p className="text-xs text-text-sub">同步課程時間</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={googleEnabled}
                    onChange={(e) => setGoogleEnabled(e.target.checked)}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              {/* LINE */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-[#06C755]">
                    chat
                  </span>
                  <div>
                    <h4 className="font-bold">LINE 通知</h4>
                    <p className="text-xs text-text-sub">接收即時通知</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={lineEnabled}
                    onChange={(e) => setLineEnabled(e.target.checked)}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="flex flex-col gap-6 pt-6 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
              <div>
                <h4 className="text-base font-bold text-red-700 dark:text-red-400">
                  {isPaused ? "恢復帳號" : "暫停帳號"}
                </h4>
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-1">
                  {isPaused
                    ? "您的帳號目前處於暫停狀態，學生無法預約。"
                    : "暫停期間學生將無法搜尋到您的課程。"}
                </p>
              </div>
              <button
                onClick={handlePauseService}
                className="px-4 py-2 bg-white dark:bg-surface-dark border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
              >
                {isPaused ? "恢復服務" : "暫停服務"}
              </button>
            </div>

            <button className="text-text-sub hover:text-slate-800 dark:hover:text-white text-sm font-medium self-center flex items-center gap-2">
              <span className="material-symbols-outlined">lock_reset</span>
              修改登入密碼
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
