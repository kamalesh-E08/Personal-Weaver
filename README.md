# PersonalWeaver – Personalized Planner Powered by LLM

PersonaWeaver is a personalized planner web application designed to help users create structured, goal-oriented, and adaptable plans for their personal and professional needs. By integrating *Gemini AI*, the system generates tailored recommendations, timelines, and strategies, allowing users to stay organized and productive.

---

## 🚀 Problem Statement

In today’s fast-paced world, many individuals struggle with time management, unstructured planning, and lack of personalized guidance. Existing planners and calendar tools only provide basic scheduling features without adapting to users’ unique goals or contexts. PersonaWeaver solves this problem by combining AI-driven personalization with intuitive planning features, enabling users to create *actionable, context-aware plans*.

---

## 💡 Our Solution

* Uses *Gemini AI* to generate personalized plans.
* Interactive planner with features like *drag-and-drop tasks, progress tracking, and customizable goals*.
* Plans can be *downloaded for offline use*, ensuring accessibility even without internet.
* Simple and intuitive interface for students, professionals, and teams.

---

## 🛠 Tech Stack

* *Frontend*: React.js, CSS
* *Backend*: Node.js, Express.js
* *Database*: MongoDB
* *AI Integration*: Gemini AI
* *Deployment*: Vercel

---

## 📂 Project Structure

```bash
Personal-Weaver-main/
│── backend/          # Express.js backend APIs
│── frontend/         # React.js frontend
│── models/           # Database schemas
│── routes/           # API routes
│── controllers/      # Business logic
│── public/           # Static assets
│── package.json      # Project metadata
```

---

## ⚙ Installation and Setup

### Prerequisites

* Node.js and npm installed
* MongoDB instance running locally or on cloud (e.g., MongoDB Atlas)

### Steps

1. *Clone the repository*

   ```bash
   git clone https://github.com/your-username/PersonaWeaver.git
   cd PersonaWeaver
   ```

2. *Install dependencies*

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. *Set up environment variables*
   Create a `.env` file inside the `backend/` directory with:

   ```env
   MONGO_URI=your_mongo_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   ```

4. *Run the application*
   Open two terminals:

   **Backend**

   ```bash
   cd backend
   npm start
   ```

   **Frontend**

   ```bash
   cd frontend
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints

### Authentication

* POST /api/auth/register → Register new user
* POST /api/auth/login → Login user

### Planner

* POST /api/plans → Create new plan (AI-assisted)
* GET /api/plans/\:id → Fetch user plan
* PUT /api/plans/\:id → Update plan
* DELETE /api/plans/\:id → Delete plan

### Tasks

* POST /api/tasks → Add new task to plan
* PUT /api/tasks/\:id → Update task
* DELETE /api/tasks/\:id → Remove task

---

## 📸 Screenshots

### Landing Page

<img width="1883" height="909" alt="Screenshot 2025-09-18 101648" src="https://github.com/user-attachments/assets/e8a6e17b-543e-4c15-b6b5-6717784e5fdb" />

### Dashboard

<img width="1892" height="904" alt="Screenshot 2025-09-18 101920" src="https://github.com/user-attachments/assets/a8ddb630-5334-48b5-b99f-b63ed879aa77" />

### AI Assistant Plan Maker

<img width="1914" height="888" alt="Screenshot 2025-09-18 101949" src="https://github.com/user-attachments/assets/c4c1f04c-2d30-455b-9250-ea60881658b2" />

### Smart Tasks Page

<img width="1881" height="907" alt="Screenshot 2025-09-18 102024" src="https://github.com/user-attachments/assets/de92eb63-4f39-4218-bc53-c721e2186168" />

### New Plan Creation Page

---<img width="1876" height="907" alt="Screenshot 2025-09-19 202739" src="https://github.com/user-attachments/assets/53023c0f-d99f-4495-a02b-f22ff2e16508" />

## 📦 Features

* Personalized plan generation using Gemini AI
* Real-time task updates and progress tracking
* Plans downloadable for offline access
* User authentication and secure data handling
* Simple and clean user interface

---

## 👩‍💻 Team Contributions

* **Documentation** – 1 member
* **UI/UX Design** – 1 member
* **Frontend Development** – 3 members
* **Backend Development** – 3 members
* **Tester** - 1 member
