import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Leaf,
  LockKeyhole,
  Mail,
  UserRound,
  XCircle,
} from 'lucide-react';
import React, { FormEvent, useState } from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

const getPublicAppUrl = () => {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim().replace(/\/$/, '');
  return configured || window.location.origin;
};

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthPageProps {
  initialMode?: AuthMode;
  onBack: () => void;
  onSuccess: () => void | Promise<void>;
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getPasswordChecks = (password: string) => ({
  minLength: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
});

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onBack,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const passwordChecks = getPasswordChecks(password);

  const passwordValid =
    passwordChecks.minLength &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.symbol;

  const confirmValid =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const emailValid =
    email.length > 0 &&
    isValidEmail(email);

  const nameValid =
    fullName.trim().length >= 2;

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const changeMode = (nextMode: AuthMode) => {
    resetFeedback();

    setPassword('');
    setConfirmPassword('');

    setMode(nextMode);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    resetFeedback();

    if (!supabase || !isSupabaseConfigured) {
      setError(
        'Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.'
      );
      return;
    }

    /*
     * =========================
     * REGISTER VALIDATION
     * =========================
     */

    if (mode === 'register') {
      if (!nameValid) {
        setError(
          'Nama lengkap belum benar. Nama minimal 2 karakter.'
        );
        return;
      }

      if (!emailValid) {
        setError(
          'Format email belum benar. Contoh: nama@email.com'
        );
        return;
      }

      if (!passwordValid) {
        setError(
          'Password belum memenuhi semua persyaratan.'
        );
        return;
      }

      if (!confirmValid) {
        setError(
          'Konfirmasi password tidak cocok.'
        );
        return;
      }
    }

    /*
     * =========================
     * LOGIN VALIDATION
     * =========================
     */

    if (mode === 'login') {
      if (!emailValid) {
        setError(
          'Masukkan alamat email yang valid.'
        );
        return;
      }

      if (!password) {
        setError(
          'Masukkan password.'
        );
        return;
      }
    }

    /*
     * =========================
     * FORGOT PASSWORD
     * =========================
     */

    if (mode === 'forgot') {
      if (!emailValid) {
        setError(
          'Masukkan alamat email yang valid.'
        );
        return;
      }
    }

    /*
     * =========================
     * RESET PASSWORD
     * =========================
     */

    if (mode === 'reset') {
      if (!passwordValid) {
        setError(
          'Password baru belum memenuhi semua persyaratan.'
        );
        return;
      }

      if (!confirmValid) {
        setError(
          'Konfirmasi password tidak cocok.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      /*
       * =========================
       * REGISTER
       * =========================
       */

      if (mode === 'register') {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,

            options: {
              data: {
                full_name: fullName.trim(),

                /*
                 * REGISTER PUBLIK
                 * SELALU SISWA
                 */
                role: 'siswa',
              },

              emailRedirectTo:
                `${getPublicAppUrl()}/`,
            },
          });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          setMessage('Email tersebut sudah terdaftar. Jika akun belum diverifikasi, kembali ke Login dan gunakan opsi kirim ulang email verifikasi.');
          setPassword('');
          setConfirmPassword('');
          return;
        }

        setMessage(
          'Akun siswa berhasil dibuat. Cek email kamu untuk verifikasi akun sebelum login.'
        );

        setPassword('');
        setConfirmPassword('');

        return;
      }

      /*
       * =========================
       * LOGIN
       * =========================
       */

      if (mode === 'login') {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) {
          const authMessage = String(signInError.message || '').toLowerCase();
          if (authMessage.includes('email not confirmed') || authMessage.includes('email_not_confirmed')) {
            const resend = window.confirm('Email akun ini belum diverifikasi. Kirim ulang email verifikasi sekarang?');
            if (resend) {
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim(),
                options: { emailRedirectTo: `${getPublicAppUrl()}/` },
              });
              if (resendError) throw resendError;
              setMessage('Email verifikasi dikirim ulang. Cek inbox dan folder spam, lalu verifikasi sebelum login.');
              return;
            }
          }
          throw signInError;
        }

        await onSuccess();

        return;
      }

      /*
       * =========================
       * FORGOT PASSWORD
       * =========================
       */

      if (mode === 'forgot') {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${getPublicAppUrl()}/?mode=reset-password`,
            }
          );

        if (resetError) {
          throw resetError;
        }

        setMessage(
          'Link reset password sudah dikirim. Periksa inbox dan folder spam email kamu.'
        );

        return;
      }

      /*
       * =========================
       * RESET PASSWORD
       * =========================
       */

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setMessage(
        'Password berhasil diubah. Silakan login menggunakan password baru.'
      );

      setPassword('');
      setConfirmPassword('');

      setMode('login');

    } catch (err: any) {
      let errorMessage =
        err?.message ||
        'Terjadi kesalahan. Silakan coba lagi.';

      const lowerMessage =
        errorMessage.toLowerCase();

      if (
        lowerMessage.includes(
          'invalid login credentials'
        )
      ) {
        errorMessage =
          'Email atau password salah.';
      }

      if (
        lowerMessage.includes(
          'email not confirmed'
        )
      ) {
        errorMessage =
          'Email belum diverifikasi. Cek inbox email kamu dan klik link verifikasi dari Supabase.';
      }

      if (
        lowerMessage.includes(
          'user already registered'
        )
      ) {
        errorMessage =
          'Email ini sudah terdaftar. Silakan login atau gunakan fitur lupa password.';
      }

      if (
        lowerMessage.includes(
          'email rate limit exceeded'
        )
      ) {
        errorMessage =
          'Terlalu banyak percobaan email. Tunggu beberapa saat lalu coba lagi.';
      }

      if (
        lowerMessage.includes(
          'password should be at least'
        )
      ) {
        errorMessage =
          'Password terlalu pendek.';
      }

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================
   * TITLE
   * =========================
   */

  const title =
    mode === 'register'
      ? 'Daftar Akun Siswa'
      : mode === 'forgot'
        ? 'Lupa Password?'
        : mode === 'reset'
          ? 'Buat Password Baru'
          : 'Selamat Datang Kembali';

  const subtitle =
    mode === 'register'
      ? 'Bikin akun siswa buat masuk ke dunia TERRA.'
      : mode === 'forgot'
        ? 'Masukkan email akun kamu untuk mendapatkan link reset password.'
        : mode === 'reset'
          ? 'Buat password baru untuk akun TERRA kamu.'
          : 'Masuk untuk lanjut belajar dan mengumpulkan poin.';

  /*
   * =========================
   * VALIDATION MESSAGE
   * =========================
   */

  const ValidationMessage = ({
    valid,
    children,
  }: {
    valid: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${
        valid
          ? 'text-emerald-700'
          : 'text-red-600'
      }`}
    >
      {valid ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 shrink-0" />
      )}

      <span>{children}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1D3557] flex items-center justify-center p-4 relative overflow-hidden">

      {/* BACKGROUND */}

      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#BDE0FE]/60 blur-2xl" />

      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#C7F9CC]/70 blur-2xl" />

      <div className="w-full max-w-lg relative">

        {/* BACK */}

        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 font-bold text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />

          Kembali ke TERRA
        </button>

        {/* CARD */}

        <div className="bg-white border-[3px] border-[#1D3557] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#1D3557]">

          {/* LOGO */}

          <div className="flex items-center gap-3 mb-6">

            <div className="w-12 h-12 bg-[#FFF176] border-2 border-[#1D3557] rounded-xl shadow-[0_4px_0_0_#1D3557] flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>

            <div>
              <div className="font-heading font-black text-2xl">
                TERRA
              </div>

              <div className="text-[10px] font-bold opacity-60">
                KENALI • PILAH • OLAH • JAGA BUMI
              </div>
            </div>

          </div>

          {/* TITLE */}

          <h1 className="font-heading font-black text-3xl mb-1">
            {title}
          </h1>

          <p className="text-sm opacity-65 mb-6">
            {subtitle}
          </p>

          {/* SUCCESS */}

          {message && (
            <div className="mb-5 rounded-xl border-2 border-emerald-700 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-800">

              <div className="flex gap-2">

                <CheckCircle2 className="w-5 h-5 shrink-0" />

                <span>
                  {message}
                </span>

              </div>

            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border-2 border-red-700 bg-red-50 p-3.5 text-sm font-semibold text-red-800">

              <div className="flex gap-2">

                <XCircle className="w-5 h-5 shrink-0" />

                <div>

                  <div className="font-black mb-0.5">
                    Tidak bisa dilanjutkan
                  </div>

                  <div>
                    {error}
                  </div>

                </div>

              </div>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* =========================
                NAMA LENGKAP
            ========================= */}

            {mode === 'register' && (
              <label className="block">

                <span className="text-xs font-black uppercase">
                  Nama Lengkap
                </span>

                <div className="relative mt-1">

                  <UserRound className="absolute left-3 top-3.5 w-4 h-4 opacity-50" />

                  <input
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    className={`w-full border-2 rounded-xl px-10 py-3 outline-none transition ${
                      fullName.length === 0
                        ? 'border-[#1D3557]/30'
                        : nameValid
                          ? 'border-emerald-500'
                          : 'border-red-500'
                    } focus:border-[#1D3557]`}
                    placeholder="Nama lengkap"
                    autoComplete="name"
                  />

                </div>

                {fullName.length > 0 && (
                  <ValidationMessage
                    valid={nameValid}
                  >
                    {nameValid
                      ? 'Nama lengkap terlihat bagus.'
                      : 'Nama minimal 2 karakter.'}
                  </ValidationMessage>
                )}

              </label>
            )}

            {/* =========================
                EMAIL
            ========================= */}

            {mode !== 'reset' && (
              <label className="block">

                <span className="text-xs font-black uppercase">
                  Email
                </span>

                <div className="relative mt-1">

                  <Mail className="absolute left-3 top-3.5 w-4 h-4 opacity-50" />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className={`w-full border-2 rounded-xl px-10 py-3 outline-none transition ${
                      email.length === 0
                        ? 'border-[#1D3557]/30'
                        : emailValid
                          ? 'border-emerald-500'
                          : 'border-red-500'
                    } focus:border-[#1D3557]`}
                    placeholder="nama@email.com"
                    autoComplete="email"
                  />

                </div>

                {email.length > 0 && (
                  <ValidationMessage
                    valid={emailValid}
                  >
                    {emailValid
                      ? 'Format email valid.'
                      : 'Format email belum benar. Contoh: nama@email.com'}
                  </ValidationMessage>
                )}

              </label>
            )}

            {/* =========================
                PASSWORD
            ========================= */}

            {mode !== 'forgot' && (
              <label className="block">

                <span className="text-xs font-black uppercase">
                  {mode === 'reset'
                    ? 'Password Baru'
                    : 'Password'}
                </span>

                <div className="relative mt-1">

                  <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 opacity-50" />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className={`w-full border-2 rounded-xl px-10 pr-12 py-3 outline-none transition ${
                      password.length === 0
                        ? 'border-[#1D3557]/30'
                        : passwordValid
                          ? 'border-emerald-500'
                          : 'border-red-500'
                    } focus:border-[#1D3557]`}
                    placeholder="Buat password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-3.5 opacity-60 hover:opacity-100"
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

                {password.length > 0 && (
                  <>
                    <ValidationMessage
                      valid={passwordValid}
                    >
                      {passwordValid
                        ? 'Password sudah memenuhi semua persyaratan.'
                        : 'Password belum memenuhi semua persyaratan.'}
                    </ValidationMessage>

                    {!passwordValid && (
                      <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">

                        <div className="font-black mb-2">
                          Password harus memiliki:
                        </div>

                        <div className="space-y-1">

                          <div>
                            {passwordChecks.minLength
                              ? '✓'
                              : '•'}{' '}
                            Minimal 8 karakter
                          </div>

                          <div>
                            {passwordChecks.upper
                              ? '✓'
                              : '•'}{' '}
                            Huruf besar
                          </div>

                          <div>
                            {passwordChecks.lower
                              ? '✓'
                              : '•'}{' '}
                            Huruf kecil
                          </div>

                          <div>
                            {passwordChecks.number
                              ? '✓'
                              : '•'}{' '}
                            Angka
                          </div>

                          <div>
                            {passwordChecks.symbol
                              ? '✓'
                              : '•'}{' '}
                            Simbol, contoh: !@#$%
                          </div>

                        </div>

                      </div>
                    )}

                  </>
                )}

              </label>
            )}

            {/* =========================
                KONFIRMASI PASSWORD
            ========================= */}

            {(mode === 'register' ||
              mode === 'reset') && (
              <label className="block">

                <span className="text-xs font-black uppercase">
                  Konfirmasi Password
                </span>

                <div className="relative mt-1">

                  <KeyRound className="absolute left-3 top-3.5 w-4 h-4 opacity-50" />

                  <input
                    type={
                      showConfirm
                        ? 'text'
                        : 'password'
                    }
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className={`w-full border-2 rounded-xl px-10 pr-12 py-3 outline-none transition ${
                      confirmPassword.length === 0
                        ? 'border-[#1D3557]/30'
                        : confirmValid
                          ? 'border-emerald-500'
                          : 'border-red-500'
                    } focus:border-[#1D3557]`}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-3.5 opacity-60 hover:opacity-100"
                    aria-label={
                      showConfirm
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

                {confirmPassword.length > 0 && (
                  <ValidationMessage
                    valid={confirmValid}
                  >
                    {confirmValid
                      ? 'Konfirmasi password cocok.'
                      : 'Password tidak cocok. Periksa kembali.'}
                  </ValidationMessage>
                )}

              </label>
            )}

            {/* =========================
                SUBMIT
            ========================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full brick-btn bg-[#FFF176] border-2 border-[#1D3557] rounded-xl py-3.5 font-heading font-black disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition"
            >
              {loading
                ? 'Memproses...'
                : mode === 'register'
                  ? 'Daftar sebagai Siswa'
                  : mode === 'forgot'
                    ? 'Kirim Link Reset'
                    : mode === 'reset'
                      ? 'Simpan Password Baru'
                      : 'Login'}
            </button>

          </form>

          {/* =========================
              LOGIN
          ========================= */}

          {mode === 'login' && (
            <div className="mt-5 text-center text-sm">

              <button
                type="button"
                onClick={() =>
                  changeMode('forgot')
                }
                className="font-bold underline"
              >
                Lupa password?
              </button>

              <div className="mt-3 opacity-70">
                Belum punya akun?
              </div>

              <button
                type="button"
                onClick={() =>
                  changeMode('register')
                }
                className="font-black underline"
              >
                Daftar sebagai siswa
              </button>

            </div>
          )}

          {/* =========================
              REGISTER
          ========================= */}

          {mode === 'register' && (
            <div className="mt-5 text-center text-sm">

              Sudah punya akun?{' '}

              <button
                type="button"
                onClick={() =>
                  changeMode('login')
                }
                className="font-black underline"
              >
                Login
              </button>

            </div>
          )}

          {/* =========================
              FORGOT / RESET
          ========================= */}

          {(mode === 'forgot' ||
            mode === 'reset') && (
            <div className="mt-5 text-center text-sm">

              <button
                type="button"
                onClick={() =>
                  changeMode('login')
                }
                className="font-black underline"
              >
                Kembali ke login
              </button>

            </div>
          )}



        </div>
      </div>
    </div>
  );
};