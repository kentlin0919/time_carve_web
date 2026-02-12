"use client";

import Link from "next/link";

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md space-y-6">
                <h1 className="text-3xl font-bold text-red-600">驗證連結無效或已過期</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    您的驗證連結可能已經過期或已被使用。為了安全起見，驗證連結只能使用一次。
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/auth/login"
                        className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90 transition-colors"
                    >
                        返回登入
                    </Link>
                    <Link
                        href="/auth/forgot-password"
                        className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                    >
                        重發連結
                    </Link>
                </div>
            </div>
        </div>
    );
}
