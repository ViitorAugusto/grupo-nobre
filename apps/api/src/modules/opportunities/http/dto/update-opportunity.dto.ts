import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { CalendarDate } from '../../../../shared/domain/calendar-date.js';
import { IsCalendarDateString } from '../../../../shared/http/validators.js';

const MAX_ESTIMATED_VALUE = 9_999_999_999.99;
const MAX_QUANTITY = 2_147_483_647;

export class OpportunityItemInput {
  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Kit escritório' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'product deve ser um texto' })
  @Length(1, 120, { message: 'product deve ter entre 1 e 120 caracteres' })
  product!: string;

  @ApiProperty({ minimum: 1, example: 150 })
  @IsInt({ message: 'quantity deve ser um número inteiro' })
  @Min(1, { message: 'quantity deve ser pelo menos 1' })
  @Max(MAX_QUANTITY, { message: 'quantity acima do limite permitido' })
  quantity!: number;
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ type: Number, nullable: true, example: 10500 })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'estimatedValue deve ser um número com até 2 casas decimais' },
  )
  @IsPositive({ message: 'estimatedValue deve ser maior que zero' })
  @Max(MAX_ESTIMATED_VALUE, { message: 'estimatedValue acima do limite permitido' })
  estimatedValue?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true, example: '2026-10-30' })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsCalendarDateString()
  proposalValidUntil?: CalendarDate | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true, example: null })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsCalendarDateString()
  eventDate?: CalendarDate | null;

  @ApiPropertyOptional({ type: [OpportunityItemInput], maxItems: 50 })
  @ValidateIf((_, value) => value !== undefined)
  @IsArray({ message: 'items deve ser uma lista' })
  @ArrayMaxSize(50, { message: 'items aceita no máximo 50 itens' })
  @ValidateNested({ each: true })
  @Type(() => OpportunityItemInput)
  items?: OpportunityItemInput[];
}
