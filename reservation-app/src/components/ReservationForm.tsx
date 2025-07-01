// src/components/ReservationForm.tsx

// ReservationForm コンポーネント: 名前と時間の入力フォームを提供
export const ReservationForm = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        予約フォーム
      </h2>
      {/* フォームの送信先を /submit-reservation に設定 */}
      <form action="/submit-reservation" method="post">
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
          />
        </div>
        <div className="mb-6">
          <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">
            時間:
          </label>
          <input
            type="time"
            id="time"
            name="time"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline transition duration-300 focus:border-blue-500"
            required
          />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 focus:outline-none focus:shadow-outline"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
};
