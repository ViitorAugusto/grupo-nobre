import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetMetaUseCase } from '../application/get-meta.use-case.js';
import { ListSellersUseCase } from '../application/list-sellers.use-case.js';
import { presentMeta, presentSeller } from './opportunity.presenter.js';
import { MetaResponse, SellerListResponse } from './opportunity.responses.js';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(
    private readonly getMeta: GetMetaUseCase,
    private readonly listSellers: ListSellersUseCase,
  ) {}

  @Get('meta')
  @ApiOkResponse({ type: MetaResponse })
  meta(): MetaResponse {
    return presentMeta(this.getMeta.execute());
  }

  @Get('sellers')
  @ApiOkResponse({ type: SellerListResponse })
  async sellers(): Promise<SellerListResponse> {
    return { data: (await this.listSellers.execute()).map(presentSeller) };
  }
}
