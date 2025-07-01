import {
  boolean,
  int,
  timestamp,
  mysqlTable,
  primaryKey,
  varchar,
  mysqlEnum,
} from "drizzle-orm/mysql-core"
import mysql from "mysql2/promise"
import { drizzle } from "drizzle-orm/mysql2"
import type { AdapterAccountType } from '@auth/core/adapters'
import { relations } from "drizzle-orm"
 
export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }),
  image: varchar("image", { length: 255 }),
})
 
export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccountType>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 255 }),
    access_token: varchar("access_token", { length: 255 }),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: varchar("id_token", { length: 2048 }),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)
 
export const sessions = mysqlTable("session", {
  sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)
 
export const authenticators = mysqlTable(
  "authenticator",
  {
    credentialID: varchar("credentialID", { length: 255 }).notNull().unique(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    credentialPublicKey: varchar("credentialPublicKey", {
      length: 255,
    }).notNull(),
    counter: int("counter").notNull(),
    credentialDeviceType: varchar("credentialDeviceType", {
      length: 255,
    }).notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: varchar("transports", { length: 255 }),
  },
  (authenticator) => ({
    compositePk: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

// rooms テーブル (部屋の情報)
export const rooms = mysqlTable('rooms', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(), // 部屋のID (UUIDなどを想定)
  name: varchar('name', { length: 255 }).notNull().unique(), // 部屋の名前 (例: 会議室A)
  capacity: int('capacity').notNull(),                      // 部屋の収容人数
  description: varchar('description', { length: 512 }),     // 部屋の説明
  // 必要に応じて、部屋のタイプ、場所などのカラムを追加することもできます
});

// rooms テーブルと bookings テーブルのリレーションシップ
export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings), // rooms テーブルから bookings への一対多のリレーション
}));

// bookings テーブル (予約情報)
export const bookings = mysqlTable('bookings', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(), // 予約のID (UUIDなどを想定)
  room_id: varchar('room_id', { length: 255 }).notNull(),   // 予約された部屋のID
  user_id: varchar('user_id', { length: 255 }).notNull(),   // 予約したユーザーのID
  start_time: timestamp('start_time', { mode: 'date' }).notNull(), // 予約開始日時
  end_time: timestamp('end_time', { mode: 'date' }).notNull(),     // 予約終了日時
  purpose: varchar('purpose', { length: 255 }),             // 予約の目的
  status: mysqlEnum('status', ['confirmed', 'pending', 'cancelled']).default('pending').notNull(), // 予約の状態
  created_at: timestamp('created_at').defaultNow().notNull(), // レコード作成日時
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(), // レコード最終更新日時
});

// bookings テーブルと他のテーブルのリレーションシップ
export const bookingsRelations = relations(bookings, ({ one }) => ({
  room: one(rooms, { fields: [bookings.room_id], references: [rooms.id] }), // bookings から rooms への多対一のリレーション
  user: one(users, { fields: [bookings.user_id], references: [users.id] }), // bookings から users への多対一のリレーション
}));
