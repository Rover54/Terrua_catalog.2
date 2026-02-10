
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
    - detectedCode: the exact alphanumeric code found (return exactly "null" if none).
    - reasoning: brief explanation of what was found.
    - suggestedKeywords: array of descriptive words.
  `;

  try {
    // Use gemini-3-pro-preview for complex reasoning tasks like visual code detection and product identification.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
            detectedCode: { type: Type.STRING, description: "Alphanumeric code or null" },
            reasoning: { type: Type.STRING },
            suggestedKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          // Use propertyOrdering as shown in the @google/genai guidelines for Type.OBJECT.
          propertyOrdering: ['detectedObject', 'detectedCode', 'reasoning', 'suggestedKeywords']
        }
      }
    });

    // Access the .text property directly instead of calling it as a method.
    const resultStr = response.text;
    if (!resultStr) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(resultStr);
    
    // Normalización para asegurar que null sea null real
    if (parsed.detectedCode === "null" || parsed.detectedCode === "") {
      parsed.detectedCode = null;
    }

    return parsed as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Visual Analysis Error:", error);
    throw error;
  }
};
