import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldAlert, CheckCircle, Info, KeyRound } from 'lucide-react';

interface AuthPageProps {
  onShowToast: (msg: string) => void;
}

export default function AuthPage({ onShowToast }: AuthPageProps) {
  const { login, signup, oauthLogin, forgotPassword, resetPassword, verifyEmail } = useAuth();
  
  // App views: 'login' | 'signup' | 'forgot' | 'reset' | 'verify'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  
  // Credentials Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recovery / Verification States
  const [tokenInput, setTokenInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [mockResetLink, setMockResetLink] = useState<string | null>(null);



  // Handle URL search params on load (e.g. for reset-password or verify-email redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const emailParam = params.get('email');
    const userId = params.get('userId');

    if (token) {
      setTokenInput(token);
      if (emailParam) {
        setEmail(emailParam);
        setAuthMode('reset');
      } else if (userId) {
        setUserIdInput(userId);
        setAuthMode('verify');
      }
    }
  }, []);

  // Validate and submit credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setMockResetLink(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) && authMode !== 'verify') {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(email, password, rememberMe);
        onShowToast('Logged in successfully!');
      } else if (authMode === 'signup') {
        await signup(email, password, name);
        onShowToast('Account created successfully!');
      } else if (authMode === 'forgot') {
        const res = await forgotPassword(email);
        setSuccessMessage('Password reset instructions generated.');
        if (res.mockResetToken) {
          const mockLink = `http://localhost:5173/?token=${res.mockResetToken}&email=${encodeURIComponent(email)}`;
          setMockResetLink(mockLink);
        }
        onShowToast('Reset token generated successfully!');
      } else if (authMode === 'reset') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }
        await resetPassword(email, tokenInput, password);
        setSuccessMessage('Password successfully updated. You can now login.');
        setAuthMode('login');
        setPassword('');
        onShowToast('Password updated successfully!');
      } else if (authMode === 'verify') {
        await verifyEmail(userIdInput, tokenInput);
        setSuccessMessage('Email successfully verified. You can now login.');
        setAuthMode('login');
        onShowToast('Email verified successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger actual Firebase OAuth login flow
  const handleOAuthClick = async (provider: 'google' | 'apple') => {
    setError(null);
    setSuccessMessage(null);
    if (provider === 'google') {
      setLoading(true);
      try {
        await oauthLogin('google');
        onShowToast('Signed in via Google successfully!');
      } catch (err: any) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Apple authentication is not configured. Please use Google or Email/Password.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors relative overflow-hidden select-none font-sans">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Sparkles size={24} />
          </div>
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">NovaDocs Workspace</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Create. Edit. Export.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-xs font-semibold text-red-500 dark:text-red-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30 text-xs font-semibold text-green-600 dark:text-green-400 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {mockResetLink && (
          <div className="mb-5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs text-blue-600 dark:text-blue-450 flex flex-col gap-1.5 animate-in fade-in">
            <span className="font-bold flex items-center gap-1"><Info size={12}/> Dev Simulation Token:</span>
            <span className="font-mono text-[10px] break-all select-all bg-white dark:bg-slate-950 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50 cursor-pointer">
              {mockResetLink}
            </span>
            <span className="text-[10px] text-slate-400">Clicking this box copies/selects the simulation link to reset password directly.</span>
          </div>
        )}

        {/* Auth form controller */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authMode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {authMode !== 'verify' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-slate-400" size={14} />
                <input
                  type="email"
                  required
                  disabled={authMode === 'reset'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100 disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">
                {authMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-slate-400" size={14} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {authMode === 'reset' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Reset Security Token</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste token here"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {authMode === 'verify' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Verification Token</label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter token"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">User ID</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    required
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="Enter User ID"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 pl-9 pr-3 py-3 rounded-xl outline-none focus:border-blue-500 font-medium transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </>
          )}

          {authMode === 'login' && (
            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 text-slate-500 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember Me</span>
              </label>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-650 hover:underline font-bold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>
                  {authMode === 'login' && 'Sign In'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'forgot' && 'Send Recovery Instructions'}
                  {authMode === 'reset' && 'Update Password'}
                  {authMode === 'verify' && 'Verify Email Address'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Separator for OAuth */}
        {(authMode === 'login' || authMode === 'signup') && (
          <>
            <div className="flex items-center my-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
              <div className="h-[1px] bg-slate-150 dark:bg-slate-800/85 flex-1" />
              <span>Or Continue With</span>
              <div className="h-[1px] bg-slate-150 dark:bg-slate-800/85 flex-1" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuthClick('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                onClick={() => handleOAuthClick('apple')}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.27-.58 2.97-1.41z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </>
        )}

        {/* Toggle Mode / Back */}
        <div className="mt-8 text-center text-xs">
          {authMode === 'login' && (
            <>
              <span className="text-slate-400">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Create one now
              </button>
            </>
          )}
          {authMode === 'signup' && (
            <>
              <span className="text-slate-400">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Sign in here
              </button>
            </>
          )}
          {(authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMessage(null);
                setMockResetLink(null);
              }}
              className="text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>


    </div>
  );
}
