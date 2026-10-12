import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router'
import { AppShell } from '@/components/AppShell'
import Today from '@/features/home/Today'
import Onboarding from '@/features/onboarding/Onboarding'
import PlanReveal from '@/features/onboarding/PlanReveal'
import Welcome from '@/features/onboarding/Welcome'
import PlanPage from '@/features/plan/PlanPage'
import SessionDetail from '@/features/plan/SessionDetail'
import Complete from '@/features/player/Complete'
import Player from '@/features/player/Player'
import Progress from '@/features/progress/Progress'
import EditPlan from '@/features/settings/EditPlan'
import ProfilePage from '@/features/settings/Profile'
import { useAppStore } from '@/store/useAppStore'

// Dev-only QA page showing every exercise animation (not shipped in production builds).
const devRoutes = import.meta.env.DEV
  ? [{ path: '/dev/animations', lazy: async () => ({ Component: (await import('@/features/dev/AnimationGallery')).default }) }]
  : []

/** Routes that need a finished onboarding. */
function RequireProfile({ children }: { children?: ReactNode }) {
  const profile = useAppStore((s) => s.profile)
  if (!profile) return <Navigate to="/welcome" replace />
  return children ?? <Outlet />
}

/** Onboarding routes bounce to home once a plan exists. */
function RequireNoProfile({ children }: { children: ReactNode }) {
  const profile = useAppStore((s) => s.profile)
  if (profile) return <Navigate to="/" replace />
  return children
}

function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

export const router = createBrowserRouter(
  [
    {
      element: <Root />,
      children: [
        { path: '/welcome', element: <RequireNoProfile><Welcome /></RequireNoProfile> },
        { path: '/onboarding', element: <Onboarding /> },
        {
          element: <RequireProfile />,
          children: [
            { path: '/building', element: <PlanReveal /> },
            { path: '/workout/:weekKey/:sessionId', element: <Player /> },
            { path: '/complete/:id', element: <Complete /> },
            { path: '/profile/edit', element: <EditPlan /> },
            {
              element: <AppShell />,
              children: [
                { index: true, element: <Today /> },
                { path: '/plan', element: <PlanPage /> },
                { path: '/plan/:weekKey/:sessionId', element: <SessionDetail /> },
                { path: '/progress', element: <Progress /> },
                { path: '/profile', element: <ProfilePage /> },
              ],
            },
          ],
        },
        ...devRoutes,
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  // '/<repo>/' on GitHub Pages, '/' everywhere else. Route paths stay root-relative.
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
