import Image from "next/image";
import Link from "next/link";
import NavAuthButtons from "@/components/NavAuthButtons";
import PublicHeader from "@/components/ui/PublicHeader";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root bg-background-light dark:bg-background-dark text-[#111618] dark:text-[#f0f3f4] font-display overflow-x-hidden selection:bg-primary selection:text-white">
      <PublicHeader />
      <main className="flex-1 w-full flex justify-center">
        <div className="flex flex-col max-w-[1024px] w-full px-6 sm:px-10">
          <section className="py-16 sm:py-24 relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="@container">
              <div className="flex flex-col-reverse gap-12 @[864px]:flex-row @[864px]:items-center">
                <div className="flex flex-col gap-8 flex-1 text-left @[864px]:pr-8">
                  <div className="flex flex-col gap-4">
                    <span className="inline-flex items-center gap-1.5 w-fit rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary dark:text-primary border border-primary/20">
                      <span className="material-symbols-outlined text-sm">
                        verified
                      </span>
                      專業家教預約平台
                    </span>
                    <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl text-[#111618] dark:text-white">
                      刻畫完美<span className="text-primary">學習</span>
                      <br />
                      的黃金時刻
                    </h1>
                    <h2 className="text-lg text-gray-600 dark:text-gray-300 font-normal leading-relaxed max-w-xl">
                      TimeCarve
                      提供最流暢的家教預約體驗。整合即時課表、進度追蹤與個人化教學管理，讓教與學的每一分鐘都更有價值。
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button className="flex h-12 min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-8 text-white text-base font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1 transition-all duration-300">
                      <span className="truncate">瀏覽課程</span>
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </button>
                    <button className="flex h-12 min-w-[140px] cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-800 text-[#111618] dark:text-white text-base font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all duration-300">
                      <span className="truncate">觀看作品</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-5 pt-4">
                    <div className="flex -space-x-4">
                      <div
                        className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-[#101d22] bg-gray-200 bg-cover bg-center"
                        data-alt="Portrait of a female student"
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJiHHWqCqnbokIb4vC9x4TMzG8xD_-s5pbFoCk8iq5QbsUnB_0Mllm8HPaZ0eSo3SC40CEZvbkbXXbqKzDh-NWRiVy8kHjEuBEkRjR0gpw-zZL1G0RjYZXhfy6WJFwLlb4yumwb2OFq0yofitoQA1Vk1Kno55E4f1_NNrDGjMaHjobJyqiFcnzRje8mKwLq43MroN5LtXnCPx2Qf3S0YBNAG1shGPTU52OfmBfFDI6SpdjiWdKwf9omEQYwULyGY0qIWD618vFveM")',
                        }}
                      ></div>
                      <div
                        className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-[#101d22] bg-gray-200 bg-cover bg-center"
                        data-alt="Portrait of a male student"
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBE6YwUj1wlZxV5_2UWGK4_gsqPubpKkXWnt0avhPGO1aQHiplLNGrFt4lNbDd5_9YLc_r4xb1qCX-yQST0-Ps3qc78ry1tWTFZjNR22352KZdOfa1y8PmklGx0pRvT1i1h_0FrsiZpg8zDvNqynW7lA4DP09yEf9g0nfBdIwhjMD2JJ57dkRbs67-mPc2p9rpAf6PKCQiYUNkqgEspfC7yEhBwEvrvwgSgIc_EKRQGJ5CzSe0RJ9TKFc1AUdKm0Xqe5aJBf-F4x24")',
                        }}
                      ></div>
                      <div
                        className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-[#101d22] bg-gray-200 bg-cover bg-center"
                        data-alt="Portrait of a female student"
                        style={{
                          backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuArwDfIG3eNWXW-Q3Eraz8JkUZDSOXHvJjncBnjMy5dqw8ntlGAltEJ7KgHljbchP5oIlAHnZil615mMyfpkk7jhBmVgPagAs9BrKvqwj7gbr6RSI9K_DQdwNVKmGxXciDwB90BBEmkyxmiSZdb3Mg-MlOv3HxuuAxO9fNEnR5gR1uAnYmQuSuwOC8NybjgB3__sUVNYxnQ7AJwu1eIk98uyr5ICe93ymw7-Y8uGGBx1GWlQJTxbX_j2hhE-rpKd2Re3xlWV7IBd28")',
                        }}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-sm filled">
                          star
                        </span>
                        <span className="font-bold text-[#111618] dark:text-white">
                          4.9/5.0
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        已有 500+ 位學員加入
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full flex-1 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                    <div
                      className="absolute inset-0 bg-center bg-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      data-alt="Close up of dental technician hands carving a denture wax model"
                      style={{
                        backgroundImage:
                          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBlNxVP5acES4Vx8j4JUlRqn1zwtcf48PythdeBHsjwonpbXDvRp5w7SPjgeaYt7Zq3kWzuLs2MV7dVpY55pT0FhJUssCAY2WZ9G3o66iHm9utnbHl8kWB2rIeKRHX0YQIgoQXgqSZ3VzKdgSGe0_ZdoAduDz8ndjFQzL7JFcmYLETmmLGrTj1fKZHYu3BykMjDtoehWwvAxu5JcdhFnKoZd3ojRTD2oyrb_VIE48xr8mHtr-oI56nZa_csheUyS5GLAlc9rSkihF4")',
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-lg border border-white/20 transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        Focus
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        專注於每一次的學習成長
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="py-16 sm:py-24" id="philosophy">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3 text-center sm:text-left max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                  核心理念
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
                  不僅僅是預約，更是對學習效率的極致追求。我們致力於打造最順暢的教學互動平台。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group flex flex-col gap-5 rounded-2xl bg-white dark:bg-[#1a2c32] p-8 shadow-soft border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">
                      schedule
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111618] dark:text-white mb-3">
                      彈性時間管理
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      智慧化的預約系統，讓學生與老師能輕鬆協調上課時間。即時同步行事曆，避免時間衝突，大幅提升安排效率。
                    </p>
                  </div>
                </div>
                <div className="group flex flex-col gap-5 rounded-2xl bg-white dark:bg-[#1a2c32] p-8 shadow-soft border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111618] dark:text-white mb-3">
                      學習進度追蹤
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      視覺化的進度儀表板，完整記錄每一次的課程重點與作業成效。讓學習軌跡清晰可見，目標達成更有效率。
                    </p>
                  </div>
                </div>
                <div className="group flex flex-col gap-5 rounded-2xl bg-white dark:bg-[#1a2c32] p-8 shadow-soft border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">
                      school
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111618] dark:text-white mb-3">
                      專屬客製教學
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      支援一對一專屬教學模式設定。老師可針對不同學生建立獨立的教學計畫與教材庫，實現真正的因材施教。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="py-16 sm:py-24 border-t border-gray-100 dark:border-gray-800"
            id="portfolio"
          >
            <div className="flex items-end justify-between pb-10">
              <div className="flex flex-col gap-2">
                <span className="text-primary font-bold tracking-wider text-xs uppercase">
                  Portfolio
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                  教學成果展示
                </h2>
              </div>
              <a
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-gray-600 hover:text-primary hover:bg-primary/5 transition-all text-sm font-bold"
                href="#"
              >
                查看全部
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group cursor-pointer flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <div
                    className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
                    data-alt="Online tutoring session screenshot"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop")',
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30">
                        線上教學
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#111618] dark:text-white text-xl font-bold leading-normal group-hover:text-primary transition-colors">
                    遠端互動教學
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal mt-1">
                    即時視訊解題與觀念引導
                  </p>
                </div>
              </div>
              <div className="group cursor-pointer flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <div
                    className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
                    data-alt="Student studying with notes"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1470&auto=format&fit=crop")',
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30">
                        學習筆記
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#111618] dark:text-white text-xl font-bold leading-normal group-hover:text-primary transition-colors">
                    學科重點整理
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal mt-1">
                    系統化歸納考點與觀念
                  </p>
                </div>
              </div>
              <div className="group cursor-pointer flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <div
                    className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
                    data-alt="One on one tutoring"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1577896337318-2833d2212590?q=80&w=1471&auto=format&fit=crop")',
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30">
                        實體輔導
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#111618] dark:text-white text-xl font-bold leading-normal group-hover:text-primary transition-colors">
                    一對一實體輔導
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal mt-1">
                    面對面解惑，針對弱點加強
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 flex sm:hidden justify-center">
              <button className="flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-transparent px-8 py-3 text-sm font-bold text-[#111618] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                查看全部作品
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
