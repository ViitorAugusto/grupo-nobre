import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConflictError, DomainError, NotFoundError } from '../domain/domain-error.js';

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

const HTTP_CODES: Record<number, string> = {
  400: 'VALIDACAO_INVALIDA',
  404: 'NAO_ENCONTRADO',
  429: 'LIMITE_DE_REQUISICOES',
};

const DOMAIN_STATUS: [new (...args: never[]) => DomainError, HttpStatus][] = [
  [NotFoundError, HttpStatus.NOT_FOUND],
  [ConflictError, HttpStatus.CONFLICT],
];

function domainStatus(error: DomainError): HttpStatus {
  return (
    DOMAIN_STATUS.find(([type]) => error instanceof type)?.[1] ?? HttpStatus.UNPROCESSABLE_ENTITY
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception);
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof DomainError) {
      return {
        statusCode: domainStatus(exception),
        error: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const custom = typeof response === 'object' ? (response as Partial<ApiErrorBody>) : {};
      const ownCode = typeof custom.error === 'string' && /^[A-Z_]+$/.test(custom.error);
      const message = typeof custom.message === 'string' ? custom.message : exception.message;
      return {
        statusCode,
        error: ownCode ? custom.error! : (HTTP_CODES[statusCode] ?? 'ERRO_HTTP'),
        message: message.startsWith('Cannot ') ? 'Recurso não encontrado.' : message,
        details: custom.details,
      };
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'ERRO_INTERNO',
      message: 'Erro inesperado. Tente novamente em instantes.',
    };
  }
}
