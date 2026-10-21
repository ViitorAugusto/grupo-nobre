import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { STAGES, type Stage } from '../../domain/stage.js';

export class ListOpportunitiesQuery {
  @ApiPropertyOptional({
    description: 'Contém, sem diferenciar maiúsculas nem acentos, no código ou na empresa',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'search deve ser um texto' })
  @Length(1, 100, { message: 'search deve ter entre 1 e 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'sellerId deve ser um UUID' })
  sellerId?: string;

  @ApiPropertyOptional({ enum: STAGES })
  @IsOptional()
  @IsIn(STAGES, { message: `stage deve ser um destes valores: ${STAGES.join(', ')}` })
  stage?: Stage;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'needsAttention deve ser true ou false' })
  needsAttention?: boolean;
}
