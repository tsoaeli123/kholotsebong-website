import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleCheck,
  FileText,
  GraduationCap,
  Handshake,
  Image,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MonitorCog,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import {
  supabase,
  type Article,
  type ClientRecord,
  type Database,
  type PageImage,
  type Program,
  type Service,
  type SiteSettings,
} from './lib/supabase'
import './AdminApp.css'

type Collection = 'services' | 'programs' | 'articles' | 'clients'
type CollectionEntry = Service | Program | Article | ClientRecord
type FormValues = Record<string, string>
type ImageSection = PageImage['section']
type EnquiryStatus = 'new' | 'contacted' | 'closed'
type ToastMessage = { message: string; type: 'success' | 'error' }
type FieldDefinition = {
  name: string
  label: string
  type?: 'text' | 'number' | 'url' | 'email' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  options?: string[]
  wide?: boolean
  help?: string
}

type Client = SupabaseClient<Database>

const settingsDefaults: SiteSettings = {
  id: 'primary',
  hero_headline: 'Building strong businesses. Empowering employer and employee.',
  hero_subheadline:
    'Human Resources Management, Business Development Services, ICT solutions and computer sales for people and organizations ready to move forward.',
  about_text:
    'Kholo Tsebong Consulting brings business development, human resources and technology services together in one place. Our focus is on practical solutions that help individuals, teams and organisations build capability.',
  footer_copy:
    'Corporate training, human resources, ICT services and computer sales for people and organisations in Lesotho.',
  phone: '+266 6345 0591',
  email: 'info@kholotsebong.co.ls',
  address: 'Maseru, Lesotho',
}

const collectionInfo: Record<Collection, { title: string; description: string; fields: FieldDefinition[] }> = {
  services: {
    title: 'Services',
    description: 'Manage the service areas and descriptions shown across the website.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'icon', label: 'Icon', type: 'select', required: true, options: ['GraduationCap', 'UsersRound', 'Cpu', 'Laptop', 'BriefcaseBusiness'] },
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
      { name: 'image_url', label: 'Image URL', type: 'url', required: true, wide: true },
      { name: 'active', label: 'Published on the website', type: 'checkbox' },
      { name: 'sort_order', label: 'Display order', type: 'number', required: true },
    ],
  },
  programs: {
    title: 'Training programs',
    description: 'Edit GYBI, SYB, IYB and EYB programme information.',
    fields: [
      { name: 'code', label: 'Program code', required: true },
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
      { name: 'active', label: 'Published on the website', type: 'checkbox' },
      { name: 'sort_order', label: 'Display order', type: 'number', required: true },
    ],
  },
  articles: {
    title: 'Blog / insights',
    description: 'Write and publish articles for the public insights section.',
    fields: [
      { name: 'title', label: 'Article title', required: true, wide: true },
      { name: 'slug', label: 'URL slug', required: true, help: 'Lowercase words separated by hyphens.' },
      { name: 'excerpt', label: 'Short introduction', type: 'textarea', required: true, wide: true },
      { name: 'body', label: 'Article body', type: 'textarea', required: true, wide: true, help: 'Plain text is supported. Separate paragraphs with a blank line.' },
      { name: 'image_url', label: 'Cover image URL', type: 'url', wide: true },
      { name: 'status', label: 'Publication status', type: 'select', required: true, options: ['draft', 'published'] },
    ],
  },
  clients: {
    title: 'Clients',
    description: 'Manage the organizations and businesses featured in the clients section.',
    fields: [
      { name: 'name', label: 'Client name', required: true },
      { name: 'logo_url', label: 'Logo URL', type: 'url', wide: true },
      { name: 'sort_order', label: 'Display order', type: 'number', required: true },
    ],
  },
}

const sidebarItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/services', label: 'Services', icon: BriefcaseBusiness },
  { path: '/admin/clients', label: 'Clients', icon: Handshake },
  { path: '/admin/programs', label: 'Programs', icon: GraduationCap },
  { path: '/admin/articles', label: 'Blog / Insights', icon: FileText },
  { path: '/admin/site-images', label: 'Site Images', icon: Image },
  { path: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
  { path: '/admin/settings', label: 'Site settings', icon: Settings2 },
]

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred. Please try again.'
}

function getSlug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!supabase) return

    let active = true
    const client = supabase
    client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      setSession(data.session)
      setLoading(false)
    }).catch((error: unknown) => {
      if (!active) return
      setAuthError(messageFromError(error))
      setLoading(false)
    })

    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setAuthError('')
      }
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (!supabase) return <SupabaseSetup />
  if (loading) return <AdminLoading message="Checking your session…" />
  if (authError && !session) {
    return <AdminError message={authError} title="Could not check your session" />
  }

  return (
    <AdminRoutes
      client={supabase}
      session={session}
      onAuthError={setAuthError}
      onSession={setSession}
    />
  )
}

function AdminRoutes({
  client,
  session,
  onAuthError,
  onSession,
}: {
  client: Client
  session: Session | null
  onAuthError: (message: string) => void
  onSession: (session: Session | null) => void
}) {
  const location = useLocation()
  const isLoginPage = location.pathname.endsWith('/login')

  if (!session) {
    return isLoginPage
      ? <AdminLogin client={client} onAuthError={onAuthError} />
      : <Navigate to="/admin/login" replace />
  }

  if (session.user.app_metadata.role !== 'admin') {
    return <AdminAccessDenied client={client} onSession={onSession} />
  }

  if (isLoginPage) return <Navigate to="/admin" replace />
  return <AdminConsole client={client} user={session.user} onSession={onSession} />
}

function SupabaseSetup() {
  return (
    <div className="admin-screen">
      <section className="setup-card">
        <span className="setup-icon"><Settings2 size={22} strokeWidth={1.5} /></span>
        <span className="admin-kicker">KHOLO TSEBONG CONSULTING</span>
        <h1>Connect your workspace</h1>
        <p>Add your Supabase project URL and public anon key to the local environment to enable secure admin access.</p>
        <pre>VITE_SUPABASE_URL=https://your-project.supabase.co<br />VITE_SUPABASE_ANON_KEY=your-public-anon-key</pre>
        <span className="setup-footnote"><ShieldCheck size={15} strokeWidth={1.5} /> Never put a Supabase service-role key in the browser app.</span>
        <Link className="admin-back-link" to="/">Return to website <ArrowUpRight size={14} strokeWidth={1.5} /></Link>
      </section>
    </div>
  )
}

function AdminLoading({ message }: { message: string }) {
  return <div className="admin-loading"><LoaderCircle size={22} strokeWidth={1.5} className="spin" /><span>{message}</span></div>
}

function AdminError({ message, title }: { message: string; title: string }) {
  return (
    <div className="admin-screen">
      <section className="setup-card">
        <span className="setup-icon error-icon"><AlertCircle size={22} strokeWidth={1.5} /></span>
        <span className="admin-kicker">AUTHENTICATION ERROR</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <Link className="admin-back-link" to="/">Return to website <ArrowUpRight size={14} strokeWidth={1.5} /></Link>
      </section>
    </div>
  )
}

function AdminLogin({ client, onAuthError }: { client: Client; onAuthError: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data, error: loginError } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (loginError) {
        setError(loginError.message)
        return
      }
      if (data.user.app_metadata.role !== 'admin') {
        const { error: signOutError } = await client.auth.signOut()
        setError(signOutError
          ? `This account has no administrator access. Sign out failed: ${signOutError.message}`
          : 'This account does not have administrator access.')
        return
      }
      onAuthError('')
      navigate('/admin', { replace: true })
    } catch (loginError) {
      setError(messageFromError(loginError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-screen login-screen">
      <Link to="/" className="login-home"><img className="admin-brand-logo" src="/logo.png" alt="" /><span>KHOLO TSEBONG<small>CONSULTING</small></span></Link>
      <section className="login-card">
        <span className="login-icon"><ShieldCheck size={21} strokeWidth={1.5} /></span>
        <span className="admin-kicker">SECURE ADMINISTRATION</span>
        <h1>Welcome back.</h1>
        <p>Sign in with your administrator account to continue.</p>
        <form className="admin-form login-form" onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>
          {error && <p className="inline-error" role="alert"><AlertCircle size={15} strokeWidth={1.5} />{error}</p>}
          <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" strokeWidth={1.5} /> : null}Sign in <ArrowUpRight size={15} strokeWidth={1.5} /></button>
        </form>
        <Link className="login-back-link" to="/">Back to website</Link>
      </section>
      <p className="login-security"><ShieldCheck size={14} strokeWidth={1.5} /> Protected by Supabase authentication</p>
    </div>
  )
}

function AdminAccessDenied({ client, onSession }: { client: Client; onSession: (session: Session | null) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    setBusy(true)
    try {
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) {
        setError(signOutError.message)
        return
      }
      onSession(null)
    } catch (signOutError) {
      setError(messageFromError(signOutError))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-screen">
      <section className="setup-card">
        <span className="setup-icon error-icon"><ShieldCheck size={22} strokeWidth={1.5} /></span>
        <span className="admin-kicker">ACCESS RESTRICTED</span>
        <h1>Administrator access required</h1>
        <p>Your account is signed in, but it does not have the administrator role assigned.</p>
        {error && <p className="inline-error" role="alert"><AlertCircle size={15} strokeWidth={1.5} />{error}</p>}
        <button className="admin-primary-button" type="button" onClick={signOut} disabled={busy}>Sign out <LogOut size={15} strokeWidth={1.5} /></button>
      </section>
    </div>
  )
}

function AdminConsole({
  client,
  user,
  onSession,
}: {
  client: Client
  user: User
  onSession: (session: Session | null) => void
}) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const page = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard'
  const currentItem = sidebarItems.find((item) => item.path === location.pathname)

  async function signOut() {
    try {
      const { error } = await client.auth.signOut()
      if (error) throw error
      onSession(null)
    } catch (error) {
      setSignOutError(messageFromError(error))
    }
  }

  let content
  if (page === 'services') content = <CollectionManager client={client} collection="services" />
  else if (page === 'clients') content = <CollectionManager client={client} collection="clients" />
  else if (page === 'programs') content = <CollectionManager client={client} collection="programs" />
  else if (page === 'articles') content = <CollectionManager client={client} collection="articles" />
  else if (page === 'site-images') content = <SiteImagesPage client={client} />
  else if (page === 'enquiries') content = <EnquiriesPage client={client} />
  else if (page === 'settings') content = <SiteSettingsPage client={client} />
  else content = <DashboardPage client={client} />

  return (
    <div className="admin-app">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={sidebarOpen ? 'admin-sidebar sidebar-open' : 'admin-sidebar'}>
        <Link to="/" className="admin-brand"><img className="admin-brand-logo" src="/logo.png" alt="" /><span>KHOLO TSEBONG<small>CONSULTING</small></span></Link>
        <span className="sidebar-caption">WORKSPACE</span>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {sidebarItems.map(({ path, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === path : location.pathname.startsWith(path)
            return (
              <Link className={active ? 'sidebar-link sidebar-link-active' : 'sidebar-link'} to={path} key={path} onClick={() => setSidebarOpen(false)}>
                <Icon size={17} strokeWidth={1.5} /><span>{label}</span>{active && <span className="active-indicator" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><ShieldCheck size={17} strokeWidth={1.5} /><span>Secure content<br />management</span></div>
          <Link className="sidebar-view-site" to="/"><ArrowUpRight size={15} strokeWidth={1.5} /> View public website</Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" aria-label="Open admin navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} strokeWidth={1.5} /></button>
          <div className="admin-breadcrumb"><span>Workspace</span><span>/</span><b>{currentItem?.label ?? (page === 'dashboard' ? 'Dashboard' : 'Dashboard')}</b></div>
          <div className="admin-user"><span className="admin-avatar">{(user.email?.[0] ?? 'A').toUpperCase()}</span><span className="admin-user-email">{user.email}</span><button type="button" onClick={signOut}><LogOut size={15} strokeWidth={1.5} /><span>Sign out</span></button></div>
        </header>
        {signOutError && <div className="admin-global-error" role="alert">{signOutError}</div>}
        <main className="admin-content">{content}</main>
      </div>
    </div>
  )
}

function DashboardPage({ client }: { client: Client }) {
  const [counts, setCounts] = useState({ services: 0, programs: 0, articles: 0, enquiries: 0 })
  const [latestEnquiries, setLatestEnquiries] = useState<Database['public']['Tables']['enquiries']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [servicesResult, programsResult, articlesResult, enquiriesResult, recentResult] = await Promise.all([
        client.from('services').select('*', { count: 'exact', head: true }),
        client.from('programs').select('*', { count: 'exact', head: true }),
        client.from('articles').select('*', { count: 'exact', head: true }),
        client.from('enquiries').select('*', { count: 'exact', head: true }),
        client.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      const issue = servicesResult.error ?? programsResult.error ?? articlesResult.error ?? enquiriesResult.error ?? recentResult.error
      if (issue) throw issue

      setCounts({
        services: servicesResult.count ?? 0,
        programs: programsResult.count ?? 0,
        articles: articlesResult.count ?? 0,
        enquiries: enquiriesResult.count ?? 0,
      })
      setLatestEnquiries(recentResult.data ?? [])
    } catch (loadError) {
      setError(messageFromError(loadError))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void load() })
    return () => { active = false }
  }, [load])

  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="OVERVIEW" title="Good day." description="Here’s what’s happening across your consulting website." />
      {error && <InlineNotice message={error} onRetry={() => { setLoading(true); setError(''); void load() }} />}
      <div className="dashboard-stats">
        {[
          { label: 'Services', value: counts.services, icon: BriefcaseBusiness, path: '/admin/services', color: 'red' },
          { label: 'Programs', value: counts.programs, icon: GraduationCap, path: '/admin/programs', color: 'blue' },
          { label: 'Insights', value: counts.articles, icon: BookOpen, path: '/admin/articles', color: 'violet' },
          { label: 'Enquiries', value: counts.enquiries, icon: Inbox, path: '/admin/enquiries', color: 'green' },
        ].map(({ label, value, icon: Icon, path, color }) => (
          <Link className="stat-card" to={path} key={label}>
            <span className={`stat-icon stat-${color}`}><Icon size={19} strokeWidth={1.5} /></span>
            <span className="stat-label">{label}</span>
            <strong>{loading ? '—' : value}</strong>
            <span className="stat-open">Manage <ArrowUpRight size={14} strokeWidth={1.5} /></span>
          </Link>
        ))}
      </div>
      <section className="admin-panel recent-panel">
        <div className="panel-heading"><div><span className="admin-kicker">INCOMING LEADS</span><h2>Recent enquiries</h2></div><Link to="/admin/enquiries" className="panel-link">View all <ArrowUpRight size={14} strokeWidth={1.5} /></Link></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>CONTACT</th><th>SERVICE</th><th>RECEIVED</th><th>STATUS</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="table-empty"><LoaderCircle className="spin" size={17} strokeWidth={1.5} /> Loading enquiries…</td></tr>
                : latestEnquiries.length === 0 ? <tr><td colSpan={4} className="table-empty">No enquiries received yet.</td></tr>
                  : latestEnquiries.map((enquiry) => <tr key={enquiry.id}><td><b>{enquiry.name}</b><span>{enquiry.email}</span></td><td>{enquiry.service}</td><td>{formatDate(enquiry.created_at)}</td><td><StatusBadge status={enquiry.status} /></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      <section className="dashboard-tip"><span><MonitorCog size={19} strokeWidth={1.5} /></span><div><b>Keep your site up to date</b><p>Review your service details and respond to new enquiries from this dashboard.</p></div><Link to="/admin/settings">Site settings <ArrowUpRight size={14} strokeWidth={1.5} /></Link></section>
    </div>
  )
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="admin-page-intro"><div><span className="admin-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function InlineNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="inline-notice" role="alert"><AlertCircle size={17} strokeWidth={1.5} /><span>{message}</span><button type="button" onClick={onRetry}>Try again</button></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

function isEnquiryStatus(value: string): value is EnquiryStatus {
  return value === 'new' || value === 'contacted' || value === 'closed'
}

function CollectionManager({ client, collection }: { client: Client; collection: Collection }) {
  const info = collectionInfo[collection]
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<CollectionEntry | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormValues>({})
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const loadEntries = useCallback(async () => {
    try {
      setEntries(await getEntries(client, collection))
    } catch (loadError) {
      setError(messageFromError(loadError))
    } finally {
      setLoading(false)
    }
  }, [client, collection])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void loadEntries() })
    return () => { active = false }
  }, [loadEntries])

  function showToast(message: string, type: ToastMessage['type']) {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 4200)
  }

  function beginCreate() {
    const defaults: FormValues = {}
    for (const field of info.fields) {
      if (field.type === 'checkbox') defaults[field.name] = collection === 'services' || collection === 'programs' ? 'true' : 'false'
      else if (field.name === 'sort_order') defaults[field.name] = String(entries.length + 1)
      else if (field.name === 'icon') defaults[field.name] = 'GraduationCap'
      else if (field.name === 'status') defaults[field.name] = 'draft'
      else defaults[field.name] = ''
    }
    setForm(defaults)
    setEditing(null)
    setCreating(true)
  }

  function beginEdit(entry: CollectionEntry) {
    const nextForm: FormValues = {}
    for (const field of info.fields) {
      const value = getEntryField(entry, field.name)
      nextForm[field.name] = field.type === 'checkbox' ? String(Boolean(value)) : String(value ?? '')
    }
    setForm(nextForm)
    setEditing(entry)
    setCreating(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!formElement.reportValidity()) return
    setBusy(true)
    try {
      await saveEntry(client, collection, form, editing?.id)
      showToast(`${info.title.replace(/s$/, '')} saved successfully.`, 'success')
      setCreating(false)
      setEditing(null)
      await loadEntries()
    } catch (saveError) {
      showToast(messageFromError(saveError), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function removeEntry(entry: CollectionEntry) {
    const title = 'title' in entry ? entry.title : 'name' in entry ? entry.name : 'Untitled item'
    if (!window.confirm(`Delete “${title}”? This action cannot be undone.`)) return
    try {
      await deleteEntry(client, collection, entry.id)
      showToast('Item deleted.', 'success')
      await loadEntries()
    } catch (deleteError) {
      showToast(messageFromError(deleteError), 'error')
    }
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file to upload.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image files must be 5 MB or smaller.', 'error')
      return
    }
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
      const objectPath = `${collection}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await client.storage
        .from('consulting-assets')
        .upload(objectPath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = client.storage.from('consulting-assets').getPublicUrl(objectPath)
      const imageField = collection === 'clients' ? 'logo_url' : 'image_url'
      setForm((current) => ({ ...current, [imageField]: data.publicUrl }))
      showToast('Image uploaded successfully.', 'success')
    } catch (uploadError) {
      showToast(messageFromError(uploadError), 'error')
    } finally {
      setUploading(false)
    }
  }

  const action = <button className="admin-primary-button" onClick={beginCreate}><Plus size={16} strokeWidth={1.5} /> Add {collection === 'articles' ? 'article' : collection === 'programs' ? 'program' : collection === 'clients' ? 'client' : 'service'}</button>

  return (
    <div className="collection-page">
      <PageIntro eyebrow={`CONTENT / ${collection.toUpperCase()}`} title={info.title} description={info.description} action={action} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && <InlineNotice message={error} onRetry={() => { setLoading(true); setError(''); void loadEntries() }} />}
      <section className="admin-panel collection-panel">
        <div className="collection-toolbar"><span>{loading ? 'Loading content…' : `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`}</span><span className="toolbar-note"><ShieldCheck size={14} strokeWidth={1.5} /> Changes publish to your website</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table content-table">
            <thead><tr><th>{collection === 'programs' ? 'CODE / TITLE' : collection === 'clients' ? 'CLIENT' : 'TITLE'}</th><th>{collection === 'articles' ? 'PUBLICATION' : collection === 'clients' ? 'LOGO' : 'DESCRIPTION'}</th><th>STATUS</th><th className="action-heading">ACTIONS</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="table-empty"><LoaderCircle className="spin" size={17} strokeWidth={1.5} /> Loading content…</td></tr>
                : entries.length === 0 ? <tr><td colSpan={4} className="table-empty">Nothing here yet. Add your first item to get started.</td></tr>
                  : entries.map((entry) => (
                    <tr key={entry.id}>
                      <td><b>{'title' in entry ? entry.title : 'name' in entry ? entry.name : 'Untitled item'}</b><span>{collection === 'programs' && 'code' in entry ? entry.code : collection === 'articles' && 'slug' in entry ? `/${entry.slug}` : 'description' in entry ? entry.description : ''}</span></td>
                      <td>{collection === 'articles' && 'created_at' in entry ? formatDate(entry.created_at) : collection === 'clients' && 'logo_url' in entry ? entry.logo_url ? <img className="client-logo-thumbnail" src={entry.logo_url} alt="" /> : 'No logo uploaded' : 'description' in entry ? entry.description : ''}</td>
                      <td><StatusBadge status={'active' in entry ? entry.active ? 'published' : 'hidden' : 'status' in entry ? entry.status : 'active'} /></td>
                      <td><div className="row-actions"><button title="Edit item" aria-label={`Edit ${'title' in entry ? entry.title : 'name' in entry ? entry.name : 'item'}`} onClick={() => beginEdit(entry)}><Pencil size={15} strokeWidth={1.5} /></button><button className="delete-action" title="Delete item" aria-label={`Delete ${'title' in entry ? entry.title : 'name' in entry ? entry.name : 'item'}`} onClick={() => void removeEntry(entry)}><Trash2 size={15} strokeWidth={1.5} /></button></div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      {creating && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreating(false) }}>
          <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-heading">
            <header className="modal-header"><div><span className="admin-kicker">{editing ? 'UPDATE CONTENT' : 'NEW CONTENT'}</span><h2 id="editor-heading">{editing ? 'Edit' : 'Add'} {collection === 'articles' ? 'article' : collection === 'programs' ? 'program' : collection === 'clients' ? 'client' : 'service'}</h2></div><button type="button" aria-label="Close editor" onClick={() => setCreating(false)}><X size={20} strokeWidth={1.5} /></button></header>
            <form className="admin-form editor-form" onSubmit={save}>
              <div className="editor-fields">
                {info.fields.map((field) => (
                  <label className={field.wide ? 'field-wide' : ''} key={field.name}>
                    <span>{field.label}{field.required && <i> *</i>}</span>
                    {field.type === 'textarea' ? <textarea required={field.required} rows={field.name === 'body' ? 8 : 4} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
                      : field.type === 'select' ? <div className="select-wrap"><select required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select><ChevronDown size={15} strokeWidth={1.5} /></div>
                        : field.type === 'checkbox' ? <span className="check-field"><input type="checkbox" checked={form[field.name] === 'true'} onChange={(event) => setForm((current) => ({ ...current, [field.name]: String(event.target.checked) }))} /><span>{form[field.name] === 'true' ? 'Visible on the public website' : 'Hidden from the public website'}</span></span>
                          : <input type={field.type ?? 'text'} required={field.required} value={form[field.name] ?? ''} onChange={(event) => {
                            const value = event.target.value
                            setForm((current) => ({
                              ...current,
                              [field.name]: value,
                              ...(collection === 'articles' && field.name === 'title' && !editing ? { slug: getSlug(value) } : {}),
                            }))
                          }} />}
                    {field.help && <small>{field.help}</small>}
                  </label>
                ))}
                {(collection === 'articles' || collection === 'clients') && (
                  <div className="upload-area-wrap field-wide">
                    <span className="upload-label">{collection === 'clients' ? 'Client logo' : 'Cover image'}</span>
                    <label className={dragging ? 'upload-dropzone is-dragging' : 'upload-dropzone'}
                      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void uploadImage(file) }}
                    >
                      <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file) }} />
                      {uploading ? <LoaderCircle className="spin" size={22} strokeWidth={1.5} /> : (collection === 'clients' ? form.logo_url : form.image_url) ? <Image size={22} strokeWidth={1.5} /> : <UploadCloud size={22} strokeWidth={1.5} />}
                      <b>{uploading ? 'Uploading image…' : (collection === 'clients' ? form.logo_url : form.image_url) ? 'Image attached' : 'Drop an image here or browse'}</b>
                      <span>JPG, PNG, GIF or WebP · Max 5 MB</span>
                    </label>
                    {(collection === 'clients' ? form.logo_url : form.image_url) && <div className="image-preview"><img src={collection === 'clients' ? form.logo_url : form.image_url} alt={collection === 'clients' ? 'Client logo preview' : 'Article cover preview'} /><button type="button" onClick={() => setForm((current) => ({ ...current, [collection === 'clients' ? 'logo_url' : 'image_url']: '' }))}>Remove image <X size={13} strokeWidth={1.5} /></button></div>}
                    <small>Uploaded files use the public “consulting-assets” storage bucket.</small>
                  </div>
                )}
              </div>
              <footer className="modal-footer"><button className="admin-secondary-button" type="button" onClick={() => setCreating(false)}>Cancel</button><button className="admin-primary-button" disabled={busy || uploading} type="submit">{busy ? <LoaderCircle className="spin" size={15} strokeWidth={1.5} /> : <Check size={15} strokeWidth={1.5} />}{editing ? 'Save changes' : 'Create item'}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

async function getEntries(client: Client, collection: Collection): Promise<CollectionEntry[]> {
  if (collection === 'clients') {
    const { data, error } = await client.from('clients').select('*').order('sort_order')
    if (error) throw error
    return data ?? []
  }
  if (collection === 'services') {
    const { data, error } = await client.from('services').select('*').order('sort_order')
    if (error) throw error
    return data ?? []
  }
  if (collection === 'programs') {
    const { data, error } = await client.from('programs').select('*').order('sort_order')
    if (error) throw error
    return data ?? []
  }
  const { data, error } = await client.from('articles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

async function saveEntry(client: Client, collection: Collection, form: FormValues, id?: string) {
  if (collection === 'clients') {
    const values = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      sort_order: Number(form.sort_order),
    }
    const { error } = id
      ? await client.from('clients').update(values).eq('id', id)
      : await client.from('clients').insert(values)
    if (error) throw error
    return
  }
  if (collection === 'services') {
    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      icon: form.icon,
      active: form.active === 'true',
      sort_order: Number(form.sort_order),
    }
    const { error } = id
      ? await client.from('services').update(values).eq('id', id)
      : await client.from('services').insert(values)
    if (error) throw error
    return
  }
  if (collection === 'programs') {
    const values = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      active: form.active === 'true',
      sort_order: Number(form.sort_order),
    }
    const { error } = id
      ? await client.from('programs').update(values).eq('id', id)
      : await client.from('programs').insert(values)
    if (error) throw error
    return
  }
  const status: Article['status'] = form.status === 'published' ? 'published' : 'draft'
  const values = {
    title: form.title.trim(),
    slug: getSlug(form.slug || form.title),
    excerpt: form.excerpt.trim(),
    body: form.body.trim(),
    image_url: form.image_url.trim(),
    status,
  }
  const { error } = id
    ? await client.from('articles').update(values).eq('id', id)
    : await client.from('articles').insert(values)
  if (error) throw error
}

async function deleteEntry(client: Client, collection: Collection, id: string) {
  const result = collection === 'services'
    ? await client.from('services').delete().eq('id', id)
    : collection === 'clients'
      ? await client.from('clients').delete().eq('id', id)
    : collection === 'programs'
      ? await client.from('programs').delete().eq('id', id)
      : await client.from('articles').delete().eq('id', id)
  if (result.error) throw result.error
}

function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  return <div className={`admin-toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>{toast.type === 'success' ? <CircleCheck size={17} strokeWidth={1.5} /> : <AlertCircle size={17} strokeWidth={1.5} />}<span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={15} strokeWidth={1.5} /></button></div>
}

function EnquiriesPage({ client }: { client: Client }) {
  const [enquiries, setEnquiries] = useState<Database['public']['Tables']['enquiries']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const loadEnquiries = useCallback(async () => {
    try {
      const { data, error: queryError } = await client.from('enquiries').select('*').order('created_at', { ascending: false })
      if (queryError) throw queryError
      setEnquiries(data ?? [])
    } catch (loadError) {
      setError(messageFromError(loadError))
    } finally {
      setLoading(false)
    }
  }, [client])
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void loadEnquiries() })
    return () => { active = false }
  }, [loadEnquiries])

  async function updateStatus(id: string, status: EnquiryStatus) {
    setSavingId(id)
    try {
      const { error: updateError } = await client.from('enquiries').update({ status }).eq('id', id)
      if (updateError) throw updateError
      setEnquiries((current) => current.map((item) => item.id === id ? { ...item, status } : item))
      setToast({ message: 'Enquiry status updated.', type: 'success' })
    } catch (updateError) {
      setToast({ message: messageFromError(updateError), type: 'error' })
    } finally {
      setSavingId('')
      window.setTimeout(() => setToast(null), 4200)
    }
  }

  return (
    <div className="enquiries-page">
      <PageIntro eyebrow="INCOMING LEADS" title="Enquiries" description="Review messages from your website and keep track of follow-up." />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && <InlineNotice message={error} onRetry={() => { setLoading(true); setError(''); void loadEnquiries() }} />}
      <section className="admin-panel">
        <div className="collection-toolbar"><span>{loading ? 'Loading enquiries…' : `${enquiries.length} ${enquiries.length === 1 ? 'enquiry' : 'enquiries'}`}</span><span className="toolbar-note"><Inbox size={14} strokeWidth={1.5} /> New messages arrive from your public contact form</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table enquiry-table">
            <thead><tr><th>CONTACT</th><th>REQUEST</th><th>MESSAGE</th><th>RECEIVED</th><th>STATUS</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="table-empty"><LoaderCircle className="spin" size={17} strokeWidth={1.5} /> Loading enquiries…</td></tr>
                : enquiries.length === 0 ? <tr><td colSpan={5} className="table-empty">No enquiries yet. New website submissions will appear here.</td></tr>
                  : enquiries.map((enquiry) => (
                    <tr key={enquiry.id}><td><b>{enquiry.name}</b><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></td><td>{enquiry.service}</td><td><span className="enquiry-message" title={enquiry.message}>{enquiry.message}</span></td><td>{formatDate(enquiry.created_at)}</td><td><div className="status-control"><select aria-label={`Update status for ${enquiry.name}`} disabled={savingId === enquiry.id} value={enquiry.status} onChange={(event) => { const status = event.target.value; if (isEnquiryStatus(status)) void updateStatus(enquiry.id, status) }}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>{savingId === enquiry.id && <LoaderCircle size={13} className="spin" strokeWidth={1.5} />}</div></td></tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SiteSettingsPage({ client }: { client: Client }) {
  const [form, setForm] = useState<SiteSettings>(settingsDefaults)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      const { data, error: loadError } = await client.from('site_settings').select('*').eq('id', 'primary').maybeSingle()
      if (loadError) throw loadError
      if (data) setForm(data)
    } catch (loadError) {
      setError(messageFromError(loadError))
    } finally {
      setLoading(false)
    }
  }, [client])
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void loadSettings() })
    return () => { active = false }
  }, [loadSettings])

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { error: saveError } = await client.from('site_settings').upsert({
        ...form,
        id: 'primary',
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      })
      if (saveError) throw saveError
      setToast({ message: 'Website settings saved.', type: 'success' })
    } catch (saveError) {
      setToast({ message: messageFromError(saveError), type: 'error' })
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(null), 4200)
    }
  }

  function updateField(key: keyof SiteSettings, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="settings-page">
      <PageIntro eyebrow="WEBSITE CONFIGURATION" title="Site settings" description="Update shared messaging and contact details used across your public website." />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && <InlineNotice message={error} onRetry={() => { setLoading(true); setError(''); void loadSettings() }} />}
      {loading ? <div className="admin-panel settings-loading"><LoaderCircle size={18} className="spin" strokeWidth={1.5} /> Loading website settings…</div> : (
        <form className="settings-form admin-panel" onSubmit={saveSettings}>
          <section className="settings-group"><div><h2>Homepage copy</h2><p>Update key messages shown on the homepage.</p></div><div className="settings-fields">
            <label className="field-wide">Hero headline<input required value={form.hero_headline} onChange={(event) => updateField('hero_headline', event.target.value)} /></label>
            <label className="field-wide">Hero subheadline<textarea rows={3} required value={form.hero_subheadline} onChange={(event) => updateField('hero_subheadline', event.target.value)} /></label>
            <label className="field-wide">About text<textarea rows={5} required value={form.about_text} onChange={(event) => updateField('about_text', event.target.value)} /></label>
            <label className="field-wide">Footer copy<textarea rows={3} required value={form.footer_copy} onChange={(event) => updateField('footer_copy', event.target.value)} /></label>
          </div></section>
          <section className="settings-group"><div><h2>Contact information</h2><p>Keep your contact details current across the site.</p></div><div className="settings-fields">
            <label>Phone<input type="tel" required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
            <label>Email<input type="email" required value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label>
            <label className="field-wide">Address<input required value={form.address} onChange={(event) => updateField('address', event.target.value)} /></label>
          </div></section>
          <div className="settings-actions"><span><ShieldCheck size={14} strokeWidth={1.5} /> Changes are reflected on the public website.</span><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} strokeWidth={1.5} /> : <Check size={15} strokeWidth={1.5} />} Save settings</button></div>
        </form>
      )}
    </div>
  )
}

function SiteImagesPage({ client }: { client: Client }) {
  const [images, setImages] = useState<PageImage[]>([])
  const [section, setSection] = useState<ImageSection>('hero')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const loadImages = useCallback(async () => {
    try {
      const { data, error: loadError } = await client.from('page_images').select('*').order('sort_order')
      if (loadError) throw loadError
      setImages(data ?? [])
    } catch (loadError) {
      setError(messageFromError(loadError))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void loadImages() })
    return () => { active = false }
  }, [loadImages])

  function showToast(message: string, type: ToastMessage['type']) {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 4200)
  }

  async function uploadFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    const invalidFile = files.find((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      showToast(
        invalidFile.type.startsWith('image/')
          ? `${invalidFile.name} is larger than 5 MB.`
          : `${invalidFile.name} is not an image file.`,
        'error',
      )
      return
    }

    setUploading(true)
    try {
      let nextOrder = Math.max(0, ...images.filter((image) => image.section === section).map((image) => image.sort_order))
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
        const objectPath = `site-images/${section}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await client.storage
          .from('consulting-assets')
          .upload(objectPath, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data } = client.storage.from('consulting-assets').getPublicUrl(objectPath)
        const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        const { error: insertError } = await client.from('page_images').insert({
          section,
          image_url: data.publicUrl,
          alt_text: altText,
          sort_order: ++nextOrder,
        })
        if (insertError) throw insertError
      }
      showToast(`${files.length} image${files.length === 1 ? '' : 's'} uploaded.`, 'success')
      setError('')
    } catch (uploadError) {
      showToast(messageFromError(uploadError), 'error')
    } finally {
      await loadImages()
      setUploading(false)
    }
  }

  async function removeImage(image: PageImage) {
    if (!window.confirm('Remove this image from the website?')) return
    try {
      const { error: deleteError } = await client.from('page_images').delete().eq('id', image.id)
      if (deleteError) throw deleteError
      showToast('Image removed from the website.', 'success')
      await loadImages()
    } catch (deleteError) {
      showToast(messageFromError(deleteError), 'error')
    }
  }

  const sectionLabels: Record<ImageSection, string> = {
    hero: 'Hero slideshow',
    services: 'Services cards',
    about: 'About page',
  }
  const visibleImages = images.filter((image) => image.section === section)

  return (
    <div className="site-images-page">
      <PageIntro eyebrow="WEBSITE CONTENT" title="Site Images" description="Upload and manage imagery used by the hero slideshow, services cards, and About page." />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && <InlineNotice message={error} onRetry={() => { setLoading(true); setError(''); void loadImages() }} />}
      <section className="admin-panel site-images-panel">
        <div className="site-image-tabs" role="tablist" aria-label="Image section">
          {(Object.keys(sectionLabels) as ImageSection[]).map((imageSection) => (
            <button
              type="button"
              role="tab"
              aria-selected={section === imageSection}
              className={section === imageSection ? 'site-image-tab is-active' : 'site-image-tab'}
              key={imageSection}
              onClick={() => setSection(imageSection)}
            >
              {sectionLabels[imageSection]}
            </button>
          ))}
        </div>
        <div className="site-image-upload">
          <label
            className={dragging ? 'upload-dropzone is-dragging' : 'upload-dropzone'}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files) }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(event) => { void uploadFiles(event.currentTarget.files); event.currentTarget.value = '' }}
            />
            {uploading ? <LoaderCircle className="spin" size={22} strokeWidth={1.5} /> : <UploadCloud size={22} strokeWidth={1.5} />}
            <b>{uploading ? 'Uploading images…' : `Add images for ${sectionLabels[section].toLowerCase()}`}</b>
            <span>Choose or drop multiple JPG, PNG, GIF or WebP images · Max 5 MB each</span>
          </label>
          <p>Hero images rotate in the slideshow. Services images are assigned to service cards in display order. The first About image is used on the About section.</p>
        </div>
        <div className="site-image-list-header">
          <b>{sectionLabels[section]}</b>
          <span>{loading ? 'Loading…' : `${visibleImages.length} ${visibleImages.length === 1 ? 'image' : 'images'}`}</span>
        </div>
        {loading ? (
          <div className="settings-loading"><LoaderCircle size={18} className="spin" strokeWidth={1.5} /> Loading site images…</div>
        ) : visibleImages.length === 0 ? (
          <div className="site-images-empty">No uploaded images in this section. The website will use its built-in default images.</div>
        ) : (
          <div className="site-images-grid">
            {visibleImages.map((image) => (
              <article className="site-image-card" key={image.id}>
                <img src={image.image_url} alt={image.alt_text} />
                <div><b>{image.alt_text || sectionLabels[section]}</b><span>Display order {image.sort_order}</span></div>
                <button type="button" className="delete-action" aria-label={`Remove ${image.alt_text || 'site image'}`} onClick={() => void removeImage(image)}><Trash2 size={15} strokeWidth={1.5} /></button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function getEntryField(entry: CollectionEntry, name: string) {
  if (name === 'id') return entry.id
  if (name === 'title' && 'title' in entry) return entry.title
  if (name === 'name' && 'name' in entry) return entry.name
  if (name === 'logo_url' && 'logo_url' in entry) return entry.logo_url
  if (name === 'description' && 'description' in entry) return entry.description
  if (name === 'active' && 'active' in entry) return entry.active
  if (name === 'sort_order' && 'sort_order' in entry) return entry.sort_order
  if (name === 'icon' && 'icon' in entry) return entry.icon
  if (name === 'code' && 'code' in entry) return entry.code
  if (name === 'slug' && 'slug' in entry) return entry.slug
  if (name === 'excerpt' && 'excerpt' in entry) return entry.excerpt
  if (name === 'body' && 'body' in entry) return entry.body
  if (name === 'image_url' && 'image_url' in entry) return entry.image_url
  if (name === 'status' && 'status' in entry) return entry.status
  return undefined
}

export default AdminApp
