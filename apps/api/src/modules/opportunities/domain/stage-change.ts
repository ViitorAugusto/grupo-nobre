import type { LossReason } from './loss-reason.js';
import { lossReasonRequiresText } from './loss-reason.js';
import {
  finalStageError,
  lossReasonRequiredError,
  lossReasonTextRequiredError,
  quoteRequirementsError,
} from './opportunity-errors.js';
import {
  createStageHistoryEntry,
  type NewStageHistoryEntry,
  type Opportunity,
} from './opportunity.js';
import { missingQuoteRequirements } from './quote-requirements.js';
import { isFinalStage, type Stage } from './stage.js';
import { assertTransitionAllowed } from './stage-transition.js';

export interface StageChangeRequest {
  toStage: Stage;
  lossReason?: LossReason | null;
  lossReasonText?: string | null;
}

export type StageChangeDecision =
  | { kind: 'unchanged' }
  | { kind: 'changed'; opportunity: Opportunity; historyEntry: NewStageHistoryEntry };

export function decideStageChange(
  opportunity: Opportunity,
  request: StageChangeRequest,
): StageChangeDecision {
  const from = opportunity.stage;
  const to = request.toStage;

  if (isFinalStage(from)) throw finalStageError(from);
  if (to === from) return { kind: 'unchanged' };

  assertTransitionAllowed(from, to);

  if (to === 'APRESENTACAO_ORCAMENTO') {
    const missing = missingQuoteRequirements(opportunity);
    if (missing.length > 0) throw quoteRequirementsError(missing);
  }

  const lossReason = to === 'PERDIDA' ? (request.lossReason ?? null) : null;
  const lossReasonText = to === 'PERDIDA' ? normalizeText(request.lossReasonText) : null;
  if (to === 'PERDIDA') {
    if (lossReason === null) throw lossReasonRequiredError();
    if (lossReasonRequiresText(lossReason) && lossReasonText === null) {
      throw lossReasonTextRequiredError();
    }
  }

  return {
    kind: 'changed',
    opportunity: { ...opportunity, stage: to, lossReason, lossReasonText },
    historyEntry: createStageHistoryEntry({
      fromStage: from,
      toStage: to,
      lossReason,
      lossReasonText,
    }),
  };
}

function normalizeText(text: string | null | undefined): string | null {
  const trimmed = text?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}
