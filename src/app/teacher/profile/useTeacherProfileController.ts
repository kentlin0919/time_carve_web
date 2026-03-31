"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SupabaseTeacherRepository } from "@/lib/infrastructure/teacher/SupabaseTeacherRepository";
import type { TeacherEducation, TeacherProfile } from "@/lib/domain/teacher/entity";

export function useTeacherProfileController() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const repository = useMemo(() => new SupabaseTeacherRepository(), []);

  const refreshProfile = useCallback(async (profileId: string) => {
    const newData = await repository.getProfile(profileId);
    if (newData) setProfile(newData);
  }, [repository]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (user) {
        const data = await repository.getProfile(user.id);
        if (isMounted) {
          setProfile(data);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const handleSave = useCallback(
    async (updated: Partial<TeacherProfile>) => {
      if (!profile) return;
      await repository.updateProfile(profile.id, updated);
      await refreshProfile(profile.id);
    },
    [profile, refreshProfile, repository]
  );

  const handleAddEducation = useCallback(
    async (
      education: Omit<TeacherEducation, "id" | "teacherId">
    ): Promise<TeacherEducation | null> => {
      if (!profile) return null;
      return await repository.addEducation(profile.id, education);
    },
    [profile, repository]
  );

  const handleDeleteEducation = useCallback(
    async (educationId: string) => {
      if (!profile) return;
      if (confirm("確定要刪除此學歷嗎？")) {
        await repository.deleteEducation(educationId);
        await refreshProfile(profile.id);
      }
    },
    [profile, refreshProfile, repository]
  );

  const handleRefresh = useCallback(async () => {
    if (!profile) return;
    await refreshProfile(profile.id);
  }, [profile, refreshProfile]);

  return {
    profile,
    loading,
    handleSave,
    handleAddEducation,
    handleDeleteEducation,
    handleRefresh,
  };
}
