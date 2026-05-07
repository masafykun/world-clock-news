/**
 * OpenAI API を使って英語ニュースを日本語に翻訳・要約する。
 * OPENAI_API_KEY が未設定の場合は何もしない（元のテキストをそのまま返す）。
 *
 * モデル: gpt-4o-mini（コスト効率重視）
 * 1リクエストで全記事をバッチ処理し、API呼び出し回数を最小化する。
 */

interface ArticleInput {
  id: string;
  title: string;
  summary: string;
}

interface ArticleOutput {
  id: string;
  title: string;
  summary: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

const SYSTEM_PROMPT = `あなたはニュース翻訳・要約の専門家です。
英語の記事タイトルと概要を自然な日本語に翻訳してください。
- タイトル: 簡潔に30〜40文字以内
- 概要: 分かりやすく60〜80文字以内
- 敬体（です・ます調）を使う
- 固有名詞（人名・地名・ブランド名）はカタカナまたは元の表記を維持する
必ず {"articles": [...]} の形式のJSONのみ返してください。`;

export async function translateToJapanese(
  items: ArticleInput[],
  apiKey: string
): Promise<Map<string, { title: string; summary: string }>> {
  const payload = items.map((item) => ({
    id: item.id,
    title: item.title.slice(0, 300),
    summary: item.summary.slice(0, 300),
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `以下の記事を日本語に翻訳・要約し、{"articles":[{"id":"...","title":"...","summary":"..."},...]} の形式で返してください。\n\n${JSON.stringify(payload)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API HTTP ${res.status}: ${body}`);
  }

  const data: OpenAIResponse = await res.json();
  const content = data.choices[0]?.message?.content ?? "{}";

  const parsed = JSON.parse(content) as { articles?: ArticleOutput[] };
  const results = parsed.articles ?? [];

  const map = new Map<string, { title: string; summary: string }>();
  for (const r of results) {
    if (r.id && r.title && r.summary) {
      map.set(r.id, { title: r.title, summary: r.summary });
    }
  }
  return map;
}
