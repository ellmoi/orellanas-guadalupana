import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FormStatus } from '../components/FormStatus.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { apiRequest } from '../services/api.js';

const waiting = { type: 'loading', message: 'Procesando…' };
const errorStatus = (error) => ({ type: 'error', message: error.message, errors: error.errors });

export function RegisterPage() {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(waiting);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form);
    body.acceptTerms = form.has('acceptTerms');
    body.acceptDataProcessing = form.has('acceptDataProcessing');
    body.commercialConsent = form.has('commercialConsent');
    try {
      const payload = await apiRequest('/auth/register', { method: 'POST', body });
      event.currentTarget.reset();
      setStatus({ type: 'success', message: payload.message });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthCard title="Crea tu cuenta" intro="Cultivadas con dedicación para tu mesa.">
      <form onSubmit={submit} className="auth-form">
        <Field label="Nombre completo" name="fullName" autoComplete="name" required />
        <div className="form-grid">
          <Field label="Correo" name="email" type="email" autoComplete="email" required />
          <Field label="Nombre de usuario" name="username" autoComplete="username" required />
        </div>
        <div className="form-grid">
          <Field label="Fecha de nacimiento" name="birthDate" type="date" required />
          <SelectField
            label="Tipo de cliente"
            name="customerType"
            options={[
              ['RETAIL', 'Para mi hogar'],
              ['RESTAURANT', 'Restaurante'],
              ['WHOLESALE', 'Mayorista'],
              ['DISTRIBUTOR', 'Distribuidor'],
            ]}
          />
        </div>
        <div className="form-grid">
          <Field label="Teléfono (opcional)" name="phone" autoComplete="tel" />
          <Field label="Ciudad (opcional)" name="city" autoComplete="address-level2" />
        </div>
        <div className="form-grid">
          <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required />
          <Field
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <small>Usa mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.</small>
        <Checkbox name="acceptTerms" required>
          Acepto los términos y condiciones.
        </Checkbox>
        <Checkbox name="acceptDataProcessing" required>
          Autorizo el tratamiento de mis datos.
        </Checkbox>
        <Checkbox name="commercialConsent">Deseo recibir novedades comerciales (opcional).</Checkbox>
        <FormStatus status={status} />
        <button className="primary-button" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
      </p>
    </AuthCard>
  );
}

export function LoginPage() {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(waiting);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await login(body);
      navigate(location.state?.from || '/perfil', { replace: true });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthCard title="Bienvenido de nuevo" intro="Gracias por apoyar la producción familiar y local.">
      <form onSubmit={submit} className="auth-form">
        <Field label="Correo o usuario" name="identifier" autoComplete="username" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <FormStatus status={status} />
        <button className="primary-button" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/olvide-contrasena">Olvidé mi contraseña</Link>
      </p>
    </AuthCard>
  );
}

export function VerificationPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState(token ? waiting : { type: 'error', message: 'El enlace no incluye un token.' });
  useEffect(() => {
    if (!token) return;
    apiRequest('/auth/verify-email', { method: 'POST', body: { token } })
      .then((payload) => setStatus({ type: 'success', message: payload.message }))
      .catch((error) => setStatus(errorStatus(error)));
  }, [token]);
  return (
    <AuthCard title="Verificación de correo" intro="Estamos confirmando tu cuenta.">
      <FormStatus status={status} />
      {status.type === 'success' && (
        <Link className="primary-button" to="/iniciar-sesion">
          Ir a iniciar sesión
        </Link>
      )}
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(waiting);
    try {
      const payload = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      });
      setStatus({ type: 'success', message: `${payload.message} Revisa la consola del backend en desarrollo.` });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthCard title="Recupera tu contraseña" intro="Te ayudaremos a volver a tu cuenta.">
      <form onSubmit={submit} className="auth-form">
        <Field label="Correo" name="email" type="email" required />
        <FormStatus status={status} />
        <button className="primary-button" disabled={submitting}>
          Generar enlace
        </button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const token = params.get('token');
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(waiting);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.token = token;
    try {
      const payload = await apiRequest('/auth/reset-password', { method: 'POST', body });
      event.currentTarget.reset();
      setStatus({ type: 'success', message: payload.message });
    } catch (error) {
      setStatus(errorStatus(error));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthCard title="Define una nueva contraseña" intro="El enlace es válido durante una hora.">
      {!token ? (
        <FormStatus status={{ type: 'error', message: 'El enlace no incluye un token.' }} />
      ) : (
        <form onSubmit={submit} className="auth-form">
          <Field label="Nueva contraseña" name="password" type="password" required />
          <Field label="Confirmar contraseña" name="confirmPassword" type="password" required />
          <FormStatus status={status} />
          <button className="primary-button" disabled={submitting}>
            Restablecer contraseña
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export function ProfilePage({ admin = false }) {
  const { user } = useAuth();
  return (
    <main className="account-page">
      <section className="account-card">
        <p className="eyebrow">{admin ? 'Área administrativa' : 'Mi cuenta'}</p>
        <h1>
          {user.firstName} {user.lastName}
        </h1>
        <dl>
          <div>
            <dt>Correo</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{user.username || 'Sin definir'}</dd>
          </div>
          <div>
            <dt>Tipo de cliente</dt>
            <dd>{user.customerType}</dd>
          </div>
          <div>
            <dt>Roles</dt>
            <dd>{user.roles.join(', ')}</dd>
          </div>
        </dl>
        <p>
          La edición completa del perfil y las direcciones ya está disponible en la API y se ampliará visualmente en la
          etapa de cuenta.
        </p>
      </section>
    </main>
  );
}

function AuthCard({ title, intro, children }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <img src={`${import.meta.env.BASE_URL}images/logo-setas-la-guadalupana.png`} alt="Setas La Guadalupana" />
        <h1>{title}</h1>
        <p>{intro}</p>
        {children}
      </section>
    </main>
  );
}
function Field({ label, ...props }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
function SelectField({ label, options, ...props }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select {...props}>
        {options.map(([value, text]) => (
          <option value={value} key={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Checkbox({ children, ...props }) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  );
}
