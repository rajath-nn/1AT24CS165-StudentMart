import { useEffect, useState } from 'react'
import Login from './Components/Login.jsx'
import Register from './Components/Register.jsx'
import Dashboard from './Components/Dashboard.jsx'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function App() {
  const [mode, setMode] = useState('register')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: '', gender: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem('authToken')))

  useEffect(() => {
    if (!token) return
    fetch(API_URL + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
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
    const next = {}
    if (mode === 'register' && form.name.trim().length < 2) next.name = 'Enter your name (at least 2 characters).'
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (mode === 'register') {
      if (form.password.length < 8 || form.password.length > 128) next.password = 'Use 8 to 128 characters.'
      else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) next.password = 'Include uppercase, lowercase, and a number.'
      if (form.phone.trim()) {
        const digits = form.phone.replace(/\D/g, '')
        if (form.phone.trim().length > 32 || !/^\+?[0-9\s().-]+$/.test(form.phone.trim()) || digits.length < 7 || digits.length > 15) {
          next.phone = 'Enter a valid phone number (7 to 15 digits).'
        }
      }
      if (form.age && (!/^\d+$/.test(form.age) || Number(form.age) < 1 || Number(form.age) > 120)) {
        next.age = 'Enter an age between 1 and 120.'
      }
    } else if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submitForm(event) {
    event.preventDefault()
    setMessage('')
    if (!validateForm()) return
    setLoading(true)
    try {
      const response = await fetch(API_URL + '/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          age: form.age,
          gender: form.gender,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setErrors(data.errors || {}); throw new Error(data.message || 'Unable to continue.') }
      localStorage.setItem('authToken', data.token)
      setToken(data.token)
      setUser(data.user)
      setForm({ name: '', email: '', password: '', phone: '', age: '', gender: '' })
      setErrors({})
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server.')
    } finally { setLoading(false) }
  }

  async function logout() {
    setLoading(true)
    try {
      if (token) {
        const response = await fetch(API_URL + '/api/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
        if (!response.ok) throw new Error('Sign out failed.')
      }
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
      setMode('login')
      setMessage('You have been signed out.')
    } catch (error) {
      setMessage(error.message)
    } finally { setLoading(false) }
  }

  function updateToken(nextToken) {
    localStorage.setItem('authToken', nextToken)
    setToken(nextToken)
  }

  if (checkingSession) return <main className="page-shell"><p>Checking your session...</p></main>
  if (user && token) return <Dashboard user={user} token={token} onUserChange={setUser} onTokenChange={updateToken} onLogout={logout} />

  const isRegister = mode === 'register'
  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="auth-heading">
        <h1 id="auth-heading">{isRegister ? 'Register' : 'Login'}</h1>
        <div className="mode-switch" role="tablist" aria-label="Authentication options">
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => { setMode('register'); setErrors({}); setMessage('') }}>Register</button>
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => { setMode('login'); setErrors({}); setMessage('') }}>Login</button>
        </div>
        {message && <p className="form-message" role="alert">{message}</p>}
        {isRegister ? <Register form={form} errors={errors} loading={loading} onChange={updateField} onSubmit={submitForm} /> : <Login form={form} errors={errors} loading={loading} onChange={updateField} onSubmit={submitForm} />}
        <p className="switch-prompt">{isRegister ? 'Already registered?' : 'Need an account?'}{' '}
          <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setErrors({}); setMessage('') }}>{isRegister ? 'Login' : 'Register'}</button>
        </p>
      </section>
    </main>
  )
}

export default App
