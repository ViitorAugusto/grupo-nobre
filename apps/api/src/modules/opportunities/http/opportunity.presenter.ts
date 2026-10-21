import type { Meta } from '../application/get-meta.use-case.js';
import type { OpportunityDetailView } from '../application/opportunity-views.js';
import type { SellerRef, StageHistoryEntry } from '../domain/opportunity.js';
import type { OpportunityView } from '../domain/opportunity-view.js';
import { isFinalStage } from '../domain/stage.js';
import type {
  MetaResponse,
  OpportunityDetailResponse,
  OpportunityResponse,
  SellerResponse,
  StageHistoryResponse,
} from './opportunity.responses.js';

export function presentOpportunity(view: OpportunityView): OpportunityResponse {
  const { opportunity } = view;
  return {
    id: opportunity.id,
    code: opportunity.code,
    company: opportunity.company,
    seller: presentSeller(opportunity.seller),
    stage: opportunity.stage,
    isFinal: isFinalStage(opportunity.stage),
    estimatedValue: opportunity.estimatedValue,
    items: opportunity.items.map((item) => ({
      id: item.id!,
      product: item.product,
      quantity: item.quantity,
    })),
    lastContactDate: opportunity.lastContactDate,
    proposalValidUntil: opportunity.proposalValidUntil,
    eventDate: opportunity.eventDate,
    daysWithoutContact: view.daysWithoutContact,
    lossReason: opportunity.lossReason,
    lossReasonText: opportunity.lossReasonText,
    attention: {
      needsAttention: view.attention.needsAttention,
      reasons: view.attention.reasons.map((reason) => ({ ...reason })),
    },
    allowedTransitions: view.allowedTransitions,
  };
}

export function presentOpportunityDetail(view: OpportunityDetailView): OpportunityDetailResponse {
  return Object.assign(presentOpportunity(view), {
    history: view.history.map(presentHistoryEntry),
  });
}

function presentHistoryEntry(entry: StageHistoryEntry): StageHistoryResponse {
  return {
    id: entry.id,
    fromStage: entry.fromStage,
    toStage: entry.toStage,
    lossReason: entry.lossReason,
    lossReasonText: entry.lossReasonText,
    changedAt: entry.changedAt.toISOString(),
  };
}

export function presentSeller(seller: SellerRef): SellerResponse {
  return { id: seller.id, name: seller.name };
}

export function presentMeta(meta: Meta): MetaResponse {
  return {
    referenceDate: meta.referenceDate,
    parameters: { ...meta.parameters },
    stages: meta.stages.map(({ code, label, order, isFinal }) => ({ code, label, order, isFinal })),
    lossReasons: meta.lossReasons.map(({ code, label, requiresText }) => ({
      code,
      label,
      requiresText,
    })),
  };
}
