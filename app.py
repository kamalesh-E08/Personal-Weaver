import streamlit as st
import google.generativeai as genai
import json
import re
from collections import OrderedDict

# --- System Prompt ---
system_prompt = """
You are an expert personal planner. Your goal is to have a conversation with the user to gather all necessary details to create a comprehensive, actionable plan. 
        
*CRITICAL INSTRUCTION: When planning travel, you MUST invent realistic but fictional details that are specific and plausible.*
- For flights: Create a fictional flight number (e.g., 'IndiGo 6E-559'), airline name, and plausible departure/arrival times.
- For trains: Create a fictional train number (e.g., '12671') and name (e.g., 'Nilgiri Express from Mettupalayam').
- For buses: Invent a specific route number and common local landmarks for the route. For example, if the user is in Coimbatore, you could say 'Take Bus S11 from Gandhipuram towards Ukkadam'.

Follow these steps:
1.  Start by understanding the user's primary goal.
2.  Ask clarifying questions one at a time (e.g., start location, travel mode preference, prep time).
3.  Once you have enough information, explicitly state that you are ready to create the plan.
4.  Then, provide the final plan as a single, clean JSON object. Do not include any other text around the final JSON. The JSON must have a "title" and a "schedule" array. Each schedule item must have "time", "activity", and "details".
"""

# --- Page Config ---
st.set_page_config(page_title="Conversational AI Planner", page_icon="🤖")

st.title("Conversational AI Planner")
st.write("Chat with your AI assistant to build the perfect plan.")

# --- API Key Setup ---
try:
    api_key = st.secrets["GEMINI_API_KEY"]
except (KeyError, FileNotFoundError):
    api_key = st.sidebar.text_input("Enter your Gemini API Key:", type="password")

if not api_key:
    st.info("Please enter your Gemini API Key in the sidebar to begin.")
    st.stop()

# --- Configure Gemini ---
genai.configure(api_key=api_key)
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    system_instruction=system_prompt
)

# --- Initialize Session State ---
if "messages" not in st.session_state:
    st.session_state.messages = []

if "chat" not in st.session_state:
    st.session_state.chat = model.start_chat(history=[])

if "plan" not in st.session_state:
    st.session_state.plan = None


# --- Helper Function: Add Task Numbers & Order Keys ---
def add_task_numbers_to_plan():
    """
    Adds or updates 'task_number' to each task and ensures key order:
    task_number → time → activity → details
    """
    if "plan" in st.session_state and st.session_state.plan:
        ordered_schedule = []
        schedule = st.session_state.plan.get("schedule", [])

        for i, item in enumerate(schedule, start=1):
            time = item.get("time", "")
            activity = item.get("activity", "")
            details = item.get("details", "")

            # Reorder keys
            ordered_task = OrderedDict([
                ("task_number", i),
                ("time", time),
                ("activity", f"{i}. {activity}" if not activity.startswith(f"{i}.") else activity),
                ("details", details)
            ])
            ordered_schedule.append(ordered_task)

        st.session_state.plan["schedule"] = ordered_schedule


# --- Reschedule Function ---
def reschedule_plan(task_number, minutes_saved):
    """
    Reschedule only the remaining tasks after the given task number,
    shifting them earlier based on how many minutes were saved.
    """
    try:
        if "plan" not in st.session_state or "schedule" not in st.session_state.plan:
            st.warning("No valid plan found to reschedule.")
            return

        full_plan = st.session_state.plan
        all_tasks = full_plan["schedule"]

        # Validate task number
        if task_number < 1 or task_number > len(all_tasks):
            st.warning("Invalid task number selected.")
            return

        # Split completed vs remaining tasks
        completed_tasks = all_tasks[:task_number]
        remaining_tasks = all_tasks[task_number:]

        if not remaining_tasks:
            st.info("🎉 No remaining tasks to reschedule — all done!")
            return

        # ✅ Use correct field name: "activity"
        finished_activity = all_tasks[task_number - 1].get("activity", f"Task {task_number}")

        st.info(f"Rescheduling tasks after '{finished_activity}' by {minutes_saved} minutes earlier...")

        # Prepare partial plan for Gemini to adjust only remaining ones
        partial_plan = {
            "title": full_plan["title"],
            "schedule": remaining_tasks
        }

        # Instruction prompt for Gemini to shift times earlier
        user_msg = f"""
        The user finished task {task_number} ("{finished_activity}") {minutes_saved} minutes early.
        Adjust ONLY the remaining tasks below so that their times are shifted earlier by about {minutes_saved} minutes.
        Keep the same order, activities, and details. Return ONLY valid JSON.

        Remaining tasks JSON:
        {json.dumps(partial_plan, indent=2)}
        """

        # Send reschedule request
        response = st.session_state.chat.send_message(user_msg)
        ai_text = response.text

        # Try to extract new JSON
        json_match = re.search(r'({[\s\S]*})', ai_text)
        if not json_match:
            st.warning("Couldn't detect JSON in AI response.")
            return

        new_json = json.loads(json_match.group(1))

        if "schedule" in new_json:
            # Merge completed + rescheduled tasks
            st.session_state.plan["schedule"] = completed_tasks + new_json["schedule"]
            st.success("✅ Remaining tasks successfully rescheduled earlier!")
            st.rerun()
        else:
            st.warning("AI did not return a valid schedule.")

    except Exception as e:
        st.error(f"Reschedule error: {e}")

# --- Main App Logic ---
if st.session_state.plan:
    # === PLAN VIEW ===
    st.header(st.session_state.plan["title"])
    st.info("You can edit your plan details directly below.")

    add_task_numbers_to_plan()  # Ensure proper order before displaying

    edited_schedule = st.data_editor(
        st.session_state.plan["schedule"],
        num_rows="dynamic",
        use_container_width=True
    )

    st.session_state.plan["schedule"] = edited_schedule
    add_task_numbers_to_plan()  # ✅ Maintain numbering and order

    # --- Buttons ---
    col1, col2, col3 = st.columns(3)
    with col1:
        st.download_button(
            label="💾 Save Plan as JSON",
            data=json.dumps(st.session_state.plan, indent=2),
            file_name=f"{st.session_state.plan['title'].replace(' ', '_')}.json",
            mime="application/json"
        )
    with col2:
        if st.button("🔄 Start Over", type="primary"):
            st.session_state.clear()
            st.rerun()

    # --- Reschedule Section ---
    st.subheader("⏰ Finished a Task Early? Reschedule Remaining Tasks!")

    task_numbers = [i + 1 for i in range(len(st.session_state.plan["schedule"]))]
    task_number = st.selectbox("Select the task you finished early:", task_numbers)
    minutes_saved = st.number_input("How many minutes earlier did you finish?", min_value=5, max_value=180, step=5)

    if st.button("Reschedule Remaining Tasks"):
        reschedule_plan(task_number, minutes_saved)

else:
    # === CHAT VIEW ===
    for msg in st.session_state.messages:
        st.chat_message(msg["role"]).write(msg["content"])

    if prompt := st.chat_input("What's your main goal?"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        st.chat_message("user").write(prompt)

        with st.spinner("Assistant is thinking..."):
            try:
                response = st.session_state.chat.send_message(prompt)
                ai_response_text = response.text
                plan_json = None

                json_match = re.search(r'({[\s\S]*})', ai_response_text, re.DOTALL)
                if json_match:
                    json_string = json_match.group(1).strip()
                    if json_string and len(json_string) > 2:
                        parsed_json = json.loads(json_string)
                        if isinstance(parsed_json, dict) and "title" in parsed_json and "schedule" in parsed_json:
                            plan_json = parsed_json

                if plan_json:
                    st.session_state.plan = plan_json
                    add_task_numbers_to_plan()  # ✅ Proper column order
                    st.session_state.messages.append({"role": "model", "content": "Great! I've created your personalized plan."})
                    st.rerun()
                else:
                    st.session_state.messages.append({"role": "model", "content": ai_response_text})
                    st.chat_message("model").write(ai_response_text)

            except Exception as e:
                st.error(f"An error occurred: {e}")
