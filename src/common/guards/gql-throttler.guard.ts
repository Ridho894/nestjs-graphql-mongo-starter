import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

interface RequestWithIP extends Request {
  ip?: string;
  headers: any;
  connection?: {
    remoteAddress?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
}

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  private logger = new Logger(GqlThrottlerGuard.name);

  // List of GraphQL fields that should bypass throttling
  private skipThrottleFields = [
    'publicUserStats',
    // Add more fields here as needed, for example:
    // 'getPublicConfig',
    // 'healthCheck',
  ];

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // For non-GraphQL requests, use the parent implementation
    if (context.getType<GqlContextType>() !== 'graphql') {
      return super.canActivate(context);
    }

    // For GraphQL requests, get the resolver and field name
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const fieldName = info?.fieldName;

    this.logger.debug(`GraphQL field: ${fieldName}`);

    // Special case: Manually check for fields that should skip throttling
    // This is a workaround since the @SkipThrottle decorator metadata isn't being detected
    if (this.skipThrottleFields.includes(fieldName)) {
      this.logger.debug(`Explicitly skipping throttle for ${fieldName}`);
      return true;
    }

    // Get the parent class (Resolver) and method (Query/Mutation)
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check for SkipThrottle at both method and class level
    const methodSkipThrottle = this.reflector.get('skipThrottle', handler);
    const classSkipThrottle = this.reflector.get('skipThrottle', classRef);

    this.logger.debug(
      `Method skipThrottle: ${JSON.stringify(methodSkipThrottle)}`,
    );
    this.logger.debug(
      `Class skipThrottle: ${JSON.stringify(classSkipThrottle)}`,
    );

    // If method explicitly sets skipThrottle
    if (methodSkipThrottle !== undefined) {
      const shouldSkip = this.shouldSkipThrottle(methodSkipThrottle);
      if (shouldSkip) {
        this.logger.debug(
          `Skipping throttle for ${fieldName} due to method decorator`,
        );
        return true;
      }
    }

    // If class has skipThrottle and method doesn't override it
    if (classSkipThrottle !== undefined && methodSkipThrottle === undefined) {
      const shouldSkip = this.shouldSkipThrottle(classSkipThrottle);
      if (shouldSkip) {
        this.logger.debug(
          `Skipping throttle for ${fieldName} due to class decorator`,
        );
        return true;
      }
    }

    // Apply throttling
    return super.canActivate(context);
  }

  private shouldSkipThrottle(skipThrottle: any): boolean {
    if (skipThrottle === true) {
      return true;
    }

    if (typeof skipThrottle === 'object') {
      // Check if any throttler should be skipped
      for (const key in skipThrottle) {
        if (skipThrottle[key] === true) {
          return true;
        }
      }
    }

    return false;
  }
}
