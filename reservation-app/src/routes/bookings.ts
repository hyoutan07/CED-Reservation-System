// src/routes/bookings.ts

import { Hono } from 'hono';
import { db } from '../db/index.js'; // DBインスタンスのインポート
import { bookings, rooms, users } from '../db/schema.js'; // スキーマのインポート
import { eq, and, sql } from 'drizzle-orm'; // Drizzle ORM のクエリヘルパー
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
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.redirect('/api/auth/signin?error=AuthenticationRequired');
  }

  const userId = auth.session.user.id; // 認証済みユーザーのID
  const body = await c.req.parseBody(); // フォームデータをパース (application/x-www-form-urlencoded または multipart/form-data)

  // フォームからの入力値を取得
  const roomId = body['room_id'] as string;
  const bookingDateStr = body['booking_date'] as string; // ★変更
  const startTimeOnlyStr = body['start_time_only'] as string; // ★変更
  const endTimeOnlyStr = body['end_time_only'] as string; // ★変更
  const purpose = body['purpose'] ? (body['purpose'] as string) : null; // 目的は任意

  // 入力値の基本的なバリデーション
  if (!roomId || !bookingDateStr || !startTimeOnlyStr || !endTimeOnlyStr) { // ★変更
    return c.redirect('/?error=MissingFields');
  }

  // ★変更: 日付と時刻を結合してDateオブジェクトを作成
  const startTime = new Date(`${bookingDateStr}T${startTimeOnlyStr}:00`);
  const endTime = new Date(`${bookingDateStr}T${endTimeOnlyStr}:00`);

  // 日付の有効性チェック
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return c.redirect('/?error=InvalidTime');
  }
  if (startTime >= endTime) {
    return c.redirect('/?error=InvalidTime');
  }
  if (startTime < new Date()) {
    return c.redirect('/?error=InvalidTime');
  }

  // データベーストランザクションを開始
  const transactionResult = await db.transaction(async (tx) => {
    // 選択された部屋が存在するか確認
    const roomExists = await tx.select().from(rooms).where(eq(rooms.id, roomId));
    if (roomExists.length === 0) {
      tx.rollback();
      return { success: false, redirectError: 'RoomNotFound' };
    }

    // 重複する予約をチェック (確定済みの予約のみを対象)
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
      .for('update');

    if (overlappingBookings.length > 0) {
      tx.rollback();
      return { success: false, redirectError: 'TimeOverlap' };
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
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { success: true, redirectSuccess: 'ReservationSuccess' };
  });

  if (transactionResult.success) {
    return c.redirect(`/?success=${transactionResult.redirectSuccess}`);
  } else {
    return c.redirect(`/?error=${transactionResult.redirectError}`);
  }
});

// GET /api/bookings/my - ログインユーザーの予約一覧を取得 (既存のコード)
bookingsRouter.get('/my', async (c) => {
  const auth = c.get('authUser');
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.json({ error: 'Authentication required to view your bookings.' }, 401 as ContentfulStatusCode);
  }

  const userId = auth.session.user.id;

  try {
    // ユーザーIDに基づいて予約を取得し、関連する部屋情報も同時に取得
    const userBookings = await db.query.bookings.findMany({
      where: eq(bookings.user_id, userId),
      with: {
        room: true, // 関連する部屋情報を取得
      },
      orderBy: [bookings.start_time], // 開始時間でソート
    });

    return c.json(userBookings);
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    return c.json({ error: 'Failed to fetch your bookings.' }, 500 as ContentfulStatusCode);
  }
});

// PUT /api/bookings/:id - 予約の更新
bookingsRouter.put('/:id', async (c) => {
  const auth = c.get('authUser');
  if (!auth || !auth.session || !auth.session.user || !auth.session.user.id) {
    return c.json({ error: 'Authentication required.' }, 401 as ContentfulStatusCode);
  }

  const userId = auth.session.user.id;
  const bookingId = c.req.param('id'); // URLパラメータから予約IDを取得
  const body = await c.req.json(); // JSON形式で更新データを受け取る

  const { room_id, start_time, end_time, purpose, status } = body;

  // 入力値のバリデーション
  if (!room_id || !start_time || !end_time) {
    return c.json({ error: 'Missing required fields for update.' }, 400 as ContentfulStatusCode);
  }

  const newStartTime = new Date(start_time);
  const newEndTime = new Date(end_time);

  if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime()) || newStartTime >= newEndTime || newStartTime < new Date()) {
    return c.json({ error: 'Invalid date/time format or time sequence for update.' }, 400 as ContentfulStatusCode);
  }

  const transactionResult = await db.transaction(async (tx) => {
    // 1. 更新対象の予約がログインユーザーのものであるか確認
    const existingBooking = await tx.select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.user_id, userId)));

    if (existingBooking.length === 0) {
      tx.rollback();
      return { success: false, message: 'Booking not found or you do not have permission to update it.', status: 404 as ContentfulStatusCode };
    }

    // 2. 部屋の存在チェック (もし room_id が変更される可能性があるなら)
    const roomExists = await tx.select().from(rooms).where(eq(rooms.id, room_id));
    if (roomExists.length === 0) {
      tx.rollback();
      return { success: false, message: 'Selected room for update does not exist.', status: 404 as ContentfulStatusCode };
    }

    // 3. 更新後の時間帯で重複がないかチェック (自分自身を除く)
    const overlappingBookings = await tx.select()
      .from(bookings)
      .where(
        and(
          eq(bookings.room_id, room_id),
          sql`${newStartTime} < ${bookings.end_time}`,
          sql`${newEndTime} > ${bookings.start_time}`,
          eq(bookings.status, 'confirmed'),
          sql`${bookings.id} != ${bookingId}` // 更新対象の予約自身は重複チェックから除外
        )
      )
      .for('update');

    if (overlappingBookings.length > 0) {
      tx.rollback();
      return { success: false, message: 'Updated time slot overlaps with an existing confirmed booking for this room.', status: 409 as ContentfulStatusCode };
    }

    // 4. 予約の更新
    await tx.update(bookings)
      .set({
        room_id: room_id,
        start_time: newStartTime,
        end_time: newEndTime,
        purpose: purpose,
        status: status || 'confirmed', // ステータスも更新可能にする (デフォルトはconfirmed)
        updated_at: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return { success: true, message: 'Booking updated successfully!', status: 200 as ContentfulStatusCode };
  });

  return c.json({ message: transactionResult.message }, transactionResult.status);
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
