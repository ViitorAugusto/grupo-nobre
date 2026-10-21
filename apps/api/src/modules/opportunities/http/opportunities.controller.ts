import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { uuidParam } from '../../../shared/http/validators.js';
import { ChangeStageUseCase } from '../application/change-stage.use-case.js';
import { GetOpportunityUseCase } from '../application/get-opportunity.use-case.js';
import { ListOpportunitiesUseCase } from '../application/list-opportunities.use-case.js';
import { RegisterContactUseCase } from '../application/register-contact.use-case.js';
import { UpdateOpportunityUseCase } from '../application/update-opportunity.use-case.js';
import { ChangeStageDto } from './dto/change-stage.dto.js';
import { ListOpportunitiesQuery } from './dto/list-opportunities.query.js';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto.js';
import { presentOpportunity, presentOpportunityDetail } from './opportunity.presenter.js';
import { OpportunityDetailResponse, OpportunityListResponse } from './opportunity.responses.js';

@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly listOpportunities: ListOpportunitiesUseCase,
    private readonly getOpportunity: GetOpportunityUseCase,
    private readonly changeStage: ChangeStageUseCase,
    private readonly registerContact: RegisterContactUseCase,
    private readonly updateOpportunity: UpdateOpportunityUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: OpportunityListResponse })
  async list(@Query() query: ListOpportunitiesQuery): Promise<OpportunityListResponse> {
    const views = await this.listOpportunities.execute(query);
    return { data: views.map(presentOpportunity) };
  }

  @Get(':id')
  @ApiOkResponse({ type: OpportunityDetailResponse })
  async detail(@Param('id', uuidParam()) id: string): Promise<OpportunityDetailResponse> {
    return presentOpportunityDetail(await this.getOpportunity.execute(id));
  }

  @Post(':id/stage-changes')
  @HttpCode(200)
  @ApiOkResponse({ type: OpportunityDetailResponse })
  async moveStage(
    @Param('id', uuidParam()) id: string,
    @Body() body: ChangeStageDto,
  ): Promise<OpportunityDetailResponse> {
    return presentOpportunityDetail(await this.changeStage.execute(id, body));
  }

  @Post(':id/contacts')
  @HttpCode(200)
  @ApiOkResponse({ type: OpportunityDetailResponse })
  async contact(@Param('id', uuidParam()) id: string): Promise<OpportunityDetailResponse> {
    return presentOpportunityDetail(await this.registerContact.execute(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: OpportunityDetailResponse })
  async update(
    @Param('id', uuidParam()) id: string,
    @Body() body: UpdateOpportunityDto,
  ): Promise<OpportunityDetailResponse> {
    return presentOpportunityDetail(await this.updateOpportunity.execute(id, body));
  }
}
