import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

import { UsersModule } from './modules/users/users.module';
import { ModuleSchemaFactory } from './graphql/module-schema.factory';

const pubSub = new PubSub();
dotenv.config();

// Ensure schemas directory exists
const schemasDir = join(process.cwd(), 'src/graphql/schemas');
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      installSubscriptionHandlers: true,
      context: ({ req, connection }) => ({
        req,
        connection,
        pubSub,
      }),
      autoSchemaFile: join(process.cwd(), 'src/graphql/schemas/schema.gql'),
      buildSchemaOptions: {
        // Set orphanedTypes to ensure types are included properly
        orphanedTypes: [],
      },
      playground: true,
      formatError: (error) => {
        return error;
      },
    }),

    MongooseModule.forRoot(process.env.MONGO_URI),
    UsersModule,
  ],
  providers: [ModuleSchemaFactory],
})
export class AppModule {}
