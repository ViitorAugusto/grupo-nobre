import type { CommercialField } from './opportunity-errors.js';
import type { Opportunity } from './opportunity.js';
import { isFinalStage, type Stage, stageOrder } from './stage.js';

export function missingQuoteRequirements(
  opportunity: Pick<Opportunity, 'estimatedValue' | 'items'>,
): CommercialField[] {
  const missing: CommercialField[] = [];
  if (opportunity.estimatedValue === null) missing.push('estimatedValue');
  if (opportunity.items.length === 0) missing.push('items');
  return missing;
}

export function requiresQuoteData(stage: Stage): boolean {
  return !isFinalStage(stage) && stageOrder(stage) >= stageOrder('APRESENTACAO_ORCAMENTO');
}
