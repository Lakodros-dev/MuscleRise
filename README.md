# 💪 MuscleRise

MuscleRise - bu zamonaviy fitness tracking web ilovasi. Foydalanuvchilar kunlik mashqlarini kuzatib borishi, coinlar to'plashi va boshqa foydalanuvchilar bilan raqobatlashishi mumkin.

## 🚀 Texnologiyalar

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS 3** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **React Router 6** - SPA routing
- **TanStack Query** - Server state management
- **Zod** - Validation

### Backend

- **Express 5** - Server framework
- **bcrypt** - Password hashing
- **Zod** - Input validation
- **CORS** - Security

### Dev Tools

- **npm** - Package manager
- **Vitest** - Testing
- **Prettier** - Code formatting

## 📦 O'rnatish

```bash
# Dependencies o'rnatish
npm install

# Development server ishga tushirish
npm run dev

# Production build
npm run build

# Production server
npm run start

# Type checking
npm run typecheck

# Tests
npm run test
```

## 🔧 Konfiguratsiya

`.env` faylida quyidagi o'zgaruvchilarni sozlang:

```env
# CORS allowed origins (vergul bilan ajratilgan)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# Ping message (test uchun)
PING_MESSAGE="ping pong"
```

## 🏗️ Loyiha strukturasi

```
client/                   # React SPA frontend
├── pages/                # Route components
├── components/           # Reusable components
│   ├── ui/              # UI component library
│   ├── Layout.tsx       # Main layout
│   ├── Avatar.tsx       # 3D avatar
│   ├── MRNavbar.tsx     # Navigation
│   └── Onboarding.tsx   # User registration
├── state/               # State management
├── hooks/               # Custom hooks
├── lib/                 # Utilities
└── global.css           # TailwindCSS theme

server/                   # Express API backend
├── index.ts             # Server setup
├── routes/              # API handlers
│   ├── auth.ts         # Authentication
│   └── demo.ts         # Demo endpoint
└── data/                # JSON file storage

shared/                   # Shared types
└── api.ts               # API interfaces
```

## 🔐 Xavfsizlik

- ✅ **bcrypt** bilan parol hashing (10 rounds)
- ✅ **Zod** validation barcha inputlar uchun
- ✅ **CORS** faqat ruxsat etilgan originlar uchun
- ✅ **TypeScript strict mode** yoqilgan
- ✅ Password hash'lar hech qachon client'ga yuborilmaydi

## 🎯 Asosiy funksiyalar

- 👤 User authentication (register/login)
- 💪 Kunlik mashqlar rejasi
- 🔥 Calorie tracking
- 🪙 Coin system
- 🏆 Leaderboard/ranking
- 📊 Statistics (kunlik, haftalik, oylik)
- 🎨 Theme customization
- 🛍️ Shop (skins, outfits)
- 📱 Responsive design

## 🔄 State Management

Loyiha React Context + useReducer pattern ishlatadi:

- LocalStorage'da local state saqlanadi (300ms debounce)
- Server'ga 2 sekundda bir marta sync qilinadi
- Login qilganda server'dan data yuklanadi

## 🧪 Testing

```bash
# Barcha testlarni ishga tushirish
npm run test

# Watch mode
npm run test -- --watch
```

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Yangi user yaratish
- `POST /api/auth/login` - Login
- `PATCH /api/auth/user/:id` - User ma'lumotlarini yangilash

### Demo

- `GET /api/ping` - Server health check
- `GET /api/demo` - Demo endpoint

## 🎨 Theme System

TailwindCSS CSS variables orqali dynamic theming:

- `--primary-rgb` - Primary color (RGB format)
- `--background` - Background color (HSL format)
- `--foreground` - Text color (HSL format)

Skinlar `client/components/Layout.tsx`da boshqariladi.

## 🚀 Deployment

### Standard

```bash
npm run build
npm run start
```

### Cloud (Netlify/Vercel)

Netlify yoki Vercel MCP integration orqali deploy qilish mumkin.

## 📄 License

MIT

## 👨‍💻 Development

Loyiha Fusion Starter template asosida qurilgan va MuscleRise fitness app uchun moslashtirilgan.

### Optimization qilingan

- ✅ TypeScript strict mode
- ✅ bcrypt password hashing
- ✅ Zod validation
- ✅ CORS security
- ✅ Performance optimization (debouncing)
- ✅ Code deduplication
- ✅ Clean package.json

---

**MuscleRise** - Fitness journey'ingizni boshlang! 💪
