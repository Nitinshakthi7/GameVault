import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { forgotPassword, resetPassword } from '../api/endpoints.js';
import { fieldErrors } from '../lib/errors.js';
import { FormError } from '../components/ErrorPanel.jsx';
import { usePageTitle } from '../hooks/useMisc.js';

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <motion.section
      className="auth-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-labelledby="auth-title"
    >
      <h1 id="auth-title">{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
      {children}
      {footer && <p className="auth-footer">{footer}</p>}
    </motion.section>
  );
}

function Field({ id, label, error, hint, ...input }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...input} />
      {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

export function Login() {
  usePageTitle('Sign in');
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const from = location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search || ''}` : '/dashboard';

  if (status === 'authed') return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn({ email: form.email.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };
  const fe = fieldErrors(error);
  const badCreds = error?.code === 'UNAUTHORIZED';

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to open your vault."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {badCreds ? (
          <div className="form-error" role="alert"><strong>Incorrect email or password.</strong> Check your details and try again, or <Link to="/forgot-password">reset your password</Link>.</div>
        ) : (
          <FormError error={error} what="sign you in" />
        )}
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} error={fe.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required value={form.password} error={fe.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !form.email || !form.password}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}

export function Register() {
  usePageTitle('Create account');
  const { signUp, status } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const [busy, setBusy] = useState(false);

  if (status === 'authed') return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const out = {};
    const u = form.username.trim();
    if (u.length < 3 || u.length > 20) out.username = 'Username must be 3 to 20 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) out.email = 'Enter a valid email address.';
    if (form.password.length < 8) out.password = 'Password must be at least 8 characters.';
    return out;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    setLocal(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await signUp({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };
  const fe = { ...fieldErrors(error), ...local };

  return (
    <AuthCard
      title="Create your vault"
      subtitle="It takes less than a minute."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {error?.code === 'CONFLICT' ? (
          <div className="form-error" role="alert"><strong>That email or username is taken.</strong> Try signing in instead, or pick a different one.</div>
        ) : (
          <FormError error={error} what="create your account" />
        )}
        <Field id="username" label="Username" autoComplete="username" required minLength={3} maxLength={20} hint="3 to 20 characters" value={form.username} error={fe.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Field id="email" label="Email" type="email" autoComplete="email" required value={form.email} error={fe.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters" value={form.password} error={fe.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}

export function ForgotPassword() {
  usePageTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await forgotPassword(email.trim());
      setResult(r || {});
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  // Outside production the API also returns resetUrl; only follow it if it points at our own reset page.
  let devLink = null;
  if (result?.resetUrl) {
    try {
      const u = new URL(result.resetUrl, window.location.origin);
      if (u.pathname === '/reset-password') devLink = `${u.pathname}${u.search}`;
    } catch {
      devLink = null;
    }
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we will send a reset link." footer={<Link to="/login">Back to sign in</Link>}>
      {result ? (
        <div className="notice" role="status">
          <p>If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder).</p>
          {devLink && (
            <p>Development mode: <Link to={devLink}>open the reset page</Link></p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormError error={error} what="send the reset email" />
          <Field id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !email}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPassword() {
  usePageTitle('Choose a new password');
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Reset link missing" footer={<Link to="/forgot-password">Request a new link</Link>}>
        <div className="form-error" role="alert">This page needs a reset token. Open the link from your email, or request a new one.</div>
      </AuthCard>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = {};
    if (password.length < 8) v.password = 'Password must be at least 8 characters.';
    if (confirm !== password) v.confirm = 'Passwords do not match.';
    setLocal(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const fe = { ...fieldErrors(error), ...local };
  const expired = error && (error.code === 'VALIDATION_ERROR' || error.code === 'UNAUTHORIZED' || error.code === 'NOT_FOUND') && !Object.keys(fieldErrors(error)).length;

  return (
    <AuthCard title="Choose a new password" footer={<Link to="/login">Back to sign in</Link>}>
      {done ? (
        <div className="notice" role="status">
          <p>Your password has been updated and all old sessions were signed out.</p>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {expired ? (
            <div className="form-error" role="alert"><strong>This reset link is invalid or has expired.</strong> <Link to="/forgot-password">Request a new one</Link>.</div>
          ) : (
            <FormError error={error} what="reset your password" />
          )}
          <Field id="password" label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters" value={password} error={fe.password} onChange={(e) => setPassword(e.target.value)} />
          <Field id="confirm" label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} error={fe.confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Saving...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
