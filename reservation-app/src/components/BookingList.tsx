// src/components/BookingList.tsx
import { format } from 'date-fns'; // 日付フォーマット用ライブラリをインポート
import { ja } from 'date-fns/locale'; // 日本語ロケールをインポート

// 予約データの型定義 (schema.ts の $inferSelect と一致させる)
// room も含まれるため、ネストした型定義が必要
interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  purpose: string | null;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  room?: { // 関連する部屋情報
    id: string;
    name: string;
    capacity: number;
    description: string | null;
  };
}

interface BookingListProps {
  userBookings: Booking[]; // ユーザーの予約リスト
  userName?: string | null; // ユーザー名 (表示用、必須ではない)
}

export const BookingList = ({ userBookings, userName }: BookingListProps) => {
  return (
    <div className="mt-8 text-left border-t pt-6 border-gray-200 bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        {userName ? `${userName}さんの予約` : 'あなたの予約'}
      </h2>
      {userBookings.length === 0 ? (
        <p className="text-gray-600 text-center">まだ予約がありません。</p>
      ) : (
        <ul className="space-y-4">
          {userBookings.map((booking) => (
            <li key={booking.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-lg font-semibold text-gray-800">
                部屋: {booking.room?.name || '不明な部屋'}
              </p>
              <p className="text-sm text-gray-600">
                開始: {format(booking.start_time, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </p>
              <p className="text-sm text-gray-600">
                終了: {format(booking.end_time, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </p>
              {booking.purpose && (
                <p className="text-sm text-gray-600">目的: {booking.purpose}</p>
              )}
              <p className={`text-sm font-medium ${booking.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'}`}>
                ステータス: {booking.status === 'confirmed' ? '確定済み' : '保留中'}
              </p>
              {/* ★追加: 削除ボタン */}
              <form action={`/api/bookings/delete/${booking.id}`} method="post" className="ml-4">
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-2 rounded-lg shadow transition duration-300 focus:outline-none focus:shadow-outline"
                // 削除確認のJavaScriptを追加することも可能ですが、今回はシンプルに
                // onClick="return confirm('本当にこの予約を削除しますか？');"
                >
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
