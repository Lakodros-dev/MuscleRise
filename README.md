# 💪 MuscleRise - Fitness Tracking Platform

MuscleRise - bu zamonaviy fitness tracking web ilovasi. Foydalanuvchilar kunlik mashqlarini kuzatib borishi, coinlar to'plashi va boshqa foydalanuvchilar bilan raqobatlashishi mumkin.

## 🏗️ Loyiha strukturasi

Loyiha frontend va backend qismlariga ajratilgan:

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
└── README.md         # Bu fayl
```

## 🚀 Tezkor boshlash

### Talablar
- Node.js 18+ 
- MongoDB (local yoki Atlas)

### Backend o'rnatish
```bash
cd backend
npm install
copy .env.example .env
# .env faylida MongoDB URI va boshqa sozlamalarni kiriting
npm run dev
```

### Frontend o'rnatish
```bash
cd frontend
npm install
copy .env.example .env
# .env faylida backend URL ni kiriting (default: http://localhost:3001)
npm run dev
```

## 🔧 Texnologiyalar

### Backend
- **Express.js 5** - Server framework
- **MongoDB** - Database
- **TypeScript** - Type safety
- **bcrypt** - Password hashing
- **JWT** - Authentication
- **Zod** - Validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS 3** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **React Router 6** - SPA routing
- **TanStack Query** - Server state management

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
- 🔐 Admin panel

## 🔄 Development

1. Backend serverni ishga tushiring (port 3001)
2. Frontend development serverni ishga tushiring (port 3000)
3. Frontend avtomatik ravishda API so'rovlarini backend'ga yo'naltiradi

## 🚀 Deploy qilish

### Backend Deploy

1. **Environment Variables sozlash:**
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3001
   NODE_ENV=production
   ```

2. **Hosting xizmatlariga deploy:**
   - Heroku, Railway, DigitalOcean, AWS, va h.k.
   - Node.js 18+ ni qo'llab-quvvatlaydigan har qanday hosting

### Frontend Deploy

1. **Environment Variables sozlash:**
   ```bash
   # .env.production faylida
   VITE_API_URL=https://your-backend-domain.com
   ```

2. **Build va deploy:**
   ```bash
   cd frontend
   npm run build
   # dist/ papkasini static hosting ga yuklang
   ```

3. **Static hosting xizmatlariga:**
   - **Netlify**: `dist/` papkasini drag & drop
   - **Vercel**: GitHub repository ni ulang
   - **GitHub Pages**: GitHub Actions bilan
   - **Firebase Hosting**: `firebase deploy`

### Muhim eslatmalar:

- ⚠️ **VITE_API_URL** environment variable ni production da to'g'ri sozlang
- 🔒 Backend CORS sozlamalarini frontend domain uchun ochiq qiling
- 📱 SPA routing uchun hosting da redirect rules sozlang
- 🔐 Production da sensitive ma'lumotlarni environment variables da saqlang

## 📄 License

Bu loyiha shaxsiy va mulkiy hisoblanadi.

---

**MuscleRise** - Fitness journey'ingizni boshlang! 💪