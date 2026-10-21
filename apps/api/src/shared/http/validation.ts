import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';

interface FieldError {
  field: string;
  message: string;
}

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([name, message]) => ({
      field,
      message: name === 'whitelistValidation' ? `${field} não é um campo permitido` : message,
    }));
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        error: 'VALIDACAO_INVALIDA',
        message: 'Dados inválidos na requisição.',
        details: flatten(errors),
      }),
  });
}
