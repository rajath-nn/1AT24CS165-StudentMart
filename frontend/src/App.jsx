import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function App() {
  const [mode, setMode] = useState('register')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem('authToken')))

  useEffect(() => {
    if (!token) return

    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Your session has ended.')
        setUser(data.user)
      })
      .catch((error) => {
        localStorage.removeItem('authToken')
        setToken(null)
        setMessage(error.message)
      })
      .finally(() => setCheckingSession(false))
  }, [token])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setMessage('')
  }

  function validateForm() {
    const nextErrors = {}
    if (mode === 'register' && form.name.trim().length < 2) nextErrors.name = 'Enter your name (at least 2 characters).'
    if (!EMAIL_PATTERN.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (mode === 'register') {
      if (form.password.length < 8 || form.password.length > 128) nextErrors.password = 'Use 8 to 128 characters.'
      else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
        nextErrors.password = 'Include an uppercase letter, a lowercase letter, and a number.'
      }
    } else if (!form.password) {
      nextErrors.password = 'Enter your password.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submitForm(event) {
    event.preventDefault()
    setMessage('')
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrors(data.errors || {})
        throw new Error(data.message || 'Unable to continue. Please try again.')
      }

      localStorage.setItem('authToken', data.token)
      setToken(data.token)
      setUser(data.user)
      setForm({ name: '', email: '', password: '' })
      setErrors({})
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setLoading(true)
    try {
      if (token) {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Sign out failed. Please try again.')
      }
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
      setMode('login')
      setMessage('You have been signed out.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <main className="page-shell"><p className="loading-state">Checking your session…</p></main>
  }

  if (user) {
    return (
      <main className="page-shell">
        <section className="welcome-card" aria-labelledby="welcome-heading">
          <div className="brand-mark" aria-hidden="true">A</div>
          <p className="eyebrow">ACCOUNT</p>
          <h1 id="welcome-heading">You’re signed in.</h1>
          <p className="welcome-copy">Welcome back, {user.name}. Your account is ready.</p>
          <div className="account-detail"><span>Email address</span><strong>{user.email}</strong></div>
          <button className="button button-secondary" type="button" onClick={logout} disabled={loading}>
            {loading ? 'Signing out…' : 'Sign out'}
          </button>
        </section>
        <p className="page-footnote">Atria Institute of Technology <span>•</span> User Authentication</p>
      </main>
    )
  }

  const isRegister = mode === 'register'

  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="brand-mark" aria-hidden="true">A</div>
        <p className="eyebrow">ATRIA INSTITUTE OF TECHNOLOGY</p>
        <h1 id="auth-heading">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="subtitle">{isRegister ? 'Register to get started with your account.' : 'Sign in to continue to your account.'}</p>

        <div className="mode-switch" role="tablist" aria-label="Authentication options">
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => { setMode('register'); setErrors({}); setMessage('') }}>Create account</button>
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => { setMode('login'); setErrors({}); setMessage('') }}>Sign in</button>
        </div>

        {message && <p className="form-message" role="alert">{message}</p>}

        <form onSubmit={submitForm} noValidate>
          {isRegister && (
            <label className="field">
              <span>Full name</span>
              <input name="name" type="text" autoComplete="name" placeholder="Your name" value={form.name} onChange={updateField} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
              {errors.name && <small id="name-error" className="field-error">{errors.name}</small>}
            </label>
          )}
          <label className="field">
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={updateField} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : isRegister ? 'password-hint' : undefined} />
            {errors.password && <small id="password-error" className="field-error">{errors.password}</small>}
            {isRegister && !errors.password && <small id="password-hint" className="field-hint">8+ characters with uppercase, lowercase, and a number.</small>}
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="switch-prompt">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setErrors({}); setMessage('') }}>{isRegister ? 'Sign in' : 'Create an account'}</button>
        </p>
      </section>
      <p className="page-footnote">Atria Institute of Technology <span>•</span> User Authentication</p>
    </main>
  )
}

export default App
