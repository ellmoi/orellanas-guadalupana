export class AppError extends Error {
  constructor(message, status = 500, errors = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errors = errors;
    this.isOperational = true;
  }
}
