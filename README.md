# Hacker House Goa 2026 Builder Generator

A production-ready full-stack application built to generate custom profile frames and Builder ID cards for attendees and builders of Hacker House Goa 2026.

## Tech Stack

### Frontend
- **Framework:** React 19, TypeScript, Vite
- **Styling & Animation:** Tailwind CSS, Framer Motion
- **State & Forms:** React Query (TanStack Query v5), React Hook Form
- **UI Components:** shadcn/ui

### Backend
- **Framework:** FastAPI, Uvicorn
- **Image Processing:** OpenCV (`opencv-python-headless`), Pillow (PIL)

---

## Project Structure

```text
├── frontend/             # React SPA + TypeScript + Vite
│   ├── src/
│   │   ├── core/         # Routing, API settings, queryClient config
│   │   ├── components/   # Common ui / reusable components
│   │   ├── features/     # Feature-focused modules (profile frame, ID card)
│   │   ├── hooks/        # Reusable custom hooks
│   │   ├── lib/          # Utilities (e.g., tailwind merge cn helper)
│   │   └── types/        # TypeScript declarations
│   ├── tailwind.config.js # Tailwind CSS config
│   └── vercel.json       # Deployment configuration for Vercel
│
└── backend/              # Python FastAPI service
    ├── app/
    │   ├── api/          # Route definitions and endpoint endpoints
    │   ├── core/         # Config variables, logger, and settings
    │   ├── models/       # Pydantic validation schemas
    │   ├── services/     # Business logic layers (OpenCV, Pillow processing)
    │   └── main.py       # FastAPI entrypoint
    ├── Dockerfile        # Multi-stage production container
    └── requirements.txt  # Python requirements
```

---

## Local Setup

### Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### Frontend (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
