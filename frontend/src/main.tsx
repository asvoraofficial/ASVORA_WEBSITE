import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Public from './Public'
import Admin from './Admin'
import './index.css'
const Page = ({ children }: any) => <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .5 }}>{children}</motion.div>
function NotFound() {
  return <Page><main className="grid min-h-screen place-items-center px-5 text-center">
    <div>
      <p className="font-display text-8xl font-bold text-lime">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-white/60">The page you’re looking for doesn’t exist or may have moved.</p>
      <Link to="/" className="btn-p mt-6 inline-flex">Back to home</Link>
    </div>
  </main></Page>
}
function App() {
  const l = useLocation()
  return <AnimatePresence mode="wait"><Routes location={l} key={l.pathname.startsWith('/admin') ? 'a' : 'p'}>
    <Route path="/admin/*" element={<Page><Admin /></Page>} />
    <Route path="/" element={<Page><Public /></Page>} />
    <Route path="/services" element={<Page><Public /></Page>} />
    <Route path="/work" element={<Page><Public /></Page>} />
    <Route path="*" element={<NotFound />} /></Routes></AnimatePresence>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>)
