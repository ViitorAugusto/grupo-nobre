export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('NAO_ENCONTRADO', message, details);
  }
}

export class ConflictError extends DomainError {}
