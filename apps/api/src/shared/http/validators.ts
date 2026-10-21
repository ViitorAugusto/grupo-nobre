import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ValidateBy, type ValidationOptions } from 'class-validator';
import { isCalendarDate } from '../domain/calendar-date.js';

export function IsCalendarDateString(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDateString',
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isCalendarDate(value),
        defaultMessage: (args) =>
          `${args?.property} deve ser uma data válida no formato AAAA-MM-DD`,
      },
    },
    options,
  );
}

export function uuidParam(field = 'id'): ParseUUIDPipe {
  return new ParseUUIDPipe({
    exceptionFactory: () =>
      new BadRequestException({
        error: 'VALIDACAO_INVALIDA',
        message: 'Dados inválidos na requisição.',
        details: [{ field, message: `${field} deve ser um UUID` }],
      }),
  });
}
