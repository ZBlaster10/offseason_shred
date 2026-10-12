import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { useAuthStore } from './store/useAuthStore'
import { cloudEnabled, loadCloud } from './sync/config'
import './styles/index.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (cloudEnabled) {
  loadCloud()
    .then((cloud) => cloud.initCloud())
    .catch((err) => {
      console.warn('[sync] could not load', err)
      useAuthStore.setState({ status: 'signedOut' })
    })
}
