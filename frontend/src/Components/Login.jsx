function Login({ form, errors, loading, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <label className="field">
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={onChange}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && <small id="password-error" className="field-error">{errors.password}</small>}
      </label>

      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : 'Sign in'}
      </button>
    </form>
  )
}

export default Login
