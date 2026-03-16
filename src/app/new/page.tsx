"use client";

import EditorLayout from "@/app/components/editor/EditorLayout";

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
    .container { text-align: center; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, APLZ!</h1>
    <p>ここからアプリを作り始めましょう</p>
  </div>
</body>
</html>`;

export default function NewAppPage() {
  return (
    <EditorLayout
      app={null}
      initialCode={DEFAULT_TEMPLATE}
      isNewApp={true}
      backUrl="/publish"
    />
  );
}
