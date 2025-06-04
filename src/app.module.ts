import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { PubSub } from 'graphql-subscriptions';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { APP_GUARD } from '@nestjs/core';

import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

const pubSub = new PubSub();
dotenv.config();

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      installSubscriptionHandlers: true,
      context: ({ req, res, connection }) => ({
        req,
        res,
        connection,
        pubSub,
      }),
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      playground: true,
      formatError: (error) => {
        return error;
      },
    }),

    MongooseModule.forRoot(process.env.MONGO_URI),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    UsersModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
