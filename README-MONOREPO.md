# MuscleRise - Separated Architecture

This project has been separated into frontend and backend applications for better maintainability and deployment flexibility.

## Project Structure

```
├── backend/          # Express.js API server
│   ├── src/          # Backend source code
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
├── frontend/         # React application
│   ├── src/          # Frontend source code
│   ├── public/       # Static assets
│   ├── package.json  # Frontend dependencies
│   └── README.md     # Frontend documentation
└── README-MONOREPO.md # This file
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
copy .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
# Edit .env with backend URL
npm run dev
```

## Development Workflow

1. Start the backend server first (runs on port 3001)
2. Start the frontend development server (runs on port 3000)
3. The frontend is configured to proxy API requests to the backend

## Deployment

### Backend
- Build: `npm run build`
- Start: `npm start`
- Deploy to any Node.js hosting service

### Frontend
- Build: `npm run build`
- Deploy the `dist/` folder to any static hosting service
- Configure environment variables for production API URL

## Migration Notes

- All server code moved to `backend/src/`
- All client code moved to `frontend/src/`
- Separate package.json files for independent dependency management
- Environment variables split between frontend and backend
- Vite proxy configured for development API calls