import { getStudentDashboardStats } from "@/app/actions/student";
import { getMyCoursesWithProgress } from "@/app/actions/progress";
import { NotificationBell } from "@/components/notification/NotificationBell";
import Link from "next/link";

export default async function StudentDashboard() {
  const [stats, progressList] = await Promise.all([
    getStudentDashboardStats(),
    getMyCoursesWithProgress()
  ]);

  // Use the most recently updated progress as "Recent Learning"
  const recentProgress = progressList.length > 0 
    ? [...progressList].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    : null;

  return (
    <div className="container mx-auto max-w-[1280px] px-4 py-6 md:p-10 flex flex-col gap-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
            早安，同學{' '}
            <span className="inline-block animate-wave origin-bottom-right">
              👋
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            今天也是充實自己的一天！
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <NotificationBell />
          </div>
          <Link
            href="/student/courses"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            預約新課程
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
        <div className="xl:col-span-3 flex flex-col gap-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-5 transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[120px]">
                  check_circle
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-emerald-500">
                  check_circle
                </span>
                已完成課程
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats.completedCount}
                </span>
                <span className="text-sm font-medium text-slate-400">堂</span>
              </div>
            </div>

            <div className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-5 transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[120px]">
                  school
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-teal-500">
                  school
                </span>
                參與課程數
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                  {progressList.length}
                </span>
                <span className="text-sm font-medium text-slate-400">個</span>
              </div>
            </div>

            <div className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-5 transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[120px]">
                  event
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-blue-500">
                  event
                </span>
                待參加預約
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats.recentBookings.filter(b => b.status === 'confirmed').length}
                </span>
                <span className="text-sm font-medium text-slate-400">筆</span>
              </div>
            </div>
          </div>

          {/* Recent Bookings List */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-800 dark:text-white text-xl font-bold">
                近期預約行程
              </h2>
              <Link href="/student/bookings" className="text-primary hover:underline text-sm font-medium">
                查看全部
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {stats.recentBookings.length > 0 ? (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {stats.recentBookings.map((booking) => (
                    <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-500">
                          <span className="text-[10px] font-bold uppercase">{new Date(booking.bookingDate).getMonth() + 1}月</span>
                          <span className="text-lg font-black leading-none">{new Date(booking.bookingDate).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{booking.courseTitle}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {booking.startTime} - {booking.endTime} • 講師: {booking.teacherName || '老師'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                          {booking.status === 'confirmed' ? '已確認' : booking.status === 'pending' ? '待確認' : booking.status}
                        </span>
                        <Link href="/student/bookings" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 transition-all">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-20">event_busy</span>
                  <p>尚無預約行程</p>
                  <Link href="/student/courses" className="text-primary text-sm font-bold mt-4 inline-block">現在就去瀏覽課程</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Learning Progress */}
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-800 dark:text-white text-xl font-bold">
                最近學習進度
              </h2>
              <Link href="/student/progress" className="text-teal-500 hover:text-teal-600 text-sm font-medium">
                查看全部
              </Link>
            </div>

            {recentProgress ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full group">
                <div
                  className="h-40 bg-cover bg-center relative"
                  style={{
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1513346940221-18f46018e2dd?q=80&w=2669&auto=format&fit=crop")',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      進行中
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-lg font-bold leading-tight shadow-black drop-shadow-md">
                      {recentProgress.course.title}
                    </h3>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">當前狀態</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {recentProgress.status === 'in_progress' ? '學習中' : recentProgress.status === 'completed' ? '已完課' : '尚未開始'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">教案進度</span>
                        <span className="text-teal-500 font-bold">{recentProgress.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full shadow-lg shadow-teal-500/30"
                          style={{ width: `${recentProgress.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <Link href={`/student/booking/create?courseId=${recentProgress.course.id}`} className="w-full mt-auto py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 text-center transition-all shadow-md">
                    預約下堂課
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-slate-500 mb-4">您目前沒有進行中的課程進度</p>
                <Link href="/student/courses" className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold inline-block">
                  瀏覽課程
                </Link>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-black rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="font-bold text-lg mb-1 relative z-10">個人設定</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10">
              管理您的帳戶、密碼與通知偏好。
            </p>
            <div className="space-y-2 relative z-10">
              <Link
                href="/student/profile"
                className="flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-teal-500">
                    person
                  </span>
                  <span className="text-sm font-medium">編輯個人資料</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  chevron_right
                </span>
              </Link>
              <Link
                href="/student/notifications"
                className="flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-teal-500">
                    notifications
                  </span>
                  <span className="text-sm font-medium">通知設定</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  chevron_right
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}