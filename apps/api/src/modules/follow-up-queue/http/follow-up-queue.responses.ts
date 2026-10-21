import { ApiProperty } from '@nestjs/swagger';
import {
  AttentionReasonResponse,
  SellerResponse,
} from '../../opportunities/http/opportunity.responses.js';

export class QueueRunSellerResponse {
  @ApiProperty({ type: SellerResponse }) seller!: SellerResponse;
  @ApiProperty({ example: 1 }) itemCount!: number;
}

export class QueueRunResponse {
  @ApiProperty({ format: 'date', example: '2026-10-15' }) date!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ type: [QueueRunSellerResponse] }) sellers!: QueueRunSellerResponse[];
}

export class QueueOpportunityResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'OPP-2002' }) code!: string;
  @ApiProperty({ example: 'Construtora Horizonte' }) company!: string;
  @ApiProperty({ type: Number, nullable: true, example: 9800 }) estimatedValue!: number | null;
}

export class QueueItemResponse {
  @ApiProperty({ example: 1 }) position!: number;
  @ApiProperty({ type: QueueOpportunityResponse }) opportunity!: QueueOpportunityResponse;
  @ApiProperty({ type: [AttentionReasonResponse], description: 'Ordem: A3 → A1 → A4 → A2' })
  reasons!: AttentionReasonResponse[];
}

export class SellerQueueResponse {
  @ApiProperty({ format: 'date', example: '2026-10-15' }) date!: string;
  @ApiProperty({ type: SellerResponse }) seller!: SellerResponse;
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'null = a rotina ainda não rodou para a data',
  })
  generatedAt!: string | null;
  @ApiProperty({ type: [QueueItemResponse] }) items!: QueueItemResponse[];
}

export class SummaryResponse {
  @ApiProperty({ format: 'date', example: '2026-10-15' }) date!: string;
  @ApiProperty({ type: SellerResponse }) seller!: SellerResponse;
  @ApiProperty({ example: 'Bom dia, Bruno! Você tem 1 retorno hoje (15/10/2026):…' }) text!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class SummaryListResponse {
  @ApiProperty({ type: [SummaryResponse] }) data!: SummaryResponse[];
}
