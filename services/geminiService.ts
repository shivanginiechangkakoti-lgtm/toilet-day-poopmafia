import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateToiletJoke = async (): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Why did the toilet paper roll down the hill? To get to the bottom!";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Tell me a short, silly, clean, one-liner joke about toilets, plumbing, or poop suitable for a cartoon game. Keep it under 20 words.",
    });
    
    return response.text.trim() || "Happy Toilet Day!";
  } catch (error) {
    console.error("Failed to generate joke:", error);
    return "Flushed with success! (AI unavailable)";
  }
};
