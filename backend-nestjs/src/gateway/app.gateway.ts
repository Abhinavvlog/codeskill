import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenService } from '../auth/token.service';
import { Contest } from '../database/entities/contest.entity';
import { resolveAllowedCorsOrigins, isOriginAllowed } from '../common/cors.util';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = resolveAllowedCorsOrigins();
      const isProd = process.env.NODE_ENV === 'production';
      if (isOriginAllowed(origin, allowed, isProd)) {
        callback(null, true);
      } else {
        callback(new Error('WebSocket connection rejected by CORS policy'));
      }
    },
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private readonly socketRateLimits = new Map<string, { count: number; resetAt: number }>();
  private readonly nodeId = `${process.pid}-${Math.random().toString(36).slice(2, 9)}`;
  private subscriberClient?: any;

  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  async onModuleInit() {
    try {
      if (this.redisService) {
        this.subscriberClient = this.redisService.createSubscriberClient();
        if (typeof this.subscriberClient?.subscribe === 'function') {
          await this.subscriberClient.subscribe('codeskill:ws:events');
          this.subscriberClient.on('message', (channel: string, message: string) => {
            if (channel === 'codeskill:ws:events') {
              try {
                const payload = JSON.parse(message);
                if (payload.nodeId === this.nodeId && this.server) {
                  return;
                }
                const { target, targetId, event, data } = payload;
                if (target === 'user' && targetId) {
                  this.server?.to(`user_${targetId}`).emit(event, data);
                } else if (target === 'contest' && targetId) {
                  this.server?.to(`contest_${targetId}`).emit(event, data);
                }
              } catch (err: any) {
                this.logger.warn(`Failed to parse Redis WS event: ${err?.message || err}`);
              }
            }
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize Redis pub/sub listener in AppGateway: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    if (this.subscriberClient && typeof this.subscriberClient.quit === 'function') {
      try {
        await this.subscriberClient.quit();
      } catch {
        // ignore
      }
    }
  }

  private checkRateLimit(client: Socket): boolean {
    const now = Date.now();
    const record = this.socketRateLimits.get(client.id) || { count: 0, resetAt: now + 1000 };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + 1000;
    } else {
      record.count++;
    }
    this.socketRateLimits.set(client.id, record);
    if (record.count > 25) {
      this.logger.warn(`Rate limit exceeded for client ${client.id}`);
      client.emit('error', { message: 'Too many requests. Please slow down.' });
      return false;
    }
    return true;
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string);

      if (!authHeader) {
        this.logger.warn(`Unauthenticated connection rejected: socket ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      const user = await this.tokenService.authenticateAccessToken(token);
      if (!user) {
        this.logger.warn(`Invalid or expired token for socket ${client.id}`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect(true);
        return;
      }

      client.data.user = user;
      client.data.userId = user.id;

      // Automatically join the authenticated user's private room
      const userRoom = `user_${user.id}`;
      client.join(userRoom);

      this.logger.log(`Authenticated client connected: ${client.id} (user: ${user.id})`);
    } catch (err: any) {
      this.logger.error(`Error during socket connection authentication: ${err.message}`);
      client.emit('error', { message: 'Authentication failure' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.socketRateLimits.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_contest')
  async handleJoinContest(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.checkRateLimit(client)) return;

    const user = client.data?.user;
    const userId = client.data?.userId;

    if (!user || !userId) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    const { contestId } = data || {};
    if (!contestId) {
      client.emit('error', { message: 'Contest ID is required' });
      return;
    }

    // Verify contest existence and user registration or admin role (AUD-024)
    const contest = await this.contestRepo.findOne({
      where: [{ id: contestId }, { mongoId: contestId }],
    });

    if (!contest) {
      client.emit('error', { message: 'Contest not found' });
      return;
    }

    const isPlatformAdmin =
      user.isAdmin ||
      ['admin', 'super_admin', 'student_admin', 'assessment_admin'].includes(user.role);

    const isParticipant =
      Array.isArray(contest.participants) && contest.participants.includes(userId);

    if (!isParticipant && !isPlatformAdmin) {
      this.logger.warn(
        `User ${userId} attempted to join unauthorized contest ${contestId}`,
      );
      client.emit('error', {
        message: 'You are not registered for this contest',
      });
      return;
    }

    const roomName = `contest_${contestId}`;
    client.join(roomName);
    this.logger.log(`User ${userId} joined room ${roomName}`);
    client.to(roomName).emit('user_joined', { userId });
  }

  @SubscribeMessage('leave_contest')
  handleLeaveContest(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.checkRateLimit(client)) return;

    const userId = client.data?.userId;
    const { contestId } = data || {};
    if (contestId && userId) {
      const roomName = `contest_${contestId}`;
      client.leave(roomName);
      this.logger.log(`User ${userId} left room ${roomName}`);
      client.to(roomName).emit('user_left', { userId });
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    if (!this.checkRateLimit(client)) return;

    const authUserId = client.data?.userId;
    const { userId } = data || {};

    if (!authUserId) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    const isPlatformAdmin =
      client.data.user?.isAdmin ||
      ['admin', 'super_admin'].includes(client.data.user?.role);

    // Prevent joining rooms belonging to other users
    if (userId !== authUserId && !isPlatformAdmin) {
      this.logger.warn(
        `User ${authUserId} attempted to join room of user ${userId}`,
      );
      client.emit('error', {
        message: 'Cannot join room belonging to another user',
      });
      return;
    }

    const roomName = `user_${userId}`;
    client.join(roomName);
    this.logger.log(`User ${authUserId} confirmed in room ${roomName}`);
  }

  // Used to notify all clients in a contest room
  broadcastToContest(contestId: string, event: string, data: any) {
    const roomName = `contest_${contestId}`;
    if (this.server) {
      this.server.to(roomName).emit(event, data);
    }
    if (this.redisService) {
      this.redisService.publish(
        'codeskill:ws:events',
        JSON.stringify({
          nodeId: this.nodeId,
          target: 'contest',
          targetId: contestId,
          event,
          data,
        }),
      );
    }
  }

  // Used to notify a specific user
  emitToUser(userId: string, event: string, data: any) {
    const roomName = `user_${userId}`;
    if (this.server) {
      this.server.to(roomName).emit(event, data);
    }
    if (this.redisService) {
      this.redisService.publish(
        'codeskill:ws:events',
        JSON.stringify({
          nodeId: this.nodeId,
          target: 'user',
          targetId: userId,
          event,
          data,
        }),
      );
    }
  }
}
