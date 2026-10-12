import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useAuthStore } from '@/store/useAuthStore'
import { loadCloud } from '@/sync/config'

type Cloud = Awaited<ReturnType<typeof loadCloud>>
type Busy = 'google' | 'email' | 'reset' | null

const inputClass =
  'h-12 w-full rounded-2xl border border-line bg-elev-2 px-4 text-ink placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30'

/** Google or email/password sign-in. Opened from anywhere via `useAuthStore.openSignIn()`. */
export function SignInSheet() {
  const open = useAuthStore((s) => s.signInOpen)
  const close = useAuthStore((s) => s.closeSignIn)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Close once the account's data has been merged into this device.
  useEffect(() => {
    if (open && status === 'signedIn') close()
  }, [open, status, close])

  useEffect(() => {
    if (!open) {
      setPassword('')
      setNotice(null)
    }
  }, [open])

  const setError = (msg: string | null) => useAuthStore.setState({ error: msg })

  async function run(kind: Busy, action: (cloud: Cloud) => Promise<unknown>) {
    setBusy(kind)
    setError(null)
    setNotice(null)
    let cloud: Cloud
    try {
      cloud = await loadCloud()
    } catch {
      setBusy(null)
      return setError('No connection. Check your internet and try again.')
    }
    try {
      await action(cloud)
    } catch (err) {
      setError(cloud.authErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run('email', (c) => (mode === 'signIn' ? c.signInEmail(email, password) : c.signUpEmail(email, password)))
  }

  const forgot = () => {
    if (!email.trim()) return setError('Enter your email above, then tap “Forgot password?” again.')
    void run('reset', async (c) => {
      await c.resetPassword(email)
      setNotice(`We sent a reset link to ${email.trim()}. Check your inbox (and spam).`)
    })
  }

  const connecting = status === 'connecting'

  return (
    <Sheet open={open} onClose={close} title={connecting ? 'Signing in' : mode === 'signIn' ? 'Sign in' : 'Create account'}>
      {connecting ? (
        <div className="flex flex-col items-center gap-3 py-10 text-muted">
          <LoaderCircle size={28} className="animate-spin text-primary" />
          Loading your training…
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">Save your plan, workout history and streak to your account, and pick up on any device.</p>

          <Button variant="outline" size="lg" className="mt-4 w-full" disabled={busy !== null} onClick={() => void run('google', (c) => c.signInWithGoogle())}>
            {busy === 'google' ? <LoaderCircle size={20} className="animate-spin" /> : <GoogleMark />}
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs font-semibold tracking-wide text-muted uppercase">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <Field label="Email" htmlFor="auth-email">
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Password"
              htmlFor="auth-password"
              action={
                mode === 'signIn' && (
                  <button type="button" onClick={forgot} disabled={busy !== null} className="text-xs font-semibold text-primary hover:underline">
                    {busy === 'reset' ? 'Sending…' : 'Forgot password?'}
                  </button>
                )
              }
            >
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  placeholder={mode === 'signUp' ? 'At least 6 characters' : ''}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-1 flex w-11 items-center justify-center text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-success">
                {notice}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy !== null}>
              {busy === 'email' && <LoaderCircle size={20} className="animate-spin" />}
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            {mode === 'signIn' ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                setError(null)
                setNotice(null)
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === 'signIn' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </>
      )}
    </Sheet>
  )
}

function Field({ label, htmlFor, action, children }: { label: string; htmlFor: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}
