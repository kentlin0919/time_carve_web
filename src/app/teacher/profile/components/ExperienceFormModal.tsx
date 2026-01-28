import { useState, useEffect } from "react";
import {
  CreateTeacherExperienceDTO,
  TeacherExperience,
} from "@/lib/domain/teacher/experience";
import { useModal } from "@/components/providers/ModalContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeacherExperienceDTO) => Promise<void>;
  initialData?: TeacherExperience;
}

export function ExperienceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) {
  const { showModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState<CreateTeacherExperienceDTO>({
    title: "",
    organization: "",
    start_date: "",
    end_date: null,
    is_current: false,
    description: "",
  });

  // Handle visibility animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        organization: initialData.organization,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        is_current: initialData.is_current,
        description: initialData.description,
      });
    } else {
      setFormData({
        title: "",
        organization: "",
        start_date: "",
        end_date: null,
        is_current: false,
        description: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.organization || !formData.start_date) {
      showModal({ type: "error", title: "資料不完整", description: "請填寫必填欄位", confirmText: "確定" });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
      showModal({ type: "error", title: "儲存失敗", description: "請稍後再試", confirmText: "確定" });
    } finally {
      setLoading(false);
    }
  };

  if (!visible && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
        }`}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px]"
        onClick={onClose}
      ></div>
      <div
        className={`relative w-full max-w-[500px] transform rounded-[32px] bg-white dark:bg-gray-800 p-8 text-left shadow-2xl transition-all duration-300 border border-slate-100 dark:border-gray-700 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {initialData ? "編輯經歷" : "新增經歷"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              職稱 / 頭銜 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="例如：資深英文教師"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              任職單位 / 公司 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.organization}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organization: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="例如：長頸鹿美語"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                開始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                結束日期
              </label>
              <input
                type="date"
                disabled={formData.is_current}
                value={formData.end_date || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  is_current: checked,
                  end_date: checked ? null : prev.end_date,
                }));
              }}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="is_current"
              className="text-sm font-medium text-slate-700 dark:text-gray-300 cursor-pointer select-none"
            >
              目前仍在職
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              工作內容描述
            </label>
            <textarea
              rows={3}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary/50 outline-none resize-none transition-all"
              placeholder="簡述您的職責與成就 (選填)..."
            />
          </div>

          <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>儲存中...</span>
                </>
              ) : (
                <span>確認儲存</span>
              )}
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>
    </div>
  );
}
