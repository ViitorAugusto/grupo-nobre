import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { AttentionParametersProvider } from './application/attention-parameters.provider.js';
import { ChangeStageUseCase } from './application/change-stage.use-case.js';
import { GetMetaUseCase } from './application/get-meta.use-case.js';
import { GetOpportunityUseCase } from './application/get-opportunity.use-case.js';
import { ListOpportunitiesUseCase } from './application/list-opportunities.use-case.js';
import { ListSellersUseCase } from './application/list-sellers.use-case.js';
import { OpportunityRepository, SellerRepository } from './application/opportunity.repository.js';
import { OpportunityViews } from './application/opportunity-views.js';
import { RegisterContactUseCase } from './application/register-contact.use-case.js';
import { UpdateOpportunityUseCase } from './application/update-opportunity.use-case.js';
import { CatalogController } from './http/catalog.controller.js';
import { OpportunitiesController } from './http/opportunities.controller.js';
import { PrismaOpportunityRepository } from './infra/prisma-opportunity.repository.js';
import { PrismaSellerRepository } from './infra/prisma-seller.repository.js';

@Module({
  controllers: [OpportunitiesController, CatalogController],
  providers: [
    { provide: OpportunityRepository, useClass: PrismaOpportunityRepository },
    { provide: SellerRepository, useClass: PrismaSellerRepository },
    {
      provide: AttentionParametersProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): AttentionParametersProvider => {
        const params = {
          noContactDays: config.get('ATTENTION_NO_CONTACT_DAYS', { infer: true }),
          eventWindowDays: config.get('ATTENTION_EVENT_WINDOW_DAYS', { infer: true }),
        };
        return { get: () => params };
      },
    },
    OpportunityViews,
    ListOpportunitiesUseCase,
    GetOpportunityUseCase,
    ChangeStageUseCase,
    RegisterContactUseCase,
    UpdateOpportunityUseCase,
    ListSellersUseCase,
    GetMetaUseCase,
  ],
  exports: [OpportunityRepository, SellerRepository, AttentionParametersProvider, OpportunityViews],
})
export class OpportunitiesModule {}
