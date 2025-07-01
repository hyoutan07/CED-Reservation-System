// src/components/Layout.tsx
// HonoのJSXを使用するため、'hono/jsx' から h と VNode/Child をインポートします
import { html } from 'hono/html';
import { type Child } from 'hono/jsx'; // ★VNode と Child を追加

// LayoutProps: コンポーネントに渡すプロパティの型を定義
interface LayoutProps {
  children: Child; // ★'any' を 'Child' に変更。VNode | VNode[] も選択肢
  title?: string; // ページのタイトル
}

// Layout コンポーネント: HTMLの基本構造（DOCTYPE, html, head, body）を提供
export const Layout = ({ children, title = 'Hono Auth App' }: LayoutProps) => {
  return html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      </style>
    </head>
    <body class="bg-gray-100 flex items-center justify-center min-h-screen">
      ${children}
    </body>
    </html>
  `;
};
