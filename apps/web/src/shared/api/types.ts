export type Stage =
  | 'PRIMEIRO_CONTATO'
  | 'APRESENTACAO_ORCAMENTO'
  | 'FOLLOW_UP'
  | 'FORECAST'
  | 'FECHAMENTO'
  | 'PERDIDA';

export type LossReason =
  | 'PRECO'
  | 'PRAZO'
  | 'CONCORRENCIA'
  | 'CLIENTE_DESISTIU'
  | 'SEM_RESPOSTA'
  | 'OUTRO'
  | 'NAO_REGISTRADO';

export type InputLossReason = Exclude<LossReason, 'NAO_REGISTRADO'>;

export type AttentionReason = {
  rule: 'A1' | 'A2' | 'A3' | 'A4';
  code: 'EVENTO_PROXIMO' | 'PROPOSTA_VENCIDA' | 'VALIDADE_APOS_EVENTO' | 'SEM_CONTATO';
  message: string;
  days: number | null;
};

export type Seller = { id: string; name: string };

export type OpportunityItem = { id: string; product: string; quantity: number };

export type Opportunity = {
  id: string;
  code: string;
  company: string;
  seller: Seller;
  stage: Stage;
  isFinal: boolean;
  estimatedValue: number | null;
  items: OpportunityItem[];
  lastContactDate: string | null;
  proposalValidUntil: string | null;
  eventDate: string | null;
  daysWithoutContact: number | null;
  lossReason: LossReason | null;
  lossReasonText: string | null;
  attention: { needsAttention: boolean; reasons: AttentionReason[] };
  allowedTransitions: Stage[];
};

export type StageChange = {
  id: string;
  fromStage: Stage;
  toStage: Stage;
  lossReason: LossReason | null;
  lossReasonText: string | null;
  changedAt: string;
};

export type OpportunityDetail = Opportunity & { history: StageChange[] };

export type StageMeta = { code: Stage; label: string; order: number; isFinal: boolean };
export type LossReasonMeta = { code: InputLossReason; label: string; requiresText: boolean };

export type Meta = {
  referenceDate: string;
  parameters: { noContactDays: number; eventWindowDays: number };
  stages: StageMeta[];
  lossReasons: LossReasonMeta[];
};

export type ListResponse<T> = { data: T[] };

export type OpportunityFilters = {
  search?: string;
  sellerId?: string;
  needsAttention?: boolean;
};

export type StageChangeInput = {
  toStage: Stage;
  lossReason?: InputLossReason;
  lossReasonText?: string;
};

export type FollowUpQueueItem = {
  position: number;
  opportunity: Pick<Opportunity, 'id' | 'code' | 'company' | 'estimatedValue'>;
  reasons: AttentionReason[];
};

export type SellerQueue = {
  date: string;
  seller: Seller;
  generatedAt: string | null;
  items: FollowUpQueueItem[];
};

export const LEGACY_LOSS_REASON_LABEL = 'Não registrado (dado legado)';
