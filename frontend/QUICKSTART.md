# Quick Start Guide

## Setup Instructions

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Make sure your backend is running:**
   - Backend should be running on `http://localhost:8000`
   - Start it with: `python main.py` (from the backend directory)

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The app will automatically reload when you make changes

## First Steps

1. **Set Up Profile:**
   - Click on "Profile Setup" in the sidebar
   - Enter patient name, email, and caregiver emails
   - Click "Create Profile"

2. **Add Relations:**
   - Go to "Relations" page
   - Click "Add Relation"
   - Enter name, relationship, and photo URL (optional)
   - These will be used for facial recognition

3. **Set Reminders:**
   - Go to "Reminders" page
   - Click "Add Reminder"
   - Set time and message (e.g., "Take morning medication")

4. **View Dashboard:**
   - The dashboard shows an overview of all your data
   - Stats, recent relations, and upcoming reminders

## Troubleshooting

- **CORS Errors:** Make sure your backend CORS settings include `http://localhost:3000`
- **API Connection:** Verify backend is running on port 8000
- **Build Errors:** Delete `node_modules` and run `npm install` again

