import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { graphqlUploadExpress } from 'graphql-upload-ts';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { exportSchemasAfterInit } from './graphql/module-schema.factory';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      cors: AppConfig.cors,
      bodyParser: AppConfig.bodyParser,
    },
  );

  app.use('/graphql', graphqlUploadExpress(AppConfig.graphqlUpload));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use('/uploads', express.static(AppConfig.staticFiles.uploadsPath));

  await app.listen(AppConfig.port);

  await exportSchemasAfterInit(app);
}

bootstrap();
