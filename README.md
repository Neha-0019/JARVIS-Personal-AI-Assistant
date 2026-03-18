# JARVIS

A simple local AI assistant project with a Python backend and a React frontend.

## 🧩 Project Structure

- `agent.py` – Core assistant logic / controller
- `tools.py` – Utility functions and tools used by the agent
- `token_server.py` – Token service (likely for API keys or auth)
- `prompts.py` – Prompt templates for the AI assistant
- `frontend/` – React frontend (Vite + React)

## 🚀 Getting Started

### 1) Create / Activate Python virtual environment

```powershell
python -m venv venv
& .\venv\Scripts\Activate.ps1
```

### 2) Install Python dependencies

```powershell
pip install -r requirements.txt
```

### 3) Run the backend (Python)

```powershell
python agent.py
```

### 4) Run the frontend (React)

```powershell
cd frontend
npm install
npm run dev
```

## 🧪 Usage

- Visit the local frontend URL shown by Vite (commonly `http://localhost:5173`).
- The frontend communicates with the backend agent to provide AI-powered responses.

## 📌 Notes

- Add any required environment variables in a `.env` file (not committed). See `.gitignore`.
- If you add keys or secrets, keep them out of source control.

## 🛠️ Customization

- Modify prompts in `prompts.py` to change the assistant’s behavior.
- Update tools in `tools.py` to add new capabilities.
- Adjust the UI in `frontend/src/`.
