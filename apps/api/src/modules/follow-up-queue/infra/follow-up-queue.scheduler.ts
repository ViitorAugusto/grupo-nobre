import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { Env } from '../../../config/env.js';
import { GenerateFollowUpQueueUseCase } from '../application/generate-follow-up-queue.use-case.js';

export const FOLLOW_UP_QUEUE_JOB = 'follow-up-queue';

@Injectable()
export class FollowUpQueueScheduler implements OnModuleInit {
  private readonly logger = new Logger(FollowUpQueueScheduler.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly registry: SchedulerRegistry,
    private readonly generateQueue: GenerateFollowUpQueueUseCase,
  ) {}

  onModuleInit(): void {
    const job = CronJob.from({
      cronTime: this.config.get('FOLLOW_UP_QUEUE_CRON', { infer: true }),
      timeZone: this.config.get('FOLLOW_UP_QUEUE_TIMEZONE', { infer: true }),
      onTick: () => this.run(),
    });
    this.registry.addCronJob(FOLLOW_UP_QUEUE_JOB, job);
    job.start();
  }

  async run(): Promise<void> {
    try {
      const result = await this.generateQueue.execute();
      const total = result.sellers.reduce((sum, s) => sum + s.itemCount, 0);
      this.logger.log(`Fila de ${result.date} gerada: ${total} retorno(s).`);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.stack : String(error));
    }
  }
}
