"use client";

import TeacherProfileForm from "./TeacherProfileForm";
import { useTeacherProfileController } from "./useTeacherProfileController";

export default function TeacherProfileSettingsPage() {
  const {
    profile,
    loading,
    handleSave,
    handleAddEducation,
    handleDeleteEducation,
    handleRefresh,
  } = useTeacherProfileController();

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-10 text-center">無法載入教師資料。</div>;
  }

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto">
      <TeacherProfileForm
        initialProfile={profile}
        onSave={handleSave}
        onAddEducation={handleAddEducation}
        onDeleteEducation={handleDeleteEducation}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
