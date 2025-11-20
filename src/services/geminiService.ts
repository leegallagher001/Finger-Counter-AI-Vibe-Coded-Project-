import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FingerCountResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: "YOUR_ACTUAL_GEMINI_API_KEY" });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fingerCount: {
      type: Type.INTEGER,
      description: "The number of fingers clearly visible and extended in the hand. Return 0 if a closed fist is shown. Return -1 if no hand is detected.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "Confidence level of the detection.",
    },
    description: {
      type: Type.STRING,
      description: "A brief description of the hand gesture (e.g., 'Peace sign', 'Open palm', 'Thumbs up').",
    },
  },
  required: ["fingerCount", "confidence", "description"],
};

export const detectFingers = async (base64Image: string): Promise<FingerCountResponse> => {
  // Strip the data URL prefix if present to get raw base64
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image and count exactly how many fingers are being held up or extended. Ignore the thumb if it is tucked in. If it's a fist, count is 0. If no hand is visible, count is -1.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a vision expert. You strictly count fingers in camera frames. You represent the count as an integer.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text) as FingerCountResponse;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};