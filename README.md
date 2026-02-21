# Instagram Wrapped MVP

![Dashboard](docs/images/media__1771670253192.png)

A full-stack TypeScript MVP that authenticates users with Instagram Graph API (Facebook OAuth), syncs Instagram data, and generates Spotify-Wrapped style reports with stunning visuals. 

> **Built with OpenClaw & Antigravity**
> This project was entirely conceptualized and created using [OpenClaw](https://github.com/magical-app/openclaw) (for agentic orchestration) and **Antigravity** (for frontend, backend, and codebase engineering).

### Your 2024 Wrapped Generation

> **Note:** The UI shown below is rendered entirely using instant HTML/CSS cards! The Open AI Generative Image fallback is not in use by default but can be toggled on within the app if configured.

![Wrapped Start](docs/images/media__1771670287762.png)
![Impact & Top Posts](docs/images/media__1771670340363.png)
![The Numbers](docs/images/media__1771670340376.png)
![Content Mix & Top Moment](docs/images/media__1771670340772.png)

## 🚀 Quick Start (Docker)

For anyone who wants to run this project directly without local setup, we've provided a complete Docker configuration.

1. Ensure [Docker](https://docs.docker.com/get-docker/) is installed.
2. Clone the repository.
3. Run the following command in the root of the project:
   ```bash
   docker-compose up --build
   ```
4. Access the apps:
   - **Frontend:** http://localhost:5173
   - **Backend:** http://localhost:4000

## 🛠️ Local Development Setup

If you prefer to run things locally without Docker:

### 1) Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL running locally

### 2) Configure Environment
Copy `.env.example` values into `backend/.env` and `frontend/.env`.

**Backend (`backend/.env`):**
```env
# Core Server Setup
PORT=4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://admin:admin@localhost:5432/instagram_wrapped
SESSION_SECRET=change-me

# Toggle real Instagram Graph API vs Fake Seeded Data
MOCK_MODE=true # Set to false if you have a valid Meta App setup

# Meta (Facebook) App Setup (Required if MOCK_MODE=false)
INSTAGRAM_CLIENT_ID=your_meta_app_client_id
INSTAGRAM_CLIENT_SECRET=your_meta_app_client_secret
INSTAGRAM_REDIRECT_URI=https://your-ngrok-url.ngrok-free.dev/auth/instagram/callback
INSTAGRAM_SCOPES=instagram_basic,instagram_manage_insights,pages_show_list

# OpenAI Image Generation Setup (Optional, default uses HTML/CSS)
OPENAI_API_KEY=your_openai_key
OPENAI_IMAGE_MODEL=gpt-4o # Or whatever model you prefer
```

> **Ngrok Setup for Local Development:** 
> Facebook OAuth *strictly requires* a secure `https://` redirect URI. If you are developing locally without Docker and want to use real Instagram Login, you must expose your backend using a tool like [Ngrok](https://ngrok.com/).
> 
> Run `ngrok http 4000` to expose your backend, then update the `INSTAGRAM_REDIRECT_URI` in your `.env` and in your Meta App Settings to match the generated Ngrok HTTPS URL.

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3) Install & Run
```bash
# Install dependencies
npm run install:all

# Initialize Database (Terminal 1)
psql -h localhost -U admin -d postgres -f scripts/create-db.sql
npm run prisma:generate -w backend
npm run prisma:push -w backend

# Start Development Servers (Terminal 2)
npm run dev
```

---

## 🎨 AI Image Generation (OpenAI)

> **Important:** We are currently *not* using the Generative AI image capabilities of OpenAI by default. 

However, the configuration to dynamically create these images from prompts is fully implemented in the `backend/src/routes/wrapped.routes.ts` file! 
You can easily configure it using any agentic IDE:
1. Obtain an OpenAI API Key.
2. Add `OPENAI_API_KEY=your_key_here` to your `.env` file.
3. Toggle the UI setting to "AI Generated" on the Wrapped page!

---

## 📖 Step-by-Step Guide: Creating THE Facebook App

To run this application with real Instagram data (disabling `MOCK_MODE`), you must create and configure a **Meta (Facebook) App**. 

> **🚨 Deployment Blocker:** This application requires the Facebook App to be "Live" to authenticate arbitrary users. However, Meta requires **Business Data Validation** (a registered business entity) to switch an app to Live mode for Instagram Graph API permissions. Since we don't have a registered business yet, this app cannot be widely deployed or published for others to create their own "Wraps".

### How Graph APIs are Divided
During creation, we discovered that the Graph APIs are strictly divided between Facebook and Instagram. Facebook Login for Instagram requires a highly structured sequence of connections:

1. **Create a Meta App:** Go to the [Meta Developer Portal](https://developers.facebook.com/) and create a new App (Type: Business or Consumer).
2. **Facebook Business Account:** You must create a Meta Business Manager account.
3. **Facebook Page:** Create a Facebook Business Page within that manager.
4. **Instagram Creator/Business Account:** Convert your personal Instagram to a Professional (Creator/Business) account.
5. **Connecting the Two:** You must link your Instagram Professional account to the created Facebook Business Page.
6. **App Configuration:** 
   - Add "Facebook Login for Business" product to your Meta App.
   - Add "Instagram Graph API" product.
   - Configure your OAuth Redirect URIs (e.g., `https://your-ngrok-url.ngrok-free.dev/auth/instagram/callback`).
   - Request the following permissions: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
7. **Access Tokens:** Once linked, the user logs in via Facebook. We get a User Access Token, exchange it to find linked Pages, and grab the Instagram Business Account ID associated with that page to make API calls!

---

## 🔬 Blockers & Discoveries

During the automated orchestration of this project, we ran into a few fascinating architectural discoveries and API limitations:

- **24-Hour Story Limitation:** The Instagram Graph API **does not** support fetching highlights or archived stories! The endpoint `/me/stories` *only* returns stories active in the last 24 hours. To mitigate this, our `auto-sync` logic accumulates stories over time in our PostgreSQL database. The more frequently a user logs in, the more story data is securely saved for their Wrapped generation.
- **HTML Cards vs DALL-E:** We transitioned from exclusively generating slow, expensive DALL-E images to streaming, instant HTML/CSS rendered cards (similar to YouTube/Spotify). The backend automatically syncs fresh insights, computes aggregated stats, and renders the stunning UI via Vite+React.

---

## 🤝 Contributing

Did you know about the strict business-tier API limitations? Do you have a verified Meta Business account and want to help us take this LIVE? 

We'd love for you to easily replicate this process and contribute! Feel free to fork the repository, try the Docker setup, and open a Pull Request.
