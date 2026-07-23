export function FormStatus({ status }) {
  if (!status?.message) return null;
  return (
    <div className={`form-status form-status--${status.type}`} role="status">
      {status.message}
      {status.errors?.map((error) => (
        <small key={`${error.field}-${error.message}`}>{error.message}</small>
      ))}
    </div>
  );
}
