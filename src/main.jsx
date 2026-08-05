import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import AgentTrainer from './AgentTrainer.jsx'

// Plan Day 6: ?authtest=1 renders the isolated auth probe instead of the app.
// AgentTrainer is untouched. Lazy import keeps supabase-js OUT of the main
// chunk — a normal load must not pay for the auth SDK.
const AuthTest = lazy(() => import('./AuthTest.jsx'))
const authTest = new URLSearchParams(window.location.search).get('authtest') === '1'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {authTest
      ? <Suspense fallback={null}><AuthTest /></Suspense>
      : <AgentTrainer />}
  </StrictMode>
)
