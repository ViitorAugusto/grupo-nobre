import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { IsCalendarDateString } from '../../../shared/http/validators.js';

const DATE_DOC = {
  format: 'date',
  example: '2026-10-15',
  description: 'Padrão: data de referência',
};

export class GenerateRunDto {
  @ApiPropertyOptional(DATE_DOC)
  @IsOptional()
  @IsCalendarDateString()
  date?: string;
}

export class SellerQueueQuery {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'sellerId deve ser um UUID' })
  sellerId!: string;

  @ApiPropertyOptional(DATE_DOC)
  @IsOptional()
  @IsCalendarDateString()
  date?: string;
}

export class SummariesQuery {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'sellerId deve ser um UUID' })
  sellerId?: string;

  @ApiPropertyOptional(DATE_DOC)
  @IsOptional()
  @IsCalendarDateString()
  date?: string;
}
