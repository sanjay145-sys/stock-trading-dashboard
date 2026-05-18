import { SignIn } from '@clerk/nextjs';
import { Activity } from 'lucide-react';

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Brand header */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">StockPulse AI</h1>
        <p className="text-sm text-zinc-500 mt-1.5">AI-powered investment intelligence</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-600">
          <span>Real-time data</span>
          <span>·</span>
          <span>Claude AI analysis</span>
          <span>·</span>
          <span>Invite only</span>
        </div>
      </div>

      {/* Clerk sign-in component — dark themed */}
      <SignIn
        appearance={{
          variables: {
            colorBackground: '#0f1219',
            colorInputBackground: '#141820',
            colorText: '#e2e8f0',
            colorTextSecondary: '#94a3b8',
            colorTextOnPrimaryBackground: '#ffffff',
            colorPrimary: '#6366f1',
            colorDanger: '#f87171',
            colorSuccess: '#34d399',
            colorNeutral: '#71717a',
            borderRadius: '0.625rem',
            fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            fontSize: '14px',
          },
          elements: {
            card: {
              backgroundColor: '#0f1219',
              border: '1px solid #1e2435',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
            },
            headerTitle: { color: '#e2e8f0', fontWeight: '700' },
            headerSubtitle: { color: '#64748b' },
            dividerLine: { backgroundColor: '#1e2435' },
            dividerText: { color: '#52525b' },
            formButtonPrimary: {
              backgroundColor: '#6366f1',
              '&:hover': { backgroundColor: '#4f46e5' },
            },
            formFieldInput: {
              backgroundColor: '#141820',
              borderColor: '#1e2435',
              color: '#e2e8f0',
              '&:focus': { borderColor: '#6366f1' },
            },
            formFieldLabel: { color: '#94a3b8' },
            identityPreviewText: { color: '#e2e8f0' },
            identityPreviewEditButton: { color: '#818cf8' },
            footerActionLink: { color: '#818cf8' },
            socialButtonsBlockButton: {
              backgroundColor: '#141820',
              borderColor: '#1e2435',
              color: '#e2e8f0',
              '&:hover': { backgroundColor: '#1e2435' },
            },
            socialButtonsBlockButtonText: { color: '#e2e8f0' },
          },
        }}
      />

      <p className="mt-6 text-xs text-zinc-700 text-center max-w-xs">
        Access is by invitation only. Contact the admin if you need access.
      </p>
    </div>
  );
}
