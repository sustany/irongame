import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AgentTrainer from './AgentTrainer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AgentTrainer />
  </StrictMode>
)
