"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";

type NotificationChannelSettings = {
  email: boolean;
  app: boolean;
  line: boolean;
};

type BookingSettings = {
  window?: string;
  buffer?: string;
  cancel_policy?: string;
  limit_freq?: boolean;
};

type NotificationSettings = {
  new_booking?: NotificationChannelSettings;
  reminder?: NotificationChannelSettings;
  cancel?: NotificationChannelSettings;
  system?: NotificationChannelSettings;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationChannelSettings = {
  email: true,
  app: true,
  line: true,
};

export function useTeacherSettingsController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showModal } = useModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bookingWindow, setBookingWindow] = useState("2 週內");
  const [bookingBuffer, setBookingBuffer] = useState("15 分鐘");
  const [cancelPolicy, setCancelPolicy] = useState("課程開始前 24 小時");
  const [limitFreq, setLimitFreq] = useState(false);
  const [notifNewBooking, setNotifNewBooking] =
    useState<NotificationChannelSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notifReminder, setNotifReminder] = useState<NotificationChannelSettings>({
    email: false,
    app: true,
    line: true,
  });
  const [notifCancel, setNotifCancel] =
    useState<NotificationChannelSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notifSystem, setNotifSystem] = useState<NotificationChannelSettings>({
    email: true,
    app: true,
    line: false,
  });
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [lineToken, setLineToken] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

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
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              userData.name || "User"
            )}`
        );
      }

      const { data: teacherData } = await supabase
        .from("teacher_info")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (teacherData) {
        const bookingSettings = (teacherData.booking_settings || {}) as BookingSettings;
        setBookingWindow(bookingSettings.window || "2 週內");
        setBookingBuffer(bookingSettings.buffer || "15 分鐘");
        setCancelPolicy(bookingSettings.cancel_policy || "課程開始前 24 小時");
        setLimitFreq(bookingSettings.limit_freq || false);

        const notificationSettings = (teacherData.notification_settings ||
          {}) as NotificationSettings;
        if (notificationSettings.new_booking) {
          setNotifNewBooking(notificationSettings.new_booking);
        }
        if (notificationSettings.reminder) {
          setNotifReminder(notificationSettings.reminder);
        }
        if (notificationSettings.cancel) {
          setNotifCancel(notificationSettings.cancel);
        }
        if (notificationSettings.system) {
          setNotifSystem(notificationSettings.system);
        }

        setReminderEmailEnabled(Boolean(teacherData.enable_email_reminders));
        setReminderMinutes(teacherData.reminder_minutes || 30);
        setGoogleEnabled(Boolean(teacherData.google_calendar_enabled));
        setLineEnabled(Boolean(teacherData.line_notify_enabled));
        setLineToken(teacherData.line_notify_token || "");
        setIsPaused(!teacherData.is_public);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = useCallback(async () => {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
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

      if (error) throw error;

      showModal({
        title: "成功",
        description: "系統設定已儲存",
        confirmText: "確定",
      });
    } catch (error: unknown) {
      console.error("Error saving settings:", error);
      showModal({
        title: "錯誤",
        description: `儲存失敗: ${
          error instanceof Error ? error.message : "未知錯誤"
        }`,
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  }, [
    bookingBuffer,
    bookingWindow,
    cancelPolicy,
    googleEnabled,
    isPaused,
    limitFreq,
    lineEnabled,
    lineToken,
    notifCancel,
    notifNewBooking,
    notifReminder,
    notifSystem,
    reminderEmailEnabled,
    reminderMinutes,
    showModal,
  ]);

  const handlePauseService = useCallback(() => {
    const action = isPaused ? "恢復" : "暫停";

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
            .update({ is_public: isPaused })
            .eq("id", user.id);

          if (error) throw error;

          setIsPaused((previous) => !previous);
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
  }, [isPaused, showModal]);

  return {
    loading,
    saving,
    name,
    email,
    avatarUrl,
    bookingWindow,
    setBookingWindow,
    bookingBuffer,
    setBookingBuffer,
    cancelPolicy,
    setCancelPolicy,
    limitFreq,
    setLimitFreq,
    notifNewBooking,
    setNotifNewBooking,
    notifReminder,
    setNotifReminder,
    notifCancel,
    setNotifCancel,
    notifSystem,
    setNotifSystem,
    reminderEmailEnabled,
    setReminderEmailEnabled,
    reminderMinutes,
    setReminderMinutes,
    googleEnabled,
    setGoogleEnabled,
    lineEnabled,
    setLineEnabled,
    lineToken,
    setLineToken,
    isPaused,
    fetchSettings,
    handleSave,
    handlePauseService,
  };
}
