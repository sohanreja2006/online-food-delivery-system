import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { AuthUserProfile, SupabaseAuthService } from '../models/AuthService';
import {
  clearRuntimeSupabaseConfig,
  getSupabaseConfig,
  saveRuntimeSupabaseConfig,
} from '../services/supabaseClient';

type AuthMode = 'signin' | 'signup' | 'magic' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  authService: SupabaseAuthService;
  currentProfile: AuthUserProfile | null;
  onClose: () => void;
  onAuthSuccess: (profile: AuthUserProfile | null, message: string) => void;
  onSupabaseConfigured: () => void;
  onRecordError: (error: unknown) => string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  authService,
  currentProfile,
  onClose,
  onAuthSuccess,
  onSupabaseConfigured,
  onRecordError,
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  const [runtimeUrl, setRuntimeUrl] = useState('');
  const [runtimeKey, setRuntimeKey] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const config = getSupabaseConfig();

  const handleSaveRuntimeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      saveRuntimeSupabaseConfig(runtimeUrl, runtimeKey);
      onSupabaseConfigured();
      setInfoMsg('Supabase credentials saved! You can now sign up or sign in.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid Supabase configuration.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);

    try {
      if (mode === 'signin') {
        const profile = await authService.signInWithPassword(email, password);
        onAuthSuccess(profile, `Signed in as ${profile.fullName}.`);
      } else if (mode === 'signup') {
        const res = await authService.signUp({
          fullName,
          email,
          phone,
          address,
          landmark,
          password,
        });
        // Auto-confirm trigger is active — session is returned immediately.
        if (res.profile) {
          onAuthSuccess(res.profile, `Welcome, ${res.profile.fullName}! Account created & signed in.`);
        } else {
          setInfoMsg(`Account created for ${email}! You can now sign in.`);
          setMode('signin');
        }
      } else if (mode === 'magic') {
        await authService.sendMagicLink(email);
        setInfoMsg(`Magic sign-in link sent to ${email}. Check your inbox to log in.`);
      } else if (mode === 'reset') {
        await authService.sendPasswordReset(email);
        setInfoMsg(`Password reset email sent to ${email}.`);
      }
    } catch (err) {
      const msg = onRecordError(err);
      setErrorMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await authService.signOut();
      onAuthSuccess(null, 'Signed out of Supabase Auth.');
    } catch (err) {
      setErrorMsg(onRecordError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E7DFD3] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAF7F2] border-b border-[#E7DFD3]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#D94E28]/10 text-[#D94E28]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {currentProfile ? 'Your Account' : 'Supabase Authentication'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {config
                  ? `Connected (${config.source === 'env' ? '.env.local' : 'Browser Config'})`
                  : 'Setup required to enable live auth'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {currentProfile ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#E7DFD3] p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{currentProfile.fullName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      currentProfile.emailConfirmed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {currentProfile.emailConfirmed ? 'Verified' : 'Unverified Email'}
                  </span>
                </div>
                <div className="text-stone-600">{currentProfile.email}</div>
                <div className="text-stone-600">{currentProfile.phone}</div>
                <div className="text-stone-600">{currentProfile.address}</div>
                <div className="pt-1 font-mono-code text-[10px] text-stone-400">
                  Supabase UID: {currentProfile.id}
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {busy ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          ) : !config ? (
            <form onSubmit={handleSaveRuntimeConfig} className="space-y-4">
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold">Supabase Credentials Needed</div>
                <p className="leading-relaxed">
                  Add <span className="font-mono-code">VITE_SUPABASE_URL</span> and{' '}
                  <span className="font-mono-code">VITE_SUPABASE_PUBLISHABLE_KEY</span> to{' '}
                  <span className="font-mono-code">.env.local</span> (see{' '}
                  <span className="font-mono-code">.env.example</span>), or connect directly below:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={runtimeUrl}
                  onChange={(e) => setRuntimeUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm font-mono-code"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Supabase Anon / Publishable Key
                </label>
                <input
                  type="text"
                  required
                  value={runtimeKey}
                  onChange={(e) => setRuntimeKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm font-mono-code"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#D94E28] hover:bg-[#B63B19] text-white text-sm font-semibold transition cursor-pointer"
              >
                Connect Supabase Project
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5 bg-[#FAF7F2] p-1 rounded-2xl border border-[#E7DFD3]">
                {(
                  [
                    { id: 'signin', label: 'Sign In' },
                    { id: 'signup', label: 'Sign Up' },
                    { id: 'magic', label: 'Magic Link' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id);
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      mode === tab.id || (mode === 'reset' && tab.id === 'signin')
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ahammed Sohan Raja"
                        className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="Near Central Park"
                          className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="42 Park Street, Block B"
                        className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                  />
                </div>

                {(mode === 'signin' || mode === 'signup') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-600">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('reset');
                            setErrorMsg(null);
                            setInfoMsg(null);
                          }}
                          className="text-[11px] font-semibold text-[#D94E28] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-[#E7DFD3] px-3.5 py-2 text-sm"
                    />
                  </div>
                )}

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-xs font-semibold text-stone-600 hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D94E28] hover:bg-[#B63B19] text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {mode === 'signin' && <LogIn className="w-4 h-4" />}
                  {mode === 'signup' && <UserPlus className="w-4 h-4" />}
                  {mode === 'magic' && <Mail className="w-4 h-4" />}
                  {mode === 'reset' && <KeyRound className="w-4 h-4" />}
                  {busy
                    ? 'Please wait...'
                    : mode === 'signin'
                      ? 'Sign In with Supabase'
                      : mode === 'signup'
                        ? 'Create Account'
                        : mode === 'magic'
                          ? 'Send Magic Link'
                          : 'Send Password Reset Email'}
                </button>
              </form>

              {config.source === 'runtime' && (
                <div className="pt-2 border-t border-[#E7DFD3] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearRuntimeSupabaseConfig();
                      onSupabaseConfigured();
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Change connected Supabase project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

