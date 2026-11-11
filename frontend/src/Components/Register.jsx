function Register({ form, errors, loading, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <label className="field">
        <span>Full name</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={onChange}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <small id="name-error" className="field-error">{errors.name}</small>}
      </label>

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
        <span>Phone number <span className="field-hint">(optional)</span></span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          maxLength="32"
          value={form.phone}
          onChange={onChange}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && <small id="phone-error" className="field-error">{errors.phone}</small>}
      </label>

      <label className="field">
        <span>Age <span className="field-hint">(optional)</span></span>
        <input
          name="age"
          type="number"
          min="1"
          max="120"
          placeholder="Your age"
          value={form.age}
          onChange={onChange}
          aria-invalid={Boolean(errors.age)}
          aria-describedby={errors.age ? 'age-error' : undefined}
        />
        {errors.age && <small id="age-error" className="field-error">{errors.age}</small>}
      </label>

      <label className="field">
        <span>Gender <span className="field-hint">(optional)</span></span>
        <select name="gender" value={form.gender} onChange={onChange}>
          <option value="">Select an option</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={onChange}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
        />
        {errors.password ? (
          <small id="password-error" className="field-error">{errors.password}</small>
        ) : (
          <small id="password-hint" className="field-hint">
            8+ characters with uppercase, lowercase, and a number.
          </small>
        )}
      </label>

      <button className="button button-primary" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : 'Create account'}
      </button>
    </form>
  )
}

export default Register
