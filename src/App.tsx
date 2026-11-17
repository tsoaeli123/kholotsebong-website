import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  GraduationCap,
  Handshake,
  Laptop,
  Menu,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import {
  supabase,
  type Article,
  type ClientRecord,
  type PageImage,
  type Program,
  type Service,
  type SiteSettings,
} from './lib/supabase'
import './App.css'

const serviceDefaults: Service[] = [
  {
    id: 'corporate-training',
    title: 'Corporate Training',
    description:
      'Business development and professional learning programmes designed to help individuals and teams build useful capabilities.',
    image_url: '/images/service-training.webp',
    icon: 'GraduationCap',
    active: true,
    sort_order: 1,
  },
  {
    id: 'human-resources',
    title: 'Human Resources',
    description:
      'Human resources services and people-focused organisational support. Contact our team to discuss the scope of support available for your organisation.',
    image_url: '/images/service-hr.webp',
    icon: 'UsersRound',
    active: true,
    sort_order: 2,
  },
  {
    id: 'ict-services',
    title: 'ICT Services',
    description:
      'Technology services and practical ICT support to help businesses and organisations work more effectively.',
    image_url: '/images/service-tech.webp',
    icon: 'Cpu',
    active: true,
    sort_order: 3,
  },
  {
    id: 'computer-sales',
    title: 'Computer Sales',
    description:
      'Retail sales of computers and related technology products. Ask us about available products and specifications.',
    image_url: '/images/service-sales.webp',
    icon: 'Laptop',
    active: true,
    sort_order: 4,
  },
]

const programDefaults: Program[] = [
  {
    id: 'gybi',
    code: 'GYBI',
    title: 'Generate Your Business Idea',
    description: 'For people exploring business opportunities and shaping a viable idea.',
    active: true,
    sort_order: 1,
  },
  {
    id: 'syb',
    code: 'SYB',
    title: 'Start Your Business',
    description:
      'For aspiring entrepreneurs preparing to turn a business idea into an operating venture.',
    active: true,
    sort_order: 2,
  },
  {
    id: 'iyb',
    code: 'IYB',
    title: 'Improve Your Business',
    description:
      'For existing business owners seeking to strengthen business practices and operations.',
    active: true,
    sort_order: 3,
  },
  {
    id: 'eyb',
    code: 'EYB',
    title: 'Expand Your Business',
    description: 'For established businesses considering growth and expansion.',
    active: true,
    sort_order: 4,
  },
]

const heroSlides = [
  {
    image: '/images/hero-1.webp',
    width: 1200,
    height: 675,
    alt: 'Professionals discussing a business development strategy',
    label: 'People & possibility',
  },
  {
    image: '/images/hero-2.webp',
    width: 1200,
    height: 675,
    alt: 'Colleagues reviewing a digital marketing strategy together',
    label: 'Skills for what is next',
  },
  {
    image: '/images/hero-3.webp',
    width: 1200,
    height: 800,
    alt: 'A manager reviewing strategy with her team',
    label: 'Ideas into action',
  },
]

const serviceImages: Record<string, string> = {
  'Corporate Training': '/images/service-training.webp',
  'Human Resources': '/images/service-hr.webp',
  'ICT Services': '/images/service-tech.webp',
  'Computer Sales': '/images/service-sales.webp',
}

const clientDefaults: ClientRecord[] = [
  'Ministry of Communications',
  'ASEC Lesotho',
  'Leaps and Bounces',
  'Agno',
  'Tebellong Hospital',
  'Black Hair Studio',
  'Roman Catholic Church Lesotho',
].map((name, index) => ({
  id: `client-${index + 1}`,
  name,
  logo_url: '',
  sort_order: index + 1,
}))

const iconByName: Record<string, LucideIcon> = {
  GraduationCap,
  UsersRound,
  Cpu,
  Laptop,
}

const emptySettings: SiteSettings = {
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
const currentYear = new Date().getFullYear()

type SitePage = 'home' | 'about' | 'services' | 'training' | 'contact'

const pageCopy: Record<Exclude<SitePage, 'home'>, { eyebrow: string; title: string; emphasis: string; description: string }> = {
  about: {
    eyebrow: 'OUR COMPANY',
    title: 'People. Possibility.',
    emphasis: 'Progress.',
    description: 'Meet Kholo Tsebong Consulting and discover the services behind our approach to business growth.',
  },
  services: {
    eyebrow: 'WHAT WE DO',
    title: 'Solutions for',
    emphasis: 'better business.',
    description: 'Four complementary service areas. One place to start the conversation.',
  },
  training: {
    eyebrow: 'BUSINESS TRAINING',
    title: 'From first idea',
    emphasis: 'to next level.',
    description: 'Explore four business development programmes for different stages of the entrepreneurial journey.',
  },
  contact: {
    eyebrow: 'START A CONVERSATION',
    title: 'Let’s talk about',
    emphasis: 'what’s next.',
    description: 'Looking for training, HR support, ICT services or computers? Send us an enquiry.',
  },
}

function App({ page }: { page: SitePage }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [services, setServices] = useState(serviceDefaults)
  const [programs, setPrograms] = useState(programDefaults)
  const [clients, setClients] = useState(clientDefaults)
  const [siteImages, setSiteImages] = useState<PageImage[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [settings, setSettings] = useState(emptySettings)
  const [contentNotice, setContentNotice] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactError, setContactError] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const reduceMotion = useReducedMotion()
  const isHome = page === 'home'
  const heroImages = siteImages.filter((image) => image.section === 'hero')
  const slides = heroImages.length > 0
    ? heroImages.map((image) => ({
      image: image.image_url,
      width: 1200,
      height: 675,
      alt: image.alt_text || 'Kholo Tsebong Consulting',
      label: 'Kholo Tsebong Consulting',
    }))
    : heroSlides
  const displayedSlide = activeSlide % slides.length
  const servicePageImages = siteImages.filter((image) => image.section === 'services')
  const aboutPageImage = siteImages.find((image) => image.section === 'about')

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      6500,
    )
    return () => window.clearInterval(timer)
  }, [reduceMotion, slides.length])

  useEffect(() => {
    let active = true

    async function loadContent() {
      const client = supabase
      if (!client) return
      const [serviceResult, programResult, articleResult, settingsResult, clientResult, imageResult] = await Promise.all([
        client.from('services').select('*').eq('active', true).order('sort_order'),
        client.from('programs').select('*').eq('active', true).order('sort_order'),
        client.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        client.from('site_settings').select('*').eq('id', 'primary').maybeSingle(),
        client.from('clients').select('*').order('sort_order'),
        client.from('page_images').select('*').order('sort_order'),
      ])

      const errors = [
        serviceResult.error,
        programResult.error,
        articleResult.error,
        settingsResult.error,
        clientResult.error,
        imageResult.error,
      ].filter(Boolean)

      if (!active) return
      if (errors.length > 0) {
        console.error('Unable to load public site content:', errors)
        setContentNotice('Some content could not be refreshed. Showing the published site copy.')
        return
      }

      if (serviceResult.data) setServices(serviceResult.data)
      if (programResult.data) setPrograms(programResult.data)
      if (articleResult.data) setArticles(articleResult.data)
      if (settingsResult.data) setSettings(settingsResult.data)
      if (clientResult.data) setClients(clientResult.data)
      if (imageResult.data) setSiteImages(imageResult.data)
    }

    void loadContent()
    return () => {
      active = false
    }
  }, [])

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setContactMessage('')
    setContactError(false)
    const formElement = event.currentTarget

    if (!supabase) {
      setContactError(true)
      setContactMessage(
        'The enquiry form is not connected yet. Please email us directly at ',
      )
      return
    }

    const formData = new FormData(formElement)
    try {
      const { error } = await supabase.from('enquiries').insert({
        name: String(formData.get('name') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        service: String(formData.get('service') ?? ''),
        message: String(formData.get('message') ?? '').trim(),
      })
      if (error) throw error
    } catch (error) {
      console.error('Unable to submit enquiry:', error)
      setContactError(true)
      setContactMessage('We could not send your enquiry. Please email us directly at ')
      return
    }

    formElement.reset()
    setContactMessage('Thank you. Your enquiry has been sent to our team.')
  }

  async function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterMessage('')

    if (!supabase) {
      setNewsletterMessage('Newsletter sign-up is not available yet. Please contact our team.')
      return
    }

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        email: String(formData.get('newsletterEmail') ?? '').trim(),
      })
      if (error) throw error
    } catch (error) {
      console.error('Unable to save newsletter subscription:', error)
      setNewsletterMessage('We could not save your sign-up. Please try again later.')
      return
    }

    formElement.reset()
    setNewsletterMessage('You are on the list. Thank you for subscribing.')
  }

  const changeSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length)
  }
  const phoneLink = settings.phone.replace(/[^\d+]/g, '')

  return (
    <LazyMotion features={domAnimation}>
      <div className="site-shell">
        {contentNotice && (
          <div className="content-notice" role="status">
            <span>{contentNotice}</span>
            <button type="button" aria-label="Dismiss notice" onClick={() => setContentNotice('')}>
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        )}
        <div className="utility-bar">
          <div className="site-container utility-inner">
            <a href={`tel:${phoneLink}`}>{settings.phone}</a>
            <span className="utility-dot" />
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <span className="utility-hours">MON–FRI 9AM–6PM <span>·</span> SAT 10AM–2PM</span>
          </div>
        </div>
        <header className="site-header">
          <div className="site-container nav-inner">
            <Link className="brand" to="/" aria-label="Kholo Tsebong Consulting home">
              <span className="brand-lockup">
                <img src="/logo.png" alt="Kholo Tsebong Logo" className="h-10 w-auto" />
                <span className="brand-wordmark">Kholo Tsebong Consulting</span>
              </span>
            </Link>
            <button
              className="mobile-menu-toggle"
              type="button"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={21} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}
            </button>
            <nav className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Main navigation">
              <Link className={page === 'home' ? 'nav-active' : ''} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link className={page === 'about' ? 'nav-active' : ''} to="/about" onClick={() => setMenuOpen(false)}>About</Link>
              <Link className={page === 'services' ? 'nav-active' : ''} to="/services" onClick={() => setMenuOpen(false)}>Our services</Link>
              <Link className={page === 'training' ? 'nav-active' : ''} to="/training" onClick={() => setMenuOpen(false)}>Training</Link>
              <Link className={page === 'contact' ? 'nav-active' : ''} to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link className="nav-cta" to="/contact" onClick={() => setMenuOpen(false)}>
                Let’s talk <ArrowUpRight size={15} strokeWidth={1.5} />
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {isHome ? (
            <section className="hero-section" id="home" aria-label="Welcome to Kholo Tsebong Consulting">
            <div className="hero-slides">
              <m.div
                key={activeSlide}
                className="hero-slide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 1.1 }}
              >
                <img
                  className="object-cover"
                  width={slides[displayedSlide].width}
                  height={slides[displayedSlide].height}
                  loading={displayedSlide === 0 ? 'eager' : 'lazy'}
                  src={slides[displayedSlide].image}
                  alt={slides[displayedSlide].alt}
                />
              </m.div>
            </div>
            <div className="hero-shade" />
            <div className="site-container hero-content">
              <m.div
                className="hero-copy"
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <span className="eyebrow eyebrow-light"><span className="eyebrow-dash" /> KHOLO TSEBONG CONSULTING · LESOTHO</span>
                <h1>{settings.hero_headline}</h1>
                <p>{settings.hero_subheadline}</p>
                <div className="hero-actions">
                  <Link className="button button-accent" to="/services">Explore our solutions <ArrowUpRight size={16} strokeWidth={1.5} /></Link>
                  <Link className="button button-outline" to="/contact">Request a consultation <ArrowRight size={16} strokeWidth={1.5} /></Link>
                </div>
              </m.div>
            </div>
            <div className="hero-bottom">
              <a href="#introduction" className="scroll-cue"><ArrowDown size={15} strokeWidth={1.5} /> Discover Kholo Tsebong</a>
              <div className="hero-controls" aria-label="Hero slideshow controls">
                <span className="hero-slide-label">{slides[displayedSlide].label}</span>
                <span className="hero-count">0{displayedSlide + 1}<i> / </i>0{slides.length}</span>
                <button type="button" aria-label="Previous slide" onClick={() => changeSlide(-1)}><ChevronLeft size={17} strokeWidth={1.5} /></button>
                <button type="button" aria-label="Next slide" onClick={() => changeSlide(1)}><ChevronRight size={17} strokeWidth={1.5} /></button>
              </div>
            </div>
            </section>
          ) : (
            <section className="inner-page-hero">
              <div className="site-container">
                <span className="eyebrow"><span className="eyebrow-dash" /> {pageCopy[page].eyebrow}</span>
                <h1>{pageCopy[page].title}<br /><em>{pageCopy[page].emphasis}</em></h1>
                <p>{pageCopy[page].description}</p>
              </div>
            </section>
          )}

          {isHome && <section className="intro-section section-space" id="introduction">
            <div className="site-container intro-layout">
              <div className="intro-heading">
                <span className="eyebrow"><span className="eyebrow-dash" /> WHO WE HELP</span>
                <h2>Solutions for every<br />stage of <em>growth.</em></h2>
              </div>
              <div className="intro-aside">
                <p>From your first business idea to your next organisational milestone, we help turn ambitions into practical progress.</p>
                <Link className="text-link" to="/services">See how we can help <ArrowUpRight size={15} strokeWidth={1.5} /></Link>
              </div>
            </div>
            <div className="site-container audience-grid">
              <Link className="audience-card" to="/training">
                <img className="object-cover" loading="lazy" src="/images/service-training.webp" alt="Entrepreneurs developing business skills" />
                <span className="image-wash" />
                <div className="audience-content"><span>01 / ENTREPRENEURS</span><h3>Starting a business?</h3><p>Explore practical business development training.</p><b>Explore training <ArrowUpRight size={14} strokeWidth={1.5} /></b></div>
              </Link>
              <Link className="audience-card" to="/services">
                <img className="object-cover" loading="lazy" src="/images/about-team.webp" alt="Professionals working together as a team" />
                <span className="image-wash" />
                <div className="audience-content"><span>02 / ORGANISATIONS</span><h3>Growing your team?</h3><p>Discover human resources and corporate learning.</p><b>Our services <ArrowUpRight size={14} strokeWidth={1.5} /></b></div>
              </Link>
              <Link className="audience-card" to="/services">
                <img className="object-cover" loading="lazy" src="/images/service-tech.webp" alt="Technology support for modern businesses" />
                <span className="image-wash" />
                <div className="audience-content"><span>03 / BUSINESSES</span><h3>Need technology?</h3><p>ICT support and computer sales for modern work.</p><b>ICT solutions <ArrowUpRight size={14} strokeWidth={1.5} /></b></div>
              </Link>
            </div>
          </section>}

          {(isHome || page === 'services') && <section className="services-section section-space" id="services">
            <div className="site-container">
              <div className="section-heading-row">
                <div>
                  <span className="eyebrow"><span className="eyebrow-dash" /> WHAT WE DO</span>
                  <h2>Expertise that<br /><em>moves you forward.</em></h2>
                </div>
                <p>Four complementary service areas. One place to start the conversation.</p>
              </div>
              <div className="services-grid">
                {services.slice(0, 4).map((service, index) => {
                  const Icon = iconByName[service.icon] ?? BriefcaseBusiness
                  return (
                    <Link className="service-card" to="/contact" key={service.id}>
                      <div className="service-image-wrap">
                        <img className="object-cover" loading="lazy" src={servicePageImages[index]?.image_url ?? serviceImages[service.title] ?? service.image_url} alt={`${service.title} services`} />
                        <span className="service-icon"><Icon size={21} strokeWidth={1.5} /></span>
                        <span className="service-index">0{index + 1}</span>
                      </div>
                      <div className="service-card-copy">
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                        <span className="service-link">Explore service <ArrowUpRight size={15} strokeWidth={1.5} /></span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>}

          {(isHome || page === 'services') && <section className="clients-section section-space" id="clients">
            <div className="site-container">
              <div className="clients-heading">
                <div>
                  <span className="eyebrow"><span className="eyebrow-dash" /> TRUSTED PARTNERSHIPS</span>
                  <h2>Clients we <em>serve.</em></h2>
                </div>
                <p>We work alongside organizations and businesses committed to moving forward.</p>
              </div>
              <div className="clients-grid">
                {clients.map((client) => (
                  <div className="client-card" key={client.id}>
                    {client.logo_url
                      ? <img src={client.logo_url} alt={`${client.name} logo`} loading="lazy" />
                      : <span>{client.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>}

          {(isHome || page === 'about') && <section className="about-section section-space" id="about">
            <div className="about-image">
              <img className="object-cover" loading="lazy" src={aboutPageImage?.image_url ?? '/images/about-team.webp'} alt={aboutPageImage?.alt_text || 'The Kholo Tsebong team working together'} />
              <span className="image-caption">A practical approach to progress</span>
            </div>
            <div className="about-copy">
              <m.div
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65 }}
              >
                <span className="eyebrow eyebrow-light"><span className="eyebrow-dash" /> ABOUT KHOLO TSEBONG</span>
                <h2>Practical support.<br /><em>Real conversations.</em></h2>
                <p>{settings.about_text}</p>
                <Link className="button button-outline about-button" to="/contact">Talk with our team <ArrowUpRight size={16} strokeWidth={1.5} /></Link>
              </m.div>
              <div className="values-grid">
                <article className="value-card"><Handshake size={20} strokeWidth={1.5} /><span>01</span><h3>Understand</h3><p>Start with your goals, challenges and needs.</p></article>
                <article className="value-card"><BriefcaseBusiness size={20} strokeWidth={1.5} /><span>02</span><h3>Equip</h3><p>Connect with relevant training, HR or technology.</p></article>
                <article className="value-card"><ArrowUpRight size={20} strokeWidth={1.5} /><span>03</span><h3>Grow</h3><p>Support progress with practical solutions.</p></article>
              </div>
            </div>
          </section>}

          {(isHome || page === 'training') && <section className="programs-section section-space" id="programs">
            <div className="site-container">
              <div className="programs-heading">
                <div><span className="eyebrow eyebrow-light"><span className="eyebrow-dash" /> BUSINESS DEVELOPMENT</span><h2>Training for your<br /><em>next big step.</em></h2></div>
                <p>Explore the stages of the Generate Your Business Idea, Start Your Business, Improve Your Business and Expand Your Business programmes.</p>
              </div>
              <div className="program-grid">
                {programs.slice(0, 4).map((program, index) => (
                  <m.div
                    className="program-card"
                    key={program.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link className="program-hit-area" to="/contact" aria-label={`Enquire about ${program.code}`} />
                    <span className="program-number">0{index + 1}</span>
                    <span className="program-code">{program.code}</span>
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                    <span className="program-arrow"><ArrowUpRight size={18} strokeWidth={1.5} /></span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>}

          {isHome && <section className="testimonial-section section-space">
            <div className="site-container testimonial-inner">
              <div className="testimonial-kicker"><span className="eyebrow"><span className="eyebrow-dash" /> CLIENT EXPERIENCE</span><span className="testimonial-count">01 <i>—</i> 01</span></div>
              <div className="testimonial-content">
                <span className="quote-mark">“</span>
                <blockquote>Kholo Tsebong provided excellent service. Our website is world class, our readership tripled in a week and continues exponential growth.</blockquote>
                <div className="quote-attribution"><span className="quote-rule" /><div><b>Ministry of Communications</b><span>Client testimonial</span></div></div>
              </div>
              <div className="testimonial-side-note">A relationship built<br />on meaningful progress.</div>
            </div>
          </section>}

          {isHome && articles.length > 0 && (
            <section className="insights-section section-space" id="insights">
              <div className="site-container">
                <div className="section-heading-row">
                  <div><span className="eyebrow"><span className="eyebrow-dash" /> INSIGHTS</span><h2>Ideas for your<br /><em>next chapter.</em></h2></div>
                  <p>Perspectives and practical ideas from Kholo Tsebong Consulting.</p>
                </div>
                <div className="insights-grid">
                  {articles.slice(0, 3).map((article) => (
                    <article className="insight-card" key={article.id}>
                      {article.image_url && <img className="object-cover" loading="lazy" src={article.image_url} alt={article.title} />}
                      <div><span>{article.created_at.slice(0, 10)}</span><h3>{article.title}</h3><p>{article.excerpt}</p><details className="insight-body"><summary>Continue reading</summary><div>{article.body.split(/\n{2,}/).map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}</div></details></div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {(isHome || page === 'contact') && <section className="contact-section section-space" id="contact">
            <div className="site-container contact-layout">
              <div className="contact-copy">
                <span className="eyebrow"><span className="eyebrow-dash" /> START A CONVERSATION</span>
                <h2>Ready to make<br /><em>your next move?</em></h2>
                <p>Tell us what you are working towards. Let’s explore how Kholo Tsebong can support you.</p>
                <div className="contact-details">
                  <span>{settings.address}</span>
                  <a href={`tel:${phoneLink}`}>{settings.phone}</a>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  <a href="mailto:support@kholotsebong.co.ls">support@kholotsebong.co.ls</a>
                </div>
              </div>
              <form className="contact-form" onSubmit={submitEnquiry}>
                <label>Your name<input name="name" autoComplete="name" required placeholder="Full name" /></label>
                <label>Your email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
                <label>What can we help with?
                  <select name="service" defaultValue="Corporate Training">
                    {services.map((service) => <option key={service.id}>{service.title}</option>)}
                    <option>General Enquiry</option>
                  </select>
                </label>
                <label>Your message<textarea name="message" rows={4} required placeholder="Tell us about your needs" /></label>
                <button className="button button-dark" type="submit">Send an enquiry <ArrowUpRight size={16} strokeWidth={1.5} /></button>
                {contactMessage && (
                  <p className={contactError ? 'form-feedback form-error' : 'form-feedback'} role="status">
                    {contactMessage}{contactError && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
                  </p>
                )}
              </form>
            </div>
          </section>}

          {isHome && <section className="newsletter-band">
            <img className="newsletter-image object-cover" loading="lazy" src="/images/footer-bg.webp" alt="Maseru, Lesotho" />
            <div className="site-container newsletter-content">
              <div><span className="eyebrow eyebrow-light"><span className="eyebrow-dash" /> NOTES ON GROWTH</span><h2>Good ideas move<br /><em>business forward.</em></h2><p>Occasional updates from Kholo Tsebong Consulting.</p></div>
              <form className="newsletter-form" onSubmit={submitNewsletter}>
                <label className="sr-only" htmlFor="newsletterEmail">Email address</label>
                <input id="newsletterEmail" name="newsletterEmail" type="email" required placeholder="Your email address" />
                <button type="submit" aria-label="Subscribe to newsletter"><ArrowRight size={19} strokeWidth={1.5} /></button>
                {newsletterMessage && <span className="newsletter-feedback" role="status">{newsletterMessage}</span>}
              </form>
            </div>
          </section>}
        </main>

        <footer className="site-footer">
          <div className="site-container">
            <div className="footer-grid">
              <div className="footer-about">
                <Link className="brand footer-brand" to="/">
                  <span className="brand-lockup">
                    <img src="/logo.png" alt="Kholo Tsebong Logo" className="h-10 w-auto" />
                    <span className="brand-wordmark">Kholo Tsebong Consulting</span>
                  </span>
                </Link>
                <p>{settings.footer_copy}</p>
              </div>
              <div className="footer-links"><h3>Explore</h3><Link to="/">Home</Link><Link to="/about">About</Link><Link to="/services">Our services</Link><Link to="/training">Training</Link><Link to="/contact">Contact</Link></div>
              <div className="footer-links"><h3>Our services</h3>{services.map((service) => <Link to="/services" key={service.id}>{service.title}</Link>)}</div>
              <div className="footer-links"><h3>Let’s connect</h3><span>{settings.address}</span><a href={`tel:${phoneLink}`}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a><a href="mailto:support@kholotsebong.co.ls">support@kholotsebong.co.ls</a></div>
            </div>
            <div className="footer-bottom"><span>© {currentYear} Kholo Tsebong Consulting. All rights reserved.</span><Link to="/admin">Admin access <Check size={13} strokeWidth={1.5} /></Link><span>Designed for a better tomorrow.</span></div>
          </div>
        </footer>
        <Link className="floating-contact" to="/contact" aria-label="Contact Kholo Tsebong"><ArrowUpRight size={19} strokeWidth={1.5} /></Link>
      </div>
    </LazyMotion>
  )
}

export default App
