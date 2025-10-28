import streamlit as st
import google.generativeai as genai
import json
import re

# --- System Prompt (Copied directly from your JS) ---
# We'll set this as the system_instruction for the model
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

# --- Page Configuration ---
st.set_page_config(
    page_title="Conversational AI Planner",
    page_icon="🤖"
)

st.title("Conversational AI Planner")
st.write("Chat with your AI assistant to build the perfect plan.")

# --- API Key & Model Setup ---
# Using st.secrets for deployment, but st.sidebar.text_input for local dev is fine
try:
    # Try to get the API key from Streamlit secrets
    api_key = st.secrets["GEMINI_API_KEY"]
except (KeyError, FileNotFoundError):
    # If not found, ask the user for it in the sidebar
    api_key = st.sidebar.text_input("Enter your Gemini API Key:", type="password")

if not api_key:
    st.info("Please enter your Gemini API Key in the sidebar to begin.")
    st.stop()

# Configure the Gemini client
genai.configure(api_key=api_key)

# We use gemini-1.5-flash, which is a great, fast model for this
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",  # <-- Add "-latest" here
    system_instruction=system_prompt
)

# --- Session State Initialization ---
# This is where we store data that persists between script re-runs
if "messages" not in st.session_state:
    # This stores the chat history
    st.session_state.messages = []
    
if "chat" not in st.session_state:
    # This stores the chat session object from the API
    st.session_state.chat = model.start_chat(history=[]) # Start with an empty history
    
if "plan" not in st.session_state:
    # This will store the final JSON plan
    st.session_state.plan = None

# --- Main App Logic (View Switching) ---

if st.session_state.plan:
    # === PLAN VIEW ===
    # If a plan exists, show the plan editor
    st.header(st.session_state.plan["title"])
    
    # We use st.data_editor to replicate your "edit" feature.
    # It's a powerful, built-in "Excel-like" editor.
    st.info("You can edit your plan details directly below.")
    
    edited_schedule = st.data_editor(
        st.session_state.plan["schedule"],
        num_rows="dynamic",  # Allows adding/deleting rows
        use_container_width=True
    )
    
    # Update the plan in session state with the edits
    st.session_state.plan["schedule"] = edited_schedule

    # --- Add Save/Load/Start Over buttons ---
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # Save Plan: We use st.download_button to save as a JSON file
        # This is the Streamlit equivalent of your "Save" button
        st.download_button(
            label="Save Plan as JSON",
            data=json.dumps(st.session_state.plan, indent=2),
            file_name=f"{st.session_state.plan['title'].replace(' ', '_')}.json",
            mime="application/json"
        )
        
    with col2:
        # "Start Over" button (replaces your js 'window.location.reload()')
        if st.button("Start Over", type="primary"):
            # Clear the entire session state and re-run
            st.session_state.clear()
            st.rerun()
    
    # We can add the "Load" button here too, using st.file_uploader
    
else:
    # === CHAT VIEW ===
    # If no plan exists, show the chat interface

    # Display existing chat messages
    for msg in st.session_state.messages:
        st.chat_message(msg["role"]).write(msg["content"])

    # Chat input box at the bottom
    if prompt := st.chat_input("What's your main goal?"):
        
        # Add user message to state and display it
        st.session_state.messages.append({"role": "user", "content": prompt})
        st.chat_message("user").write(prompt)
        
        # Send to Gemini and get response
        with st.spinner("Assistant is thinking..."):
            try:
                response = st.session_state.chat.send_message(prompt)
                ai_response_text = response.text
                
                # --- This is the JSON parsing logic from your JS ---
                plan_json = None
                try:
                    # Use regex to find a JSON block (handles ```json ... ``` or just {...})
                    json_match = re.search(r'```json\s*([\s\S]*?)\s*```|({[\s\S]*})', ai_response_text, re.DOTALL)
                    
                    if json_match:
                        json_string = json_match.group(1) or json_match.group(2)
                        parsed_json = json.loads(json_string)
                        
                        # Check if it's a valid plan
                        if "title" in parsed_json and "schedule" in parsed_json:
                            plan_json = parsed_json
                            
                except json.JSONDecodeError:
                    # Not a JSON, just a regular chat message
                    pass

                # --- Handle the response ---
                if plan_json:
                    # It's a plan! Save it to state.
                    st.session_state.plan = plan_json
                    
                    # Add a final "Here is your plan" message
                    final_msg = "Great! I've created your personalized plan."
                    st.session_state.messages.append({"role": "model", "content": final_msg})
                    
                    # Re-run the script to switch to the "Plan View"
                    st.rerun() 
                    
                else:
                    # It's just a regular chat message.
                    st.session_state.messages.append({"role": "model", "content": ai_response_text})
                    st.chat_message("model").write(ai_response_text)

            except Exception as e:
                st.error(f"An error occurred: {e}")