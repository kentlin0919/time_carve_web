"use client";

import EducationInputs from "@/components/ui/EducationInputs";
import { useOnboardingController } from "./useOnboardingController";

export default function OnboardingPage() {
  const { pageLoading, form } = useOnboardingController();

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4 text-slate-600 dark:text-slate-300">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4 dark:bg-background-dark">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
            完善個人資料
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            請幫助我們認識您，以便提供更好的服務
          </p>
        </div>

        <form onSubmit={form.onSubmit} className="space-y-6">
          {form.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/10">
              {form.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) => form.setFullName(event.target.value)}
              className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              placeholder="您的真實姓名"
            />
          </div>

          <div className="space-y-4">
            <EducationInputs
              school={form.school}
              setSchool={form.setSchool}
              status={form.status}
              setStatus={form.setStatus}
              department={form.department}
              setDepartment={form.setDepartment}
              degreeLevel={form.degreeLevel}
              setDegreeLevel={form.setDegreeLevel}
              labels={{
                school: "就讀學校",
                status: "就學狀態",
                department: "科系/所",
              }}
              className="gap-4"
            />
          </div>

          <button
            type="submit"
            disabled={form.loading}
            className="w-full rounded-xl bg-primary py-3.5 font-bold text-white transition-all shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {form.loading ? "儲存中..." : "儲存並繼續"}
          </button>
        </form>
      </div>
    </div>
  );
}
