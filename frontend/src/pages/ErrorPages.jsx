import { Link } from 'react-router-dom';

function ErrorPage({ code, title, message }) {
  return (
    <main className="error-page">
      <p className="error-code" aria-hidden="true">
        {code}
      </p>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="primary-button" to="/">
        Volver a un lugar seguro
      </Link>
    </main>
  );
}

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="Acceso restringido"
      message="Tu cuenta no tiene permiso para consultar esta sección."
    />
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="Página no encontrada"
      message="La dirección puede ser incorrecta o la página ya no está disponible."
    />
  );
}
