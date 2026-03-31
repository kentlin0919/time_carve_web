"use client";

import { useAdminUsersController } from "./useAdminUsersController";

export default function AdminUsersPage() {
  const {
    users,
    identities,
    loading,
    selectedUserId,
    selectedUser,
    editing,
    saving,
    passwordSaving,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    formUser,
    formStudent,
    formTeacher,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    filteredUsers,
    identityOptions,
    showStudentSection,
    showTeacherSection,
    roleMap,
    setSelectedUser,
    toggleEditing,
    updateFormUser,
    updateFormStudent,
    updateFormTeacher,
    handleSave,
    handlePasswordReset,
  } = useAdminUsersController();

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            用戶管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {users.length} 位用戶
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋姓名或 Email"
              className="rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">所有角色</option>
            {identities.map((identity) => (
              <option key={identity.identity_id} value={identity.identity_id}>
                {identity.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "active" | "inactive")
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">全部狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-5">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">用戶</th>
                <th className="px-6 py-4">角色</th>
                <th className="px-6 py-4">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    載入中...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    找不到符合條件的用戶
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedUserId === user.id
                        ? "bg-sky-50/60 dark:bg-sky-500/10"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.identity?.name || roleMap[user.identity_id || 0] || "未設定"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {user.is_active ? "啟用" : "停用"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-7">
          {!selectedUser ? (
            <div className="py-20 text-center text-gray-500">請從左側選擇用戶</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={toggleEditing}
                  className="rounded-lg border border-sky-200 px-4 py-2 text-sky-600 transition-colors hover:bg-sky-50"
                >
                  {editing ? "取消編輯" : "編輯資料"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(editing || formUser.name) && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">姓名</label>
                    <input
                      value={formUser.name || ""}
                      onChange={(event) => updateFormUser("name", event.target.value)}
                      disabled={!editing}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                    />
                  </div>
                )}
                {(editing || formUser.email) && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Email</label>
                    <input
                      value={formUser.email || ""}
                      onChange={(event) => updateFormUser("email", event.target.value)}
                      disabled={!editing}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                    />
                  </div>
                )}
                {(editing || formUser.phone) && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">電話</label>
                    <input
                      value={formUser.phone || ""}
                      onChange={(event) => updateFormUser("phone", event.target.value)}
                      disabled={!editing}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500">角色</label>
                  {editing ? (
                    <select
                      value={formUser.identity_id || ""}
                      onChange={(event) =>
                        updateFormUser(
                          "identity_id",
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <option value="">未設定</option>
                      {identityOptions.map((identity) => (
                        <option key={identity.identity_id} value={identity.identity_id}>
                          {identity.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                      {selectedUser.identity?.name ||
                        identities.find(
                          (identity) => identity.identity_id === selectedUser.identity_id
                        )?.name ||
                        roleMap[selectedUser.identity_id || 0] ||
                        "未設定"}
                    </div>
                  )}
                </div>
                {editing && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">狀態</label>
                    <select
                      value={formUser.is_active ? "active" : "inactive"}
                      onChange={(event) =>
                        updateFormUser("is_active", event.target.value === "active")
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                )}
                {editing && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      首次登入狀態
                    </label>
                    <select
                      value={formUser.is_first_login ? "complete" : "pending"}
                      onChange={(event) =>
                        updateFormUser(
                          "is_first_login",
                          event.target.value === "complete"
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <option value="pending">尚未完成</option>
                      <option value="complete">已完成</option>
                    </select>
                  </div>
                )}
              </div>

              {(editing || formUser.disabled_reason || formUser.disabled_at) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(editing || formUser.disabled_reason) && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500">停用原因</label>
                      <input
                        value={formUser.disabled_reason || ""}
                        onChange={(event) =>
                          updateFormUser("disabled_reason", event.target.value)
                        }
                        disabled={!editing}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                      />
                    </div>
                  )}
                  {(editing || formUser.disabled_at) && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500">停用日期</label>
                      <input
                        value={formUser.disabled_at || ""}
                        disabled
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                  )}
                </div>
              )}

              {showStudentSection && (
                <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    學生資料
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(editing || formStudent.student_code) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">學員編號</label>
                        <input
                          value={formStudent.student_code || ""}
                          onChange={(event) =>
                            updateFormStudent("student_code", event.target.value)
                          }
                          disabled={!editing || !selectedUser.student_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                    {(editing || formStudent.teacher_code) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">
                          綁定教師代碼
                        </label>
                        <input
                          value={formStudent.teacher_code || ""}
                          onChange={(event) =>
                            updateFormStudent("teacher_code", event.target.value)
                          }
                          disabled={!editing || !selectedUser.student_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showTeacherSection && (
                <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    教師資料
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(editing || formTeacher.teacher_code) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">教師代碼</label>
                        <input
                          value={formTeacher.teacher_code || ""}
                          onChange={(event) =>
                            updateFormTeacher("teacher_code", event.target.value)
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                    {(editing || formTeacher.title) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">教師頭銜</label>
                        <input
                          value={formTeacher.title || ""}
                          onChange={(event) =>
                            updateFormTeacher("title", event.target.value)
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                    {(editing || formTeacher.experience_years) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">教學年資</label>
                        <input
                          type="number"
                          value={formTeacher.experience_years ?? ""}
                          onChange={(event) =>
                            updateFormTeacher(
                              "experience_years",
                              event.target.value ? Number(event.target.value) : null
                            )
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                    {(editing || formTeacher.base_price) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">每小時費用</label>
                        <input
                          type="number"
                          value={formTeacher.base_price ?? ""}
                          onChange={(event) =>
                            updateFormTeacher(
                              "base_price",
                              event.target.value ? Number(event.target.value) : null
                            )
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                    {(editing || formTeacher.is_public !== null) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500">公開顯示</label>
                        <select
                          value={formTeacher.is_public ? "public" : "private"}
                          onChange={(event) =>
                            updateFormTeacher(
                              "is_public",
                              event.target.value === "public"
                            )
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        >
                          <option value="public">公開</option>
                          <option value="private">不公開</option>
                        </select>
                      </div>
                    )}
                    {(editing || formTeacher.bio) && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500">教師簡介</label>
                        <textarea
                          value={formTeacher.bio || ""}
                          onChange={(event) =>
                            updateFormTeacher("bio", event.target.value)
                          }
                          disabled={!editing || !selectedUser.teacher_info}
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editing && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-600 disabled:opacity-60"
                  >
                    {saving ? "儲存中..." : "儲存變更"}
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
                  變更密碼
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">新密碼</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">再次確認</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    變更密碼後，系統會將使用者狀態重設為首次登入。
                  </p>
                  <button
                    onClick={handlePasswordReset}
                    disabled={passwordSaving}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                  >
                    {passwordSaving ? "更新中..." : "更新密碼"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
