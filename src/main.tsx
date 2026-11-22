import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PublicLanding from './PublicLanding.tsx'
import LazyEshop from './eshop/LazyEshop.tsx'

const prototype = new URLSearchParams(window.location.search).get('prototyp')
const Page = prototype === 'eshop' ? LazyEshop : prototype === 'obchod' ? App : PublicLanding

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
