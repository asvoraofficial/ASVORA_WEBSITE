const B = import.meta.env.VITE_API || ''
const DEMO_MODE = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD
const DEMO_TOKEN = 'local-browser-demo'
const DEMO_DATA_KEY = 'tp_demo_data'
export const DEFAULT_QUOTE_BUDGETS: string[] = []
type DemoData = { content: Record<string, string>; [key: string]: any }
export const browserOnlyDemo = DEMO_MODE
const DEFAULT_CONTENT = {
  brand: 'ASZENIX',
  logo: '',
  heroTitle: 'Digital solutions for your business',
  heroSub: 'AS Digital Studio delivers professional web development, creative video editing, and engaging content creation. We help businesses build their online presence with innovative digital solutions and premium quality.',
  aboutTitle: 'Creative digital work. Made for your business.',
  aboutText: 'AS Digital Studio delivers professional web development, creative video editing, and engaging content creation. We help businesses build their online presence with innovative digital solutions and premium quality.',
  ctaText: "Let's build your online presence.",
  contactTitle: 'Let us talk about your project',
  email: '', phone: '9150962176', address: 'Thiruvannamalai, Tamil Nadu, India',
  stat1: '', stat2: '', stat3: '', stat4: '', technologies: '',
  quoteBudgets: DEFAULT_QUOTE_BUDGETS.join(','),
}
const LEGACY_CONTENT: Record<string, string> = {
  heroTitle: 'We engineer software that scales your business',
  heroSub: 'TECHPRO designs, builds and runs cloud platforms, AI products and digital experiences for ambitious companies.',
  aboutText: 'TECHPRO is a product engineering studio of designers, architects and developers. We pair senior talent with a rigorous delivery process, so ideas become reliable, fast and beautiful software.',
  ctaText: 'Ready to build something exceptional?',
  email: 'hello@techpro.dev', phone: '+91 44 0000 0000', address: 'Chennai, India',
  stat1: '120+|Projects delivered', stat2: '45|Enterprise clients', stat3: '99.9%|Platform uptime', stat4: '8 yrs|Of engineering',
  technologies: 'React,TypeScript,Next.js,Python,FastAPI,Node.js,MongoDB,PostgreSQL,AWS,Docker,Kubernetes,TensorFlow',
  quoteBudgets: '< $10k,$10k–$50k,$50k–$150k,$150k+',
}
const LEGACY_PROJECTS = [
  ['Nimbus Analytics', 'SaaS', 'Real-time analytics platform serving 2M events per minute.', '+240% faster reporting'],
  ['Voltix Energy', 'IoT', 'Smart-grid monitoring dashboard for 14 plants.', '-31% downtime'],
  ['Aurora Health', 'AI', 'Clinical triage assistant with explainable models.', '4x faster triage'],
  ['Kite Commerce', 'E-commerce', 'Headless storefront with sub-second page loads.', '+58% conversion'],
]
const LEGACY_TESTIMONIAL_QUOTES = [
  'TECHPRO shipped in ten weeks what we had planned for a year. Exceptional engineers and communication.',
  'Their dashboards changed how our operators work. Reliable, fast and beautifully designed.',
  'A true product partner. They challenged our assumptions and the results speak for themselves.',
]
const LEGACY_SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Web Development': 'Modern, responsive websites and web applications built to help your business grow.',
  'Graphic Design': 'Distinctive visual identities, logos, and marketing designs that make your brand stand out.',
  'Content Creation': 'Engaging written and visual content tailored to your brand, audience, and goals.',
  'Video Editing': 'Polished, compelling videos edited for social media, marketing, and storytelling.',
  'Business Ideas': 'Creative business ideas and practical guidance to help turn opportunities into a clear plan.',
}
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Web Development': "Professional websites and web applications designed to build your business's online presence.",
  'Video Editing': 'Creative, polished video editing for your brand, marketing, and social channels.',
  'Content Creation': 'Engaging content tailored to your brand, audience, and business goals.',
}
export const tok = () => {
  const token = localStorage.getItem('tp_token')
  if (DEMO_MODE && token !== DEMO_TOKEN) {
    localStorage.removeItem('tp_token')
    return null
  }
  return token
}
export const media = (u: string) => (u?.startsWith('/uploads') ? B + u : u)

function newDemoData(): DemoData {
  const now = new Date().toISOString()
  return {
    content: { ...DEFAULT_CONTENT },
    services: [
      ['💻', 'Web Development', "Professional websites and web applications designed to build your business's online presence."],
      ['🎬', 'Video Editing', 'Creative, polished video editing for your brand, marketing, and social channels.'],
      ['✍️', 'Content Creation', 'Engaging content tailored to your brand, audience, and business goals.'],
    ].map(([icon, title, description]) => ({ id: crypto.randomUUID(), icon, title, description, published: true, created: now })),
    projects: [],
    testimonials: [],
    enquiries: [], quotes: [], notifications: [], media: [], visits: [],
    admin: { email: DEMO_EMAIL || '', name: 'ASZENIX Admin' },
  }
}

function demoData(): DemoData {
  const saved = localStorage.getItem(DEMO_DATA_KEY)
  if (!saved) {
    const data = newDemoData()
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data))
    return data
  }
  try {
    const data = JSON.parse(saved)
    let changed = false
    data.content ||= {}
    for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
      if (!Object.prototype.hasOwnProperty.call(data.content, key)) {
        data.content[key] = value
        changed = true
      } else if (data.content[key] === LEGACY_CONTENT[key]) {
        data.content[key] = value
        changed = true
      }
    }
    data.services ||= []
    data.services = data.services.filter((row: any) => {
      if (LEGACY_SERVICE_DESCRIPTIONS[row.title] !== row.description) return true
      if (!SERVICE_DESCRIPTIONS[row.title]) {
        changed = true
        return false
      }
      row.description = SERVICE_DESCRIPTIONS[row.title]
      changed = true
      return true
    })
    if (data.admin?.name === 'TECHPRO Admin') {
      data.admin.name = 'ASZENIX Admin'
      changed = true
    }
    const projects = (data.projects || []).filter((row: any) => !LEGACY_PROJECTS.some(
      ([title, category, description, result]) =>
        row.title === title && row.category === category && row.description === description && row.result === result,
    ))
    const testimonials = (data.testimonials || []).filter((row: any) => !LEGACY_TESTIMONIAL_QUOTES.includes(row.quote))
    if (projects.length !== data.projects?.length || testimonials.length !== data.testimonials?.length) {
      data.projects = projects
      data.testimonials = testimonials
      changed = true
    }
    data.notifications ||= []
    data.notifications.forEach((notif: any) => {
      if (!notif.details) {
        const title = (notif.title || '').toLowerCase()
        const msg = notif.message || ''
        const emailMatch = msg.match(/\(([^)]+@[^)]+)\)/)
        const email = emailMatch ? emailMatch[1] : ''
        const nameMatch = msg.match(/^([^(]+)/)
        const name = nameMatch ? nameMatch[1].trim() : ''
        if (title.includes('quote')) {
          const match = (data.quotes || []).find((q: any) => (email && q.email === email) || (name && q.name === name))
          if (match) {
            notif.type ||= 'quotes'
            notif.targetId ||= match.id
            notif.name ||= match.name
            notif.email ||= match.email
            notif.phone ||= match.phone
            notif.service ||= match.service
            notif.budget ||= match.budget
            notif.details ||= match.message
            changed = true
          }
        } else if (title.includes('enquiry')) {
          const match = (data.enquiries || []).find((e: any) => (email && e.email === email) || (name && e.name === name))
          if (match) {
            notif.type ||= 'enquiries'
            notif.targetId ||= match.id
            notif.name ||= match.name
            notif.email ||= match.email
            notif.details ||= match.message
            changed = true
          }
        }
      }
    })
    if (changed) saveDemoData(data)
    return data
  } catch (error) {
    throw new Error(`Could not read browser demo data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function saveDemoData(data: DemoData) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data))
}

function requireDemoLogin(path: string) {
  if (path.startsWith('/admin/') || path.startsWith('/auth/profile')) {
    if (tok() !== DEMO_TOKEN) throw new Error('Sign in to the local demo first.')
  }
}

async function demoApi(path: string, method: string, body: any) {
  const request = new URL(path, location.origin)
  path = request.pathname
  if (path === '/auth/login' && method === 'POST') {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) throw new Error('Set the local demo credentials in frontend/.env.local.')
    const data = demoData()
    if (body?.email !== data.admin.email || body?.password !== DEMO_PASSWORD) throw new Error('Invalid credentials')
    return { token: DEMO_TOKEN }
  }

  requireDemoLogin(path)
  const data = demoData()

  if (path === '/auth/me' && method === 'GET') return { ...data.admin }
  if (path === '/auth/profile' && method === 'PUT') {
    data.admin = { ...data.admin, email: body.email || data.admin.email, name: body.name || data.admin.name }
    saveDemoData(data)
    return { token: DEMO_TOKEN }
  }
  if (path === '/public' && method === 'GET') {
    return {
      content: data.content,
      services: data.services.filter((row: any) => row.published !== false),
      projects: data.projects.filter((row: any) => row.published !== false),
      testimonials: data.testimonials.filter((row: any) => row.published !== false),
    }
  }
  if (path === '/track' && method === 'POST') {
    data.visits.push({ path: String(body?.path || '/').slice(0, 100), created: new Date().toISOString() })
    saveDemoData(data)
    return { ok: true }
  }
  if (path === '/reviews' && method === 'POST') {
    const name = String(body?.name || '').trim()
    const rating = Number(body?.rating)
    const quote = String(body?.quote || '').trim()
    if (!name || name.length > 120) throw new Error('Name must be between 1 and 120 characters.')
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5 stars.')
    if (quote.length > 3000) throw new Error('Review must be 3000 characters or fewer.')
    const created = new Date().toISOString()
    const reviewId = crypto.randomUUID()
    data.testimonials.push({
      id: reviewId,
      name,
      role: 'ASZENIX visitor',
      quote: quote || `Rated ${rating} out of 5 stars.`,
      rating,
      published: false,
      created,
    })
    data.notifications.push({
      id: crypto.randomUUID(),
      title: 'New review to approve',
      message: `${name} · ${rating}/5 stars`,
      type: 'testimonials',
      targetId: reviewId,
      name,
      rating,
      details: quote || `Rated ${rating} out of 5 stars.`,
      read: false,
      created,
    })
    saveDemoData(data)
    return { ok: true }
  }
  if (path === '/admin/stats' && method === 'GET') {
    const today = new Date()
    const series = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - 13 + i)
      const day = date.toISOString().slice(0, 10)
      return { d: day, n: data.visits.filter((visit: any) => visit.created.startsWith(day)).length }
    })
    const counts = new Map<string, number>()
    data.visits.forEach((visit: any) => counts.set(visit.path, (counts.get(visit.path) || 0) + 1))
    return {
      visits: data.visits.length, series,
      top: [...counts].map(([path, n]) => ({ path, n })).sort((a, b) => b.n - a.n).slice(0, 5),
      enquiries: data.enquiries.length, quotes: data.quotes.length,
      new: [...data.enquiries, ...data.quotes].filter((row: any) => row.status === 'new').length,
      services: data.services.length, projects: data.projects.length,
      unread: data.notifications.filter((row: any) => !row.read).length,
    }
  }
  if (path === '/admin/content') {
    if (method === 'GET') return { ...data.content }
    if (method === 'PUT') {
      data.content = { ...data.content, ...body }
      saveDemoData(data)
      return { ok: true }
    }
  }

  const collectionMatch = path.match(/^\/admin\/(services|projects|testimonials|enquiries|quotes|notifications|media)(?:\/([^/]+))?$/)
  if (collectionMatch) {
    const [, collection, id] = collectionMatch
    const rows = data[collection] as any[]
    if (!id && method === 'GET') {
      const params = request.searchParams
      const query = params.get('q')?.toLowerCase() || ''
      const status = params.get('status') || ''
      return rows.filter((row: any) =>
        (!query || ['title', 'name', 'email', 'message'].some(key => String(row[key] || '').toLowerCase().includes(query))) &&
        (!status || row.status === status))
    }
    if (!id && method === 'POST') {
      const row = { ...body, id: crypto.randomUUID(), created: new Date().toISOString() }
      rows.push(row)
      saveDemoData(data)
      return row
    }
    const index = rows.findIndex((row: any) => row.id === id)
    if (index !== -1 && method === 'PUT') {
      rows[index] = { ...rows[index], ...body, id, created: rows[index].created }
      saveDemoData(data)
      return { ok: true }
    }
    if (index !== -1 && method === 'DELETE') {
      rows.splice(index, 1)
      saveDemoData(data)
      return { ok: true }
    }
  }
  if (path === '/enquiries' || path === '/quotes') {
    const collection = path.slice(1) as 'enquiries' | 'quotes'
    const entry = { ...body, id: crypto.randomUUID(), status: 'new', created: new Date().toISOString() }
    data[collection].push(entry)
    data.notifications.push({
      id: crypto.randomUUID(),
      title: `New ${collection === 'quotes' ? 'quote request' : 'enquiry'}`,
      message: `${entry.name} (${entry.email})`,
      type: collection,
      targetId: entry.id,
      name: entry.name,
      email: entry.email,
      phone: entry.phone || '',
      service: entry.service || '',
      budget: entry.budget || '',
      details: entry.message || '',
      read: false,
      created: entry.created,
    })
    saveDemoData(data)
    return { ok: true }
  }
  if (path === '/admin/media/upload' && method === 'POST') {
    throw new Error('Media uploads need the backend and are unavailable in browser-only demo mode.')
  }
  throw new Error(`This action is unavailable in browser-only demo mode: ${method} ${path}`)
}

function notifyPublicUpdate(path: string, method: string) {
  if (typeof BroadcastChannel === 'undefined' || !/^\/admin\/(content|services|projects|testimonials)(?:\/|$)/.test(path) || !['POST', 'PUT', 'DELETE'].includes(method)) return
  const channel = new BroadcastChannel('tp_public_update')
  channel.postMessage(null)
  channel.close()
}

export async function api(path: string, o: any = {}) {
  const form = o.body instanceof FormData
  const method = (o.method || 'GET').toUpperCase()
  if (DEMO_MODE) {
    const result = await demoApi(path, method, o.body)
    notifyPublicUpdate(path, method)
    return result
  }
  const r = await fetch(B + '/api' + path, { ...o,
    headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(tok() ? { Authorization: 'Bearer ' + tok() } : {}) },
    body: o.body && !form ? JSON.stringify(o.body) : o.body })
  if (r.status === 401 && path !== '/auth/login') { localStorage.removeItem('tp_token'); location.href = '/admin' }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Request failed')
  const result = await r.json()
  notifyPublicUpdate(path, method)
  return result
}
