// src/components/Welcome.tsx
interface WelcomeProps {
  userName?: string | null;
}

// Welcome コンポーネント: 純粋なコンテンツ部分のみを返します。
// HTMLの基本構造（DOCTYPE, head, bodyなど）は Layout コンポーネントが提供します。
export const Welcome = ({ userName }: WelcomeProps) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Hono Auth アプリ
      </h1>
      <p className="text-xl text-gray-700 mb-6">
        {userName ? `こんにちは、${userName}さん！` : 'ようこそ！サインインしてください。'}
      </p>
      <div className="space-y-4">
        <a href="/api/auth/signin" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300">
          サインイン
        </a>
        <a href="/api/auth/signout" className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300">
          サインアウト
        </a>
      </div>
    </div>
  );
};
