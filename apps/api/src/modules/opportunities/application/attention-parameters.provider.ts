import type { AttentionParameters } from '../domain/attention.js';

export abstract class AttentionParametersProvider {
  abstract get(): AttentionParameters;
}
