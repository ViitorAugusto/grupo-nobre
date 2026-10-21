import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, Min, validateSync } from 'class-validator';
import { isCalendarDate } from '../shared/domain/calendar-date.js';

export class Env {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3333;

  @IsString()
  CORS_ORIGIN = 'http://localhost:3000';

  @Matches(/^postgres(ql)?:\/\//, { message: 'DATABASE_URL deve ser uma URL postgresql://' })
  DATABASE_URL!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'REFERENCE_DATE deve estar no formato AAAA-MM-DD' })
  REFERENCE_DATE = '2026-10-15';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  ATTENTION_NO_CONTACT_DAYS = 5;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  ATTENTION_EVENT_WINDOW_DAYS = 7;

  @IsString()
  FOLLOW_UP_QUEUE_CRON = '0 7 * * *';

  @IsString()
  FOLLOW_UP_QUEUE_TIMEZONE = 'America/Sao_Paulo';
}

export function validateEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(Env, config, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (!isCalendarDate(env.REFERENCE_DATE)) {
    throw new Error(`REFERENCE_DATE inválida: ${env.REFERENCE_DATE}`);
  }
  if (errors.length > 0) {
    const list = errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; ');
    throw new Error(`Configuração de ambiente inválida: ${list}`);
  }
  return env;
}
