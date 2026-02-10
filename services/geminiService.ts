import { GoogleGenAI, Type } from "@google/genai";

export interface AIAnalysisResult {
  detectedObject: string;
  detectedCode: string | null;
  reasoning: string;
  suggestedKeywords: string[];
}

export const performVisualSearch = async (
  imageDataBase64: string
): Promise<AIAnalysisResult> => {
  // Always initialize GoogleGenAI with exactly { apiKey: process.env.API_KEY } as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this image as a retail expert. 
    1. Look for any barcode numbers, QR codes, or printed SKUs/Product codes.
    2. Identify the main product or object in the image.
    3. Provide a list of 3-5 keywords that describe this specific object (colors, materials, type).
    
    Return a JSON object:
    - detectedObject: short specific name of the item.
    - detectedCode: the exact alphanumeric code found (null if none).
    - reasoning: brief explanation of what was found.
    - suggestedKeywords: array of descriptive words.
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
            detectedObject: { type: Type.STRING },
            detectedCode: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            suggestedKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['detectedObject', 'reasoning', 'suggestedKeywords']
        }
      }
    });

    // Directly access .text property as per guidelines.
    const resultStr = response.text;
    if (!resultStr) throw new Error("Empty response from AI");
    
    return JSON.parse(resultStr) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Visual Analysis Error:", error);
    throw error;
  }
};