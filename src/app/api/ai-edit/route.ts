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
- 修正後の完全なHTMLコードのみを返してください
- HTMLコード以外のテキスト（説明、マークダウン、コードブロック記号など）は一切含めないでください
- <!DOCTYPE html> または <html> から始めてください
- 元のコードの機能を壊さないでください
- CSSはインラインまたは<style>タグ内に書いてください
- JavaScriptは<script>タグ内に書いてください

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
    const newCode = data.content[0]?.text || "";

    if (!newCode.includes("<") || !newCode.includes(">")) {
      return NextResponse.json({ error: "AIが有効なHTMLを返しませんでした" }, { status: 500 });
    }

    // Remove markdown code block markers if present
    const cleanCode = newCode
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({ code: cleanCode });
  } catch (error) {
    console.error("AI edit error:", error);
    return NextResponse.json({ error: "内部エラーが発生しました" }, { status: 500 });
  }
}
