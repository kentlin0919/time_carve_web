"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type Setting = Database["public"]["Tables"]["platform_settings"]["Row"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "發生未知錯誤";
}

export function useAdminSettingsController() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("key");

    if (error) {
      console.error("Error fetching settings:", error);
    } else {
      setSettings(data ?? []);
    }

    setLoading(false);
  };

  const updateSettingValue = (key: string, value: string) => {
    setSettings((previous) =>
      previous.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updates = settings.map(({ key, value }) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("platform_settings").upsert(updates);

      if (error) {
        throw error;
      }

      setMessage("設定已儲存");
      setTimeout(() => setMessage(null), 3000);
    } catch (saveError) {
      console.error("Save error:", saveError);
      setMessage(`儲存失敗: ${getErrorMessage(saveError)}`);
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    message,
    settings,
    updateSettingValue,
    saveSettings,
  };
}
