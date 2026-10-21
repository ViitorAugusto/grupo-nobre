import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { parseCalendarDate } from '../../../shared/domain/calendar-date.js';
import { GenerateFollowUpQueueUseCase } from '../application/generate-follow-up-queue.use-case.js';
import { GetSellerQueueUseCase } from '../application/get-seller-queue.use-case.js';
import { ListSummariesUseCase } from '../application/list-summaries.use-case.js';
import { GenerateRunDto, SellerQueueQuery, SummariesQuery } from './follow-up-queue.dto.js';
import {
  presentQueueRun,
  presentSellerQueue,
  presentSummary,
} from './follow-up-queue.presenter.js';
import {
  QueueRunResponse,
  SellerQueueResponse,
  SummaryListResponse,
} from './follow-up-queue.responses.js';

const toDate = (value?: string) => (value === undefined ? undefined : parseCalendarDate(value));

@ApiTags('follow-up-queue')
@Controller('follow-up-queue')
export class FollowUpQueueController {
  constructor(
    private readonly generateQueue: GenerateFollowUpQueueUseCase,
    private readonly getSellerQueue: GetSellerQueueUseCase,
    private readonly listSummaries: ListSummariesUseCase,
  ) {}

  @Post('runs')
  @HttpCode(200)
  @ApiOkResponse({ type: QueueRunResponse })
  async run(@Body() body: GenerateRunDto): Promise<QueueRunResponse> {
    return presentQueueRun(await this.generateQueue.execute(toDate(body.date)));
  }

  @Get()
  @ApiOkResponse({ type: SellerQueueResponse })
  async queue(@Query() query: SellerQueueQuery): Promise<SellerQueueResponse> {
    return presentSellerQueue(
      await this.getSellerQueue.execute(query.sellerId, toDate(query.date)),
    );
  }

  @Get('summaries')
  @ApiOkResponse({ type: SummaryListResponse })
  async summaries(@Query() query: SummariesQuery): Promise<SummaryListResponse> {
    const summaries = await this.listSummaries.execute(toDate(query.date), query.sellerId);
    return { data: summaries.map(presentSummary) };
  }
}
