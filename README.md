# CEDの部屋予約システム

このプロジェクトは、CEDの部屋予約システムを構築するためのバックエンドアプリケーションです。  
Honoフレームワーク、Drizzle ORM、Auth.js（`@hono/auth-js`）を使用し、MySQLデータベースと連携します。

---

## 🚀 概要

ユーザーが部屋を予約し、自分の予約を確認・管理できるシステムです。

### 🔧 主要技術スタック

- **バックエンドフレームワーク**: Hono  
- **ORM**: Drizzle ORM（MySQL2ドライバー）  
- **認証**: Auth.js（`@hono/auth-js`, Google認証プロバイダー）  
- **データベース**: MySQL（Docker Composeで管理）  
- **開発言語**: TypeScript  
- **パッケージマネージャー**: npm  

---

## 🛠️ セットアップと実行方法

### 1. 事前準備

以下のツールが必要です:

- Node.js（v18以上推奨）  
- npm  
- Docker Desktop（MySQLコンテナ実行用）  

### 2. リポジトリのクローン

```bash
git clone https://github.com/hyoutan07/CED-Reservation-System.git
cd reservation-app  # プロジェクトのルートディレクトリに移動
```

### 3. パッケージのインストールと実行

```bash
npm install
```

### 4. .env ファイルの設定

プロジェクトのルートディレクトリ（`reservation-app`）の一つ上の階層に `.env` ファイルを作成し、以下を記述してください:
```env
# 認証シークレット (Auth.js で必須)
# node -e "console.log(crypto.randomBytes(32).toString('hex'))" で生成
AUTH_SECRET=<ここに生成したランダムな文字列>

# Google OAuth プロバイダーの設定
GOOGLE_CLIENT_ID=<あなたのGoogle OAuthクライアントID>
GOOGLE_CLIENT_SECRET=<あなたのGoogle OAuthクライアントシークレット>

# データベース接続情報
DB_HOST=127.0.0.1  
DB_PORT=3306  
DB_USER=your_db_user  
DB_PASSWORD=your_db_password  
DB_DATABASE=your_db_name
```

### 5. Docker Compose で MySQL を起動

`.env` ファイルと同じ階層に `docker-compose.yml` を設置してください。

`my-project/docker-compose.yml` の例:
```
version: '3.8'
services:
    mysql_db:
    image: mysql:8.0
    container_name: hono_drizzle_mysql_db
    environment:
        MYSQL_ROOT_PASSWORD: your_root_password
        MYSQL_DATABASE: your_db_name
        MYSQL_USER: your_db_user
        MYSQL_PASSWORD: your_db_password
    ports:
        - "3306:3306"
    volumes:
        - mysql_data:/var/lib/mysql

volumes:
    mysql_data:
```
以下のコマンドでコンテナを起動します:
```bash
docker compose up -d
```

### 6. データベースの初期化と初期データ投入

以下のコマンドを順に実行してください（`reservation-app` ディレクトリで）:
```bash
# Drizzle ORM マイグレーションファイルの生成
npm run generate

# データベースへのスキーマ適用
npm run push

# 初期データ（部屋情報など）の投入
npm run seed
```

### 7. アプリケーションの起動

開発サーバーを起動します:
```bash
npm run dev
```
ブラウザで以下にアクセスしてください:

http://localhost:3000

---

## 📝 スクリプトの詳細

以下は、`package.json` に記述されたスクリプトの詳細です。

| コマンド | 説明 |
|---------|------|
| `npm run generate` | Drizzle ORM のスキーマ定義（`src/db/schema.ts`）を元にマイグレーションファイルを生成します。 |
| `npm run push` | 生成されたマイグレーションを実際のデータベースに適用し、テーブル作成や更新を行います。 |
| `npm run seed` | `src/seed.ts` を実行して、初期データ（例：部屋の定義など）を挿入します。 |

---

## ✅ その他の注意点

- `.env` ファイルの保存場所は、**必ずプロジェクトルートの一つ上の階層**にしてください（`.env` は `docker-compose.yml` と同じ場所にある必要があります）。
- Dockerを使う際は、MySQLのポートやユーザー・パスワードの整合性を`docker-compose.yml`と`.env`で一致させてください。
- `src/seed.ts` ファイルを必要に応じて編集し、独自の初期データ（部屋の定義など）を記述できます。
- アプリを本番デプロイする場合は、`.env`ファイルのシークレット管理を環境変数ベースに切り替えることを推奨します。
