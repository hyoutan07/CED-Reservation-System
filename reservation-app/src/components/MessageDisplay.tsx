import { html } from "hono/html";

export const MessageDisplay = ({ type, message }: { type: 'success' | 'error'; message: string }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';

  // メッセージコードをユーザーフレンドリーなテキストに変換
  const userFriendlyMessage = {
    // 成功メッセージ
    ReservationSuccess: '予約が正常に作成されました！',
    // エラーメッセージ
    AuthenticationRequired: '認証が必要です。ログインしてください。',
    MissingFields: '必要な情報が入力されていません。',
    InvalidTime: '予約時間が無効です。開始時刻が終了時刻より前か、現在時刻より後か確認してください。',
    RoomNotFound: '選択された部屋が見つかりません。',
    TimeOverlap: '選択された時間帯はすでに予約済みです。別の時間をお選びください。',
    DatabaseError: 'データベースエラーが発生しました。',
    TransactionFailed: '予約処理中にエラーが発生しました。',
    ServerError: 'サーバーで予期せぬエラーが発生しました。'
    // 他の可能性のあるエラーメッセージもここに追加
  }[message] || message; // マッピングがなければ元のメッセージを表示

  return html`
    <div class="${bgColor} ${textColor} p-3 rounded-md mb-4 text-center">
      ${userFriendlyMessage}
    </div>
  `;
};
