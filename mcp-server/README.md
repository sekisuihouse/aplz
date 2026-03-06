# @aplz/mcp-server

Claude Desktop / Claude Code / Cursor などの AIツールから [aplz.dev](https://aplz.dev) にWebアプリを公開できるMCPサーバーです。

## セットアップ

### 1. APIトークンを取得

1. [aplz.dev](https://aplz.dev) にログイン
2. 右上のアバター → **APIトークン設定** に移動
3. トークン名を入力して「トークンを生成」をクリック
4. 生成されたトークン（`aplz_...`）をコピー（**再表示不可**）

### 2. Claude Desktop に設定

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "aplz": {
      "command": "npx",
      "args": ["-y", "@aplz/mcp-server"],
      "env": {
        "APLZ_API_TOKEN": "aplz_ここにトークンを貼り付け"
      }
    }
  }
}
```

Claude Desktop を再起動するとツールが使えるようになります。

### ローカルビルドして使う場合

```bash
cd mcp-server
npm install
npm run build
```

claude_desktop_config.json:
```json
{
  "mcpServers": {
    "aplz": {
      "command": "node",
      "args": ["/path/to/aplz/mcp-server/dist/index.js"],
      "env": {
        "APLZ_API_TOKEN": "aplz_xxxxxxxxxxxx"
      }
    }
  }
}
```

## 使い方

Claude に話しかけるだけ:

```
このHTMLファイルをaplzに公開して: /path/to/app.html
```

```
aplzに公開した自分のアプリの一覧を見せて
```

```
fish-tetris のフィードバックを教えて
```

## 利用可能なツール

| ツール | 説明 |
|--------|------|
| `publish_app` | HTMLまたはZIPファイルをaplzに公開 |
| `list_apps` | 自分が公開したアプリの一覧を取得 |
| `get_feedback` | 特定アプリの評価・コメント・リアクションを取得 |

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `APLZ_API_TOKEN` | APIトークン（必須） |
| `APLZ_API_BASE` | APIのベースURL（デフォルト: `https://aplz.dev`） |
