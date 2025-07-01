// src/routes/rooms.ts

import { Hono } from 'hono';
import { db } from '../db/index.js'; // DBインスタンスのインポート
import { rooms } from '../db/schema.js'; // roomsスキーマのインポート

// 新しいHonoインスタンスをルーターとして作成
const roomsRouter = new Hono();

// GET /api/rooms: すべての部屋の情報を取得
roomsRouter.get('/', async (c) => {
  try {
    const allRooms = await db.select().from(rooms);
    return c.json(allRooms); // 部屋情報をJSON形式で返す
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return c.json({ error: 'Failed to fetch rooms' }, 500);
  }
});

export default roomsRouter; // ルーターをエクスポート
