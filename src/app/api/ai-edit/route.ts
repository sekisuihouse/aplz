import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI editing is not configured" }, { status: 503 });
  }

  const { code, prompt } = await request.json();

  if (!code || !prompt) {
    return NextResponse.json({ error: "code and prompt are required" }, { status: 400 });
  }

  if (prompt.length > 500) {
    return NextResponse.json({ error: "プロンプトが長すぎます（最大500文字）" }, { status: 400 });
  }

  if (code.length > 100000) {
    return NextResponse.json({ error: "コードが大きすぎます（最大100KB）" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 16384,
        messages: [
          {
            role: "user",
            content: `あなたはHTMLファイルを編集するアシスタントです。
ユーザーの指示に従って、以下のHTMLコードを修正してください。

【重要なルール】
- 以下のJSON形式で返してください。他のテキストは含めないでください:
{"code": "修正後の完全なHTMLコード", "summary": "何を変更したかの簡潔な説明（日本語、1-2文）"}
- codeには完全なHTMLコードを入れてください
- summaryには変更内容を簡潔に日本語で説明してください
- JSONとして有効な形式で返してください。コード内のダブルクォートはエスケープしてください

【現在のHTMLコード】
${code}

【ユーザーの指示】
${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return NextResponse.json({ error: "AI処理に失敗しました" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content[0]?.text || "";

    let newCode = "";
    let summary = "修正しました！";

    try {
      const cleaned = rawText.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      newCode = parsed.code || "";
      summary = parsed.summary || "修正しました！";
    } catch {
      // JSON parse failed — treat entire text as HTML
      newCode = rawText.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
      summary = "修正しました！プレビューを確認してください。";
    }

    if (!newCode.includes("<") || !newCode.includes(">")) {
      return NextResponse.json({ error: "AIが有効なHTMLを返しませんでした" }, { status: 500 });
    }

    return NextResponse.json({ code: newCode, summary });
  } catch (error) {
    console.error("AI edit error:", error);
    return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
  }
}
