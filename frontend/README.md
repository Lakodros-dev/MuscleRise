# MuscleRise Frontend

React frontend application for the MuscleRise fitness tracking platform.

## Features

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- TanStack Query for data fetching
- Framer Motion for animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
copy .env.example .env
```

3. Update the `.env` file with your backend API URL

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run typecheck` - Type checking
- `npm run format.fix` - Format code with Prettier

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
├── state/          # State management
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── global.css      # Global styles
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)
- `VITE_PUBLIC_BUILDER_KEY` - Builder.io API key (optional)## 
Deployment on Render/Netlify

### 1. Frontend Deployment (Static Site)

#### Render:
1. GitHub'ga push qiling
2. Render.com'da yangi Static Site yarating
3. GitHub repository'ni ulang
4. Build settings:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
5. Environment Variables:
   - `VITE_API_URL=https://your-backend-service.onrender.com`

#### Netlify:
1. GitHub'ga push qiling
2. Netlify'da yangi site yarating
3. GitHub repository'ni ulang
4. Build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. Environment Variables:
   - `VITE_API_URL=https://your-backend-service.onrender.com`

### 2. Environment Variables

Production uchun quyidagi environment variables kerak:

```
VITE_API_URL=https://your-backend-service.onrender.com
VITE_PUBLIC_BUILDER_KEY=your_builder_key (ixtiyoriy)
```

### 3. Backend URL Configuration

Frontend deploy qilgandan keyin, backend'dagi `ALLOWED_ORIGINS` environment variable'ga frontend URL'ni qo'shing:

```
ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com,https://your-frontend.netlify.app
```