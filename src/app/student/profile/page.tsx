"use client";

import Image from "next/image";
import EducationInputs from "@/components/ui/EducationInputs";
import { useStudentProfileController } from "./useStudentProfileController";

export default function StudentProfilePage() {
  const {
    fileInputRef,
    loading,
    saving,
    name,
    setName,
    email,
    phone,
    setPhone,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordSuccess,
    avatarPreview,
    uploadingAvatar,
    school,
    setSchool,
    status,
    setStatus,
    department,
    setDepartment,
    degreeLevel,
    setDegreeLevel,
    openFilePicker,
    handleUpdateProfile,
    handleUpdatePassword,
    handleAvatarUpload,
    showDeleteAccountNotice,
  } = useStudentProfileController();

  if (loading) {
    return <div className="p-10 text-center">載入中...</div>;
  }

  return (
    <div className="container mx-auto max-w-[1024px] p-6 md:p-10 flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-display font-black leading-tight tracking-tight mb-2">
            個人帳戶設定
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            管理您的個人資料、頭像設定、登入密碼以及系統通知偏好
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">
              help_center
            </span>
            <span className="hidden sm:inline">需要協助？</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6 sticky top-10">
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-primary/10 to-secondary/10 z-0"></div>
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white self-start mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  face
                </span>
                頭像設定
              </h2>
              <div className="w-full flex flex-col items-center gap-6">
                <div
                  className="relative group cursor-pointer"
                  onClick={openFilePicker}
                >
                  <div className="size-44 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative ring-4 ring-primary/20 bg-slate-100">
                    <Image
                      alt="Profile Preview"
                      fill
                      unoptimized
                      className="object-cover transform hover:scale-105 transition-transform duration-500"
                      src={
                        avatarPreview ||
                        `https://ui-avatars.com/api/?name=${name || "User"}&background=random`
                      }
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-800 text-white p-2.5 rounded-full shadow-lg border-2 border-white dark:border-slate-700 hover:scale-110 hover:bg-primary transition-all duration-300">
                    <span className="material-symbols-outlined text-[20px]">
                      photo_camera
                    </span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />

                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button
                      onClick={openFilePicker}
                      disabled={uploadingAvatar}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        upload
                      </span>
                      {uploadingAvatar ? "上傳中..." : "上傳新圖"}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-400 px-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">
                    info
                  </span>
                  <p className="text-xs leading-relaxed">
                    建議尺寸 500x500 像素。支援 JPG, PNG 格式 (最大 2MB)。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 mt-1">
                info
              </span>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">
                  完成個人資料
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  填寫完整的聯絡資訊有助於我們在課程變動時第一時間通知您。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Basic Info */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  基本資料
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  更新您的姓名與聯絡方式
                </p>
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="text-primary hover:text-primary-dark text-sm font-bold trans-all disabled:opacity-50"
              >
                {saving ? "儲存中..." : "儲存變更"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  真實姓名
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  電子郵件
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-4 py-2.5 font-medium cursor-not-allowed"
                  type="email"
                  value={email}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  手機號碼
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">
                  學歷資料
                </span>
              </div>
            </div>

            <div className="mt-4">
              <EducationInputs
                school={school}
                setSchool={setSchool}
                status={status}
                setStatus={setStatus}
                department={department}
                setDepartment={setDepartment}
                degreeLevel={degreeLevel}
                setDegreeLevel={setDegreeLevel}
                labels={{
                  school: "就讀學校",
                  status: "就學狀態",
                  department: "科系/所",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  帳戶安全
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  定期更改密碼以保護您的帳戶
                </p>
              </div>
            </div>
            <div className="space-y-6 max-w-lg">
              {/* Current password field is tricky without re-auth, so specific 'change password' usually just asks for new one if already logged in, or asks for old one to re-authenticate. Simple version here. */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    新密碼
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                    placeholder="請輸入新密碼"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    確認新密碼
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                    placeholder="再次輸入新密碼"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-green-500 text-sm">{passwordSuccess}</p>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="bg-slate-800 hover:bg-slate-900 dark:bg-primary dark:hover:bg-primary-dark dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center gap-2"
                >
                  更新密碼
                </button>
              </div>
            </div>
          </div>

          {/* Notifications (UI Only for now) */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                通知偏好
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                自定義您希望接收的訊息類型
              </p>
            </div>
            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">
                    課程提醒
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    在上課前 24 小時發送 Email 與簡訊提醒
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    defaultChecked
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between pt-6">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">
                    學習進度報告
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    每週寄送一次您的練習時數與課程進度總結
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    defaultChecked
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-4 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-red-500 font-bold mb-2">危險區域</h3>
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl">
              <div>
                <h4 className="font-bold text-red-600 dark:text-red-400 text-sm">
                  刪除帳戶
                </h4>
                <p className="text-xs text-red-400/80 mt-0.5">
                  此動作無法復原，您的所有課程進度將被永久刪除。
                </p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm font-bold trans-all"
                onClick={showDeleteAccountNotice}
              >
                刪除帳戶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
