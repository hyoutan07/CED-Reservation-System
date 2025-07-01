// src/seed.ts

// dotenv をインポートし、.env ファイルを読み込む
// このスクリプトが reservation-app/src/seed.ts にある場合、.env は ../.env にあるはずです
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // ★あなたの .env のパスに合わせて調整

import { db } from './db/index.js'; // Drizzle ORM の DB インスタンスをインポート
import { rooms } from './db/schema.js'; // rooms スキーマのみをインポート
import { eq } from 'drizzle-orm'; // クエリヘルパーをインポート

// UUID を生成するためのライブラリ
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid が必要

async function seed() {
  console.log('--- シーディング開始 ---');

  try {
    // --- デフォルトの部屋データを作成 ---
    const defaultRoomName = 'CED202 (UECafe)';
    // 既に同じ名前の部屋が存在するか確認
    const existingDefaultRoom = await db.select().from(rooms).where(eq(rooms.name, defaultRoomName));

    if (existingDefaultRoom.length === 0) {
      console.log(`デフォルト部屋データ "${defaultRoomName}" を挿入中...`);
      await db.insert(rooms).values({
        id: uuidv4(), // 一意のIDを生成
        name: defaultRoomName,
        capacity: 20, // 仮の収容人数
        description: 'カフェをモチーフにしており、優雅に作業できる空間です。\n\n個人用のデスクはもちろん、大人数で作業できる大型の机やプロジェクターも完備され、チームでのMTG等にも有用です。',
      });
      console.log(`デフォルト部屋データ "${defaultRoomName}" を挿入しました。`);
    } else {
      console.log(`デフォルト部屋データ "${defaultRoomName}" は既に存在します。挿入をスキップします。`);
    }

    // ダミーのユーザーデータや予約データの生成ロジックは削除しました。
    // 必要であれば、Auth.jsでログインしてユーザーを作成してください。

    console.log('--- シーディング完了 ---');
    process.exit(0)

  } catch (error) {
    console.error('シーディング中にエラーが発生しました:', error);
    process.exit(1); // エラーで終了
  } finally {
    // データベース接続を閉じる必要がある場合はここで処理
    // mysql2/promise の createPool は自動的に接続を管理するため、明示的な close は不要なことが多い
    // process.exit(0); // 正常終了
  }
}

seed();
