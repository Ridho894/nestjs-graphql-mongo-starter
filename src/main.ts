import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      cors: AppConfig.cors,
      bodyParser: AppConfig.bodyParser,
      logger: ['debug', 'error', 'warn', 'log'],
    },
  );

  app.use(
    '/graphql',
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  app.use('/graphql', graphqlUploadExpress(AppConfig.graphqlUpload));

  app.use((req, res, next) => {
    if (req.path !== '/graphql') {
      helmet()(req, res, next);
    } else {
      next();
    }
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use('/uploads', express.static(AppConfig.staticFiles.uploadsPath));

  const logger = new Logger('Bootstrap');
  await app.listen(AppConfig.port);
  logger.log(`Application is running on port ${AppConfig.port}`);
  logger.log(`GraphQL endpoint available at /graphql`);
}
bootstrap();
