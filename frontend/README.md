# Smriti.AI Frontend

Modern React frontend for the Smriti.AI dementia care assistant application.

## Features

- 🎨 Modern, clean UI with Tailwind CSS
- 📱 Responsive design
- 👤 Patient profile management
- 👨‍👩‍👧‍👦 Family & relations management
- ⏰ Reminder system
- 💬 Conversation history
- 📊 Dashboard with overview

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
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

## API Integration

The frontend communicates with the FastAPI backend running on port 8000. Make sure the backend is running before starting the frontend.

## Technologies

- React 18
- React Router
- Tailwind CSS
- Axios
- Lucide React (icons)
- Vite

