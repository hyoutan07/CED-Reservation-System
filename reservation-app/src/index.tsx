// src/index.tsx

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // <-- あなたの .env のパスに合わせて調整

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js'
import Google from '@auth/core/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db/index.js'
import { accounts, authenticators, bookings, rooms, sessions, users, verificationTokens } from './db/schema.js'
import { html } from 'hono/html';
import { Welcome } from './components/Welcome.js';
import { Layout } from './components/Layout.js';
import { ReservationForm } from './components/ReservationForm.js';
import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';
import { BookingList } from './components/BookingList.js';
import { eq } from 'drizzle-orm';
import { MessageDisplay } from './components/MessageDisplay.js';

const app = new Hono()

app.use(
  '*',
  initAuthConfig((c) => ({
    secret: process.env.AUTH_SECRET as string,
    providers: [
      Google,
    ],
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
      authenticatorsTable: authenticators,
    }),
    callbacks: {
      async signIn({ account, profile }) {
        // profile オブジェクトには、Google から提供されるユーザーの情報が含まれています。
        // Google Workspace アカウントの場合、profile.hd にはホストされているドメインが含まれます。
        // production 環境では 'your-school.ac.jp' をあなたの学校の実際のドメインに置き換えてください。
        const allowedDomain = 'gl.cc.uec.ac.jp'; // ここをあなたの学校のドメインに置き換える！

        if (profile?.hd === allowedDomain) {
          console.log(`User ${profile.email} from ${profile.hd} allowed.`);
          return true; // ログインを許可
        } else {
          console.warn(`User ${profile?.email} from ${profile?.hd} (or no domain) denied.`);
          // ログインを拒否し、ユーザーを別のページにリダイレクトすることも可能です。
          // return '/unauthorized'; // 例えば、アクセス拒否ページにリダイレクト
          return false; // ログインを拒否
        }
      }
    }
  })
))

app.onError((err, c) => {
  if (err instanceof HTTPException && err.status === 401) {
    console.error('Authentication Error:', err.message);
    return c.redirect('/api/auth/signin');
  }
  console.error('Unhandled Error:', err);
  return c.text('Other Error', 500);
})

app.use('/api/auth/*', authHandler())

// 全てのページで認証を必須にする
app.use('*', verifyAuth())

// ★追加: モジュール化したルーターをHonoアプリケーションに登録
app.route('/api/rooms', roomsRouter);
app.route('/api/bookings', bookingsRouter)

// ルート (GET /) : Welcomeメッセージと予約フォームを表示
app.get('/', async (c) => {
  const auth = c.get('authUser');

  // サーバー側でデータ取得
  const allRooms = await db.select().from(rooms);

  const errorParam = c.req.query('error');
  const successParam = c.req.query('success');

  // ログインユーザーの予約情報を取得
  let userBookings: typeof bookings.$inferSelect[] = []; // 型定義
  if (auth && auth.session && auth.session.user && auth.session.user.id) {
    try {
      // ユーザーIDに基づいて予約を取得し、関連する部屋情報も同時に取得
      userBookings = await db.query.bookings.findMany({
        where: eq(bookings.user_id, auth.session.user.id),
        with: {
          room: true, // 関連する部屋情報を取得
        },
        orderBy: [bookings.start_time], // 開始時間でソート
      });
    } catch (error) {
      console.error('Failed to fetch user bookings on server:', error);
      // エラーが発生してもページは表示し続ける
    }
  }

  return c.html(
    <Layout title="Hono Auth Home">
      <div className="flex flex-col items-center justify-center w-full">
        <Welcome userName={auth.session?.user?.name} />
        {errorParam && <MessageDisplay type="error" message={errorParam} />}
        {successParam && <MessageDisplay type="success" message={successParam} />}
        <BookingList userBookings={userBookings} userName={auth.session?.user?.name} />
        <ReservationForm rooms={allRooms} />
      </div>
    </Layout>
  );
});

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
