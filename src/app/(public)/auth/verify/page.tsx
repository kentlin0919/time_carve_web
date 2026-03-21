'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buildPasswordRecoveryRedirect } from '@/lib/supabase/authRedirect';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'student@example.com';
  const type = (searchParams.get('type') as 'signup' | 'recovery' | 'magiclink' | 'invite') || 'signup';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    
    pastedData.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      setError('請輸入完整 6 位數驗證碼');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: type, 
      });

      if (error) throw error;

      // Redirect based on type
      if (type === 'recovery') {
        router.push('/auth/reset-password');
      } else {
        router.push('/student/courses');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, '驗證失敗，請檢查驗證碼是否正確'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      
      if (type === 'recovery') {
        const redirectTo = buildPasswordRecoveryRedirect(window.location.origin);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });
        if (error) throw error;
      }

      setTimer(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError(null);
      // Optional: Show success toast
    } catch (err: unknown) {
      console.error('Verification resend failed', {
        error: err,
      });
      setError(getErrorMessage(err, '發送失敗'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#111618] dark:text-gray-100 font-display transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-800 bg-surface-light dark:bg-surface-dark px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-[#111618] dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-[#111618] dark:text-white">TimeCarve 刻時</h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">專業家教預約系統</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">訪客</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-surface-light dark:bg-surface-dark p-8 shadow-xl dark:shadow-none rounded-2xl border border-gray-100 dark:border-gray-800">
          
          {/* Icon/Illustration */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center size-20 rounded-full bg-primary/10 dark:bg-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary">mark_email_read</span>
              <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center border-2 border-white dark:border-[#18282e]">
                <span className="material-symbols-outlined text-sm text-green-500">check_circle</span>
              </div>
            </div>
          </div>

          {/* Headings */}
          <div className="text-center">
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#111618] dark:text-white">輸入驗證碼</h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              我們已發送 6 位數驗證碼至 <span className="font-semibold text-[#111618] dark:text-gray-200">{email}</span>。<br />請查收信件並在下方輸入。
            </p>
          </div>

          {/* OTP Input Grid */}
          <div className="mt-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="\d*"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`flex h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center text-xl sm:text-2xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 
                      ${digit ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-gray-800 text-[#111618] dark:text-white' 
                              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-[#111618] dark:text-white focus:border-primary'}`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-pulse">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Timer & Resend */}
              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-lg">timer</span>
                  <span>驗證碼有效期剩餘 <span className="font-mono font-medium text-[#111618] dark:text-gray-200">{formatTime(timer)}</span></span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">沒收到驗證碼？</span>
                  <button 
                    type="button" 
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className={`font-semibold transition-colors ${canResend ? 'text-primary hover:text-primary/80' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    重新發送
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-primary hover:bg-[#0fa4d6] text-white text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin text-xl material-symbols-outlined">progress_activity</span>
                      驗證中...
                    </span>
                  ) : (
                    <span className="truncate">驗證</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Help Link */}
        <div className="mt-8 text-center">
          <Link href="/contact" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-base">help</span>
            遇到問題？聯繫客服
          </Link>
        </div>
      </main>
    </div>
  );
}

// Wrap in Suspense because we use useSearchParams
export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
