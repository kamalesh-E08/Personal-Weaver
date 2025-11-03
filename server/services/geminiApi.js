require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `
You are an expert personal planner. Your goal is to have a conversation with the user to gather all necessary details to create a comprehensive, actionable plan. 

**CRITICAL INSTRUCTION: When planning travel, you MUST invent realistic but fictional details that are specific and plausible.**
- For flights: Create a fictional flight number (e.g., 'IndiGo 6E-559'), airline name, and plausible departure/arrival times.
- For trains: Create a fictional train number (e.g., '12671') and name (e.g., 'Nilgiri Express from Mettupalayam').
- For buses: Invent a specific route number and common local landmarks for the route.

Follow these steps:
1. Start by understanding the user's primary goal.
2. Ask clarifying questions one at a time (e.g., start location, travel mode preference, prep time).
3. Once you have enough information, explicitly state that you are ready to create the plan.
4. Then, provide the final plan as a single, clean JSON object. Do not include any other text around the final JSON. The JSON must have a "title" and a "schedule" array. Each schedule item must have "time", "activity", and "details".
`;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function createNewChat() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT, 
  });
  const chat = model.startChat({
    history: [],
  });

  return chat;
}

function extractJSON(text) {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[2];
      const parsed = JSON.parse(jsonString);
      if (parsed.title && parsed.schedule) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function handleChat(message, existingChat = null) {
  try {
    const chat = existingChat || (await createNewChat());
    const result = await chat.sendMessage(message);
    const responseText = await result.response.text();
    const planJson = extractJSON(responseText);

    if (planJson) {
      return { type: "plan", data: planJson, chat: chat };
    } else {
      return { type: "chat", message: responseText, chat: chat };
    }
  } catch (e) {
    console.log("Error in  chat handler:", e);
    throw e;
  }
}

module.exports = { createNewChat, handleChat };
