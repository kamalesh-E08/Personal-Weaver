import streamlit as st # We still use this for st.secrets
import google.generativeai as genai
import json
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- System Prompt (Same as before) ---
system_prompt = """
You are an expert personal planner. Your goal is to have a conversation with the user to gather all necessary details to create a comprehensive, actionable plan. 

**CRITICAL INSTRUCTION: When planning travel, you MUST invent realistic but fictional details that are specific and plausible.**
- For flights: Create a fictional flight number (e.g., 'IndiGo 6E-559'), airline name, and plausible departure/arrival times.
- For trains: Create a fictional train number (e.g., '12671') and name (e.g., 'Nilgiri Express from Mettupalayam').
- For buses: Invent a specific route number and common local landmarks for the route. For example, if the user is in Coimbatore, you could say 'Take Bus S11 from Gandhipuram towards Ukkadam'.

Follow these steps:
1.  Start by understanding the user's primary goal.
2.  Ask clarifying questions one at a time (e.g., start location, travel mode preference, prep time).
3.  Once you have enough information, explicitly state that you are ready to create the plan.
4.  Then, provide the final plan as a single, clean JSON object. Do not include any other text around the final JSON. The JSON must have a "title" and a "schedule" array. Each schedule item must have "time", "activity", and "details".
"""

# --- API Key & Model Setup ---
try:
    api_key = st.secrets["GEMINI_API_KEY"]
except:
    api_key = "AIzaSyDQ0yfvCiMGU6dDNSGLSejO8O8OoRwXuFw" # Fallback if st.secrets fails

if not api_key:
    print("Error: GEMINI_API_KEY not found. Please check your .streamlit/secrets.toml")

genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=system_prompt
)
# We create a new chat session for each "conversation"
# In a real app, you'd manage this with user IDs
chat = model.start_chat(history=[])

# --- FastAPI App ---
app = FastAPI()

# --- Add CORS Middleware ---
# This is CRITICAL. It allows your HTML frontend to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (your file:// or web server)
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST)
    allow_headers=["*"], # Allows all headers
)

# --- Define what data the API expects from the frontend ---
class ChatRequest(BaseModel):
    message: str
    # We can add history here later if needed

# --- Create the API Endpoint ---
@app.post("/chat")
async def handle_chat(request: ChatRequest):
    try:
        # Send message to Gemini (using the logic from our Streamlit app)
        response = chat.send_message(request.message)
        ai_response_text = response.text

        # --- Try to parse for a plan ---
        plan_json = None
        try:
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```|({[\s\S]*})', ai_response_text, re.DOTALL)
            if json_match:
                json_string = json_match.group(1) or json_match.group(2)
                parsed_json = json.loads(json_string)
                if "title" in parsed_json and "schedule" in parsed_json:
                    plan_json = parsed_json

        except json.JSONDecodeError:
            pass # Not a JSON

        if plan_json:
            # Send the plan back to the frontend
            return {"type": "plan", "data": plan_json}
        else:
            # Send the normal chat message back
            return {"type": "chat", "message": ai_response_text}

    except Exception as e:
        return {"error": str(e)}