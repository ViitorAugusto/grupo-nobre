import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service.js';
import { SellerRepository } from '../application/opportunity.repository.js';
import type { SellerRef } from '../domain/opportunity.js';

@Injectable()
export class PrismaSellerRepository extends SellerRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findAll(): Promise<SellerRef[]> {
    return this.prisma.seller.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
