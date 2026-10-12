import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { SignInSheet } from './features/account/SignInSheet'
import { router } from './router'
import { useAppStore } from './store/useAppStore'
import { cloudEnabled } from './sync/config'

function useThemeSync() {
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0B1A2E' : '#F3F7FB')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  useThemeSync()
  return (
    <>
      <RouterProvider router={router} />
      {cloudEnabled && <SignInSheet />}
    </>
  )
}
