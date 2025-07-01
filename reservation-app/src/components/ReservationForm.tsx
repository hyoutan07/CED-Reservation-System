// src/components/ReservationForm.tsx

export interface Room {
  id: string;
  name: string;
  capacity: number;
  description?: string | null;
}
interface Props {
  rooms: Room[];
  userName?: string | null; // userName もpropsとして受け取ることを想定
}

export const ReservationForm = ({ rooms, userName }: Props) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        予約フォーム
      </h2>
      <form action="/api/bookings" method="post">
        <div className="mb-4">
          <label htmlFor="room_id" className="block text-gray-700 text-sm font-bold mb-2">
            部屋を選択:
          </label>
          <select
            id="room_id"
            name="room_id"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
          >
            {rooms.length === 0 ? (
              <option value="">利用可能な部屋がありません</option>
            ) : (
              <>
                <option value="">部屋を選択してください</option>
                {rooms.map((room) => (
                  <option value={room.id} key={room.id}>
                    {room.name} (収容人数: {room.capacity})
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            お名前:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
            defaultValue={userName || ''} // ユーザー名をデフォルト値に設定
          />
        </div>

        {/* ★変更点: 日付、開始時間、終了時間を個別のフィールドに分割 */}
        <div className="mb-6">
          <label htmlFor="booking_date" className="block text-gray-700 text-sm font-bold mb-2">
            日付:
          </label>
          <input
            type="date"
            id="booking_date"
            name="booking_date" // 新しいname属性
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="start_time_only" className="block text-gray-700 text-sm font-bold mb-2">
            開始時間:
          </label>
          <input
            type="time"
            id="start_time_only"
            name="start_time_only" // 新しいname属性
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="end_time_only" className="block text-gray-700 text-sm font-bold mb-2">
            終了時間:
          </label>
          <input
            type="time"
            id="end_time_only"
            name="end_time_only" // 新しいname属性
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
          />
        </div>
        {/* ★変更点ここまで */}

        <div className="mb-6">
          <label htmlFor="purpose" className="block text-gray-700 text-sm font-bold mb-2">
            目的 (任意):
          </label>
          <textarea
            id="purpose"
            name="purpose"
            rows={3}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 focus:outline-none focus:shadow-outline"
          >
            予約を送信
          </button>
        </div>
      </form>
    </div>
  );
};