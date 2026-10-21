import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReferenceDateProvider } from '../shared/domain/reference-date.js';
import { ConfigReferenceDateProvider } from './config-reference-date.provider.js';
import { validateEnv } from './env.js';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv })],
  providers: [{ provide: ReferenceDateProvider, useClass: ConfigReferenceDateProvider }],
  exports: [ReferenceDateProvider],
})
export class AppConfigModule {}
