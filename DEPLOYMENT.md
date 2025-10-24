# 🚀 MuscleRise Deployment Guide

Bu yo'riqnoma MuscleRise ilovasini production muhitiga deploy qilish uchun.

## 📋 Deployment Checklist

### 1. Backend Deploy (Render.com)

1. **GitHub repository yarating va kodingizni push qiling**
2. **Render.com'da account yarating**
3. **New Web Service yarating**
4. **GitHub repository'ni ulang**
5. **Build va Start commands:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. **Environment Variables qo'shing:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/musclerise
   JWT_SECRET=your-super-secret-jwt-key-here
   ALLOWED_ORIGINS=https://your-frontend-domain.netlify.app
   ```

### 2. Frontend Deploy (Netlify)

1. **GitHub'ga push qilganingizdan kemin**
2. **Netlify.com'da account yarating**
3. **New site from Git yarating**
4. **GitHub repository'ni ulang**
5. **Build settings (avtomatik aniqlaydi):**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
6. **Environment Variables qo'shing:**
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```

### 3. MongoDB Atlas Setup

1. **MongoDB Atlas'da account yarating**
2. **Yangi cluster yarating (M0 - free tier)**
3. **Database user yarating**
4. **Network Access'da IP whitelist qo'shing (0.0.0.0/0 yoki specific IPs)**
5. **Connection string'ni oling va backend'da MONGODB_URI ga qo'ying**

## 🔧 Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/musclerise
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
ALLOWED_ORIGINS=https://your-frontend-domain.netlify.app,https://your-frontend-domain.vercel.app
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend-service.onrender.com
VITE_PUBLIC_BUILDER_KEY=your_builder_key_if_needed
```

## 🔄 Deployment Process

### Backend Deploy Steps:
1. Code push → GitHub
2. Render auto-deploys from GitHub
3. Build process: `npm install && npm run build`
4. Start process: `npm start`
5. Service available at: `https://your-service.onrender.com`

### Frontend Deploy Steps:
1. Code push → GitHub
2. Netlify auto-deploys from GitHub
3. Build process: `npm run build`
4. Static files served from `dist/`
5. Site available at: `https://your-site.netlify.app`

## 🛠️ Troubleshooting

### Backend Issues:
- ✅ MongoDB connection string to'g'ri
- ✅ JWT_SECRET kamida 32 karakter
- ✅ ALLOWED_ORIGINS frontend URL'ni o'z ichiga oladi
- ✅ PORT environment variable set (Render uchun)

### Frontend Issues:
- ✅ VITE_API_URL backend URL'ga to'g'ri ishora qiladi
- ✅ Backend CORS frontend domain'ni qabul qiladi
- ✅ SPA routing uchun redirects sozlangan

### CORS Issues:
Backend'da ALLOWED_ORIGINS'ga frontend domain'ni qo'shing:
```bash
ALLOWED_ORIGINS=https://your-frontend.netlify.app,https://your-frontend.vercel.app
```

## 📱 Custom Domain (Ixtiyoriy)

### Netlify:
1. Domain Settings → Add custom domain
2. DNS records'ni update qiling
3. SSL certificate avtomatik

### Render:
1. Settings → Custom Domains
2. CNAME record qo'shing
3. SSL certificate avtomatik

## 🔐 Security Checklist

- ✅ JWT_SECRET kuchli va unique
- ✅ MongoDB user faqat kerakli permissions
- ✅ CORS to'g'ri sozlangan
- ✅ Environment variables secure
- ✅ No sensitive data in code
- ✅ HTTPS enabled (avtomatik)

## 📊 Monitoring

### Render:
- Logs: Service → Logs
- Metrics: Service → Metrics
- Health checks avtomatik

### Netlify:
- Deploy logs: Site → Deploys
- Analytics: Site → Analytics
- Form submissions: Site → Forms

## 🚀 Go Live!

1. ✅ Backend deployed va ishlamoqda
2. ✅ Frontend deployed va backend'ga ulanmoqda
3. ✅ Database connection ishlaydi
4. ✅ Authentication ishlaydi
5. ✅ CORS to'g'ri sozlangan

**Tabriklaymiz! MuscleRise production'da! 🎉**

---

### 💡 Tips:
- Free tier'larda service 15 daqiqa ishlamasa sleep mode'ga o'tadi
- Database backup'larini muntazam oling
- Environment variables'ni secure saqlang
- Monitoring va error tracking qo'shing