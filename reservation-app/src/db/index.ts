// my-hono-app/src/db/index.ts

// dotenv をインポートし、.env ファイルを読み込む
// .env ファイルがプロジェクトルートのさらに一つ上にある場合 (例: ../../.env)
import dotenv from 'dotenv';
dotenv.config({ path: '../../../.env' }); // <-- ここを修正！

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise'; // async/await をサポートする 'mysql2/promise' を使用
import * as schema from './schema.js'; // 作成したスキーマをインポート

const poolConnection = mysql.createPool({
  // 環境変数からデータベース接続情報を取得
  // 環境変数が設定されていない場合のフォールバック値も設定
  host: process.env.DB_HOST || '127.0.0.1',           // .envから読み込む
  port: parseInt(process.env.DB_PORT || '3306', 10), // .envから読み込む (数値に変換)
  user: process.env.DB_USER || 'user',                // .envから読み込む
  password: process.env.DB_PASSWORD || 'password',        // .envから読み込む
  database: process.env.DB_DATABASE || 'my_app_db',       // .envから読み込む
  timezone: "Z"
});

export const db = drizzle(poolConnection, { schema, mode: "default" });
