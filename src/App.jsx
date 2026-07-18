import { useEffect, useMemo, useState } from 'react'
import emailjs from '@emailjs/browser'

const EMAILJS_CONFIG = {
  serviceId: 'service_y71c0v9',
  templateId: 'template_8981a74',
  publicKey: '01sn-v83Tbcx_hubo',
  targetEmail: 'issadgroup@hotmail.com',
}

const THEME_STORAGE_KEY = 'insurance-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [debug, setDebug] = useState('')

  const year = useMemo(() => new Date().getFullYear(), [])

  useEffect(() => {
    document.title = 'Issad Farmers Insurance Agency'
  }, [])

  useEffect(() => {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.body.style.overflow = privacyOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [privacyOpen])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const scrollToSection = (event, id) => {
    event.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const email = String(formData.get('insEmail') || '').trim()
    const phone = String(formData.get('insPhone') || '').trim()
    const details = String(formData.get('insMessage') || '').trim()
    const smsOptIn = formData.get('insSmsOptIn') === 'on'

    setStatus({ type: '', message: '' })
    setDebug('')

    if (!email || !details) {
      setStatus({ type: 'error', message: 'Please provide your email and a short description.' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setSubmitting(true)

    const submittedAt = new Date().toLocaleString()
    const contactName = phone ? `Website Visitor (${phone})` : 'Website Visitor'

    const summaryLines = [
      `Email: ${email}`,
      `Phone: ${phone || '(empty)'}`,
      `Details: ${details}`,
      `SMS Opt-In: ${smsOptIn ? 'Yes' : 'No'}`,
    ]

    const templateParams = {
      from_name: 'Issad Farmers Insurance Agency (Website)',
      from_email: EMAILJS_CONFIG.targetEmail,
      sender_email: email,
      reply_to: email,
      name: contactName,
      email,
      title: 'New Insurance Request',
      time: submittedAt,
      phone,
      message: summaryLines.join('\n'),
      sms_opt_in: smsOptIn ? 'Yes' : 'No',
      sms_disclaimer: smsOptIn ? 'User checked SMS consent box.' : 'No SMS opt-in',
      to_email: EMAILJS_CONFIG.targetEmail,
      to: EMAILJS_CONFIG.targetEmail,
      recipient_email: EMAILJS_CONFIG.targetEmail,
      details,
      subject: 'New Insurance Request from Website',
      field_summary: summaryLines.join('\n'),
      submitted_at: submittedAt,
      insEmail: email,
      insPhone: phone,
      insMessage: details,
    }

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
      )

      const statusCode = typeof response?.status !== 'undefined' ? response.status : 'n/a'
      const responseText = response?.text || 'OK'
      const requestId = response?.id || response?.requestId || response?.request_id || 'n/a'

      setStatus({
        type: 'success',
        message: 'Thanks - your request has been sent. We will contact you soon.',
      })
      setDebug(`Delivery debug: status=${statusCode}, text=${responseText}, requestId=${requestId}, time=${new Date().toLocaleString()}`)
      form.reset()
    } catch (error) {
      const statusCode = typeof error?.status !== 'undefined' ? error.status : 'n/a'
      const responseText = error?.text || error?.message || 'Unknown error'
      const detailsValue = error?.details ? String(error.details) : 'n/a'

      setStatus({
        type: 'error',
        message: `Sorry, something went wrong. EmailJS said: ${responseText}`,
      })
      setDebug(`Delivery debug: status=${statusCode}, text=${responseText}, details=${detailsValue}, time=${new Date().toLocaleString()}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <div className="logo-wrap">
              <img alt="Issad logo" src="/assets/images/logo-insurance.jpg" />
            </div>
          </div>
          <nav className="contact-top" aria-label="Top actions">
            <a className="phone" href="tel:6303358885">630-335-8885</a>
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'dark'}
              onClick={toggleTheme}
            >
              <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? 'D' : 'L'}</span>
              <span className="theme-toggle-text">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-card">
              <h2 className="multi-line">
                <span className="hl-line">Welcome to</span>
                <span className="hl-line hl-main">Issad Farmers Insurance Agency</span>
              </h2>
              <p className="lead">
                At Issad Farmers Insurance Agency, we believe insurance should not be complicated.
                We partner with Farmers Insurance to provide reliable coverage, competitive rates,
                and personalized service.
              </p>
              <div className="ctas">
                <a className="btn primary" href="https://agents.farmers.com/il/bolingbrook/ahmed-issad/" target="_blank" rel="noopener noreferrer">Start Your Quote Online</a>
                <a className="btn" href="tel:6303358885">Call 630-335-8885</a>
                <a className="btn" href="#schedule" onClick={(e) => scrollToSection(e, 'schedule')}>Schedule Appointment</a>
              </div>
            </div>
          </div>
        </section>

        <section className="quote">
          <div className="container">
            <h3>Get Your Free Insurance Quote</h3>
            <p>Choose the option that works best for you to get a fast, customized quote.</p>
            <ul className="options">
              <li>Online: <a href="https://agents.farmers.com/il/bolingbrook/ahmed-issad/" target="_blank" rel="noopener noreferrer">Click Here to Start Your Quote Online</a></li>
              <li>By Phone: Call us directly at <a href="tel:6303358885">630-335-8885</a></li>
              <li>By Appointment: <a href="#schedule" onClick={(e) => scrollToSection(e, 'schedule')}>Click Here to Schedule an Appointment</a></li>
            </ul>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="container">
            <h3>Contact Us</h3>
            <p>Have questions about an existing policy or need expert guidance? Connect with our team directly.</p>
            <ul className="contact-list">
              <li><span className="contact-label">Email:</span> <a href="mailto:aissad@farmersagent.com">aissad@farmersagent.com</a></li>
              <li><span className="contact-label">Office:</span> 494 W Boughton Rd, Suite 4B, Bolingbrook, IL 60540</li>
              <li><span className="contact-label">Phone:</span> 630-335-8885</li>
              <li><span className="contact-label">Fax:</span> 331-281-1411</li>
            </ul>
          </div>
        </section>

        <section className="licensed">
          <div className="container">
            <h3>Licensed States</h3>
            <p>Issad Farmers Insurance Agency proudly protects families, properties, and businesses across the following states:</p>
            <p className="states">Illinois (IL) | Kansas (KS) | California (CA) | Texas (TX) | Ohio (OH) | Pennsylvania (PA) | New York (NY) | New Jersey (NJ)</p>
          </div>
        </section>

        <section id="schedule" className="schedule">
          <div className="container">
            <h3>Schedule an Appointment</h3>
            <p>Use the button below to request a time to review your coverage options.</p>
            <a className="btn primary" href="mailto:aissad@farmersagent.com?subject=Appointment%20Request">Request Appointment by Email</a>
          </div>
        </section>

        <section id="insurance-form" className="contact-form-section">
          <div className="container">
            <h3>Quick Request</h3>
            <p>Send us your phone, email and a short description and we will get back to you.</p>
            <form id="insuranceForm" className="simple-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="insEmail">Email *</label>
                <input type="email" id="insEmail" name="insEmail" required />
              </div>

              <div className="form-group">
                <label htmlFor="insPhone">Phone</label>
                <input type="tel" id="insPhone" name="insPhone" />
              </div>

              <div className="form-group opt-in">
                <label htmlFor="insSmsOptIn">
                  <input type="checkbox" id="insSmsOptIn" name="insSmsOptIn" />
                  By checking this box, I consent to receive SMS messages, which may include promotional material.
                </label>
                <p className="sms-disclaimer">
                  I understand that Message and data rates may apply and that I may reply STOP to opt-out of future messaging;
                  reply HELP for additional messaging help. Message frequency may vary depending on interaction between you and our agents.
                  For more information, please see our{' '}
                  <button type="button" className="footer-privacy link-button" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="insMessage">Details *</label>
                <textarea id="insMessage" name="insMessage" rows="4" required></textarea>
              </div>

              <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Sending...' : 'Send Request'}</button>
              <div id="insuranceFormMessage" className={`form-message ${status.type || ''}`} aria-live="polite">
                {status.type === 'success' && (
                  <span className="check-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" fill="none"></path>
                    </svg>
                  </span>
                )}
                <span>{status.message}</span>
              </div>
              <div id="insuranceFormDebug" className={`form-debug ${status.type === 'success' ? 'success' : status.type === 'error' ? 'error' : ''}`} aria-live="polite" aria-atomic="true">{debug}</div>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <section className="footer-ad" aria-label="Sister brand advertisement">
            <a className="footer-ad-logo-link" href="https://issadincometax.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit Issad Income Tax website">
              <img src="/assets/images/123.png" alt="Issad Income Tax logo" className="footer-ad-logo" />
            </a>
            <div className="footer-ad-inner">
              <p className="footer-ad-kicker">Also Need Tax Help?</p>
              <h3 className="footer-ad-title">Issad Income Tax &amp; Accounting</h3>
              <p className="footer-ad-copy">Get expert tax consultation, accurate filing, and year-round support for individuals, families, and small businesses.</p>
            </div>
            <a className="btn footer-ad-btn" href="https://issadincometax.com/" target="_blank" rel="noopener noreferrer">Book a Tax Consultation</a>
          </section>
          <div className="footer-bottom">
            <small>&copy; {year} Issad Farmers Insurance Agency - Partnered with Farmers Insurance</small>
            <div>
              <button type="button" className="footer-privacy link-button" aria-label="Open Privacy Policy" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>
            </div>
          </div>
        </div>
      </footer>

      <div className="modal-backdrop" id="privacyModal" aria-hidden={privacyOpen ? 'false' : 'true'} onMouseDown={(event) => event.target === event.currentTarget && setPrivacyOpen(false)}>
        <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="privacyTitle">
          <div className="modal-header">
            <h2 id="privacyTitle" className="modal-title">Privacy Policy</h2>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setPrivacyOpen(false)}>x</button>
          </div>
          <div className="modal-body">
            <p>Farmers Financial Solutions, LLC (FFS) does not accept trading instructions via voice mail, text messages, email, instant messaging, or fax. Please do not transmit orders or instructions regarding an FFS account by email.</p>
            <p>This communication contains confidential information. If you are not the intended recipient, any disclosure, copying, distribution, or use of its contents is prohibited.</p>
            <p>Securities offered through Farmers Financial Solutions, LLC. Member FINRA &amp; SIPC.</p>
            <h3>SMS and Text Messaging</h3>
            <p>By opting in to receive SMS messages via our contact form, you consent to receive automated and non-automated SMS/text messages from Issad Farmers Insurance Agency, which may include promotional material.</p>
            <p><strong>SMS Carve-Out:</strong> No opt-in information will be shared with third parties or affiliates for marketing or promotional purposes.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
