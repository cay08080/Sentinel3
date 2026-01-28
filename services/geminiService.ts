import { GoogleGenAI, Type } from "@google/genai";
import { DetectionStatus, AnalysisResult } from "../types";

export const analyzeImageForPerson = async (base64Image: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Aja como um sistema de monitoramento militar. Analise se a área está SEGURA ou INSEGURA. A área só é SEGURA se NÃO houver nenhum ser humano na imagem. Se houver qualquer pessoa, a área é INSEGURA. Responda APENAS em JSON: {\"isAreaSafe\": boolean, \"confidence\": number, \"details\": \"descrição curta\"}"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAreaSafe: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            details: { type: Type.STRING }
          },
          required: ["isAreaSafe", "confidence", "details"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");

    const result = JSON.parse(text);
    const isIntruder = result.isAreaSafe === false && result.confidence > 45;

    return {
      status: isIntruder ? DetectionStatus.PERSON_DETECTED : DetectionStatus.NO_PERSON,
      message: isIntruder ? "ÁREA INSEGURA - INTRUSO" : "ÁREA SEGURA",
      description: result.details || (isIntruder ? "Intruso identificado no perímetro." : "Nenhuma ameaça detectada."),
      confidence: result.confidence || 0,
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("429")) throw new Error("QUOTA_EXCEEDED");
    throw new Error("CONNECTION_FAILED");
  }
};