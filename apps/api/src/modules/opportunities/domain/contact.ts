import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { finalStageError } from './opportunity-errors.js';
import type { Opportunity } from './opportunity.js';
import { isFinalStage } from './stage.js';

export function registerContact(opportunity: Opportunity, today: CalendarDate): Opportunity | null {
  if (isFinalStage(opportunity.stage)) throw finalStageError(opportunity.stage);
  if (opportunity.lastContactDate === today) return null;
  return { ...opportunity, lastContactDate: today };
}
