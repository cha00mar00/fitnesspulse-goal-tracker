<div class="hero-icon" align="center">
  <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" width="100" />
</div>

<h1 align="center">
FitTrack MVP - Fitness Goal Tracker
</h1>
<h4 align="center">A web application enabling fitness enthusiasts to set, track, and monitor their fitness goals seamlessly.</h4>
<h4 align="center">Developed with the software and tools below.</h4>
<div class="badges" align="center">
  <img src="https://img.shields.io/badge/Framework-Next.js%2015-blue" alt="Framework: Next.js 15">
  <img src="https://img.shields.io/badge/Frontend-React%2019,_MUI%207-red" alt="Frontend: React 19, MUI 7">
  <img src="https://img.shields.io/badge/Backend-Node.js%20(Next.js%20API%20Routes)-blue" alt="Backend: Node.js (Next.js API Routes)">
  <img src="https://img.shields.io/badge/Database-MongoDB%20(Mongoose)-green" alt="Database: MongoDB (Mongoose)">
</div>
<div class="badges" align="center">
  <img src="https://img.shields.io/github/last-commit/coslynx/fittrack-mvp?style=flat-square&color=5D6D7E" alt="git-last-commit" />
  <img src="https://img.shields.io/github/commit-activity/m/coslynx/fittrack-mvp?style=flat-square&color=5D6D7E" alt="GitHub commit activity" />
  <img src="https://img.shields.io/github/languages/top/coslynx/fittrack-mvp?style=flat-square&color=5D6D7E" alt="GitHub top language" />
</div>

## 📑 Table of Contents
- [📍 Overview](#-overview)
- [📦 Features](#-features)
- [📂 Structure](#-structure)
- [💻 Installation](#-installation)
- [🏗️ Usage](#️-usage)
- [🌐 Hosting](#-hosting)
- [📜 API Documentation](#-api-documentation)
- [📄 License & Attribution](#-license--attribution)
- [📞 Contact](#-contact)

## 📍 Overview
This repository contains the Minimum Viable Product (MVP) for **FitTrackApp**, a web application designed for fitness enthusiasts. It provides a simple and intuitive platform for users to set personal fitness goals, track their progress over time, and stay motivated. The application features secure user authentication, goal management (creation, viewing, updating, deletion), and progress logging capabilities. Built with a modern tech stack including Next.js 15 (React 19) for the frontend and API routes, Node.js, MongoDB with Mongoose for data persistence, and Material UI for the user interface, FitTrackApp aims to deliver a clean and efficient user experience.

## 📦 Features
|    | Feature            | Description                                                                                                                                    |
|----|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| ⚙️ | **Architecture**   | Utilizes Next.js App Router for routing and API routes. Employs a monolithic structure suitable for MVP scope, with clear separation of concerns (models, context, components, api). Mongoose ODM for database interaction. |
| 📄 | **Documentation**  | Comprehensive README detailing setup, configuration, usage, API endpoints, and deployment. Code includes JSDoc comments for key functions and components.                                  |
| 🔗 | **Dependencies**   | Key dependencies include `next`, `react`, `@mui/material`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `zod`, `react-hook-form`, `axios`, `date-fns`. Managed via `package.json`.                |
| 🧩 | **Modularity**     | Code organized into logical directories: `app` (routing/pages), `components` (reusable UI), `context` (global state), `lib` (utilities, db), `models` (database schemas), `api` (backend logic). |
| 🧪 | **Testing**        | Basic testing setup configured (placeholder script in `package.json`). Further implementation of unit/integration tests (e.g., Jest, React Testing Library) is recommended.                |
| ⚡️  | **Performance**    | Leverages Next.js features (Server Components where applicable, optimized builds). Database indexing on key fields (`userId`, `email`, `goalId`). Singleton pattern for DB connection. Client-side validation reduces server load. |
| 🔐 | **Security**       | JWT-based authentication with HttpOnly cookies. Password hashing using `bcryptjs`. Middleware enforces route protection. Input validation using `zod`. Security headers configured in `next.config.mjs`. |
| 🔀 | **Version Control**| Git for version control. `.gitignore` configured to exclude sensitive files and build artifacts. Standard commit practices encouraged.                                                |
| 🔌 | **Integrations**   | Primarily integrates frontend React components with backend Next.js API routes via `axios`. Connects to MongoDB database via `mongoose`. Uses `date-fns` for date utility.               |
| 📶 | **Scalability**    | Stateless JWT authentication supports horizontal scaling of the backend API routes. Next.js provides scalable deployment options (e.g., Vercel). Database choice (MongoDB) allows for scaling. |

## 📂 Structure
```text
fittrack-mvp/
├── app/
│   ├── (app)/             # Authenticated application routes
│   │   ├── dashboard/
│   │   │   └── page.tsx   # Dashboard page
│   │   ├── goals/
│   │   │   ├── [goalId]/
│   │   │   │   └── page.tsx # Goal detail page
│   │   │   └── new/
│   │   │       └── page.tsx # New goal creation page
│   │   └── layout.tsx     # Layout for authenticated section (provides AuthContext)
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx   # Login page
│   │   ├── signup/
│   │   │   └── page.tsx   # Signup page
│   │   └── layout.tsx     # Layout for authentication pages
│   ├── api/               # Backend API routes
│   │   ├── auth/
│   │   │   └── route.ts   # Handles login, signup, profile, logout
│   │   ├── goals/
│   │   │   ├── [goalId]/
│   │   │   │   └── route.ts # Handles GET/PUT/DELETE for specific goal
│   │   │   └── route.ts   # Handles GET (list) / POST (create) for goals
│   │   └── progress/
│   │       └── route.ts   # Handles POST for creating progress entries
│   ├── layout.tsx         # Root layout for the entire application
│   └── page.tsx           # Public landing/home page
├── components/            # Reusable React components
│   ├── AppHeader.tsx      # (Assumed) Common application header/navbar
│   ├── AuthForm.tsx       # Reusable form for login/signup
│   ├── GoalCard.tsx       # Card displaying goal summary
│   ├── GoalForm.tsx       # Form for creating/editing goals
│   ├── ProgressHistory.tsx # Component to display progress entries
│   └── ProgressLogForm.tsx # Form to log new progress
├── context/               # React context providers
│   └── AuthContext.tsx    # Global authentication state management
├── lib/                   # Shared libraries, utilities, helpers
│   ├── auth.ts            # Authentication utility functions (server-side)
│   ├── db.ts              # Database connection helper (Mongoose)
│   ├── types.ts           # Shared TypeScript type definitions
│   └── utils.ts           # General utility functions (e.g., date formatting)
├── models/                # Mongoose schema definitions
│   ├── Goal.ts            # Goal model schema
│   ├── Progress.ts        # Progress entry model schema
│   └── User.ts            # User model schema (includes password hashing)
├── public/                # Static assets
│   └── favicon.ico        # Application favicon
├── styles/                # Global styles
│   └── globals.css        # Global CSS resets and base styles
├── .env                   # Environment variables (local, gitignored)
├── .env.example           # Example environment variables template
├── .gitignore             # Git ignore configuration
├── commands.json          # (Optional) Custom command definitions
├── middleware.ts          # Next.js middleware for authentication checks
├── next.config.mjs        # Next.js configuration file
├── package.json           # Project dependencies and scripts
├── README.md              # This file
├── startup.sh             # (Optional) Development startup script
└── tsconfig.json          # TypeScript configuration
```

## 💻 Installation
  > [!WARNING]
  > ### 🔧 Prerequisites
  > - **Node.js**: Version compatible with Next.js 15 (e.g., v18.17.0 or later, check Next.js docs for specifics).
  > - **npm** or **yarn** or **pnpm**: Package manager installed with Node.js.
  > - **MongoDB**: A running MongoDB instance (local or cloud-based like MongoDB Atlas). Ensure the connection URI is ready.

  ### 🚀 Setup Instructions
  1.  **Clone the repository:**
      ```bash
      git clone https://github.com/coslynx/fittrack-mvp.git
      cd fittrack-mvp
      ```
  2.  **Install dependencies:**
      ```bash
      npm install
      # or yarn install / pnpm install
      ```
  3.  **Configure environment variables:**
      *   Copy the example environment file:
          ```bash
          cp .env.example .env
          ```
      *   Edit the `.env` file with your actual configuration:
          *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/fittrack_mvp_dev` or your Atlas URI).
          *   `JWT_SECRET`: A strong, secret string for signing JWTs. Generate one using `openssl rand -base64 32` or a similar tool. **Keep this secret!**
          *   `JWT_EXPIRES_IN`: Token expiration duration (e.g., `1d`, `7h`).

## 🏗️ Usage
  ### 🏃‍♂️ Running the MVP
  1.  **Ensure MongoDB is running:** Start your local MongoDB server or ensure your Atlas cluster is accessible.
  2.  **Start the development server:**
      ```bash
      npm run dev
      # or yarn dev / pnpm dev
      ```
      This command launches the Next.js development server, typically accessible at `http://localhost:3000`. The server includes the React frontend and the backend API routes.

  > [!TIP]
  > ### ⚙️ Configuration
  > Key configuration is managed through the `.env` file in the project root:
  > - `MONGODB_URI`: Specifies the connection string for your MongoDB database.
  > - `JWT_SECRET`: The secret key used for signing and verifying user authentication tokens. Must be kept confidential.
  > - `JWT_EXPIRES_IN`: Defines how long a user's login session (JWT token) remains valid.

  ### 📚 Examples
  - **Accessing the App**: Open your web browser and navigate to `http://localhost:3000`.
  - **Signup**: Navigate to the signup page (`/signup`) and create a new user account.
  - **Login**: Navigate to the login page (`/login`) and authenticate with your credentials.
  - **Dashboard**: After logging in, you'll be redirected to the dashboard (`/dashboard`) where you can view and create fitness goals.
  - **Goal Management**: Click 'Create New Goal' to add a goal. Click on an existing goal card to view its details and log progress.

## 🌐 Hosting
  ### 🚀 Deployment Instructions (Example: Vercel)
  Vercel is highly recommended for deploying Next.js applications.

  1.  **Push to Git Repository**: Ensure your code is pushed to a Git provider (GitHub, GitLab, Bitbucket).
  2.  **Import Project on Vercel**:
      *   Sign up or log in to [Vercel](https://vercel.com).
      *   Click "Add New..." -> "Project".
      *   Import the Git repository containing your FitTrackApp code.
  3.  **Configure Project**:
      *   Vercel typically auto-detects Next.js projects.
      *   **Crucially, configure Environment Variables** in the Vercel project settings:
          *   `MONGODB_URI`: Your **production** MongoDB connection string.
          *   `JWT_SECRET`: Your **production** JWT secret (use a different, strong secret than development).
          *   `JWT_EXPIRES_IN`: Production token expiration (e.g., `7d`).
          *   `NODE_ENV`: Set automatically to `production` by Vercel.
  4.  **Deploy**: Click the "Deploy" button. Vercel will build and deploy your application.

  ### 🔑 Environment Variables for Production
  Ensure the following environment variables are set in your hosting provider's settings:

  - `MONGODB_URI`: Connection string for the **production** MongoDB database.
  - `JWT_SECRET`: A strong, unique secret key for **production** JWTs.
  - `JWT_EXPIRES_IN`: Token expiration duration for production (e.g., `7d`).
  - `NODE_ENV`: Should be set to `production` (usually handled automatically by platforms like Vercel).

## 📜 API Documentation
  The backend functionality is exposed via Next.js API routes under `/api`. Authentication is required for most endpoints (except `/api/auth` for login/signup) and relies on an HttpOnly `access_token` cookie containing a JWT.

  ### 🔍 Endpoints

  **Authentication (`/api/auth`)**
  - **`POST /api/auth`**
    - **Action: `signup`**
      - Description: Register a new user.
      - Body: `{ "action": "signup", "name": string, "email": string, "password": string }`
      - Response (Success 201): `{ "success": true, "message": "Signup successful. Please login." }`
      - Response (Error 400/409/500): `{ "success": false, "message": string }`
    - **Action: `login`**
      - Description: Authenticate a user and set `access_token` cookie.
      - Body: `{ "action": "login", "email": string, "password": string }`
      - Response (Success 200): `{ "success": true, "data": { "user": User } }` (User object excluding password)
      - Response (Error 400/401/500): `{ "success": false, "message": string }`
  - **`GET /api/auth/profile`** (Added for `AuthContext`)
    - Description: Get authenticated user's profile based on cookie.
    - Headers: Requires valid `access_token` cookie.
    - Response (Success 200): `{ "success": true, "data": { "user": User } }`
    - Response (Error 401/500): `{ "success": false, "message": string }`
  - **`POST /api/auth/logout`** (Added for `AuthContext`)
    - Description: Clears the `access_token` cookie.
    - Response (Success 200): `{ "success": true, "message": "Logout successful." }` (or similar)

  **Goals (`/api/goals`)**
  - **`POST /api/goals`**
    - Description: Create a new fitness goal for the authenticated user.
    - Headers: Requires valid `access_token` cookie.
    - Body: `{ "name": string, "description"?: string, "targetMetric"?: string, "targetUnit"?: string, "deadline"?: ISOStringDate }`
    - Response (Success 201): `{ "success": true, "data": { "goal": Goal } }`
    - Response (Error 400/401/500): `{ "success": false, "message": string }`
  - **`GET /api/goals`**
    - Description: Retrieve all goals for the authenticated user.
    - Headers: Requires valid `access_token` cookie.
    - Response (Success 200): `{ "success": true, "data": { "goals": Goal[] } }`
    - Response (Error 401/500): `{ "success": false, "message": string }`

  **Specific Goal (`/api/goals/[goalId]`)**
  - **`GET /api/goals/[goalId]`**
    - Description: Retrieve details and progress history for a specific goal owned by the user.
    - Headers: Requires valid `access_token` cookie.
    - Response (Success 200): `{ "success": true, "data": { "goal": Goal, "progressEntries": ProgressEntry[] } }`
    - Response (Error 400/401/404/500): `{ "success": false, "message": string }`
  - **`PUT /api/goals/[goalId]`**
    - Description: Update a specific goal owned by the user.
    - Headers: Requires valid `access_token` cookie.
    - Body: `{ "name"?: string, "description"?: string, "targetMetric"?: string, "targetUnit"?: string, "deadline"?: ISOStringDate }` (Partial updates allowed)
    - Response (Success 200): `{ "success": true, "data": { "goal": Goal } }`
    - Response (Error 400/401/404/500): `{ "success": false, "message": string }`
  - **`DELETE /api/goals/[goalId]`**
    - Description: Delete a specific goal (and its progress entries) owned by the user.
    - Headers: Requires valid `access_token` cookie.
    - Response (Success 204): No Content
    - Response (Error 400/401/404/500): `{ "success": false, "message": string }` (JSON error response)

  **Progress (`/api/progress`)**
  - **`POST /api/progress`**
    - Description: Log a new progress entry for a specific goal owned by the user.
    - Headers: Requires valid `access_token` cookie.
    - Body: `{ "goalId": ObjectIdString, "value": number, "date": ISOStringDate, "notes"?: string }`
    - Response (Success 201): `{ "success": true, "data": { "progressEntry": ProgressEntry } }`
    - Response (Error 400/401/404/500): `{ "success": false, "message": string }`

  ### 🔒 Authentication
  - API requests to protected routes (goals, progress, profile) must include the `access_token` cookie automatically sent by the browser after successful login.
  - The cookie is `HttpOnly`, `Secure` (in production), and `SameSite=Lax`.
  - The JWT contains the `userId` and has an expiration time defined by `JWT_EXPIRES_IN`.
  - Middleware (`middleware.ts`) verifies the token for protected routes.

  ### 📝 Examples (`curl`)

  ```bash
  # --- Login ---
  # (Replace placeholders; Cookie is set by server, not directly in curl)
  curl -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"action": "login", "email": "user@example.com", "password": "password123"}' \
    -c cookies.txt # Saves cookies (including access_token)

  # --- Create Goal ---
  # (Uses cookie saved from login)
  curl -X POST http://localhost:3000/api/goals \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"name": "Run 5km", "targetMetric": "Distance", "targetUnit": "km"}'

  # --- Log Progress ---
  # (Replace "YOUR_GOAL_ID" with actual ID)
  curl -X POST http://localhost:3000/api/progress \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"goalId": "YOUR_GOAL_ID", "value": 2.5, "date": "2024-07-27T10:00:00.000Z", "notes": "Felt good!"}'

  # --- Get User Goals ---
  curl -X GET http://localhost:3000/api/goals \
    -b cookies.txt
  ```

  > [!NOTE]
  > ## 📜 License & Attribution
  >
  > ### 📄 License
  > This Minimum Viable Product (MVP) is licensed under the [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) license.
  >
  > ### 🤖 AI-Generated MVP
  > This MVP was entirely generated using artificial intelligence through [CosLynx.com](https://coslynx.com).
  >
  > No human was directly involved in the coding process of the repository: fittrack-mvp
  >
  > ### 📞 Contact
  > For any questions or concerns regarding this AI-generated MVP, please contact CosLynx at:
  > - Website: [CosLynx.com](https://coslynx.com)
  > - Twitter: [@CosLynxAI](https://x.com/CosLynxAI)

<p align="center">
  <h1 align="center">🌐 CosLynx.com</h1>
</p>
<p align="center">
  <em>Create Your Custom MVP in Minutes With CosLynxAI!</em>
</p>
<div class="badges" align="center">
<img src="https://img.shields.io/badge/Developers-Drix10,_Kais_Radwan-red" alt="">
<img src="https://img.shields.io/badge/Website-CosLynx.com-blue" alt="">
<img src="https://img.shields.io/badge/Backed_by-Google,_Microsoft_&_Amazon_for_Startups-red" alt="">
<img src="https://img.shields.io/badge/Finalist-Backdrop_Build_v4,_v6-black" alt="">
</div>