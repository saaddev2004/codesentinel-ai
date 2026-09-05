<div align="center">

# 🛡️ CodeSentinel AI

### AI-Powered Pull Request Reviewer for GitHub

*Automatically reviews your pull requests for security vulnerabilities, logic bugs, and code quality issues — powered by LLMs.*

[![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Groq](https://img.shields.io/badge/LLM-Groq-orange)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Overview

**CodeSentinel AI** is a GitHub App that acts like a senior engineer sitting in on every pull request. The moment a PR is opened or updated, it fetches the diff, runs it through an LLM-powered multi-category review pipeline, and posts **inline comments** directly on the exact lines that need attention — flagging security vulnerabilities, logic bugs, and style issues before they ever reach production.

Manual code review is slow, inconsistent, and easy to get wrong under deadline pressure. CodeSentinel AI catches the common, expensive mistakes automatically, so human reviewers can spend their time on architecture and design decisions instead of hunting for SQL injection risks or hardcoded secrets.

## ✨ Features

- 🔍 **Automatic PR Review** — Triggers instantly on every `pull_request` webhook event (opened / synchronize)
- 🧠 **AI-Powered Analysis** — Multi-category review: security, logic bugs, and code style, via LLM (Groq / `openai/gpt-oss-120b`)
- 💬 **Inline GitHub Comments** — Issues are posted directly on the relevant line, with severity and category tags
- ⚡ **Caching Layer** — Identical diffs are never re-reviewed twice, saving LLM cost and latency
- 🔐 **Secure by Design** — GitHub App authentication (JWT + short-lived installation tokens), HMAC-verified webhooks
- 🗄️ **Persistent History** — Every review and issue is stored in PostgreSQL for auditability
- 📊 **Dashboard** — A Next.js dashboard to browse past reviews and their flagged issues at a glance

## 🏗️ Architecture

```
GitHub PR Event
      │
      ▼
Webhook Receiver (FastAPI) ── HMAC Signature Verification
      │
      ▼
GitHub App Auth ── Private Key → JWT → Installation Access Token
      │
      ▼
Diff Fetcher ── GitHub REST API (/pulls/{pr}/files)
      │
      ▼
AI Review Engine ── Groq LLM → Structured JSON (issues[])
      │              │
      │              └── In-memory cache (diff hash → result)
      ▼
   ┌──────────────┬──────────────────┐
   ▼              ▼                  ▼
Inline PR      PostgreSQL         Next.js
Comments       (reviews/issues)   Dashboard
(GitHub API)
```

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python), Uvicorn |
| AI / LLM | Groq API (`openai/gpt-oss-120b`) |
| Database | PostgreSQL (Neon, serverless) via SQLAlchemy (async) |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Auth | GitHub App (JWT + Installation Tokens), PyJWT, cryptography |
| Tunneling (dev) | ngrok |
| HTTP Client | httpx (async) |

## 🚀 How It Works

1. **Install** the CodeSentinel AI GitHub App on any repository
2. **Open or update a pull request** — the App is notified instantly via webhook
3. **Diff is fetched** for every changed file via the GitHub REST API
4. **Each file's diff is sent to the LLM**, which returns a structured list of issues (line number, severity, category, message)
5. **Issues are posted as inline PR comments** — and saved to the database
6. **Browse the dashboard** anytime to see review history across all repos



## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A GitHub account (to create a GitHub App)
- A free [Groq](https://console.groq.com) API key
- A free [Neon](https://neon.tech) PostgreSQL database

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/codesentinel-ai.git
cd codesentinel-ai
```

### 2. Backend setup
```bash
cd apps/api
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install fastapi uvicorn python-dotenv httpx pyjwt cryptography groq asyncpg sqlalchemy
```

Create a `.env` file in `apps/api/`:
```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_APP_ID=your_app_id
GITHUB_CLIENT_ID=your_client_id
GITHUB_PRIVATE_KEY_PATH=../../secrets/your-private-key.pem
GROQ_API_KEY=your_groq_key
DATABASE_URL=your_neon_connection_string
```

Run the server:
```bash
uvicorn main:app --reload
```

### 3. Expose locally with ngrok (for GitHub webhooks)
```bash
ngrok http 8000
```
Set the resulting URL + `/webhook/github` as your GitHub App's Webhook URL.

### 4. Frontend setup
```bash
cd apps/web
npm install
npm run dev
```
Visit `http://localhost:3000`.

## 🗺️ Roadmap

- [ ] Prevent duplicate comments on repeated webhook deliveries
- [ ] Smarter handling of non-code files (README, docs) to reduce noise
- [ ] Persist cache in the database instead of memory
- [ ] Per-PR cost/token budget and rate limiting
- [ ] Auto-fix suggestions using GitHub's "suggested changes" API
- [ ] Team-level analytics dashboard (recurring issue patterns over time)
- [ ] Custom per-repo configuration (`.codesentinel.yml`)

## 🧑‍💻 Author

Built by **Muhammad Saad** — Final-year Software Engineering student, as a portfolio project demonstrating GitHub App integration, async backend architecture, LLM-based code review pipelines, and full-stack engineering.

## 📄 License

This project is licensed under the MIT License.
