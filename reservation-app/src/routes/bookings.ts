// src/routes/bookings.ts

import { Hono } from 'hono';
import { db } from '../db/index.js'; // DBインスタンスのインポート
import { bookings, rooms, users } from '../db/schema.js'; // スキーマのインポート
import { eq, and, sql, gt, lt, param, gte, lte } from 'drizzle-orm'; // Drizzle ORM のクエリヘルパー
import { v4 as uuidv4 } from 'uuid'; // UUID生成用
import { type ContentfulStatusCode } from 'hono/utils/http-status'; // ContentfulStatusCode 型をインポート (PUT/DELETE用)

// 新しいHonoインスタンスをルーターとして作成
const bookingsRouter = new Hono();

// GET /api/bookings: すべての予約を取得 (管理用など)
bookingsRouter.get('/', async (c) => {
  try {
    const allBookings = await db.select().from(bookings);
    return c.json(allBookings); // 予約情報をJSON形式で返す
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return c.json({ error: 'Failed to fetch bookings' }, 500 as ContentfulStatusCode); // 型キャスト追加
  }
});

// POST /api/bookings: 新しい予約を登録
bookingsRouter.post('/', async (c) => {
  // 認証済みユーザー情報を取得
  const auth = c.get('authUser');
  if (!auth || !auth.session?.user?.id) {
    return c.redirect('/api/auth/signin?error=AuthenticationRequired');
  }

  const userId = auth.session.user.id;
  const body = await c.req.parseBody();

  const roomId = body['room_id'] as string;
  const bookingDateStr = body['booking_date'] as string;
  const startTimeOnlyStr = body['start_time_only'] as string;
  const endTimeOnlyStr = body['end_time_only'] as string;
  const purpose = body['purpose'] ? (body['purpose'] as string) : null;

  if (!roomId || !bookingDateStr || !startTimeOnlyStr || !endTimeOnlyStr) {
    return c.redirect('/?error=MissingFields');
  }

  const startTime = new Date(`${bookingDateStr}T${startTimeOnlyStr}:00`);
  const endTime = new Date(`${bookingDateStr}T${endTimeOnlyStr}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return c.redirect('/?error=InvalidTime');
  }
  if (startTime >= endTime || startTime < new Date()) {
    return c.redirect('/?error=InvalidTime');
  }

  type TransactionSuccess = {
    success: true;
    redirectSuccess: string;
  };

  type TransactionFailure = {
    success: false;
    redirectError: string;
  };

  type TransactionResult = TransactionSuccess | TransactionFailure;

  let transactionResult: TransactionResult;

  try {
    transactionResult = await db.transaction(async (tx) => {
      // 部屋が存在するか確認
      const roomExists = await tx.select().from(rooms).where(eq(rooms.id, roomId));
      if (roomExists.length === 0) {
        throw new Error('RoomNotFound');
      }

      // 重複予約チェック
      const overlappingBookings = await tx.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.room_id, roomId),
            lte(bookings.start_time, param(endTime)),
            gte(bookings.end_time, param(startTime)),
            eq(bookings.status, 'confirmed')
          )
        )
        .for('update');

      if (overlappingBookings.length > 0) {
        throw new Error('TimeOverlap');
      }

      // 予約挿入
      const newBookingId = uuidv4();
      await tx.insert(bookings).values({
        id: newBookingId,
        room_id: roomId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose,
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date(),
      });

      return { success: true, redirectSuccess: 'ReservationSuccess' };
    });
  } catch (e) {
    // エラーを transactionResult に格納
    const errMsg = e instanceof Error ? e.message : 'UnknownError';
    transactionResult = { success: false, redirectError: errMsg };
  }

  if (transactionResult.success) {
    return c.redirect(`/?success=${transactionResult.redirectSuccess}`);
  } else {
    return c.redirect(`/?error=${transactionResult.redirectError}`);
  }
});

// DELETE /api/bookings/:id - 予約の削除 (APIテストツール用)
bookingsRouter.delete('/:id', async (c) => {
  const auth = c.get('authUser');
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.json({ error: 'Authentication required.' }, 401 as ContentfulStatusCode);
  }

  const userId = auth.session.user.id;
  const bookingId = c.req.param('id');

  try {
    const deleteResult = await db.delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.user_id, userId)));

    if (deleteResult[0].affectedRows === 0) {
      return c.json({ message: 'Booking not found or you do not have permission to delete it.' }, 404 as ContentfulStatusCode);
    }

    return c.json({ message: 'Booking deleted successfully!' }, 200 as ContentfulStatusCode);
  } catch (error) {
    console.error('Failed to delete booking:', error);
    return c.json({ error: 'Failed to delete booking.' }, 500 as ContentfulStatusCode);
  }
});

// POST /api/bookings/delete/:id - HTMLフォームからの削除リクエスト用 (既存のコード)
bookingsRouter.post('/delete/:id', async (c) => {
  const auth = c.get('authUser');
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.redirect('/api/auth/signin?error=AuthenticationRequired');
  }

  const userId = auth.session.user.id;
  const bookingId = c.req.param('id');

  try {
    const deleteResult = await db.delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.user_id, userId)));

    if (deleteResult[0].affectedRows === 0) {
      return c.redirect('/?error=BookingNotFoundOrNoPermission');
    }

    return c.redirect('/?success=BookingDeleted');
  } catch (error) {
    console.error('Failed to delete booking via POST:', error);
    return c.redirect('/?error=FailedToDeleteBooking');
  }
});


export default bookingsRouter; // ルーターをエクスポート
