
import { GoogleGenAI, Type } from "@google/genai";
import { Product, VisualSearchMatch } from "../types";

export const performVisualSearch = async (
  imageDataBase64: string,
  catalog: Product[]
): Promise<VisualSearchMatch> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const catalogSummary = catalog.map(p => ({
    id: p.id,
    productCode: p.productCode,
    name: p.name
  }));

  const prompt = `
    Analyze this image specifically for any barcodes, QR codes, or printed product codes (SKUs).
    
    1. If a barcode or product code is visible, extract it exactly.
    2. Look at the object in the image and describe it.
    3. Compare any extracted code or the visual appearance with the provided catalog.
    
    Catalog:
    ${JSON.stringify(catalogSummary)}
    
    Return a JSON object with:
    - matchId: the ID of the product from the catalog that matches best (prioritize code matching). Set to null if no match.
    - confidence: number (0 to 1).
    - detectedObject: short description of what you see.
    - detectedCode: the raw alphanumeric code or barcode digits found in the image (null if none found).
    - reasoning: brief explanation (e.g., "Found barcode matching product code CHAIR-001").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageDataBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            detectedObject: { type: Type.STRING },
            detectedCode: { type: Type.STRING, nullable: true },
            reasoning: { type: Type.STRING }
          },
          required: ['matchId', 'confidence', 'detectedObject', 'reasoning']
        }
      }
    });

    const resultStr = response.text;
    if (!resultStr) throw new Error("Empty response from AI");
    
    return JSON.parse(resultStr) as VisualSearchMatch;
  } catch (error) {
    console.error("Gemini Visual Search Error:", error);
    throw error;
  }
};
