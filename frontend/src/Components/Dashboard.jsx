import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function passwordProblem(password) {
  if (password.length < 8 || password.length > 128) return 'Password must be 8 to 128 characters.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return 'Use uppercase, lowercase, and a number.'
  return ''
}

function Dashboard({ user, token, onUserChange, onTokenChange, onLogout }) {
  const [section, setSection] = useState('profile')
  const [profile, setProfile] = useState(user)
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    age: user.age ?? '',
    gender: user.gender || '',
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch(API_URL + '/api/profile', { headers: { Authorization: 'Bearer ' + token } })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load profile.')
        if (mounted) {
          setProfile(data.user)
          setProfileForm({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            age: data.user.age ?? '',
            gender: data.user.gender || '',
          })
        }
      })
      .catch((error) => {
        if (mounted) { setMessage(error.message); setIsError(true) }
      })
    return () => { mounted = false }
  }, [token])

  function selectSection(value) {
    setSection(value)
    setMessage('')
    setErrors({})
  }

  async function saveProfile(event) {
    event.preventDefault()
    const next = {}
    if (profileForm.name.trim().length < 2 || profileForm.name.trim().length > 80) next.name = 'Name must be 2 to 80 characters.'
    if (!EMAIL_PATTERN.test(profileForm.email.trim())) next.email = 'Enter a valid email.'
    if (profileForm.phone.trim()) {
      const digits = profileForm.phone.replace(/\D/g, '')
      if (profileForm.phone.trim().length > 32 || !/^\+?[0-9\s().-]+$/.test(profileForm.phone.trim()) || digits.length < 7 || digits.length > 15) {
        next.phone = 'Enter a valid phone number (7 to 15 digits).'
      }
    }
    if (profileForm.age && (!/^\d+$/.test(String(profileForm.age)) || Number(profileForm.age) < 1 || Number(profileForm.age) > 120)) {
      next.age = 'Enter an age between 1 and 120.'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(API_URL + '/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          age: profileForm.age,
          gender: profileForm.gender,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setErrors(data.errors || {}); throw new Error(data.message || 'Could not update profile.') }
      setProfile(data.user)
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '',
        age: data.user.age ?? '',
        gender: data.user.gender || '',
      })
      onUserChange(data.user)
      setMessage('Profile updated.')
      setIsError(false)
      setSection('profile')
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server.')
      setIsError(true)
    } finally { setLoading(false) }
  }

  async function changePassword(event) {
    event.preventDefault()
    const next = {}
    if (!passwordForm.currentPassword) next.currentPassword = 'Enter your current password.'
    const validation = passwordProblem(passwordForm.newPassword)
    if (validation) next.newPassword = validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(API_URL + '/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not change password.')
      localStorage.setItem('authToken', data.token)
      onTokenChange(data.token)
      onUserChange(data.user)
      setProfile(data.user)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage(data.message)
      setIsError(false)
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server.')
      setIsError(true)
    } finally { setLoading(false) }
  }

  return (
    <main className="page-shell">
      <section className="profile-card" aria-labelledby="profile-title">
        <header className="dashboard-header">
          <h1 id="profile-title">My Profile</h1>
          <button className="button dashboard-signout" type="button" onClick={onLogout} disabled={loading}>Sign out</button>
        </header>
        <nav className="dashboard-nav" aria-label="Profile sections">
          <button type="button" className={section === 'profile' ? 'active' : ''} onClick={() => selectSection('profile')}>Profile</button>
          <button type="button" className={section === 'edit' ? 'active' : ''} onClick={() => selectSection('edit')}>Edit profile</button>
          <button type="button" className={section === 'password' ? 'active' : ''} onClick={() => selectSection('password')}>Password</button>
        </nav>
        {message && <p className={'notice ' + (isError ? 'error' : 'success')} role={isError ? 'alert' : 'status'}>{message}</p>}

        {section === 'profile' && (
          <div className="profile-details">
            <div><span>Name</span><strong>{profile.name}</strong></div>
            <div><span>Email</span><strong>{profile.email}</strong></div>
            <div><span>Phone number</span><strong>{profile.phone || 'Not provided'}</strong></div>
            <div><span>Age</span><strong>{profile.age ?? 'Not provided'}</strong></div>
            <div><span>Gender</span><strong>{profile.gender || 'Not provided'}</strong></div>
            <button className="button button-primary" type="button" onClick={() => selectSection('edit')}>Edit profile</button>
          </div>
        )}

        {section === 'edit' && (
          <form className="dashboard-form" onSubmit={saveProfile} noValidate>
            <label className="field"><span>Name</span>
              <input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
            <label className="field"><span>Email</span>
              <input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="field"><span>Phone number <span className="field-hint">(optional)</span></span>
              <input type="tel" autoComplete="tel" maxLength="32" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} aria-invalid={Boolean(errors.phone)} />
              {errors.phone && <small className="field-error">{errors.phone}</small>}
            </label>
            <label className="field"><span>Age <span className="field-hint">(optional)</span></span>
              <input type="number" min="1" max="120" value={profileForm.age} onChange={(event) => setProfileForm({ ...profileForm, age: event.target.value })} aria-invalid={Boolean(errors.age)} />
              {errors.age && <small className="field-error">{errors.age}</small>}
            </label>
            <label className="field"><span>Gender <span className="field-hint">(optional)</span></span>
              <select value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })}>
                <option value="">Select an option</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
            <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
          </form>
        )}

        {section === 'password' && (
          <form className="dashboard-form" onSubmit={changePassword} noValidate>
            <label className="field"><span>Current password</span>
              <input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} aria-invalid={Boolean(errors.currentPassword)} />
              {errors.currentPassword && <small className="field-error">{errors.currentPassword}</small>}
            </label>
            <label className="field"><span>New password</span>
              <input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} aria-invalid={Boolean(errors.newPassword)} />
              {errors.newPassword && <small className="field-error">{errors.newPassword}</small>}
              {!errors.newPassword && <small className="field-hint">8+ characters, with uppercase, lowercase, and a number.</small>}
            </label>
            <label className="field"><span>Confirm new password</span>
              <input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} aria-invalid={Boolean(errors.confirmPassword)} />
              {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
            </label>
            <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Change password'}</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default Dashboard
