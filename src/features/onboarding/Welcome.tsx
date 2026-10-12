import { CalendarCheck, Flame, Timer } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { Logo, Snowfall } from '@/components/Scenery'
import { PHOTOS } from '@/lib/photos'
import { useAuthStore } from '@/store/useAuthStore'
import { cloudEnabled } from '@/sync/config'

const FEATURES = [
  { icon: CalendarCheck, text: 'A plan built for your gear, level and goals' },
  { icon: Timer, text: 'Guided timers with an animated coach' },
  { icon: Flame, text: 'Weekly streaks to keep you on track' },
]

export default function Welcome() {
  const user = useAuthStore((s) => s.user)
  const openSignIn = useAuthStore((s) => s.openSignIn)

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#06111f] text-white">
      <img src={PHOTOS.hero} alt="" className="absolute inset-0 h-full w-full object-cover object-[82%_85%] opacity-90 lg:object-[50%_88%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/70 to-[#06111f]/10 lg:bg-gradient-to-r lg:from-[#06111f] lg:via-[#06111f]/70 lg:to-transparent" />
      <Snowfall density={1.6} />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pt-safe pb-safe sm:px-8">
        <div className="pt-6">
          <Logo />
        </div>
        <div className="mt-auto max-w-xl pb-10 lg:my-auto lg:pb-0">
          <div className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">Snowboard offseason training</div>
          <h1 className="font-display text-7xl leading-[0.88] sm:text-8xl">
            Ride stronger
            <br />
            this <span className="text-accent">season.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/80">
            Home workouts designed for snowboarders. Answer six quick questions and get a personalized program that peaks right
            before your first chair.
          </p>
          <ul className="mt-6 grid gap-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <LinkButton to="/onboarding" size="lg" className="mt-8 w-full sm:w-auto sm:px-10">
            Build my plan
          </LinkButton>
          {cloudEnabled && (
            <p className="mt-4 text-sm text-white/75">
              {user ? (
                <>Signed in as {user.email ?? user.displayName}. Build your plan to get started.</>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={openSignIn} className="font-semibold text-white underline-offset-4 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
          <p className="mt-4 text-xs text-white/55">
            Not medical advice. Stop if anything hurts, and check with a doctor or physio if you’re coming back from an injury.
          </p>
        </div>
      </div>
    </div>
  )
}
