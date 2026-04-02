import { GoogleGenAI } from "@google/genai";

export async function extractReceiptInfo(base64Image: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    이 영수증 이미지에서 다음 정보를 추출해줘:
    1. 총 결제 금액 (숫자만, 예: 42900)
    2. 결제 날짜 (YYYY-MM-DD 형식, 예: 2026-03-31)

    응답은 반드시 JSON 형식으로만 해줘:
    {
      "amount": number,
      "date": "YYYY-MM-DD"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image.split(",")[1],
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 응답이 없습니다.");
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
}
