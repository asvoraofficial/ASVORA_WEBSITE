import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api, browserOnlyDemo, tok, media } from './api'
import BrandLogo from './BrandLogo'

type F = { k: string; l: string; t?: 'area' | 'bool' | 'num' | 'img' }
const CFG: Record<string, { title: string; f: F[]; status?: string[]; ro?: boolean }> = {
  services: { title: 'Services', f: [{ k: 'icon', l: 'Icon (emoji/symbol)' }, { k: 'title', l: 'Title' }, { k: 'description', l: 'Description', t: 'area' }, { k: 'published', l: 'Published', t: 'bool' }] },
  projects: { title: 'Works', f: [{ k: 'title', l: 'Title' }, { k: 'category', l: 'Category' }, { k: 'result', l: 'Key result' }, { k: 'description', l: 'Description', t: 'area' }, { k: 'caseStudyUrl', l: 'Case study URL (optional)' }, { k: 'image', l: 'Image URL (pick from Media)', t: 'img' }, { k: 'published', l: 'Published', t: 'bool' }] },
  testimonials: { title: 'Testimonials', f: [{ k: 'name', l: 'Name' }, { k: 'role', l: 'Role / company' }, { k: 'quote', l: 'Quote', t: 'area' }, { k: 'rating', l: 'Rating (1-5)', t: 'num' }, { k: 'published', l: 'Published', t: 'bool' }] },
  enquiries: { title: 'Enquiries', ro: true, status: ['new', 'in-progress', 'closed'], f: [] },
  quotes: { title: 'Quote requests', ro: true, status: ['new', 'in-progress', 'quoted', 'closed'], f: [] },
}
const NAV = [['dashboard', '▦ Dashboard'], ['enquiries', '✉ Enquiries'], ['quotes', '＄ Quotes'], ['services', '◆ Services'], ['projects', '▣ Works'], ['about', '◉ About'], ['contact', '✉ Contact'], ['testimonials', '★ Testimonials'], ['content', '✎ Content'], ['media', '▤ Media'], ['notifications', '🔔 Notifications'], ['profile', '⚙ Profile']]
const SECTION_FIELDS: Record<string, F[]> = {
  about: [
    { k: 'aboutTitle', l: 'About heading' },
    { k: 'aboutText', l: 'About description', t: 'area' },
  ],
  contact: [
    { k: 'contactTitle', l: 'Contact heading' },
    { k: 'email', l: 'Public email' },
    { k: 'phone', l: 'Phone number' },
    { k: 'address', l: 'Location' },
  ],
}
const Card = ({ children, className = '' }: any) => <div className={`card p-4 sm:p-5 ${className}`}>{children}</div>

function Login({ ok, logo, error }: { ok: () => void; logo: string; error: string }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  return <div className="grid min-h-screen place-items-center px-4"><motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={async x => { x.preventDefault(); try { const r = await api('/auth/login', { method: 'POST', body: { email: e, password: p } }); localStorage.setItem('tp_token', r.token); ok() } catch (z: any) { setErr(z.message) } }} className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
    <h1 className="font-display text-2xl font-bold"><BrandLogo logo={media(logo)}>ASVORA Admin</BrandLogo></h1><p className="text-sm text-white/50">Sign in to manage the website.</p>
    {browserOnlyDemo && <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 text-xs text-yellow-200">Browser-only demo: this is not secure authentication. Changes stay in this browser and do not update the live website. Open the public site with this same address and port to share demo changes.</p>}
    <input className="inp" type="email" placeholder="Email" value={e} onChange={x => setE(x.target.value)} required /><input className="inp" type="password" placeholder="Password" value={p} onChange={x => setP(x.target.value)} required />
    {(err || error) && <p role="alert" className="text-sm text-red-400">{err || error}</p>}<button className="btn-p w-full">Sign in</button></motion.form></div>
}

function Dash() {
  const [s, setS] = useState<any>(null), [error, setError] = useState('')
  const load = () => { setError(''); api('/admin/stats').then(setS).catch((x: any) => setError(x.message || 'Could not load dashboard data.')) }
  useEffect(() => { load() }, [])
  if (!s) return error ? <div><p role="alert" className="text-red-300">{error}</p><button className="btn-g mt-4" onClick={load}>Retry</button></div> : <p>Loading dashboard…</p>
  const max = Math.max(1, ...s.series.map((x: any) => x.n))
  const K = [['Total visits', s.visits], ['Enquiries', s.enquiries], ['Quote requests', s.quotes], ['Awaiting reply', s.new], ['Services', s.services], ['Projects', s.projects]]
  return <div className="space-y-6"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{K.map(([k, v], i) => <motion.div key={k} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}><Card><p className="text-sm text-white/50">{k}</p><b className="font-display text-3xl text-lime">{v}</b></Card></motion.div>)}</div>
    <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><h3 className="mb-4 font-display">Visitors, last 14 days</h3><div className="flex h-48 items-end gap-2">{s.series.map((x: any, i: number) => <div key={x.d} className="group relative flex-1"><motion.div initial={{ height: 0 }} animate={{ height: (x.n / max) * 100 + '%' }} transition={{ delay: i * .04 }} className="min-h-[3px] rounded-t bg-gradient-to-t from-brand to-lime" /><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100">{x.n}</span></div>)}</div>
      <div className="mt-2 flex justify-between text-xs text-white/40"><span>{s.series[0].d}</span><span>{s.series[13].d}</span></div></Card>
      <Card><h3 className="mb-4 font-display">Top pages</h3>{s.top.length ? s.top.map((t: any) => <div key={t.path} className="flex justify-between border-b border-white/5 py-2 text-sm"><span>{t.path}</span><b>{t.n}</b></div>) : <p className="text-sm text-white/40">No traffic yet.</p>}</Card></div></div>
}


function RequestDetailModal({
  item,
  onClose,
  onStatusChange,
  onNavigate,
}: {
  item: any
  onClose: () => void
  onStatusChange?: (col: string, id: string, status: string) => Promise<void>
  onNavigate?: (section: string) => void
}) {
  const [data, setData] = useState<any>(item)
  const [copied, setCopied] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function enrich() {
      if (item.details && item.service !== undefined && (item.itemStatus || item.status)) return
      const emailMatch = (item.message || '').match(/\(([^)]+@[^)]+)\)/)
      const email = item.email || (emailMatch ? emailMatch[1] : '')
      const name = item.name || (item.message || '').split('(')[0].trim()
      const title = (item.title || '').toLowerCase()
      const col = item.type || (title.includes('quote') ? 'quotes' : title.includes('enquiry') ? 'enquiries' : title.includes('review') ? 'testimonials' : null)

      if (col && (col === 'quotes' || col === 'enquiries' || col === 'testimonials')) {
        try {
          const list = await api(`/admin/${col}`)
          const match = list.find((x: any) => x.id === item.targetId || (email && x.email === email) || (name && x.name === name))
          if (match && active) {
            setData((prev: any) => ({
              ...prev,
              type: col,
              targetId: match.id,
              name: match.name || prev.name || name,
              email: match.email || prev.email || email,
              phone: match.phone ?? prev.phone,
              service: match.service ?? prev.service,
              budget: match.budget ?? prev.budget,
              details: match.message ?? match.quote ?? prev.details,
              itemStatus: match.status ?? prev.itemStatus ?? prev.status,
              rating: match.rating ?? prev.rating,
            }))
          }
        } catch {
          // ignore error
        }
      }
    }
    enrich()
    return () => { active = false }
  }, [item])

  const copyEmail = () => {
    if (data.email) {
      navigator.clipboard.writeText(data.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyMessage = () => {
    const text = data.details || data.message || data.quote || ''
    if (text) {
      navigator.clipboard.writeText(text)
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    }
  }

  const isQuote = data.type === 'quotes' || (data.title || '').toLowerCase().includes('quote')
  const isEnquiry = data.type === 'enquiries' || (data.title || '').toLowerCase().includes('enquiry')
  const isReview = data.type === 'testimonials' || (data.title || '').toLowerCase().includes('review')

  const replySubject = `ASVORA - Regarding your ${isQuote ? 'project request' : 'enquiry'}`
  const replyBody = `Hi ${data.name || 'there'},\n\nThank you for reaching out to ASVORA regarding your ${isQuote ? 'project request' : 'enquiry'}${data.service ? ` for ${data.service}` : ''}.\n\n`
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.email || '')}&su=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`
  const mailtoUrl = `mailto:${data.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`

  const titleText = isQuote
    ? 'Project Request Details'
    : isEnquiry
    ? 'Project Enquiry Details'
    : isReview
    ? 'Client Testimonial Review'
    : data.title || 'Request Details'

  const currentStatus = data.itemStatus || data.status || 'new'
  const targetCol = data.type || (isQuote ? 'quotes' : isEnquiry ? 'enquiries' : null)
  const targetId = data.targetId || data.id

  const updateStatus = async (newStatus: string) => {
    if (!targetCol || !targetId || !onStatusChange) return
    setLoading(true)
    setError('')
    try {
      await onStatusChange(targetCol, targetId, newStatus)
      setData((prev: any) => ({ ...prev, itemStatus: newStatus, status: newStatus }))
    } catch (err: any) {
      setError(err.message || 'Could not update status')
    } finally {
      setLoading(false)
    }
  }

  const messageText = data.details || data.message || data.quote || 'No detailed message provided.'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="card max-h-[92vh] w-full max-w-2xl sm:max-w-3xl space-y-5 overflow-y-auto bg-panel p-5 sm:p-8 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isQuote ? 'bg-lime/20 text-lime' : isEnquiry ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {isQuote ? '⚡ Project Request' : isEnquiry ? '✉ Project Enquiry' : '★ Testimonial'}
              </span>
              {data.created && (
                <span className="text-xs text-white/40">
                  {new Date(data.created).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
            <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold">{titleText}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

        {/* Client info card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Requester Information</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-base text-white">{data.name || 'Anonymous'}</p>
              {data.email && <p className="text-xs text-white/60">{data.email}</p>}
              {data.phone && (
                <p className="text-xs text-lime mt-1 font-medium flex items-center gap-1">
                  <span>☎</span>
                  <a href={`tel:${data.phone}`} className="hover:underline">{data.phone}</a>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data.phone && (
                <a
                  href={`tel:${data.phone}`}
                  className="rounded-lg bg-lime/10 border border-lime/30 text-lime px-2.5 py-1.5 text-xs font-semibold hover:bg-lime/20 transition flex items-center gap-1"
                  title="Call phone number"
                >
                  ☎ Call
                </a>
              )}
              {data.email && (
                <>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                    title="Copy email to clipboard"
                  >
                    {copied ? '✓ Copied' : 'Copy Email'}
                  </button>
                  <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                    title="Open Gmail directly in browser to reply"
                  >
                    ✉ Gmail
                  </a>
                  <a
                    href={mailtoUrl}
                    className="rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white/70 hover:bg-white/20 transition"
                    title="Open default desktop mail app"
                  >
                    Mail App
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Project Service & Budget Info */}
        {(data.service || data.budget || isQuote || isEnquiry) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <span className="text-xs text-white/40 block">Requested Service</span>
              <span className="font-semibold text-sm text-lime mt-1 block">
                {data.service ? `💼 ${data.service}` : 'General / Not specified'}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <span className="text-xs text-white/40 block">Project Budget</span>
              <span className="font-semibold text-sm text-white mt-1 block">
                {data.budget ? `💰 ${data.budget}` : 'Flexible / Standard'}
              </span>
            </div>
          </div>
        )}

        {/* Review rating if testimonial */}
        {isReview && data.rating && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <span className="text-xs text-white/40 block">Star Rating</span>
            <span className="font-semibold text-amber-400 mt-1 block">
              {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)} ({data.rating} / 5 stars)
            </span>
          </div>
        )}

        {/* Detailed Project Message / Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              {isQuote ? 'Project Details & Requirements' : isReview ? 'Testimonial Review' : 'Enquiry Message'}
            </p>
            <button
              type="button"
              onClick={copyMessage}
              className="text-xs text-lime hover:underline"
            >
              {copiedMsg ? '✓ Copied' : 'Copy Message'}
            </button>
          </div>
          <div className="rounded-2xl border border-white/15 bg-ink/90 p-5 sm:p-6 text-sm sm:text-base text-white/95 leading-relaxed whitespace-pre-wrap min-h-[220px] sm:min-h-[280px] max-h-[500px] overflow-y-auto selection:bg-lime selection:text-black shadow-inner ring-1 ring-white/5">
            {messageText}
          </div>
        </div>

        {/* Reply suggestions / note */}
        {data.email && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70 flex items-center justify-between gap-2">
            <span>💡 <strong>How to reply:</strong> Click <strong>Reply via Gmail</strong> to compose immediately in your browser, or <strong>Copy Email</strong> to paste into your preferred client.</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          {onNavigate && targetCol ? (
            <button
              type="button"
              onClick={() => { onClose(); onNavigate(targetCol) }}
              className="text-xs text-lime hover:underline flex items-center gap-1"
            >
              Open in {targetCol === 'quotes' ? 'Quotes' : 'Enquiries'} table →
            </button>
          ) : <div />}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-g !py-2 !px-4 text-xs" onClick={onClose}>
              Close
            </button>
            {data.email && (
              <>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="btn-g !py-2 !px-3 text-xs"
                  title="Copy email to clipboard"
                >
                  {copied ? '✓ Copied' : 'Copy Email'}
                </button>
                <a
                  href={mailtoUrl}
                  className="btn-g !py-2 !px-3 text-xs text-white/70 hover:text-white"
                  title="Open desktop mail app"
                >
                  Mail App
                </a>
                <a
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-p !py-2 !px-4 text-xs flex items-center gap-1.5"
                  title="Open and reply via Gmail web compose"
                >
                  <span>✉</span> Reply via Gmail
                </a>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Manager({ col, onNavigate }: { col: string; onNavigate?: (col: string) => void }) {
  const cfg = CFG[col], [rows, setRows] = useState<any[]>([]), [q, setQ] = useState(''), [sf, setSf] = useState(''), [ed, setEd] = useState<any>(null), [detailItem, setDetailItem] = useState<any>(null), [media_, setM] = useState<any[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [uploadingImage, setUploadingImage] = useState(false)
  const load = async () => {
    setLoading(true)
    try { setRows(await api(`/admin/${col}?q=${encodeURIComponent(q)}&status=${sf}`)); setError('') }
    catch (x: any) { setError(x.message || `Could not load ${cfg.title.toLowerCase()}.`) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [col, q, sf]); useEffect(() => { setEd(null); setDetailItem(null); setQ(''); setSf('') }, [col])
  const save = async () => {
    try {
      if (ed.id) await api(`/admin/${col}/${ed.id}`, { method: 'PUT', body: ed })
      else await api(`/admin/${col}`, { method: 'POST', body: { published: true, ...ed } })
      setEd(null)
      await load()
    } catch (x: any) { setError(x.message || 'Could not save changes.') }
  }
  const del = async (id: string) => {
    if (!confirm('Delete permanently?')) return
    try { await api(`/admin/${col}/${id}`, { method: 'DELETE' }); await load() }
    catch (x: any) { setError(x.message || 'Could not delete this item.') }
  }
  const setStatus = async (r: any, status: string) => {
    try { await api(`/admin/${col}/${r.id}`, { method: 'PUT', body: { status } }); await load() }
    catch (x: any) { setError(x.message || 'Could not update this status.') }
  }
  return <div><div className="mb-5 flex flex-wrap gap-3"><input className="inp max-w-xs" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
    {cfg.status && <select className="inp max-w-[180px] bg-panel text-white cursor-pointer" value={sf} onChange={e => setSf(e.target.value)}><option value="" className="bg-panel text-white">All statuses</option>{cfg.status.map(s => <option key={s} value={s} className="bg-panel text-white">{s}</option>)}</select>}
    {!cfg.ro && <button className="btn-p ml-auto" onClick={() => { api('/admin/media').then(setM).catch((x: any) => setError(x.message)); setEd({ published: true }) }}>+ Add</button>}</div>
    {error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
    <div className="space-y-3">{rows.map(r => <Card key={r.id} className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">{cfg.ro ? <><b>{r.name}</b> <span className="text-sm text-white/50">{r.email}</span>{r.phone && <span className="ml-2 text-xs text-lime">☎ {r.phone}</span>}{r.service && <p className="text-xs text-lime">{r.service}{r.budget ? ` · ${r.budget}` : ''}</p>}<p className="mt-2 text-sm text-white/70 line-clamp-2">{r.message}</p><p className="mt-1 text-xs text-white/30">{new Date(r.created).toLocaleString()}</p></>
        : <><b>{r.icon} {r.title || r.name}</b> {r.published === false && <span className="ml-2 rounded bg-yellow-500/20 px-2 text-xs text-yellow-300">hidden</span>}<p className="mt-1 line-clamp-2 text-sm text-white/60">{r.description || r.quote}</p></>}</div>
      <div className="flex items-center gap-2">{cfg.ro ? <>
        <button className="btn-p !py-2 text-xs" onClick={() => setDetailItem({ ...r, type: col })}>View Details</button>
        <select className="inp !w-auto !py-2 bg-panel text-white cursor-pointer text-xs" value={r.status} onChange={e => setStatus(r, e.target.value)}>{cfg.status!.map(s => <option key={s} value={s} className="bg-panel text-white capitalize">{s}</option>)}</select>
      </> : <button className="btn-g !py-2" onClick={() => { api('/admin/media').then(setM).catch((x: any) => setError(x.message)); setEd(r) }}>Edit</button>}<button className="btn-g !py-2 text-red-400" onClick={() => del(r.id)}>Delete</button></div></Card>)}
      {loading && <p className="py-10 text-center text-white/40">Loading…</p>}
      {!loading && !rows.length && !error && <p className="py-10 text-center text-white/40">Nothing here yet.</p>}</div>
    {ed && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur sm:p-4" onClick={() => setEd(null)}><motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto bg-panel p-5 sm:p-6">
      <h3 className="font-display text-xl">{ed.id ? 'Edit' : 'New'} {cfg.title.toLowerCase()}</h3>
      {cfg.f.map(f => <div key={f.k} className="block text-sm"><span className="text-white/60">{f.l}</span>
        {f.t === 'bool' ? <input type="checkbox" className="ml-3" checked={ed[f.k] !== false} onChange={e => setEd({ ...ed, [f.k]: e.target.checked })} />
          : f.t === 'area' ? <textarea rows={3} className="inp mt-1" value={ed[f.k] || ''} onChange={e => setEd({ ...ed, [f.k]: e.target.value })} />
          : f.t === 'img' ? <div className="mt-1 space-y-3">
            <input type="text" className="inp" value={ed[f.k] ?? ''} onChange={e => setEd({ ...ed, [f.k]: e.target.value })} />
            <label className={`btn-g inline-flex cursor-pointer items-center ${uploadingImage ? 'pointer-events-none opacity-50' : ''}`}>
              {uploadingImage ? 'Uploading…' : 'Upload image'}
              <input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={uploadingImage} onChange={async e => {
                const file = e.currentTarget.files?.[0]
                e.currentTarget.value = ''
                if (!file) return
                const form = new FormData()
                form.append('file', file)
                setUploadingImage(true)
                setError('')
                try {
                  const uploaded = await api('/admin/media/upload', { method: 'POST', body: form })
                  setEd((current: any) => ({ ...current, image: uploaded.url }))
                  setM(current => [uploaded, ...current.filter(item => item.id !== uploaded.id)])
                } catch (x: any) {
                  setError(x.message || 'Could not upload the image.')
                } finally {
                  setUploadingImage(false)
                }
              }} />
            </label>
            {ed[f.k] && <img src={media(ed[f.k])} alt="Selected work" className="h-24 w-36 rounded object-cover" />}
          </div>
          : <input type={f.t === 'num' ? 'number' : 'text'} className="inp mt-1" value={ed[f.k] ?? ''} onChange={e => setEd({ ...ed, [f.k]: f.t === 'num' ? +e.target.value : e.target.value })} />}
        {f.t === 'img' && <div className="mt-2 flex flex-wrap gap-2">{media_.map(m => <img key={m.id} src={media(m.url)} alt={m.title || 'Media image'} onClick={() => setEd({ ...ed, image: m.url })} className={`h-12 w-12 cursor-pointer rounded object-cover ${ed.image === m.url ? 'ring-2 ring-lime' : ''}`} />)}</div>}</div>)}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-end gap-3"><button className="btn-g" onClick={() => setEd(null)}>Cancel</button><button className="btn-p" disabled={uploadingImage} onClick={save}>Save</button></div></motion.div></div>}
    {detailItem && <RequestDetailModal item={detailItem} onClose={() => { setDetailItem(null); load() }} onStatusChange={async (_c, _id, st) => { await setStatus(detailItem, st); setDetailItem((prev: any) => ({ ...prev, status: st, itemStatus: st })) }} onNavigate={onNavigate} />}</div>
}

function Content() {
  const [c, setC] = useState<any>(null), [m, setM] = useState(''), [error, setError] = useState('')
  useEffect(() => { api('/admin/content').then(setC).catch((x: any) => setError(x.message || 'Could not load site content.')) }, [])
  if (!c) return error ? <p role="alert" className="text-red-300">{error}</p> : <p>Loading site content…</p>
  const separateFields = new Set(['aboutTitle', 'aboutText', 'contactTitle', 'email', 'phone', 'address'])
  return <Card className="max-w-2xl space-y-4">{Object.keys(c).filter(k => k !== 'quoteBudgets' && !separateFields.has(k)).map(k => <label key={k} className="block text-sm"><span className="text-white/60">{k}</span>{c[k].length > 70 ? <textarea rows={3} className="inp mt-1" value={c[k]} onChange={e => setC({ ...c, [k]: e.target.value })} /> : <input className="inp mt-1" value={c[k]} onChange={e => setC({ ...c, [k]: e.target.value })} />}</label>)}
    <p className="text-xs text-white/40">Leave metrics blank unless you can verify them. Stats use “value|label”; technologies are comma separated.</p>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <button className="btn-p" onClick={async () => { try { await api('/admin/content', { method: 'PUT', body: c }); setM('Saved. Live on the website.'); setError('') } catch (x: any) { setError(x.message || 'Could not save site content.') } }}>Save changes</button> <span className="text-sm text-lime">{m}</span></Card>
}

function SectionEditor({ section }: { section: 'about' | 'contact' }) {
  const [content, setContent] = useState<Record<string, string> | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fields = SECTION_FIELDS[section]
  const title = section === 'about' ? 'About section' : 'Contact details'
  useEffect(() => {
    api('/admin/content')
      .then(setContent)
      .catch((x: any) => setError(x.message || `Could not load ${title.toLowerCase()}.`))
  }, [section])
  const save = async () => {
    if (!content) return
    try {
      await api('/admin/content', {
        method: 'PUT',
        body: Object.fromEntries(fields.map(({ k }) => [k, content[k] || ''])),
      })
      setMessage('Saved. Live on the website.')
      setError('')
    } catch (x: any) {
      setError(x.message || `Could not save ${title.toLowerCase()}.`)
    }
  }
  if (!content) return error ? <p role="alert" className="text-red-300">{error}</p> : <p>Loading {title.toLowerCase()}…</p>
  return <Card className="max-w-2xl space-y-4">
    <p className="text-sm text-white/50">Changes here update only the public {section} section.</p>
    {fields.map(({ k, l, t }) => <label key={k} className="block text-sm">
      <span className="text-white/60">{l}</span>
      {t === 'area'
        ? <textarea rows={5} className="inp mt-1" value={content[k] || ''} onChange={event => setContent({ ...content, [k]: event.target.value })} />
        : <input type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'} className="inp mt-1" value={content[k] || ''} onChange={event => setContent({ ...content, [k]: event.target.value })} />}
    </label>)}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <button type="button" className="btn-p" onClick={save}>Save changes</button>
    {message && <p role="status" className="text-sm text-lime">{message}</p>}
  </Card>
}

function QuoteSettings() {
  const [budgets, setBudgets] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    api('/admin/content').then(content => setBudgets(content.quoteBudgets || '')).catch((x: any) => setError(x.message))
  }, [])
  const save = async () => {
    try {
      await api('/admin/content', { method: 'PUT', body: { quoteBudgets: budgets } })
      setMessage('Budget options saved and live on the quote form.')
      setError('')
    } catch (x: any) {
      setError(x.message)
    }
  }
  return <Card className="max-w-2xl space-y-4">
    <p className="text-sm text-white/60">Enter the budget choices customers can select when requesting a quote. Separate each option with a comma.</p>
    <label className="block text-sm text-white/60">Budget options
      <textarea rows={4} className="inp mt-1" value={budgets} onChange={e => setBudgets(e.target.value)} placeholder="$1k–$5k, $5k–$10k, $10k+" />
    </label>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <button className="btn-p" onClick={save}>Save budget options</button>
    {message && <p className="text-sm text-lime">{message}</p>}
  </Card>
}

function Media() {
  const [m, setM] = useState<any[]>([]), load = () => api('/admin/media').then(setM); useEffect(() => { load() }, [])
  return <div><label className="btn-p mb-6 cursor-pointer">Upload image<input type="file" hidden accept="image/*" onChange={async e => { const fd = new FormData(); fd.append('file', e.target.files![0]); try { await api('/admin/media/upload', { method: 'POST', body: fd }); load() } catch (x: any) { alert(x.message) } }} /></label>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{m.map(i => <Card key={i.id} className="!p-2"><img src={media(i.url)} className="h-32 w-full rounded-2xl object-cover" /><p className="mt-2 truncate text-xs">{i.title}</p><div className="flex justify-between text-xs"><button className="text-lime" onClick={() => navigator.clipboard.writeText(media(i.url))}>Copy URL</button><button className="text-red-400" onClick={async () => { await api('/admin/media/' + i.id, { method: 'DELETE' }); load() }}>Delete</button></div></Card>)}</div></div>
}

function Notes({ onNavigate, onUpdateCount }: { onNavigate?: (section: string) => void; onUpdateCount?: () => void }) {
  const [n, setN] = useState<any[]>([]), [loading, setLoading] = useState(true), [activeItem, setActiveItem] = useState<any>(null), [filter, setFilter] = useState<'all' | 'unread' | 'quotes' | 'enquiries'>('all')
  const load = () => {
    setLoading(true)
    api('/admin/notifications')
      .then(res => {
        setN(res)
        if (onUpdateCount) onUpdateCount()
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const markRead = async (id: string, read: boolean) => {
    await api('/admin/notifications/' + id, { method: 'PUT', body: { read } })
    load()
  }

  const markAllRead = async () => {
    const unread = n.filter(x => !x.read)
    for (const item of unread) {
      await api('/admin/notifications/' + item.id, { method: 'PUT', body: { read: true } })
    }
    load()
  }

  const del = async (id: string) => {
    await api('/admin/notifications/' + id, { method: 'DELETE' })
    load()
  }

  const openDetail = async (x: any) => {
    if (!x.read) {
      markRead(x.id, true)
    }
    setActiveItem(x)
  }

  const handleStatusChange = async (col: string, id: string, status: string) => {
    await api(`/admin/${col}/${id}`, { method: 'PUT', body: { status } })
    load()
  }

  const filtered = n.filter(x => {
    if (filter === 'unread') return !x.read
    if (filter === 'quotes') return x.type === 'quotes' || (x.title || '').toLowerCase().includes('quote')
    if (filter === 'enquiries') return x.type === 'enquiries' || (x.title || '').toLowerCase().includes('enquiry')
    return true
  })

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-white/5 p-1 text-xs">
          {(['all', 'unread', 'quotes', 'enquiries'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1.5 capitalize transition ${filter === tab ? 'bg-lime font-semibold text-black' : 'text-white/60 hover:text-white'}`}
            >
              {tab === 'quotes' ? 'Project Requests' : tab === 'enquiries' ? 'Enquiries' : tab}
              {tab === 'unread' && n.filter(x => !x.read).length > 0 && (
                <span className="ml-1.5 rounded-full bg-black/30 px-1.5 text-[10px] text-lime">
                  {n.filter(x => !x.read).length}
                </span>
              )}
            </button>
          ))}
        </div>
        {n.some(x => !x.read) && (
          <button onClick={markAllRead} className="btn-g !py-1.5 !px-3 text-xs">
            ✓ Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map(x => {
          const isQuote = x.type === 'quotes' || (x.title || '').toLowerCase().includes('quote')
          const isEnquiry = x.type === 'enquiries' || (x.title || '').toLowerCase().includes('enquiry')
          return (
            <Card
              key={x.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all border ${!x.read ? 'border-lime/40 bg-lime/[0.02]' : 'border-white/5 opacity-70 hover:opacity-100'}`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!x.read && <span className="h-2 w-2 rounded-full bg-lime shrink-0" title="Unread" />}
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${isQuote ? 'bg-lime/20 text-lime' : isEnquiry ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/70'}`}>
                    {x.title}
                  </span>
                  {x.service && (
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
                      {x.service}
                    </span>
                  )}
                  <span className="text-[11px] text-white/30">
                    {new Date(x.created).toLocaleString()}
                  </span>
                </div>
                <p className="font-semibold text-sm text-white pt-1">{x.name || x.message}</p>
                {x.email && x.name && <p className="text-xs text-white/50">{x.email}{x.phone ? ` · ☎ ${x.phone}` : ''}</p>}
                {x.details && (
                  <p className="line-clamp-2 text-xs text-white/70 italic pt-0.5">
                    "{x.details}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  className="btn-p !py-1.5 !px-3 text-xs"
                  onClick={() => openDetail(x)}
                >
                  View Details
                </button>
                <button
                  className="btn-g !py-1.5 !px-2 text-xs"
                  title={x.read ? 'Mark as unread' : 'Mark as read'}
                  onClick={() => markRead(x.id, !x.read)}
                >
                  {x.read ? 'Mark unread' : 'Mark read'}
                </button>
                <button
                  className="text-white/40 hover:text-red-400 p-1.5 text-xs transition"
                  title="Delete notification"
                  onClick={() => del(x.id)}
                >
                  ✕
                </button>
              </div>
            </Card>
          )
        })}
        {loading && <p className="py-8 text-center text-white/40">Loading notifications…</p>}
        {!loading && !filtered.length && (
          <p className="py-8 text-center text-white/40">No notifications in this view.</p>
        )}
      </div>

      {activeItem && (
        <RequestDetailModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onStatusChange={handleStatusChange}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}


function Profile({ me, logo, onSaved, onLogoSaved }: { me: any; logo: string; onSaved: (me: any) => void; onLogoSaved: (logo: string) => void }) {
  const [email, setEmail] = useState(me.email), [name, setName] = useState(me.name), [pw, setPw] = useState(''), [m, setM] = useState('')
  const [logoMessage, setLogoMessage] = useState('')
  const [logoError, setLogoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const saveLogo = async (nextLogo: string) => {
    await api('/admin/content', { method: 'PUT', body: { logo: nextLogo } })
    onLogoSaved(nextLogo)
  }
  const uploadLogo = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setLogoError('')
    setLogoMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const uploaded = await api('/admin/media/upload', { method: 'POST', body: form })
      await saveLogo(uploaded.url)
      setLogoMessage('Logo saved and displayed across the site.')
    } catch (error: any) {
      setLogoError(error.message || 'Could not upload the logo.')
    } finally {
      setUploading(false)
    }
  }
  const removeLogo = async () => {
    setLogoError('')
    setLogoMessage('')
    try {
      await saveLogo('')
      setLogoMessage('Logo removed.')
    } catch (error: any) {
      setLogoError(error.message || 'Could not remove the logo.')
    }
  }
  return <div className="space-y-4">
    <Card className="max-w-md space-y-4">{browserOnlyDemo && <p className="text-sm text-yellow-200">Browser-only demo mode. Password changes require the backend.</p>}<label className="block text-sm text-white/60">Admin email<input className="inp mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label className="block text-sm text-white/60">Name<input className="inp mt-1" value={name} onChange={e => setName(e.target.value)} /></label>{!browserOnlyDemo && <label className="block text-sm text-white/60">New password<input className="inp mt-1" type="password" placeholder="At least 8 characters (optional)" value={pw} onChange={e => setPw(e.target.value)} /></label>}
      <button className="btn-p" onClick={async () => { try { const r = await api('/auth/profile', { method: 'PUT', body: { email, name, password: pw || undefined } }); if (r.token) localStorage.setItem('tp_token', r.token); onSaved({ ...me, email, name }); setM('Saved'); setPw('') } catch (x: any) { setM(x.message) } }}>Save</button> <span className="text-sm text-lime">{m}</span>
    </Card>
    <Card className="max-w-md space-y-4">
      <div><h2 className="font-display text-lg font-semibold">Site logo</h2><p className="mt-1 text-sm text-white/50">Upload a PNG, JPG, WEBP, SVG, or GIF up to 5 MB. It appears beside ASVORA across the site.</p></div>
      {logo && <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3"><img src={media(logo)} alt="Current site logo" className="h-16 w-16 rounded-lg bg-white/5 p-1 object-contain" /><span className="text-sm text-white/60">Current logo</span></div>}
      <label className={`btn-p cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>{uploading ? 'Uploading…' : logo ? 'Replace logo' : 'Upload logo'}<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={uploading} onChange={e => { void uploadLogo(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} /></label>
      {logo && <button className="btn-g ml-2" onClick={() => { void removeLogo() }}>Remove logo</button>}
      {logoError && <p role="alert" className="text-sm text-red-300">{logoError}</p>}
      {logoMessage && <p role="status" className="text-sm text-lime">{logoMessage}</p>}
    </Card>
  </div>
}

export default function Admin() {
  const savedSection = localStorage.getItem('tp_admin_section')
  const [ok, setOk] = useState(!!tok())
  const [v, setV] = useState(() => NAV.some(([key]) => key === savedSection) ? savedSection || 'dashboard' : 'dashboard')
  const [me, setMe] = useState<any>(null)
  const [logo, setLogo] = useState('')
  const [unread, setU] = useState(0)
  const [adminError, setAdminError] = useState('')

  useEffect(() => { localStorage.setItem('tp_admin_section', v) }, [v])

  const refreshStats = () => {
    api('/admin/stats').then(s => { setU(s.unread); setAdminError('') }).catch((x: any) => setAdminError(x.message || 'Could not load admin status.'))
  }

  useEffect(() => {
    if (ok) {
      api('/auth/me').then(setMe).catch(() => setOk(false))
      refreshStats()
    }
  }, [ok, v])

  useEffect(() => {
    if (ok) api('/admin/content').then(content => setLogo(content.logo || '')).catch((x: any) => setAdminError(x.message || 'Could not load the site logo.'))
  }, [ok])

  useEffect(() => {
    if (!ok) api('/public').then(data => setLogo(data.content.logo || '')).catch((x: any) => setAdminError(x.message || 'Could not load the site logo.'))
  }, [ok])

  if (!ok) return <Login ok={() => setOk(true)} logo={logo} error={adminError} />
  if (!me) return <p className="p-8">{adminError || 'Loading admin…'}</p>

  const renderContent = () => (
    v === 'dashboard' ? <Dash />
    : CFG[v] ? <Manager col={v} onNavigate={setV} />
    : v === 'about' || v === 'contact' ? <SectionEditor section={v} />
    : v === 'content' ? <Content />
    : v === 'quote-settings' ? <QuoteSettings />
    : v === 'media' ? <Media />
    : v === 'notifications' ? <Notes onNavigate={setV} onUpdateCount={refreshStats} />
    : <Profile me={me} logo={logo} onSaved={setMe} onLogoSaved={setLogo} />
  )

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 h-screen max-h-screen w-64 border-r border-white/10 bg-panel p-4 sm:p-5 flex flex-col shrink-0">
        <div className="shrink-0 mb-6 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold"><BrandLogo logo={media(logo)} label="ASVORA" imageClassName="h-8 w-8">AS<span className="text-lime">VORA</span> <span className="text-xs text-white/40">admin</span></BrandLogo></a>
          <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-lime transition" title="Open public site">↗ Site</a>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
          {NAV.map(([k, l]) => (
            <button
              key={k}
              onClick={() => { setV(k); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition ${v === k ? 'bg-brand/20 text-lime font-medium' : 'text-white/60 hover:bg-white/5'}`}
            >
              {l}
              {k === 'notifications' && unread > 0 && (
                <b className="rounded-full bg-lime px-2 text-xs text-black">{unread}</b>
              )}
            </button>
          ))}
          <button className="mt-6 w-full rounded-xl px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5" onClick={() => { localStorage.removeItem('tp_token'); setOk(false) }}>⏻ Logout</button>
        </nav>
      </aside>

      {/* Main Content Workspace */}
      <main className="min-w-0 flex-1 p-6 md:p-10">
        {/* Top Header Bar */}
        <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8 border-b border-white/5 pb-4">
          <h1 className="min-w-0 truncate font-display text-2xl font-bold capitalize sm:text-3xl">
            {v === 'projects' ? 'Works' : v}
          </h1>
          <span className="max-w-[12rem] truncate text-right text-xs text-white/50 sm:text-sm">{me.name}</span>
        </div>

        {adminError && <p role="alert" className="mb-4 text-sm text-red-300">{adminError}</p>}
        {renderContent()}
      </main>
    </div>
  )
}
