import { format, parseISO } from 'date-fns'
import { ChevronRight, Download, ExternalLink, Gauge, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/AppShell'
import { EquipmentIcon } from '@/components/EquipmentIcon'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Segmented, Switch } from '@/components/ui/Toggle'
import { equipmentName } from '@/data/equipment'
import { AccountCard } from '@/features/account/AccountCard'
import { useProfile } from '@/hooks/usePlan'
import { PHOTO_CREDITS } from '@/lib/photos'
import { useAppStore, type ThemePref } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cloudEnabled } from '@/sync/config'

const LEVEL_NAME = { 1: 'Getting started', 2: 'Pretty active', 3: 'Athlete mode' } as const
const GOAL_NAME = { strength: 'Strength', aerobic: 'Aerobic & Power', mobility: 'Mobility & Core' } as const

const SOURCES = [
  { label: 'Workout Like A PRO Snowboarder: 24-min home workout (Snowboard Addiction × Jeremy Watkins)', url: 'https://www.youtube.com/watch?v=Hf0Jm14DLOw' },
  { label: 'The Workout EVERY Snowboarder Should be Doing! (Mobility Duo)', url: 'https://www.youtube.com/watch?v=_jPLzkoCUCE' },
  { label: '30 Minute Snowboard Workout, designed by a Doctor of Physical Therapy (Mobility Duo)', url: 'https://www.youtube.com/watch?v=y4s4jS35R7M' },
  { label: 'Injury Prevention: 6 Movements to Protect Yourself from Snowboard Falls (Burton)', url: 'https://www.burton.com/blogs/the-burton-blog/get-fit-snowboard-injury-prevention' },
]

interface InstallEvent extends Event {
  prompt: () => Promise<void>
}

function useInstallPrompt() {
  const [evt, setEvt] = useState<InstallEvent | null>(null)
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  return evt
}

export default function ProfilePage() {
  const profile = useProfile()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const intensityAdjust = useAppStore((s) => s.intensityAdjust)
  const resetAll = useAppStore((s) => s.resetAll)
  const signedIn = useAuthStore((s) => s.status === 'signedIn')
  const resetScope = signedIn ? 'from your account and all your devices' : 'from this device'
  const [confirmReset, setConfirmReset] = useState(false)
  const install = useInstallPrompt()

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Sessions per week', value: `${profile.daysPerWeek}×` },
    {
      label: 'Equipment',
      value: profile.equipment.length ? (
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {profile.equipment.map((e) => (
            <span key={e} title={equipmentName(e)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-elev-2 text-primary">
              <EquipmentIcon id={e} size={16} />
            </span>
          ))}
        </span>
      ) : (
        'Bodyweight only'
      ),
    },
    { label: 'Fitness level', value: LEVEL_NAME[profile.level] },
    { label: 'Focus', value: profile.goals.map((g) => GOAL_NAME[g]).join(', ') },
    { label: 'Session length', value: `${profile.sessionMinutes} min` },
    { label: 'Season start', value: profile.seasonStart ? format(parseISO(profile.seasonStart), 'MMM d, yyyy') : 'Not sure yet' },
  ]

  return (
    <Page className="pb-10">
      <header className="pt-6 pb-5 lg:pt-10">
        <div className="text-sm text-muted">Settings</div>
        <h1 className="font-display text-5xl leading-none">Profile</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {cloudEnabled && <AccountCard />}

        <section className="rounded-3xl bg-elev p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Your training</h2>
            <Link to="/profile/edit" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Edit <ChevronRight size={16} />
            </Link>
          </div>
          <dl className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-muted">{r.label}</dt>
                <dd className="text-right font-semibold">{r.value}</dd>
              </div>
            ))}
          </dl>
          {intensityAdjust !== 0 && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-primary-soft p-3 text-sm">
              <span className="inline-flex items-center gap-2 text-primary">
                <Gauge size={16} />
                Intensity {intensityAdjust > 0 ? `+${intensityAdjust}` : intensityAdjust} from your feedback
              </span>
              <button type="button" onClick={() => useAppStore.setState({ intensityAdjust: 0 })} className="inline-flex items-center gap-1 font-semibold text-primary">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}
          <Link to="/profile/edit" className="mt-4 block">
            <Button variant="secondary" className="w-full">
              Change parameters & rebuild plan
            </Button>
          </Link>
        </section>

        <section className="rounded-3xl bg-elev p-5 shadow-card">
          <h2 className="font-display text-3xl">App</h2>
          <div className="mt-2 divide-y divide-line">
            <Row label="Theme">
              <Segmented<ThemePref>
                label="Theme"
                value={settings.theme}
                onChange={(theme) => updateSettings({ theme })}
                options={[
                  { value: 'system', label: 'Auto' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </Row>
            <Row label="Sound effects" hint="Beeps for countdowns and transitions">
              <Switch label="Sound effects" checked={settings.sound} onChange={(sound) => updateSettings({ sound })} />
            </Row>
            <Row label="Voice coach" hint="Announces each exercise out loud">
              <Switch label="Voice coach" checked={settings.voice} onChange={(voice) => updateSettings({ voice })} />
            </Row>
            <Row label="Haptics" hint="Vibration on supported devices">
              <Switch label="Haptics" checked={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
            </Row>
          </div>
          {install && (
            <Button variant="ice" className="mt-4 w-full" onClick={() => void install.prompt()}>
              <Download size={18} /> Install app on this device
            </Button>
          )}
        </section>

        <section className="rounded-3xl bg-elev p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-3xl">About the program</h2>
          <p className="mt-2 text-sm text-muted">
            Exercises and structure are based on these snowboard-specific workouts, plus general dryland conditioning research: eccentric leg
            strength for landings, single-leg stability, hip and trunk control, ankle work, wrist and shoulder fall-proofing, and an aerobic base for
            long days.
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-primary hover:underline">
                  <ExternalLink size={14} className="mt-0.5 shrink-0" /> {s.label}
                </a>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">Photos</h3>
          <p className="mt-1 text-sm text-muted">
            From Unsplash, used under the Unsplash License:{' '}
            {PHOTO_CREDITS.map((c, i) => (
              <span key={c.key}>
                <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {c.by}
                </a>
                {i < PHOTO_CREDITS.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
          <p className="mt-4 text-xs text-muted">
            This app is not medical advice. Stop any exercise that causes pain, and check with a doctor or physiotherapist if you’re injured or
            returning from injury.
          </p>
        </section>

        <section className="rounded-3xl border border-danger/30 p-5 lg:col-span-2">
          <h2 className="font-display text-2xl">Reset</h2>
          <p className="mt-1 text-sm text-muted">Delete your plan, history and streak {resetScope} and start over.</p>
          <Button variant="outline" className="mt-3 text-danger" onClick={() => setConfirmReset(true)}>
            <Trash2 size={16} /> Reset all data
          </Button>
        </section>
      </div>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset everything?">
        <p className="text-muted">Your plan, workout history and streak will be deleted {resetScope}. This can’t be undone.</p>
        <div className="mt-5 grid gap-2">
          <Button size="lg" className="bg-danger" onClick={() => resetAll()}>
            Yes, reset
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </Page>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}
