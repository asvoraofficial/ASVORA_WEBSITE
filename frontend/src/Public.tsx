import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { api, media } from './api'
import BrandLogo from './BrandLogo'

const rv = (i = 0) => ({
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay: i * 0.07, ease: [0.2, 0.7, 0.2, 1] },
})

const Tag = ({ children }: any) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-lime">
    <i className="h-1.5 w-1.5 rounded-full bg-lime" />
    {children}
  </span>
)

const Head = ({ tag, title, sub }: any) => (
  <motion.div {...rv()} className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
    <Tag>{tag}</Tag>
    <h2 className="mt-4 font-display text-4xl font-bold md:mt-5 md:text-5xl">{title}</h2>
    {sub && <p className="mt-4 text-white/60">{sub}</p>}
  </motion.div>
)

const safeCaseStudyUrl = (value: unknown): value is string =>
  typeof value === 'string' && ((value.startsWith('/') && !value.startsWith('//')) || /^https?:\/\//i.test(value))

const matchesService = (category: unknown, title: unknown) => {
  const c = String(category || '').trim().toLowerCase()
  const t = String(title || '').trim().toLowerCase()
  if (!c || !t) return false
  return c === t || c.includes(t) || t.includes(c)
}

const REVIEW_PROMPT_KEY = 'asvora_review_prompt_v1'
const REVIEW_PROMPT_COOLDOWN_MS = 60 * 60 * 1000
type ReviewPromptState = { lastPromptAt: number; submitted: boolean }

function readReviewPromptState(): ReviewPromptState {
  try {
    const value = localStorage.getItem(REVIEW_PROMPT_KEY)
    if (!value) return { lastPromptAt: 0, submitted: false }
    const state = JSON.parse(value)
    return {
      lastPromptAt: Number.isFinite(state.lastPromptAt) ? state.lastPromptAt : 0,
      submitted: state.submitted === true,
    }
  } catch {
    return { lastPromptAt: 0, submitted: false }
  }
}

function saveReviewPromptState(state: ReviewPromptState) {
  try {
    localStorage.setItem(REVIEW_PROMPT_KEY, JSON.stringify(state))
  } catch {}
}

function Spot({ children, className = '', onClick }: any) {
  const r = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={r}
      onClick={onClick}
      className={`card relative overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:border-brand/50 ${className}`}
      onMouseMove={e => {
        if (!r.current) return
        const b = r.current.getBoundingClientRect()
        r.current.style.setProperty('--x', e.clientX - b.left + 'px')
        r.current.style.setProperty('--y', e.clientY - b.top + 'px')
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 hover:opacity-100"
        style={{ background: 'radial-gradient(300px circle at var(--x) var(--y),#7c5cff30,transparent 60%)', opacity: 1 }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function Nav({ c, hasProjects, hasTestimonials, currentPath, onStartProject }: any) {
  const [s, setS] = useState(false)
  const [o, setO] = useState(false)

  useEffect(() => {
    const f = () => setS(window.scrollY > 40)
    f()
    window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])

  // Auto-close menu when path changes
  useEffect(() => {
    setO(false)
  }, [currentPath])

  // Close on Escape key press
  useEffect(() => {
    if (!o) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setO(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [o])

  // Close when resized to desktop viewport
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setO(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (o) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [o])

  const navItems = [
    { to: '/', label: 'Home', active: currentPath === '/' },
    { to: '/services', label: 'Services', active: currentPath.startsWith('/services') },
    ...(hasProjects ? [{ to: '/work', label: 'Works', active: currentPath.startsWith('/work') }] : []),
    { to: '/#about', label: 'About', active: false },
    ...(hasTestimonials ? [{ to: '/#testimonials', label: 'Reviews', active: false }] : []),
    { to: '/#contact', label: 'Contact', active: false },
  ]

  const handleHashLinkClick = (e: React.MouseEvent, to: string) => {
    setO(false)
    const hash = to.replace('/', '')
    if (window.location.pathname === '/' && hash.startsWith('#')) {
      e.preventDefault()
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', hash)
      }
    }
  }

  return (
    <>
      <motion.header initial={{ y: -80 }} animate={{ y: 0 }} className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <nav className={`flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-3 sm:px-5 transition-all duration-500 ${s ? 'border border-white/10 bg-ink/80 backdrop-blur-xl shadow-xl shadow-black/30' : ''}`}>
          <Link to="/" onClick={() => setO(false)} className="font-display text-xl font-bold tracking-tight">
            <BrandLogo logo={media(c.logo)} label={c.brand || 'ASVORA'}>{c.brand || 'ASVORA'}</BrandLogo>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">
            {navItems.map(({ to, label, active }) =>
              to.startsWith('/#') ? (
                <a key={to} href={to} onClick={(e) => handleHashLinkClick(e, to)} className="group relative text-sm text-white/70 transition hover:text-white">
                  {label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-lime transition-all group-hover:w-full" />
                </a>
              ) : (
                <Link key={to} to={to} className={`group relative text-sm transition ${active ? 'text-lime font-semibold' : 'text-white/70 hover:text-white'}`}>
                  {label}
                  <span className={`absolute -bottom-1 left-0 h-px transition-all ${active ? 'w-full bg-lime' : 'w-0 bg-lime group-hover:w-full'}`} />
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {onStartProject && (
              <button
                type="button"
                onClick={() => onStartProject()}
                className="btn-p !py-2.5 !px-5 text-xs font-semibold"
              >
                Start your project
              </button>
            )}
          </div>

          {/* Mobile 3-Line Hamburger / Close Button */}
          <button
            type="button"
            aria-label={o ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={o}
            aria-controls="mobile-navigation"
            onClick={() => setO(prev => !prev)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-xl md:hidden transition border border-white/10 active:scale-95 text-white"
          >
            {o ? '✕' : '☰'}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Backdrop and Drawer */}
      <AnimatePresence>
        {o && (
          <>
            {/* Backdrop: Clicking anywhere outside closes the 3-line menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setO(false)}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Dropdown Menu Drawer */}
            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation"
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="card fixed inset-x-3 top-20 z-50 flex flex-col gap-1.5 bg-panel/95 backdrop-blur-2xl border border-white/15 p-4 sm:inset-x-6 sm:p-5 shadow-2xl md:hidden rounded-2xl max-h-[calc(100vh-6rem)] overflow-y-auto"
            >
              {navItems.map(({ to, label, active }) =>
                to.startsWith('/#') ? (
                  <a
                    key={to}
                    href={to}
                    onClick={(e) => handleHashLinkClick(e, to)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-lime/20 text-lime font-semibold' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setO(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-lime/20 text-lime font-semibold' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                  >
                    {label}
                  </Link>
                )
              )}

              {onStartProject && (
                <div className="pt-2 border-t border-white/10 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setO(false)
                      onStartProject()
                    }}
                    className="btn-p w-full !py-3 text-sm text-center font-semibold"
                  >
                    Start your project →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function Counter({ v }: { v: string }) {
  const [n, l] = v.split('|')
  const m = n.match(/^([\d.]+)(.*)$/)
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!m) return
    const t = parseFloat(m[1])
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const s = performance.now()
      const f = (x: number) => {
        const p = Math.min((x - s) / 1600, 1)
        setVal(t * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(f)
      }
      requestAnimationFrame(f)
    })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [v])

  return (
    <div ref={ref} className="text-center">
      <b className="grad font-display text-4xl md:text-5xl">{m ? (m[1].includes('.') ? val.toFixed(1) : Math.round(val)) + m[2] : n}</b>
      <p className="mt-1 text-sm text-white/50">{l}</p>
    </div>
  )
}

function ProjectCard({ p, index = 0, onStartProject }: { p: any; index?: number; onStartProject?: (serviceTitle?: string) => void }) {
  return (
    <motion.article {...rv(index)} className="group card flex flex-col justify-between overflow-hidden">
      <div>
        <div
          className="relative h-48 overflow-hidden sm:h-56"
          style={{ background: `linear-gradient(135deg,hsl(${((index * 65 + 240) % 360)} 70% 30%),#07080c)` }}
        >
          {p.image && <img src={media(p.image)} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />}
          <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur border border-white/10 font-medium">
            {p.category}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <h3 className="font-display text-xl font-semibold sm:text-2xl">{p.title}</h3>
            {p.result && <span className="max-w-full break-words rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-lime">{p.result}</span>}
          </div>
          <p className="mt-2 text-sm text-white/60 leading-relaxed">{p.description}</p>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        {safeCaseStudyUrl(p.caseStudyUrl) ? (
          <a
            href={p.caseStudyUrl}
            target={p.caseStudyUrl.startsWith('/') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="text-sm text-lime transition hover:translate-x-1"
          >
            Read case study →
          </a>
        ) : (
          <span />
        )}
        {onStartProject && (
          <button
            type="button"
            onClick={() => onStartProject(p.category)}
            className="text-xs font-semibold text-white/70 hover:text-lime transition"
          >
            Start a project like this →
          </button>
        )}
      </div>
    </motion.article>
  )
}

function QuoteModal({
  isOpen,
  onClose,
  d,
  initialService,
}: {
  isOpen: boolean
  onClose: () => void
  d: any
  initialService?: string
}) {
  const [f, setF] = useState<any>({ name: '', email: '', service: initialService || '', message: '' })
  const [st, setSt] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setF({ name: '', email: '', service: initialService || '', message: '' })
      setSt('')
      setSending(false)
    }
  }, [isOpen, initialService, d.services])

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  const submit = async (e: any) => {
    e.preventDefault()
    setSending(true)
    setSt('')
    try {
      const fullPhone = `${f.countryCode || '+91'}${f.phone || ''}`
      await api('/quotes', { method: 'POST', body: { ...f, phone: fullPhone } })
      setSt('ok')
    } catch (err: any) {
      setSt(err.message || 'Could not send quote request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={e => e.stopPropagation()}
            className="card relative w-full max-w-lg space-y-5 bg-panel p-6 sm:p-8 shadow-2xl border border-white/15 my-auto"
          >
            <button
              type="button"
              aria-label="Close quote modal"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition text-lg"
            >
              ✕
            </button>

            <div>
              <Tag>Request a Quote</Tag>
              <h2 id="quote-modal-title" className="mt-3 font-display text-2xl sm:text-3xl font-bold">
                Start your project with ASVORA
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Share your requirements below and our team will get back to you with a tailored plan.
              </p>
            </div>

            {st === 'ok' ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime/20 text-3xl text-lime">
                  ✓
                </div>
                <h3 className="font-display text-xl font-bold">Quote Request Received!</h3>
                <p className="text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
                  Thank you! We have received your project details and will review them immediately.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-p !py-2.5 !px-6 text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs text-white/60">
                    Your Name *
                    <input
                      required
                      className="inp mt-1"
                      placeholder="Your name"
                      value={f.name || ''}
                      onChange={e => setF({ ...f, name: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-white/60">
                    Email Address *
                    <input
                      required
                      type="email"
                      className="inp mt-1"
                      placeholder="your@email.com"
                      value={f.email || ''}
                      onChange={e => setF({ ...f, email: e.target.value })}
                    />
                  </label>
                </div>
                  
<label className="block text-xs text-white/60">
  Phone Number *
  <input
    required
    type="tel"
    inputMode="numeric"
    autoComplete="tel-national"
    className="inp w-full mt-1"
    placeholder="Enter 10-digit mobile number"
    value={f.phone || ''}
    onChange={(e) =>
      setF({
        ...f,
        phone: e.target.value.replace(/\D/g, '').slice(0, 10),
      })
    }
    pattern="[6-9][0-9]{9}"
    title="Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
  />
</label>

                <label className="block text-xs text-white/60">
                  Select Service *
                  <select
                    required
                    className="inp mt-1 bg-panel text-white cursor-pointer"
                    value={f.service || ''}
                    onChange={e => setF({ ...f, service: e.target.value })}
                  >
                    <option value="" className="bg-panel text-white/50">
                      Select a service
                    </option>
                    {d.services.map((s: any) => (
                      <option key={s.id} value={s.title} className="bg-panel text-white">
                        {s.icon ? `${s.icon} ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-white/60">
                  Project Details *
                  <textarea
                    required
                    rows={4}
                    className="inp mt-1"
                    placeholder="Tell us about your project requirements, goals, and timeline..."
                    value={f.message || ''}
                    onChange={e => setF({ ...f, message: e.target.value })}
                  />
                </label>
                {st && st !== 'ok' && (
                  <p role="alert" className="text-sm text-red-400">
                    {st}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-g flex-1 !py-3 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-p flex-1 !py-3 text-sm font-semibold"
                  >
                    {sending ? 'Sending…' : 'Submit Quote Request →'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ContactSection({ d }: { d: any }) {
  const c = d.content
  const [tab, setTab] = useState<'enquiries' | 'quotes'>('enquiries')
  const [f, setF] = useState<any>({})
  const [st, setSt] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: any) => {
    e.preventDefault()
    setSending(true)
    setSt('')
    try {
      const fullPhone = `${f.countryCode || '+91'}${f.phone || ''}`
      await api('/' + tab, { method: 'POST', body: { ...f, phone: fullPhone } })
      setSt('ok')
      setF({})
    } catch (x: any) {
      setSt(x.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-5 sm:py-10 md:py-14 lg:grid-cols-2 scroll-mt-24">
      <motion.div {...rv()}>
        <Tag>Contact</Tag>
        <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          {c.contactTitle || 'Let us talk about your project'}
        </h2>
        <p className="mt-4 text-white/60 leading-relaxed">
          Ready to scale your digital presence? Send us your project details or enquiry and our team will get back to you promptly.
        </p>
        <div className="mt-8 space-y-4 text-white/70">
          {c.email && (
            <p>
              ✉ <a href={`mailto:${c.email}`} className="hover:text-lime">{c.email}</a>
            </p>
          )}
          {c.phone && (
            <p>
              ☎ <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="hover:text-lime">{c.phone}</a>
            </p>
          )}
          {c.address && <p>⌖ {c.address}</p>}
        </div>
      </motion.div>
      <motion.form {...rv(1)} onSubmit={submit} className="card space-y-4 p-5 sm:p-7 shadow-xl shadow-brand/10">
        <div className="flex rounded-full bg-white/5 p-1 text-sm">
          {(['enquiries', 'quotes'] as const).map(k => (
            <button
              type="button"
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-full py-2 transition ${tab === k ? 'bg-lime font-semibold text-black' : 'text-white/70 hover:text-white'}`}
            >
              {k === 'quotes' ? 'Request a quote' : 'General enquiry'}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
  required
  type="text"
  className="inp"
  placeholder="Name"
  value={f.name || ''}
  onChange={e =>
    setF({
      ...f,
      name: e.target.value.replace(/[^a-zA-Z\s'-]/g, ''),
    })
  }
  minLength={2}
  maxLength={50}
  pattern="[A-Za-z][A-Za-z\s'-]*"
  title="Enter a valid name using letters, spaces, hyphens, or apostrophes."
/>
          <input
            required
            type="email"
            className="inp"
            placeholder="Email"
            value={f.email || ''}
            onChange={e => setF({ ...f, email: e.target.value })}
            onInvalid={e =>
              e.currentTarget.setCustomValidity(
                'Please enter a valid email address.'
              )
            }
            onInput={e => e.currentTarget.setCustomValidity('')}
          />
         <input
  required
  type="tel"
  className="inp"
  placeholder="Phone Number"
  value={f.phone || ''}
  onChange={e =>
    setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
  }
  pattern="[6-9][0-9]{9}"
  title="Enter a valid 10-digit Indian mobile number"
/>
        </div>
        {tab === 'quotes' && (
          <div>
            <select
              required
              className="inp bg-panel text-white cursor-pointer"
              value={f.service || ''}
              onChange={e => setF({ ...f, service: e.target.value })}
            >
              <option value="" className="bg-panel text-white/50">
                Select a service
              </option>
              {d.services.map((s: any) => (
                <option key={s.id} value={s.title} className="bg-panel text-white">
                  {s.icon ? `${s.icon} ` : ''}
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <textarea
          required
          rows={4}
          className="inp"
          placeholder={tab === 'quotes' ? 'Tell us about your project requirements and goals...' : 'Your message or question...'}
          value={f.message || ''}
          onChange={e => setF({ ...f, message: e.target.value })}
        />
        <button className="btn-p w-full" disabled={sending}>
          {sending ? 'Sending…' : tab === 'quotes' ? 'Submit Quote Request →' : 'Send message'}
        </button>
        {st === 'ok' && <p className="text-center text-sm text-lime">Thank you! Your submission was sent successfully.</p>}
        {st && !['ok', 'sending'].includes(st) && <p className="text-center text-sm text-red-400">{st}</p>}
      </motion.form>
    </section>
  )
}

function ServicesPage({ d, onStartProject }: { d: any; onStartProject: (serviceTitle?: string) => void }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const activeParam = params.get('service') || ''
  const activeService = d.services.find((s: any) => s.title.toLowerCase() === activeParam.toLowerCase())

  const setFilter = (title: string) => {
    if (!title) {
      setParams({}, { replace: true })
    } else {
      setParams({ service: title }, { replace: true })
    }
  }

  const goBack = () => {
    if (activeService) {
      setFilter('')
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="pt-28 pb-16 space-y-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <button
            type="button"
            onClick={goBack}
            className="btn-g !py-2 !px-4 text-xs inline-flex items-center gap-2 hover:border-lime/40 transition cursor-pointer"
            title="Go back"
          >
            ← {activeService ? 'Back to All Services' : 'Back'}
          </button>
        </div>
        <div className="text-center">
          <Tag>Services & Capabilities</Tag>
          <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl md:text-6xl">
            {activeService ? activeService.title : 'Creative digital work tailored for your brand'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            {activeService
              ? activeService.description
              : 'Explore our specialized services crafted to elevate your business online.'}
          </p>
        </div>
      </div>

      {activeService ? (
        <section className="mx-auto max-w-6xl px-4 space-y-10">
          <div className="card p-6 sm:p-10 border-brand/40 bg-gradient-to-br from-panel to-white/[0.02]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="mb-4 inline-grid h-16 w-16 place-items-center rounded-3xl bg-brand/20 text-4xl text-lime">
                  {activeService.icon}
                </div>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">{activeService.title}</h2>
                <p className="mt-4 max-w-2xl text-base text-white/70 leading-relaxed">{activeService.description}</p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => onStartProject(activeService.title)}
                  className="btn-p !py-3 !px-6 text-sm font-semibold"
                >
                  Start a {activeService.title} project →
                </button>
              </div>
            </div>
          </div>

          <div>
            {(() => {
              const matched = d.projects.filter((p: any) => matchesService(p.category, activeService.title))
              return (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl font-bold">
                        Works in {activeService.title}
                      </h3>
                      <p className="text-xs text-white/50 mt-1">Featured showcase projects delivered in this capability</p>
                    </div>
                    {matched.length > 0 && (
                      <Link
                        to={`/work?service=${encodeURIComponent(activeService.title)}`}
                        className="text-xs text-lime hover:underline font-semibold flex items-center gap-1"
                      >
                        View all {activeService.title} works in Portfolio →
                      </Link>
                    )}
                  </div>

                  {matched.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {matched.slice(0, 4).map((p: any, i: number) => (
                          <ProjectCard key={p.id} p={p} index={i} onStartProject={onStartProject} />
                        ))}
                      </div>
                      {matched.length > 4 ? (
                        <div className="text-center pt-4">
                          <Link
                            to={`/work?service=${encodeURIComponent(activeService.title)}`}
                            className="btn-g !py-3 !px-6 text-xs inline-flex items-center gap-2 text-lime font-semibold"
                          >
                            View all {matched.length} {activeService.title} works →
                          </Link>
                        </div>
                      ) : (
                        <div className="text-center pt-2">
                          <Link
                            to={`/work?service=${encodeURIComponent(activeService.title)}`}
                            className="text-xs text-white/50 hover:text-lime underline"
                          >
                            View all {activeService.title} projects in full portfolio →
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card p-10 text-center text-white/60 space-y-3">
                      <p>Our featured projects for {activeService.title} will be showcased here soon.</p>
                      <button
                        type="button"
                        onClick={() => onStartProject(activeService.title)}
                        className="btn-p inline-flex !py-2.5 !px-5 text-xs font-semibold"
                      >
                        Be our next showcase project →
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {d.services.map((s: any) => {
              const matched = d.projects.filter((p: any) => matchesService(p.category, s.title))
              return (
                <div
                  key={s.id}
                  className="card p-6 sm:p-8 flex flex-col justify-between gap-6 border border-white/10 hover:border-lime/40 transition group"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-brand/20 text-3xl grid place-items-center text-lime group-hover:scale-105 transition">
                        {s.icon}
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-bold">{s.title}</h2>
                        {matched.length > 0 ? (
                          <span className="text-xs text-lime font-medium">
                            {matched.length} {matched.length === 1 ? 'project' : 'projects'} available
                          </span>
                        ) : (
                          <span className="text-xs text-white/40">Capabilities available</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{s.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setFilter(s.title)}
                      className="btn-p !py-2.5 !px-5 text-xs font-semibold flex items-center gap-2"
                    >
                      View Works →
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartProject(s.title)}
                      className="btn-g !py-2.5 !px-4 text-xs font-medium"
                    >
                      Request Quote
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}

function WorksPage({ d, onStartProject }: { d: any; onStartProject: (serviceTitle?: string) => void }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const activeService = params.get('service') || ''

  const setFilter = (title: string) => {
    if (!title) {
      setParams({}, { replace: true })
    } else {
      setParams({ service: title }, { replace: true })
    }
  }

  const selectedServiceObj = d.services.find((s: any) => s.title.toLowerCase() === activeService.toLowerCase())

  const grouped = useMemo(() => {
    const list: Array<{ service: any; projects: any[] }> = []
    const usedIds = new Set<string>()

    for (const s of d.services) {
      const items = d.projects.filter((p: any) => matchesService(p.category, s.title))
      items.forEach((p: any) => usedIds.add(p.id))
      list.push({ service: s, projects: items })
    }

    const uncategorized = d.projects.filter((p: any) => !usedIds.has(p.id))
    return { list, uncategorized }
  }, [d.services, d.projects])

  return (
    <div className="pt-28 pb-16 space-y-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            className="btn-g !py-2 !px-4 text-xs inline-flex items-center gap-2 hover:border-lime/40 transition cursor-pointer"
            title="Go back to previous page"
          >
            ← Back
          </button>
        </div>
        <div className="text-center">
          <Tag>Portfolio & Works</Tag>
          <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl md:text-6xl">
            Work that speaks for itself
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Explore our delivered projects ordered by service, or click a service below to open and view its projects separately.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${!activeService ? 'bg-lime text-black font-bold' : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              ✦ All Works (Ordered by Service)
            </button>
            {d.services.map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.title)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${activeService.toLowerCase() === s.title.toLowerCase() ? 'bg-lime text-black font-bold' : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4">
        {selectedServiceObj ? (
          <div className="space-y-8">
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setFilter('')}
                className="btn-g !py-2 !px-4 text-xs inline-flex items-center gap-2"
              >
                ← Back to All Works
              </button>
            </div>

            <div className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-brand/30">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{selectedServiceObj.icon}</span>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold">{selectedServiceObj.title} Works</h2>
                  <p className="mt-1 text-sm text-white/60">{selectedServiceObj.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('')}
                  className="btn-g !py-2 !px-4 text-xs"
                >
                  View all works
                </button>
                <button
                  type="button"
                  onClick={() => onStartProject(selectedServiceObj.title)}
                  className="btn-p !py-2 !px-4 text-xs"
                >
                  Start project →
                </button>
              </div>
            </div>

            {(() => {
              const matched = d.projects.filter((p: any) => matchesService(p.category, selectedServiceObj.title))
              return matched.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {matched.map((p: any, i: number) => (
                    <ProjectCard key={p.id} p={p} index={i} onStartProject={onStartProject} />
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center text-white/60">
                  <p>No projects currently published in {selectedServiceObj.title}.</p>
                  <button
                    type="button"
                    onClick={() => onStartProject(selectedServiceObj.title)}
                    className="btn-p mt-4 inline-flex !py-2.5 !px-5 text-xs"
                  >
                    Start a {selectedServiceObj.title} project →
                  </button>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="space-y-16">
            {grouped.list.map(({ service: s, projects: projs }) => (
              <div key={s.id} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl">{s.icon}</span>
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                        {s.title}
                        <span className="text-xs font-normal text-white/40">({projs.length} {projs.length === 1 ? 'project' : 'projects'})</span>
                      </h2>
                      <p className="text-xs text-white/50">{s.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilter(s.title)}
                    className="text-xs font-semibold text-lime hover:underline self-start sm:self-auto"
                  >
                    Open {s.title} only →
                  </button>
                </div>

                {projs.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {projs.map((p: any, i: number) => (
                      <ProjectCard key={p.id} p={p} index={i} onStartProject={onStartProject} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic">Projects for this service will appear here soon.</p>
                )}
              </div>
            ))}

            {grouped.uncategorized.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-white/10">
                <h2 className="font-display text-2xl font-bold">Featured Projects</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {grouped.uncategorized.map((p: any, i: number) => (
                    <ProjectCard key={p.id} p={p} index={i} onStartProject={onStartProject} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="text-center pt-8">
        <button
          type="button"
          onClick={() => onStartProject()}
          className="btn-p !py-3 !px-8 text-base"
        >
          Start your project with ASVORA →
        </button>
      </div>
    </div>
  )
}

function HomePage({
  d,
  curTestimonial,
  testimonialIndex,
  setTestimonialIndex,
  onStartProject,
}: any) {
  const c = d.content
  const T = d.testimonials || []
  const hasProjects = (d.projects || []).length > 0

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 120])
  const words = (c.heroTitle || '').split(' ')

  return (
    <div>
      <section id="top" className="relative flex min-h-screen items-center overflow-hidden px-5 pt-28">
        <div className="grid-bg absolute inset-0" />
        <motion.div style={{ y }} className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-brand/40 blur-[120px]" />
        <motion.div style={{ y }} className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-lime/20 blur-[120px]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Tag>AS Digital Studio</Tag>
            </motion.div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-7xl">
              {words.map((w: string, i: number) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.6 }}
                  className={`mr-3 inline-block ${i > words.length - 3 ? 'grad' : ''}`}
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6 max-w-lg text-lg text-white/60">
              {c.heroSub}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-9 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onStartProject()}
                className="btn-p"
              >
                Start your project →
              </button>
              {hasProjects && (
                <Link to="/work" className="btn-g">
                  View our work
                </Link>
              )}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.5, duration: 0.9 }} className="relative animate-float">
            <div className="card space-y-4 bg-panel/80 p-6 shadow-2xl shadow-brand/20">
              <div className="flex gap-1.5">
                <i className="h-3 w-3 rounded-full bg-red-400" />
                <i className="h-3 w-3 rounded-full bg-yellow-400" />
                <i className="h-3 w-3 rounded-full bg-lime" />
              </div>
              <div className="grid min-h-36 grid-cols-3 items-center gap-3">
                {d.services.slice(0, 3).map((s: any) => (
                  <Link
                    key={s.id}
                    to={`/services?service=${encodeURIComponent(s.title)}`}
                    className="rounded-2xl bg-white/5 p-4 text-center hover:bg-white/10 transition"
                  >
                    <span className="text-3xl">{s.icon}</span>
                    <span className="mt-2 block text-xs text-white/60 truncate">{s.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {c.technologies && (
        <div className="overflow-hidden border-y border-white/10 py-5">
          <div className="flex w-max animate-marquee gap-12 text-white/40">
            {[...c.technologies.split(','), ...c.technologies.split(',')].map((x: string, i: number) => (
              <span key={i} className="font-display text-xl">
                {x} <b className="text-lime">✦</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {[1, 2, 3, 4].some(i => c['stat' + i]) && (
        <section className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-4 md:gap-10 md:py-20">
          {[1, 2, 3, 4].map(i => c['stat' + i] && <Counter key={i} v={c['stat' + i]} />)}
        </section>
      )}

      <section id="services" className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10 md:py-14">
        <Head tag="Services" title="Creative services for your brand" sub="Click any service below to view detailed capabilities and showcase works." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {d.services.map((s: any, i: number) => (
            <motion.div key={s.id} {...rv(i)}>
              <Spot className="h-full p-5 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-2xl text-lime">
                    {s.icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{s.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <Link
                    to={`/services?service=${encodeURIComponent(s.title)}`}
                    className="text-xs font-semibold text-lime hover:underline"
                  >
                    View details & works →
                  </Link>
                  <button
                    type="button"
                    onClick={() => onStartProject(s.title)}
                    className="btn-g !px-3 !py-1.5 text-xs"
                  >
                    Request quote
                  </button>
                </div>
              </Spot>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/services" className="btn-g">
            Explore all services in detail →
          </Link>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10 md:py-14">
        <Head tag="Selected projects" title="Work that speaks for itself" />
        {d.projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {d.projects.slice(0, 4).map((p: any, i: number) => (
              <ProjectCard key={p.id} p={p} index={i} onStartProject={onStartProject} />
            ))}
          </div>
        ) : (
          <p className="text-center text-white/60">Our projects will be showcased here soon.</p>
        )}
        {hasProjects && (
          <div className="mt-10 text-center">
            <Link to="/work" className="btn-p">
              View all works ordered by service →
            </Link>
          </div>
        )}
      </section>

      <section id="about" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-8 sm:px-5 sm:py-10 md:py-14 lg:grid-cols-2">
        <motion.div {...rv()}>
          <Tag>About {c.brand || 'ASVORA'}</Tag>
          <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            {c.aboutTitle || 'Creative digital work. Made for your business.'}
          </h2>
          <p className="mt-5 leading-relaxed text-white/60">{c.aboutText}</p>
          <ul className="mt-6 space-y-3 text-sm">
            {['Web development & web apps', 'Creative video editing & social reels', 'Engaging content & copywriting', 'Graphic design & brand identities', 'Business ideas & digital strategy'].map(x => (
              <li key={x} className="flex gap-3">
                <b className="text-lime">✓</b>
                {x}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div {...rv(1)} className="grid grid-cols-2 gap-3 sm:gap-4">
          {['Discover', 'Create', 'Build', 'Grow'].map((x, i) => (
            <Spot key={x} className="p-4 sm:p-6">
              <b className="font-display text-3xl text-brand">0{i + 1}</b>
              <p className="mt-3 font-display text-lg">{x}</p>
            </Spot>
          ))}
        </motion.div>
      </section>

      {T.length > 0 && (
        <section id="testimonials" className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-10 md:py-14">
          <Head tag="Testimonials" title="What clients say" />
          {curTestimonial && (
            <div className="card relative min-h-[260px] p-5 text-center sm:p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={curTestimonial.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                >
                  <div className="text-lime text-xl">{'★'.repeat(curTestimonial.rating || 5)}</div>
                  <p className="mt-4 font-display text-xl leading-relaxed md:text-2xl">“{curTestimonial.quote}”</p>
                  <b className="mt-6 block">{curTestimonial.name}</b>
                  <span className="text-sm text-white/50">{curTestimonial.role}</span>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex justify-center gap-2">
                {T.map((_: any, i: number) => (
                  <button
                    aria-label={'testimonial ' + (i + 1)}
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`h-2 rounded-full transition-all ${i === testimonialIndex % T.length ? 'w-8 bg-lime' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ContactSection d={d} />
    </div>
  )
}

export default function Public() {
  const [d, setD] = useState<any>(null)
  const [t, setT] = useState(0)
  const [loadError, setLoadError] = useState('')

  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [modalService, setModalService] = useState('')

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const [reviewSending, setReviewSending] = useState(false)

  const reviewPromptShown = useRef(false)
  const reviewCooldownUntil = useRef(0)
  const reviewSubmitted = useRef(false)

  const { scrollYProgress } = useScroll()
  const sx = useSpring(scrollYProgress)

  const location = useLocation()
  const currentPath = location.pathname

  const loadPublic = useCallback(() => {
    setLoadError('')
    api('/public')
      .then(setD)
      .catch((error: any) => {
        setD(null)
        setLoadError(error.message || 'Could not load the portfolio.')
      })
  }, [])

  useEffect(() => {
    void loadPublic()
    api('/track', { method: 'POST', body: { path: currentPath } }).catch(() => {})

    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('tp_public_update')
    const refresh = () => {
      void loadPublic()
    }
    channel.addEventListener('message', refresh)
    return () => {
      channel.close()
    }
  }, [loadPublic, currentPath])

  const openQuoteModal = useCallback((serviceTitle?: string) => {
    setModalService(serviceTitle || '')
    setQuoteModalOpen(true)
  }, [])

  useEffect(() => {
    if (location.pathname === '/') {
      if (location.hash && location.hash !== '#contact') {
        const el = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!d) return
    let lastY = window.scrollY
    let userScrollIntent = false
    const allowPrompt = () => {
      userScrollIntent = true
    }
    const allowKeyboardScroll = (event: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) allowPrompt()
    }
    const checkBottom = () => {
      const currentY = window.scrollY
      const scrolledDown = currentY > lastY
      lastY = currentY
      if (!userScrollIntent || !scrolledDown || reviewPromptShown.current || reviewSubmitted.current || quoteModalOpen) return
      if (currentY + window.innerHeight < document.documentElement.scrollHeight - 8) return
      const state = readReviewPromptState()
      reviewSubmitted.current = state.submitted
      reviewCooldownUntil.current = state.lastPromptAt + REVIEW_PROMPT_COOLDOWN_MS
      if (state.submitted || Date.now() < reviewCooldownUntil.current) return
      state.lastPromptAt = Date.now()
      reviewCooldownUntil.current = state.lastPromptAt + REVIEW_PROMPT_COOLDOWN_MS
      saveReviewPromptState(state)
      reviewPromptShown.current = true
      setReviewRating(0)
      setReviewStatus('')
      setReviewOpen(true)
    }
    window.addEventListener('wheel', allowPrompt, { passive: true })
    window.addEventListener('touchmove', allowPrompt, { passive: true })
    window.addEventListener('keydown', allowKeyboardScroll)
    window.addEventListener('scroll', checkBottom, { passive: true })
    return () => {
      window.removeEventListener('wheel', allowPrompt)
      window.removeEventListener('touchmove', allowPrompt)
      window.removeEventListener('keydown', allowKeyboardScroll)
      window.removeEventListener('scroll', checkBottom)
    }
  }, [d, quoteModalOpen])

  useEffect(() => {
    if (!reviewOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissReview()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [reviewOpen])

  useEffect(() => {
    const i = setInterval(() => setT(x => x + 1), 5000)
    return () => clearInterval(i)
  }, [])

  if (!d) {
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <p className="font-display text-2xl">{loadError ? 'Portfolio unavailable' : 'ASVORA'}</p>
          {loadError ? (
            <>
              <p role="alert" className="mt-3 text-sm text-red-300">
                {loadError}
              </p>
              <button className="btn-g mt-5" onClick={loadPublic}>
                Try again
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/50">Loading portfolio…</p>
          )}
        </div>
      </main>
    )
  }

  const c = d.content
  const T = d.testimonials || []
  const curTestimonial = T.length ? T[t % T.length] : null

  const submitReview = async (e: any) => {
    e.preventDefault()
    if (!reviewRating) {
      setReviewStatus('Please select a star rating.')
      return
    }
    setReviewSending(true)
    setReviewStatus('')
    try {
      await api('/reviews', { method: 'POST', body: { name: reviewName, rating: reviewRating, quote: reviewText } })
      reviewSubmitted.current = true
      saveReviewPromptState({ lastPromptAt: reviewCooldownUntil.current - REVIEW_PROMPT_COOLDOWN_MS, submitted: true })
      setReviewStatus('Thank you! Your review was sent for approval.')
    } catch (error: any) {
      setReviewStatus(error.message || 'Could not submit your review. Please try again.')
    } finally {
      setReviewSending(false)
    }
  }

  const dismissReview = () => {
    reviewPromptShown.current = false
    setReviewOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <motion.div style={{ scaleX: sx }} className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-lime to-brand" />

      <Nav
        c={c}
        hasProjects={(d.projects || []).length > 0}
        hasTestimonials={T.length > 0}
        currentPath={currentPath}
        onStartProject={() => openQuoteModal()}
      />

      <main className="flex-1">
        {currentPath.startsWith('/services') ? (
          <ServicesPage d={d} onStartProject={openQuoteModal} />
        ) : currentPath.startsWith('/work') ? (
          <WorksPage d={d} onStartProject={openQuoteModal} />
        ) : (
          <HomePage
            d={d}
            curTestimonial={curTestimonial}
            testimonialIndex={t}
            setTestimonialIndex={setT}
            onStartProject={openQuoteModal}
          />
        )}
      </main>

      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        d={d}
        initialService={modalService}
      />

      <footer className="border-t border-white/10 px-4 py-10 sm:px-5 sm:py-14 bg-ink/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div>
            <Link to="/" className="font-display text-2xl font-bold">
              <BrandLogo logo={media(c.logo)} label={c.brand || 'ASVORA'} imageClassName="h-10 w-10">{c.brand || 'ASVORA'}</BrandLogo>
            </Link>
            <p className="mt-2 text-sm text-white/50">Digital solutions for your business.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/60">
            <Link to="/" className="hover:text-lime">Home</Link>
            <Link to="/services" className="hover:text-lime">Services</Link>
            <Link to="/work" className="hover:text-lime">Works</Link>
            <button type="button" onClick={() => openQuoteModal()} className="hover:text-lime">
              Request a quote
            </button>
            <a href="/#about" className="hover:text-lime">About</a>
            <a href="/#contact" className="hover:text-lime">Contact</a>
          </div>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} {c.brand || 'ASVORA'}. All rights reserved.</p>
        </div>
      </footer>

      <AnimatePresence>
        {reviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissReview}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-dialog-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={event => event.stopPropagation()}
              className="card relative w-full max-w-md space-y-5 bg-panel p-6 sm:p-8"
            >
              <button
                type="button"
                aria-label="Close review prompt"
                onClick={dismissReview}
                className="absolute right-4 top-4 rounded-full px-3 py-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
              <div>
                <Tag>ASVORA</Tag>
                <h2 id="review-dialog-title" className="mt-4 font-display text-2xl font-bold">
                  How was your experience?
                </h2>
                <p className="mt-2 text-sm text-white/60">Leave a star rating for AS Digital Studio.</p>
              </div>
              {reviewStatus.startsWith('Thank you!') ? (
                <div role="status">
                  <p className="text-lime">{reviewStatus}</p>
                  <p className="mt-2 text-sm text-white/50">Your review will appear after it is approved.</p>
                  <button type="button" className="btn-p mt-5" onClick={dismissReview}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <span className="sr-only">Choose a rating</span>
                    <div className="flex gap-2" role="group" aria-label="Star rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                          aria-pressed={reviewRating === star}
                          onClick={() => setReviewRating(star)}
                          className={`text-4xl transition hover:scale-110 ${reviewRating >= star ? 'text-yellow-300' : 'text-white/25'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-sm text-white/60">
                    Your name
                    <input
                      required
                      maxLength={120}
                      className="inp mt-1"
                      value={reviewName}
                      onChange={event => setReviewName(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm text-white/60">
                    Your review <span className="text-white/40">(optional)</span>
                    <textarea
                      maxLength={3000}
                      rows={3}
                      className="inp mt-1"
                      value={reviewText}
                      onChange={event => setReviewText(event.target.value)}
                    />
                  </label>
                  <p className="text-xs text-white/40">
                    Reviews are checked before they appear publicly. This prompt will not return after you submit.
                  </p>
                  {reviewStatus && <p role="alert" className="text-sm text-red-300">{reviewStatus}</p>}
                  <button className="btn-p w-full" disabled={reviewSending || !reviewRating}>
                    {reviewSending ? 'Sending…' : 'Submit review'}
                  </button>
                </form>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
