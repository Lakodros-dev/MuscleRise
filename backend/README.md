# MuscleRise Backend

Backend API server for the MuscleRise fitness tracking application.

## Features

- Express.js REST API
- MongoDB database integration
- User authentication
- Admin panel functionality
- CORS configuration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
copy .env.example .env
```

3. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - CORS allowed origins

4. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run test` - Run tests
- `npm run typecheck` - Type checking

## API Endpoints

- `GET /api/ping` - Health check
- `GET /api/test` - API test endpoint
- `POST /api/auth/*` - Authentication routes
- `GET /api/admin/*` - Admin routes

## Environment Variables

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS allowed origins
- `PING_MESSAGE` - Custom ping response message
## Deploym
ent on Render

### 1. Backend Deployment

1. GitHub'ga push qiling
2. Render.com'da yangi Web Service yarating
3. GitHub repository'ni ulang
4. Build va Start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Environment Variables qo'shing:
   - `NODE_ENV=production`
   - `PORT=10000` (Render avtomatik beradi)
   - `MONGODB_URI=your_mongodb_connection_string`
   - `JWT_SECRET=your_super_secret_jwt_key`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com`
   - `PING_MESSAGE=production_ping` (ixtiyoriy)

### 2. MongoDB Setup

MongoDB Atlas ishlatish tavsiya etiladi:
1. [MongoDB Atlas](https://cloud.mongodb.com) da account yarating
2. Cluster yarating
3. Database user yarating
4. Network Access'da IP whitelist qo'shing (0.0.0.0/0 barcha IP lar uchun)
5. Connection string'ni `MONGODB_URI` ga qo'ying

### 3. Environment Variables

Render dashboard'da quyidagi environment variables'larni qo'shing:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/musclerise
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com,https://musclerise.netlify.app
PING_MESSAGE=MuscleRise API is running
```