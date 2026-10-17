import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';

export interface RequestStore {
  traceId: string;
  userId?: string;
  role?: string;
  ip?: string;
  path?: string;
  startTime: bigint;
}

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestStore>();

  static run<T>(store: RequestStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  static getStore(): RequestStore | undefined {
    return this.storage.getStore();
  }

  static getTraceId(): string {
    return this.storage.getStore()?.traceId || 'untraced-background-task';
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
