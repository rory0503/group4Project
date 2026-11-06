# Green AI Tracker – How to Run

## What this branch is for

`api-integration` is only for checking that the backend and front end work together.

Keep doing your normal work on the usual branches:
- Backend work → `Backend`
- Front-end work → `FrontEnd`

To bring their latest changes into this branch:
```bash
git fetch origin
git merge origin/Backend
git merge origin/FrontEnd
```

## One-time setup

**1. Install Node.js**
```bash
winget install OpenJS.NodeJS.LTS
```

**2. Install the backend packages**
```bash
python -m pip install "fastapi[standard]" requests sqlalchemy pymysql cryptography
```

**3. Create the database** (in HeidiSQL or MySQL Workbench)
```sql
CREATE DATABASE IF NOT EXISTS green_ai;
```

**4. Add your MySQL password** in `app/databaseConfig.py`
```python
DB_PASSWORD = "your-mysql-password"
```

**5. Install the front-end packages**
```bash
cd greenAiTracker
npm install
```

## Start it up

Open **two terminals** in the `group4Project` folder.

**Terminal 1 – backend**
```bash
cd app
python -m fastapi dev main.py
```
Wait for `Database sync complete.`

**Terminal 2 – front end**
```bash
cd greenAiTracker
npm run dev
```

Open **http://localhost:5173**

## Notes
- Start the backend first.
- If `npm` gives a "scripts is disabled" error, use `npm.cmd` instead.
- Don't commit your password in `databaseConfig.py`.