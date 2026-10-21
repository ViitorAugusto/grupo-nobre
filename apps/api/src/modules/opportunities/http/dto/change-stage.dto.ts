import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, ValidateBy } from 'class-validator';
import { INPUT_LOSS_REASONS, type LossReason } from '../../domain/loss-reason.js';
import { STAGES, type Stage } from '../../domain/stage.js';

function OnlyWhenLost(): PropertyDecorator {
  return ValidateBy({
    name: 'onlyWhenLost',
    validator: {
      validate: (_value: unknown, args) =>
        (args?.object as { toStage?: unknown } | undefined)?.toStage === 'PERDIDA',
      defaultMessage: (args) => `${args?.property} só é permitido com toStage = PERDIDA`,
    },
  });
}

export class ChangeStageDto {
  @ApiProperty({ enum: STAGES })
  @IsIn(STAGES, { message: `toStage deve ser um destes valores: ${STAGES.join(', ')}` })
  toStage!: Stage;

  @ApiPropertyOptional({ enum: INPUT_LOSS_REASONS, description: 'Obrigatório para PERDIDA' })
  @IsOptional()
  @IsIn(INPUT_LOSS_REASONS, {
    message: `lossReason deve ser um destes valores: ${INPUT_LOSS_REASONS.join(', ')}`,
  })
  @OnlyWhenLost()
  lossReason?: LossReason;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 500,
    description: 'Obrigatório quando lossReason = OUTRO',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'lossReasonText deve ser um texto' })
  @Length(1, 500, { message: 'lossReasonText deve ter entre 1 e 500 caracteres' })
  @OnlyWhenLost()
  lossReasonText?: string;
}
