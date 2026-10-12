import { CircleCheck, CloudAlert, CloudOff, CloudUpload, LoaderCircle, LogOut, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useAuthStore, type SyncStatus } from '@/store/useAuthStore'
import { loadCloud } from '@/sync/config'

const SYNC: Record<SyncStatus, { icon: typeof CircleCheck; label: string; className: string }> = {
  synced: { icon: CircleCheck, label: 'Synced', className: 'text-success' },
  pending: { icon: RefreshCw, label: 'Saving…', className: 'text-primary' },
  offline: { icon: CloudOff, label: 'Offline · changes sync when you’re back online', className: 'text-muted' },
  error: { icon: CloudAlert, label: 'Sync problem. Check your connection and reload.', className: 'text-danger' },
}

/** Profile → Account: sign in to back up, or see who's signed in and the sync state. */
export function AccountCard() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const sync = useAuthStore((s) => s.sync)
  const openSignIn = useAuthStore((s) => s.openSignIn)
  const [confirm, setConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    setSigningOut(true)
    try {
      await (await loadCloud()).signOutAndClear()
    } finally {
      setSigningOut(false)
      setConfirm(false)
    }
  }

  if (status === 'unknown' || status === 'connecting') {
    return (
      <section className="flex items-center gap-3 rounded-3xl bg-elev p-5 text-muted shadow-card lg:col-span-2">
        <LoaderCircle size={20} className="animate-spin text-primary" /> Checking your account…
      </section>
    )
  }

  if (status === 'signedOut' || !user) {
    return (
      <section className="flex flex-col gap-4 rounded-3xl bg-primary-soft p-5 sm:flex-row sm:items-center lg:col-span-2">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-ink">
          <CloudUpload size={24} />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-3xl leading-none">Back up your training</h2>
          <p className="mt-1 text-sm text-muted">
            Your plan, history and streak are only on this device. Sign in to keep them safe and train on any device.
          </p>
        </div>
        <Button variant="ice" onClick={openSignIn} className="sm:px-8">
          Sign in
        </Button>
      </section>
    )
  }

  const { icon: SyncIcon, label, className } = SYNC[sync]
  const name = user.displayName || user.email || 'Your account'

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-3xl bg-elev p-5 shadow-card lg:col-span-2">
      <Avatar name={name} photoURL={user.photoURL} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{name}</div>
        {user.displayName && user.email && <div className="truncate text-sm text-muted">{user.email}</div>}
        <div className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
          <SyncIcon size={14} className={sync === 'pending' ? 'animate-spin' : ''} /> {label}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => setConfirm(true)} className="basis-full sm:basis-auto">
        <LogOut size={16} /> Sign out
      </Button>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Sign out?">
        <p className="text-muted">
          Your plan, history and streak stay in your account. This device will be cleared until you sign in again.
        </p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" variant="ice" disabled={signingOut} onClick={() => void signOut()}>
            {signingOut && <LoaderCircle size={20} className="animate-spin" />} Sign out
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </section>
  )
}

function Avatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  const [broken, setBroken] = useState(false)
  if (photoURL && !broken) {
    return <img src={photoURL} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl text-primary-ink">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
