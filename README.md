# ASVORA Portfolio

## Backend

Run these commands from the project directory in PowerShell:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` before starting the server. Set a unique `JWT_SECRET` (at least 32 random characters), `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`; the example file intentionally contains no credentials. Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. The server will refuse to start if the signing secret is missing or too short, or if the admin email and password are missing on a fresh install. Keep `.env` private; it is excluded from Git. Admin logins are temporarily throttled after five failed attempts per IP address or account within 15 minutes.

The backend uses MongoDB at `mongodb://localhost:27017/` by default and stores portfolio data in the `asvora` database. Configure `MONGODB_URI` and `MONGO_DB_NAME` in `backend/.env` to use a different MongoDB server or database. Ensure MongoDB is running before starting the backend. On first startup, existing records in `backend/data.json` are migrated into MongoDB; the JSON file is retained as a backup. Analytics continue to use SQLite in `backend/analytics.sqlite3`.

```powershell
uvicorn main:app --reload
```

## Frontend

In a second PowerShell window, from the project directory:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the public site at `http://localhost:5173` and the admin at `http://localhost:5173/admin`.

## Enquiries and persistence

Enquiries and quote requests are saved in `backend/data.json` and appear in the admin panel. To also receive email notifications, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL` in `backend/.env`. Use `SMTP_USE_SSL=true` only for an SSL SMTP endpoint; otherwise the server uses STARTTLS. Without SMTP configuration, submissions still reach the admin panel, but no email is sent.

Visit analytics use `backend/analytics.sqlite3`, avoiding a full JSON rewrite on every page view. Existing visit records in `data.json` are migrated automatically the first time the backend starts with the new version. Back up the MongoDB database and SQLite database.

The starter portfolio uses the ASVORA studio details provided, with no invented projects, client testimonials, performance metrics, or quote budgets. Add verified work and testimonials in the admin panel. Add a case-study URL to a project to make its “Read case study” link appear. Configure quote budgets in Admin > Quote Settings if you want to offer them. The public contact email is intentionally blank until you provide one; update it under Admin > Content when ready.

Manage portfolio projects under Admin > Works. Edit the public About copy and Contact heading/details separately under Admin > About and Admin > Contact.

Visitors who scroll to the bottom see a star-rating prompt. Dismissing it starts a one-hour cooldown for that browser; submitting a review disables the prompt for that browser. Submitted reviews remain unpublished until approved in Admin > Testimonials.

Run backend regression tests from the `backend` directory with `python -m unittest discover -s tests`.

## Browser-only demo mode

For local demo mode, configure `VITE_DEMO_MODE`, `VITE_DEMO_ADMIN_EMAIL`, and `VITE_DEMO_ADMIN_PASSWORD` in the untracked `frontend/.env.local` file and restart Vite. Demo mode is restricted to Vite development; production builds continue to use backend authentication. Demo mode is not secure, stores changes only in the current browser origin, and cannot upload media or change backend passwords. Open the public site and admin on the same hostname and port because browser storage is not shared between `localhost` and `127.0.0.1` or between ports. Never use demo credentials on a deployed site.
