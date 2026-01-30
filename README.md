# Smriti.AI 

Smriti.AI is a comprehensive dementia care assistant that bridges the gap between memory loss and daily life. Built to support both patients and caregivers, the application provides a suite of cognitive tools:

 - Contextual Face Recognition: Instantly identifies visitors and family members, displaying their name and relationship to help the user connect.
 - Smart Reminders: automated alerts for medications and daily routines.
 - Conversation History: A logging system that helps users recall past interactions and details.
 - Caregiver Dashboard: A centralized hub for families to manage profiles, photos, and monitor their loved one's well-being.

- 👤 Patient profile management
- 👨‍👩‍👧‍👦 Family & relations management
- ⏰ Reminder system
- 💬 Conversation history
- 📊 Dashboard with overview

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`
- Python 3.9 - 3.10

### Installation

```bash
#Start Backend
python main.py

#Change Directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── services/      # API service layer
├── context/       # React context providers
└── App.jsx        # Main app component
```

## Technologies

- Python 3.9 - 3.10
- React 18
- React Router
- Tailwind CSS
- Axios
- Lucide React (icons)
- Vite

