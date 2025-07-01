// src/routes/bookings.ts

import { Hono } from 'hono';
import { db } from '../db/index.js'; // DBインスタンスのインポート
import { bookings, rooms, users } from '../db/schema.js'; // スキーマのインポート
import { eq, and, sql } from 'drizzle-orm'; // Drizzle ORM のクエリヘルパー
import { v4 as uuidv4 } from 'uuid'; // UUID生成用
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// 新しいHonoインスタンスをルーターとして作成
const bookingsRouter = new Hono();

bookingsRouter.get('/', async (c) => {
  try {
    const allBookings = await db.select().from(bookings);
    return c.json(allBookings); // 部屋情報をJSON形式で返す
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }
});

// POST /api/bookings: 新しい予約を登録
bookingsRouter.post('/', async (c) => {
  // 認証済みユーザー情報を取得
  const auth = c.get('authUser');
  // ユーザーがログインしていない場合はエラーを返す
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.json({ error: 'Authentication required. Please sign in to make a reservation.' }, 401);
  }

  const userId = auth.session.user.id; // 認証済みユーザーのID
  const body = await c.req.parseBody(); // フォームデータをパース (application/x-www-form-urlencoded または multipart/form-data)

  // フォームからの入力値を取得
  const roomId = body['room_id'] as string;
  const startTimeStr = body['start_time'] as string;
  const endTimeStr = body['end_time'] as string;
  const purpose = body['purpose'] ? (body['purpose'] as string) : null; // 目的は任意

  // 入力値の基本的なバリデーション
  if (!roomId || !startTimeStr || !endTimeStr) {
    return c.json({ error: 'Missing required fields: room_id, start_time, end_time.' }, 400);
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);

  // 日付の有効性チェック
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return c.json({ error: 'Invalid date/time format. Please use a valid date and time.' }, 400);
  }
  if (startTime >= endTime) {
    return c.json({ error: 'Start time must be before end time.' }, 400);
  }
  if (startTime < new Date()) {
    return c.json({ error: 'Reservation start time cannot be in the past.' }, 400);
  }

  // データベーストランザクションを開始
  // トランザクション内で重複チェックと挿入を行うことで、競合状態を防ぎます
  const transactionResult = await db.transaction(async (tx) => {
    // 選択された部屋が存在するか確認
    const roomExists = await tx.select().from(rooms).where(eq(rooms.id, roomId));
    if (roomExists.length === 0) {
      tx.rollback(); // 存在しない部屋IDなのでロールバック
      return { success: false, message: 'Selected room does not exist.', status: 404 };
    }

    // 重複する予約をチェック (確定済みの予約のみを対象)
    // (new_start < existing_end) AND (new_end > existing_start) の条件で時間帯の重複を検出
    const overlappingBookings = await tx.select()
      .from(bookings)
      .where(
        and(
          eq(bookings.room_id, roomId), // 同じ部屋ID
          sql`${startTime} < ${bookings.end_time}`, // 新しい予約の開始時刻が既存の終了時刻より前
          sql`${endTime} > ${bookings.start_time}`, // 新しい予約の終了時刻が既存の開始時刻より後
          eq(bookings.status, 'confirmed') // 確定済みの予約のみをチェック対象とする
        )
      )
      .for('update'); // ★重要: 選択した行をロックし、他のトランザクションからの変更を防ぐ (競合状態対策)

    if (overlappingBookings.length > 0) {
      // 重複する予約が見つかった場合
      tx.rollback(); // トランザクションをロールバック
      return { success: false, message: 'Selected time slot overlaps with an existing confirmed booking for this room.', status: 409 }; // 409 Conflict
    }

    // 重複がなければ新しい予約を挿入
    const newBookingId = uuidv4();
    await tx.insert(bookings).values({
      id: newBookingId,
      room_id: roomId,
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
      purpose: purpose,
      status: 'confirmed', // 予約はデフォルトで確定済みとする
      created_at: new Date(), // 現在日時
      updated_at: new Date(), // 現在日時
    });

    return { success: true, message: 'Reservation created successfully!', status: 201 }; // 201 Created
  });

  // トランザクションの結果をクライアントに返す
  return c.json({ message: transactionResult.message }, transactionResult.status as ContentfulStatusCode);
});

export default bookingsRouter; // ルーターをエクスポート
