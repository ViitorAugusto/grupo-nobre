import { Injectable } from '@nestjs/common';
import type { SellerRef } from '../domain/opportunity.js';
import { SellerRepository } from './opportunity.repository.js';

@Injectable()
export class ListSellersUseCase {
  constructor(private readonly sellers: SellerRepository) {}

  execute(): Promise<SellerRef[]> {
    return this.sellers.findAll();
  }
}
