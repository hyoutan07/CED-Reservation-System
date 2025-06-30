// drizzle.config.ts
import type { Config } from 'drizzle-kit';

// dotenv の 'path' オプションが必要な場合はこちらを使用
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // .envが一つ上の階層にある場合

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',           // .envから読み込む
    port: parseInt(process.env.DB_PORT || '3306', 10), // .envから読み込む (数値に変換)
    user: process.env.DB_USER || 'user',                // .envから読み込む
    password: process.env.DB_PASSWORD || 'password',        // .envから読み込む
    database: process.env.DB_DATABASE || 'my_app_db',       // .envから読み込む
  },
} satisfies Config;