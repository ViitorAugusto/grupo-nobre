import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { finalStageError, keepQuoteRequirementsError } from './opportunity-errors.js';
import type { Opportunity, OpportunityItem } from './opportunity.js';
import { missingQuoteRequirements, requiresQuoteData } from './quote-requirements.js';
import { isFinalStage } from './stage.js';

export interface CommercialDataChanges {
  estimatedValue?: number | null;
  proposalValidUntil?: CalendarDate | null;
  eventDate?: CalendarDate | null;
  items?: OpportunityItem[];
}

export function applyCommercialData(
  opportunity: Opportunity,
  changes: CommercialDataChanges,
): Opportunity {
  if (isFinalStage(opportunity.stage)) throw finalStageError(opportunity.stage);

  const updated: Opportunity = {
    ...opportunity,
    estimatedValue:
      changes.estimatedValue !== undefined ? changes.estimatedValue : opportunity.estimatedValue,
    proposalValidUntil:
      changes.proposalValidUntil !== undefined
        ? changes.proposalValidUntil
        : opportunity.proposalValidUntil,
    eventDate: changes.eventDate !== undefined ? changes.eventDate : opportunity.eventDate,
    items:
      changes.items !== undefined
        ? changes.items.map(({ product, quantity }) => ({ product, quantity }))
        : opportunity.items,
  };

  if (requiresQuoteData(updated.stage)) {
    const missing = missingQuoteRequirements(updated);
    if (missing.length > 0) throw keepQuoteRequirementsError(missing);
  }
  return updated;
}
