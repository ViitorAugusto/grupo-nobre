import { Injectable } from '@nestjs/common';
import type { CalendarDate } from '../../../shared/domain/calendar-date.js';
import { ReferenceDateProvider } from '../../../shared/domain/reference-date.js';
import type { AttentionParameters } from '../domain/attention.js';
import { LOSS_REASON_CATALOG, type LossReasonInfo } from '../domain/loss-reason.js';
import { STAGE_CATALOG, type StageInfo } from '../domain/stage.js';
import { AttentionParametersProvider } from './attention-parameters.provider.js';

export interface Meta {
  referenceDate: CalendarDate;
  parameters: AttentionParameters;
  stages: readonly StageInfo[];
  lossReasons: LossReasonInfo[];
}

@Injectable()
export class GetMetaUseCase {
  constructor(
    private readonly referenceDate: ReferenceDateProvider,
    private readonly attentionParameters: AttentionParametersProvider,
  ) {}

  execute(): Meta {
    return {
      referenceDate: this.referenceDate.today(),
      parameters: this.attentionParameters.get(),
      stages: STAGE_CATALOG,
      lossReasons: LOSS_REASON_CATALOG.filter((reason) => reason.acceptedOnInput),
    };
  }
}
