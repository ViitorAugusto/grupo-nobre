import { ApiProperty } from '@nestjs/swagger';
import { ATTENTION_PRIORITY } from '../domain/attention.js';
import { LOSS_REASONS } from '../domain/loss-reason.js';
import { STAGES } from '../domain/stage.js';

export class SellerResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Ana' }) name!: string;
}

export class SellerListResponse {
  @ApiProperty({ type: [SellerResponse] }) data!: SellerResponse[];
}

export class OpportunityItemResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Kit escritório' }) product!: string;
  @ApiProperty({ example: 120 }) quantity!: number;
}

export class AttentionReasonResponse {
  @ApiProperty({ enum: ATTENTION_PRIORITY }) rule!: string;
  @ApiProperty({
    enum: ['EVENTO_PROXIMO', 'PROPOSTA_VENCIDA', 'VALIDADE_APOS_EVENTO', 'SEM_CONTATO'],
  })
  code!: string;
  @ApiProperty({ example: 'Proposta vencida há 2 dias' }) message!: string;
  @ApiProperty({ type: Number, nullable: true, example: 2 }) days!: number | null;
}

export class AttentionResponse {
  @ApiProperty() needsAttention!: boolean;
  @ApiProperty({ type: [AttentionReasonResponse], description: 'Ordem: A3 → A1 → A4 → A2' })
  reasons!: AttentionReasonResponse[];
}

export class OpportunityResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'OPP-2002' }) code!: string;
  @ApiProperty({ example: 'Construtora Horizonte' }) company!: string;
  @ApiProperty({ type: SellerResponse }) seller!: SellerResponse;
  @ApiProperty({ enum: STAGES }) stage!: string;
  @ApiProperty() isFinal!: boolean;
  @ApiProperty({ type: Number, nullable: true, example: 9800 }) estimatedValue!: number | null;
  @ApiProperty({ type: [OpportunityItemResponse] }) items!: OpportunityItemResponse[];
  @ApiProperty({ type: String, format: 'date', nullable: true }) lastContactDate!: string | null;
  @ApiProperty({ type: String, format: 'date', nullable: true })
  proposalValidUntil!: string | null;
  @ApiProperty({ type: String, format: 'date', nullable: true }) eventDate!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: 9 }) daysWithoutContact!: number | null;
  @ApiProperty({ enum: LOSS_REASONS, nullable: true }) lossReason!: string | null;
  @ApiProperty({ type: String, nullable: true }) lossReasonText!: string | null;
  @ApiProperty({ type: AttentionResponse }) attention!: AttentionResponse;
  @ApiProperty({ enum: STAGES, isArray: true }) allowedTransitions!: string[];
}

export class OpportunityListResponse {
  @ApiProperty({ type: [OpportunityResponse] }) data!: OpportunityResponse[];
}

export class StageHistoryResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: STAGES }) fromStage!: string;
  @ApiProperty({ enum: STAGES }) toStage!: string;
  @ApiProperty({ enum: LOSS_REASONS, nullable: true }) lossReason!: string | null;
  @ApiProperty({ type: String, nullable: true }) lossReasonText!: string | null;
  @ApiProperty({ format: 'date-time' }) changedAt!: string;
}

export class OpportunityDetailResponse extends OpportunityResponse {
  @ApiProperty({ type: [StageHistoryResponse], description: 'Ordem cronológica crescente' })
  history!: StageHistoryResponse[];
}

export class StageMetaResponse {
  @ApiProperty({ enum: STAGES }) code!: string;
  @ApiProperty({ example: 'Primeiro Contato' }) label!: string;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiProperty() isFinal!: boolean;
}

export class LossReasonMetaResponse {
  @ApiProperty({ enum: LOSS_REASONS }) code!: string;
  @ApiProperty({ example: 'Preço' }) label!: string;
  @ApiProperty() requiresText!: boolean;
}

export class AttentionParametersResponse {
  @ApiProperty({ example: 5 }) noContactDays!: number;
  @ApiProperty({ example: 7 }) eventWindowDays!: number;
}

export class MetaResponse {
  @ApiProperty({ format: 'date', example: '2026-10-15' }) referenceDate!: string;
  @ApiProperty({ type: AttentionParametersResponse }) parameters!: AttentionParametersResponse;
  @ApiProperty({ type: [StageMetaResponse] }) stages!: StageMetaResponse[];
  @ApiProperty({ type: [LossReasonMetaResponse] }) lossReasons!: LossReasonMetaResponse[];
}
