import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PublicLanding from './PublicLanding.tsx'

const isOriginalPrototype = new URLSearchParams(window.location.search).get('prototyp') === 'obchod'
const Page = isOriginalPrototype ? App : PublicLanding

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
