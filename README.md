PersonaWeaver – Personalized Planner Powered by LLM

PersonaWeaver is a personalized planning and productivity platform built with the MERN stack and integrated with Large Language Models (LLMs). It helps users efficiently manage tasks, schedules, and plans while receiving AI-driven recommendations for productivity and time management.

🚀 Features

User Authentication – Secure login and registration system with role-based access.

Dashboard – High-level overview of upcoming tasks, completed tasks, and AI recommendations.

Planner – Create and manage daily, weekly, and monthly plans with LLM-based optimization.

Task Management – Add, edit, delete, and track tasks with real-time status updates.

Calendar Integration – Interactive calendar with drag-and-drop support for tasks and events.

Chat Assistance – AI-powered chat for personalized productivity suggestions.

Analytics – Visual insights into task completion, productivity trends, and time management.

Profile Management – Manage user details and customize preferences.

🛠️ Tech Stack

Frontend: React.js, Vite, CSS

Backend: Node.js, Express.js

Database: MongoDB

AI Integration: LLM-powered personalized suggestions

Other Tools: ESLint, JWT for authentication, REST APIs

📂 Project Structure
Personal-Weaver-main/
│── client/ (src folder contains React components)
│   ├── components/
│   │   ├── Chat/
│   │   ├── Dashboard/
│   │   ├── Planner/
│   │   ├── Profile/
│   │   ├── Sidebar/
│   │   └── LandingPage/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
│── server/ (Node.js + Express backend)
│   ├── routes/        # API routes (auth, tasks, plans, users, chat)
│   ├── models/        # MongoDB models (User, Task, Plan, ChatHistory)
│   ├── middleware/    # Authentication middleware
│   ├── server.js      # Entry point for backend
│   └── .env           # Environment variables
│
│── package.json       # Dependencies (root & server)
│── vite.config.js     # Frontend config
│── .gitignore
│── README.md

⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/PersonaWeaver.git
cd PersonaWeaver

2. Install dependencies

For frontend:

npm install


For backend:

cd server
npm install

3. Environment Variables

Create a .env file inside the server folder with:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

4. Run the application

Start backend:

cd server
npm run dev


Start frontend:

npm run dev


The frontend runs on http://localhost:5173
 (Vite default), and backend on http://localhost:5000
.

🔒 Security Features

Authentication & Authorization using JWT

Role-based Access Control (Admin, User)

Secure password handling with bcrypt

Input validation to prevent injection attacks

Session management with expiry
