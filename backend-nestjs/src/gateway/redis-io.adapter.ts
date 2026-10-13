import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { INestApplicationContext } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(configService: ConfigService): Promise<void> {
    const isCluster =
      process.env.REDIS_CLUSTER_MODE === 'true' ||
      process.env.REDIS_ENABLE_CLUSTER === 'true';

    const url = configService.get<string>('redis.url');
    const host = configService.get<string>('redis.host') || '127.0.0.1';
    const port = configService.get<number>('redis.port') || 6379;
    const password = configService.get<string>('redis.password');
    const useTls =
      process.env.REDIS_TLS === 'true' ||
      Boolean(url && url.startsWith('rediss://'));

    const options: any = {
      host,
      port,
      password: password || undefined,
      tls: useTls ? {} : undefined,
    };

    let pubClient: any;
    let subClient: any;

    if (isCluster) {
      const nodes = [{ host, port }];
      const clusterOpts = {
        redisOptions: {
          password: password || undefined,
          tls: useTls ? {} : undefined,
        },
      };
      pubClient = new Redis.Cluster(nodes, clusterOpts);
      subClient = new Redis.Cluster(nodes, clusterOpts);
    } else if (url) {
      pubClient = new Redis(url, options);
      subClient = new Redis(url, options);
    } else {
      pubClient = new Redis(options);
      subClient = new Redis(options);
    }

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
