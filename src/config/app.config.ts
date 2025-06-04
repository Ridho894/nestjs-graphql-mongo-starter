import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  graphqlUpload: {
    maxFileSize: 10000000,
    maxFiles: 10,
  },
  staticFiles: {
    uploadsPath: join(__dirname, '..', '..', 'uploads'),
  },
  cors: true,
  bodyParser: true,
};
