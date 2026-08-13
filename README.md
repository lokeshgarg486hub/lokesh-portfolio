# Lokesh Portfolio — Full-Stack Setup Guide

This project is split into two completely separate codebases:

| Folder | Purpose | Tech |
|--------|---------|------|
| `frontend/` | The public-facing website | HTML, CSS, Vanilla JS |
| `backend/` | The API server | Python, FastAPI, MongoDB |

---

## Prerequisites

- **Python 3.9+** — [python.org/downloads](https://www.python.org/downloads/)
- **MongoDB** — [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) OR use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A static file server for the frontend — **VS Code Live Server** extension is the easiest option

---

## 1. Quick Start (One-Command Run)

For local development, you can start both the backend API and frontend servers together using a single script from the project root.

### Option A: Double-Click (Windows)
Simply double-click the `start.bat` file in the project root folder.

### Option B: Command Line
Make sure your backend virtual environment is activated (if you aren't installing dependencies globally), then run:
```bash
python run.py
```

This will run both `uvicorn` (backend) and `http.server` (frontend) in parallel.
- **Frontend URL:** http://localhost:5500/index.html
- **Backend API Docs:** http://localhost:8000/docs

*Press `Ctrl+C` in the terminal to stop both servers cleanly.*

---

## 2. Backend Setup (Manual / Fallback)

### Step 1: Navigate to the backend folder
```bash
cd backend
```

### Step 2: Create and activate a Python virtual environment
```bash
# Create
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

> **Note on bcrypt:** `bcrypt==4.0.1` is pinned explicitly in `requirements.txt` because newer versions of bcrypt removed an attribute that `passlib` depends on, causing an `AttributeError` on startup. Do not remove this pin.

### Step 4: Set up environment variables
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=portfolio_db
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRE_MINUTES=1440
ADMIN_BOOTSTRAP_USERNAME=admin
ADMIN_BOOTSTRAP_PASSWORD=YourSecurePassword!
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=onboarding@resend.dev
```

> ⚠️ **Important:** Change `JWT_SECRET` and `ADMIN_BOOTSTRAP_PASSWORD` to strong, unique values before deploying.

### Step 5: Create the first admin user (run ONCE)
```bash
python seed_admin.py
```

This reads `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD` from your `.env` and inserts the admin user into MongoDB. Run this only once — it will skip if the user already exists.

### Step 6: Start the backend server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: `http://localhost:8000`

Interactive API docs (Swagger UI): `http://localhost:8000/docs`

---

## 3. Frontend Setup (Manual / Fallback)

### Option A: VS Code Live Server (Recommended)
1. Open the `frontend/` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` → **"Open with Live Server"**.

The frontend will be served at `http://127.0.0.1:5500`.

### Option B: Python simple HTTP server
```bash
cd frontend
python -m http.server 5500
```

> **Note:** The `API_BASE_URL` in `frontend/js/dynamic.js` and `frontend/js/admin.js` automatically detects whether you are on localhost or a deployed domain. On localhost it uses `http://localhost:8000/api`; on any other hostname it uses the placeholder `REPLACE-WITH-DEPLOYED-BACKEND-URL`. Update that placeholder string in both files once the backend is deployed.

---

## 4. Accessing the Admin Dashboard

1. Open `http://127.0.0.1:5500/admin.html` in your browser.
2. Log in with the username and password you set in `.env`.
3. Your JWT token is stored in `localStorage` under the key `admin_jwt_token`. You will stay logged in until the token expires (default: 24 hours) or you click Logout.

**Admin tabs available:**
- Domains, Projects (with featured flag, tech stack, GitHub/Demo links)
- Certificates, Internships
- Testimonials, Skills, Education
- Social Links, Profile
- Messages (with Reply via Resend)
- Analytics (page views & CV download charts, Chart.js)

---

## 5. Deploying to Vercel

### Architecture Decision Note
Vercel works well for the **static `frontend/`** (just drop the folder in). For the **FastAPI `backend/`**, Vercel uses a serverless model: no persistent background workers, cold starts on the free tier, and a ~10 second execution limit per request. For a simple CRUD portfolio backend this is fine once the fixes above are in place. **Alternative:** Render's free tier runs FastAPI as a normal persistent process (no cold starts, simpler debugging) — consider it if Vercel's serverless quirks become a problem.

### Step-by-step: Deploy the Frontend
1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo.
2. Set **Root Directory** to `frontend/`.
3. Vercel auto-detects it as a static site. Click **Deploy**.
4. Note the deployed URL (e.g., `https://lokesh-portfolio.vercel.app`).

### Step-by-step: Deploy the Backend (FastAPI on Vercel)
1. The `vercel.json` in the project root is already configured to route `/api/*` to `backend/app/main.py`.
2. In the Vercel dashboard → your project → **Settings → Environment Variables**, add all the variables from `.env.example`:
   - `MONGO_URI` — **Must be a MongoDB Atlas connection string** (see below)
   - `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`, `FROM_EMAIL`
   - `ALLOWED_ORIGINS` — include your deployed frontend URL
3. Deploy. Vercel will install `requirements.txt` automatically.
4. Test the API at `https://your-project.vercel.app/api/profile`.

### ⚠️ MongoDB Atlas (Required for Deployment)
Vercel's servers cannot reach a MongoDB instance running on your local machine. Before deploying:
1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) account.
2. Create a free **M0** cluster.
3. Create a database user and whitelist all IPs (`0.0.0.0/0`).
4. Copy the connection string and set it as `MONGO_URI` in Vercel's environment variables.
5. Run `python seed_admin.py` locally pointing at Atlas (set `MONGO_URI` in your local `.env` to the Atlas URI) to create the admin user in the cloud database.

### ⚠️ CORS
After deploying the frontend, add its URL to `ALLOWED_ORIGINS` in the Vercel environment variables:
```
ALLOWED_ORIGINS=https://lokesh-portfolio.vercel.app,http://localhost:5500
```
Then redeploy the backend.

---

## 6. File Upload Notes

Images are uploaded to **Cloudinary** (not local disk). This makes the backend stateless and compatible with serverless platforms like Vercel.

- Sign up at [cloudinary.com](https://cloudinary.com) — free tier, no credit card required.
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in your `.env`.
- Uploaded files are stored in the `lokesh_portfolio` folder in your Cloudinary account.

---

## 7. Project Structure Quick Reference

```
lokesh-portfolio/
├── frontend/
│   ├── index.html              — Home: profile, featured projects
│   ├── about.html              — About: bio, skills, education, testimonials
│   ├── service.html            — Domains: links to filtered work
│   ├── works.html              — All projects (domain-filterable)
│   ├── single-project.html     — Project detail with tech-stack chips, GitHub/Demo links
│   ├── domain-detail.html      — Domain-specific view (DomainContentBrowser)
│   ├── contact.html            — Contact form + social links
│   ├── admin.html              — Admin dashboard (login required)
│   └── js/
│       ├── dynamic.js          — All public API fetch + render logic, analytics tracking
│       ├── admin.js            — Admin CRUD, file upload, reply, analytics charts
│       └── DomainContentBrowser.js — React component for domain-detail page
├── backend/
│   ├── app/
│   │   ├── main.py             — FastAPI app, all endpoints
│   │   ├── models.py           — Pydantic schemas (Project, Testimonial, Skill, Education, Analytics...)
│   │   ├── database.py         — MongoDB Motor client + all collections
│   │   ├── auth.py             — JWT + bcrypt
│   │   └── config.py           — Settings from .env (Cloudinary, Resend, etc.)
│   ├── seed_admin.py           — One-time admin user creation
│   ├── requirements.txt        — Python dependencies (bcrypt pinned to 4.0.1)
│   └── .env.example            — Template for all environment variables
├── vercel.json                  — Vercel deployment config (routes /api/* to FastAPI)
├── run.py                       — One-command local development script
├── start.bat                    — Windows batch shortcut for run.py
└── README.md
```


This project is split into two completely separate codebases:

| Folder | Purpose | Tech |
|--------|---------|------|
| `frontend/` | The public-facing website | HTML, CSS, Vanilla JS |
| `backend/` | The API server | Python, FastAPI, MongoDB |

---

## Prerequisites

- **Python 3.9+** — [python.org/downloads](https://www.python.org/downloads/)
- **MongoDB** — [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) OR use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A static file server for the frontend — **VS Code Live Server** extension is the easiest option

---

## 1. Quick Start (One-Command Run)

For local development, you can start both the backend API and frontend servers together using a single script from the project root.

### Option A: Double-Click (Windows)
Simply double-click the `start.bat` file in the project root folder.

### Option B: Command Line
Make sure your backend virtual environment is activated (if you aren't installing dependencies globally), then run:
```bash
python run.py
```

This will run both `uvicorn` (backend) and `http.server` (frontend) in parallel.
- **Frontend URL:** http://localhost:5500/index.html
- **Backend API Docs:** http://localhost:8000/docs

*Press `Ctrl+C` in the terminal to stop both servers cleanly.*

---

## 2. Backend Setup (Manual / Fallback)

### Step 1: Navigate to the backend folder
```bash
cd backend
```

### Step 2: Create and activate a Python virtual environment
```bash
# Create
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Set up environment variables
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
MONGO_URI=mongodb://localhost:27017          # Or your Atlas connection string
DB_NAME=portfolio_db
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRE_MINUTES=1440
ADMIN_BOOTSTRAP_USERNAME=admin
ADMIN_BOOTSTRAP_PASSWORD=YourSecurePassword!
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

> ⚠️ **Important:** Change `JWT_SECRET` and `ADMIN_BOOTSTRAP_PASSWORD` to strong, unique values before deploying.

### Step 5: Create the first admin user (run ONCE)
```bash
python seed_admin.py
```

This reads `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD` from your `.env` and inserts the admin user into MongoDB. Run this only once — it will skip if the user already exists.

### Step 6: Start the backend server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: `http://localhost:8000`

Interactive API docs (Swagger UI): `http://localhost:8000/docs`

---

## 3. Frontend Setup (Manual / Fallback)

### Option A: VS Code Live Server (Recommended)
1. Open the `frontend/` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` → **"Open with Live Server"**.

The frontend will be served at `http://127.0.0.1:5500`.

### Option B: Python simple HTTP server
```bash
cd frontend
python -m http.server 5500
```

> **Note:** The frontend expects the backend to be running at `http://localhost:8000`. This is set in `frontend/js/dynamic.js` on **line 4**:
> ```js
> const API_BASE_URL = 'http://localhost:8000/api';
> ```
> Change this one line when deploying to production.

---

## 4. Accessing the Admin Dashboard

1. Open `http://127.0.0.1:5500/admin.html` in your browser.
2. Log in with the username and password you set in `.env` (`ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD`).
3. Your JWT token is stored in `localStorage` under the key `admin_jwt_token`. You will stay logged in until the token expires (default: 24 hours) or you click Logout.

---

## 5. Deployment Notes

### Backend (FastAPI) — Recommended Hosts
- **Render** (free tier): Deploy as a Web Service, set env vars in the Render dashboard.
- **Railway**: Connect your GitHub repo, set env vars.

### Frontend — Recommended Hosts
- **Netlify** or **Vercel**: Drag and drop the `frontend/` folder, or connect to GitHub.

### Database
- Use [**MongoDB Atlas**](https://www.mongodb.com/atlas) (free M0 tier). Copy the connection string and set it as `MONGO_URI` in your deployment environment variables.

### CORS
- After deploying the frontend, add its URL to `ALLOWED_ORIGINS` in your backend environment:
```env
ALLOWED_ORIGINS=https://your-portfolio.netlify.app,https://your-domain.com
```

---

## 6. File Upload Notes

Uploaded images are stored in `backend/uploads/`. This directory is served by FastAPI at `/uploads/<filename>`.

- **Max file size:** Controlled by `MAX_UPLOAD_SIZE_MB` in `.env`
- **Allowed types:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- **Filenames:** Renamed to UUID on upload to prevent overwriting

---

## 7. Project Structure Quick Reference

```
lokesh-portfolio/
├── frontend/
│   ├── index.html           — Home: profile, recent projects
│   ├── about.html           — About: bio, internships, certifications
│   ├── service.html         — Domains: links to filtered work
│   ├── works.html           — All projects
│   ├── single-project.html  — Single project detail (?id=)
│   ├── contact.html         — Contact form + social links
│   ├── admin.html           — Admin dashboard (login required)
│   └── js/
│       ├── dynamic.js       — All public API fetch + render logic
│       └── admin.js         — Admin login, CRUD, file upload
├── backend/
│   ├── app/
│   │   ├── main.py          — FastAPI app, all endpoints
│   │   ├── models.py        — Pydantic schemas
│   │   ├── database.py      — MongoDB Motor client
│   │   ├── auth.py          — JWT + bcrypt
│   │   └── config.py        — Settings from .env
│   ├── seed_admin.py        — One-time admin user creation
│   ├── uploads/             — Uploaded images
│   ├── requirements.txt
│   └── .env.example         — Template for environment variables
├── run.py                   — One-command local development script
├── start.bat                — Windows batch shortcut for run.py
└── README.md
```
