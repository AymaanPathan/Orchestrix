# 🎯 Orchestrix

> "Write backend logic the way you explain it to a friend."
> 

Orchestrix is a visual backend builder powered by [Motia](https://motia.run/)'s scalable workflows, where anyone — even without coding — can build production-ready APIs, automations, cron jobs, and integrations by simply typing what they want in plain English.

The system parses English → generates Motia workflow steps → connects nodes → deploys instantly.

<img width="1920" height="867" alt="landing (1)" src="https://github.com/user-attachments/assets/13b46907-d2b0-4c2a-b5b5-82239fabf656" />

---

## ✨ What Can You Build?

- 🔐 **Authentication Systems** - Login, signup, password reset flows
- 📊 **CRUD APIs** - Full database operations without writing queries
- 📧 **Email Automations** - Send transactional emails, notifications
- 🔗 **API Integrations** - Connect third-party services visually

All without writing backend code manually.

---

## 🎯 Who Is It For?

| User Type | Use Case |
| --- | --- |
| 🚀 **Non-coders** | Build real backend logic without learning programming |
| ⚡ **Developers** | Build APIs 10x faster with visual workflows |
| 👥 **Teams** | Create automations instantly without backend knowledge |
| 💼 **Founders** | Get production-ready backend that scales from day one |

---

## 💡 How It Works (In 4 Steps)

### 1️⃣ Describe Your API in Plain English

```
"Create a user signup API that stores name, email, password
into my MongoDB and sends a welcome email."

```

### 2️⃣ AI Generates a Workflow with Nodes

The system automatically creates:

- ✅ Input Schema Node (validates name, email, password)
- ✅ Database Insert Node (MongoDB)
- ✅ Email Sender Node (NodeMailer)

<img width="1920" height="867" alt="builder" src="https://github.com/user-attachments/assets/3156bdd3-17e8-4b1b-8093-4b3546debf06" />

### 3️⃣ Edit Visually (Optional)

- Drag and drop to reorder steps
- Add new nodes from the sidebar
- Configure node properties
- Connect custom data flows


### 4️⃣ Run or Deploy

**Execute Mode:** Test your workflow with sample data and see real-time logs

**Save Mode:** Deploy as a production API with auto-generated endpoint


---

## 🚀 Key Features

### 🧠 AI-Powered Workflow Generation

Type what you want in English, and Orchestrix generates the complete workflow with proper node connections and data flow.

### 🎨 Visual Node Editor

Built with React Flow, offering intuitive drag-and-drop interface for building complex workflows.

### 📦 Rich Node Library

| Category | Nodes Available |
| --- | --- |
| **Input/Output** | Input Node, Response Node |
| **Database** | Find, Insert, Update, Delete Records |
| **Communication** | Email Sender (SMTP/NodeMailer) |
| **Authentication** | Login, Auth Middleware, JWT Validation |
| **Logic** | Validation Middleware, Compute/Transform |
| **Async** | Background Jobs, Delayed Tasks |

### 🔄 Real-Time Execution Logs

Watch your workflow execute step-by-step with:

- Live socket-based logging
- Error tracking
- Execution time per node
- Data flow visualization

### 💾 Auto-Generated APIs

Save your workflow once, get an API endpoint instantly:

```bash
POST /api/workflows/{workflow-id}/execute
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure123"
}

```

### 🗄️ Database Agnostic

Connect to your existing databases:

- MongoDB
- PostgreSQL
- MySQL
- Or use Orchestrix's built-in storage

### 🔐 Built-In Security

- Input validation middleware
- Authentication middleware
- JWT token verification
- Field-level access control

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ React Flow   │  │  AI Prompt   │  │   Node       │  │
│  │   Editor     │  │   Generator  │  │   Library    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (Logs)
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Motia Runtime)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Workflow    │  │   Step       │  │   State      │  │
│  │   Engine     │  │  Executor    │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Database   │  │    Email     │  │     Job      │  │
│  │  Connector   │  │   Service    │  │    Queue     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘

```

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Graph Editor:** React Flow
- **State Management:** React Hooks + Motia Client
- **Real-time:** Socket.io Client

### Backend

- **Runtime:** Motia Workflow Engine
- **Language:** TypeScript/JavaScript
- **Database:** MongoDB (configurable)
- **Email:** NodeMailer
- **Authentication:** JWT
- **Job Queue:** Motia Background Jobs
- **Logging:** Motia Step Logger

### AI/ML

- **Provider:** Groq (Claude/GPT models)
- **Purpose:** Natural language → Workflow generation

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (or your preferred database)

### Clone the Repository

```bash
git clone https://github.com/AymaanPathan/orchestrix.git
cd orchestrix

```

### Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

```

### Environment Setup

Create `.env` files in both frontend and backend:

**Frontend `.env.local`:**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

```

**Backend `.env`:**

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/orchestrix
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
GROQ_API_KEY=your-groq-api-key

```

### Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

```

Visit `http://localhost:3000` to see Orchestrix in action!

---

## 🎮 Usage Examples

### Example 1: User Registration API

**Prompt:**

```
Create a user registration API that validates email format,
hashes the password, saves to database, and sends welcome email

```

**Generated Workflow:**

1. Input Validation Node → validates email format
2. Compute Node → hashes password with bcrypt
3. Database Insert Node → saves user to MongoDB
4. Email Node → sends welcome email
5. Response Node → returns success message

### Example 2: Data Dashboard API

**Prompt:**

```
Build an API that fetches all orders from last 30 days,
calculates total revenue, and returns summary

```

**Generated Workflow:**

1. Database Find Node → query orders with date filter
2. Compute Node → sum order amounts
3. Response Node → return formatted data

### Example 3: Scheduled Report

**Prompt:**

```
Every Monday at 9 AM, fetch weekly sales data and
email report to admin@company.com

```

**Generated Workflow:**

1. Background Job Node → cron schedule
2. Database Find Node → weekly sales query
3. Compute Node → format report
4. Email Node → send to admin

---

## 🎨 Node Types Reference

### Input/Output Nodes

- **Input Node** - Define API request schema
- **Response Node** - Format and return API response

### Database Nodes

- **Find Record** - Query database with filters
- **Insert Record** - Create new database entries
- **Update Record** - Modify existing records
- **Delete Record** - Remove database entries

### Logic Nodes

- **Validation Middleware** - Validate input data
- **Auth Middleware** - Verify authentication
- **Compute Node** - Transform/process data

### Communication Nodes

- **Email Sender** - Send emails via SMTP

### Async Nodes

- **Background Job** - Schedule delayed/recurring tasks

---

## 🔍 Debugging & Logs

Orchestrix provides comprehensive debugging tools:

### Real-Time Execution Logs

- See each step execute in real-time
- View input/output data for every node
- Track execution time per step
- Identify errors with stack traces

### Log Viewer Features

- Color-coded log levels (info, warn, error)
- Expandable data payloads
- Step-by-step replay
- Export logs as JSON

![Log Viewer](https://claude.ai/chat/docs/images/logs.png)

---

## 🚀 Deployment

### Deploy to Production

1. **Build the frontend:**

```bash
cd frontend
npm run build

```

1. **Configure production environment variables**
2. **Deploy backend (Motia runtime):**

```bash
cd backend
npm run build
npm start

```

1. **Deploy frontend:**
- Vercel (recommended for Next.js)
- Netlify
- Your own server

### API Access

After saving a workflow, you get:

```
Endpoint: https://your-domain.com/api/workflows/{id}/execute
Method: POST
Headers: Content-Type: application/json
Body: { ...your input data }

```

---

## 📹 Demo Video
https://github.com/user-attachments/assets/cc7e5f2d-8511-41a8-8cb2-fe73fb9cac0e

Watch the full demo showing:
- AI workflow generation
- Visual editing
- Real-time execution
- API deployment

⭐ Star us on GitHub — it helps!

</div>


