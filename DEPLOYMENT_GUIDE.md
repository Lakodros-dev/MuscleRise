# 🚀 MuscleRise Deployment Guide

Bu qo'llanma MuscleRise loyihasini GitHub orqali Render.com'da deploy qilish uchun.

## 📋 Oldindan tayyorgarlik

### 1. MongoDB Atlas Setup
1. [MongoDB Atlas](https://cloud.mongodb.com) da account yarating
2. Yangi cluster yarating (M0 Sandbox - bepul)
3. Database user yarating:
   - Username: `musclerise_user`
   - Password: kuchli parol yarating
4. Network Access'da IP whitelist qo'shing:
   - `0.0.0.0/0` (barcha IP'lar uchun)
5. Connection string'ni nusxalang:
   ```
   mongodb+srv://musclerise_user:PASSWORD@cluster0.xxxxx.mongodb.net/musclerise
   ```

### 2. GitHub'ga Push
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 🔧 Backend Deployment (Render)

### 1. Render.com'da Web Service yarating
1. [Render.com](https://render.com) da account yarating
2. "New +" > "Web Service" tanlang
3. GitHub repository'ni ulang
4. Service nomi: `musclerise-backend`
5. Root Directory: `backend`

### 2. Build Settings
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Environment Variables
Render dashboard'da quyidagi environment variables'larni qo'shing:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://musclerise_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/musclerise
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com
PING_MESSAGE=MuscleRise API is running in production
```

### 4. Deploy
- "Create Web Service" tugmasini bosing
- Deploy jarayoni 5-10 daqiqa davom etadi
- Backend URL'ni nusxalang: `https://musclerise-backend-xxxx.onrender.com`

## 🎨 Frontend Deployment (Render yoki Netlify)

### Option 1: Render Static Site

1. Render.com'da "New +" > "Static Site" tanlang
2. GitHub repository'ni ulang
3. Service nomi: `musclerise-frontend`
4. Root Directory: `frontend`
5. Build Settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Option 2: Netlify (Tavsiya etiladi)

1. [Netlify.com](https://netlify.com) da account yarating
2. "Add new site" > "Import an existing project"
3. GitHub repository'ni ulang
4. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Environment Variables (Frontend)
```
VITE_API_URL=https://musclerise-backend-xxxx.onrender.com
```

## 🔄 Final Configuration

### 1. Backend CORS Update
Frontend deploy qilgandan keyin, backend'dagi `ALLOWED_ORIGINS` environment variable'ni yangilang:

```
ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com,https://your-frontend.netlify.app
```

### 2. Test Deployment
1. Frontend URL'ga boring
2. Network tab'da API so'rovlarini tekshiring
3. Login/Register funksiyalarini test qiling

## 🐛 Troubleshooting

### Backend Issues
- **Build fails**: `backend/package.json` da dependencies to'g'ri ekanligini tekshiring
- **Server won't start**: Environment variables to'g'ri kiritilganligini tekshiring
- **Database connection fails**: MongoDB URI to'g'ri va IP whitelist sozlanganligini tekshiring

### Frontend Issues
- **Build fails**: `frontend/package.json` da dependencies to'g'ri ekanligini tekshiring
- **API calls fail**: `VITE_API_URL` to'g'ri backend URL'ga ishora qilayotganligini tekshiring
- **CORS errors**: Backend'da `ALLOWED_ORIGINS` to'g'ri sozlanganligini tekshiring

### Common Solutions
1. Render logs'ni tekshiring: Service > Logs
2. Environment variables'ni qayta tekshiring
3. Manual deploy qiling: Service > Manual Deploy

## 📝 Environment Variables Cheat Sheet

### Backend (.env)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/musclerise
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
ALLOWED_ORIGINS=https://frontend-domain.com,https://another-domain.com
PING_MESSAGE=MuscleRise API is running
```

### Frontend (.env)
```env
VITE_API_URL=https://backend-domain.onrender.com
VITE_PUBLIC_BUILDER_KEY=optional_builder_key
```

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster yaratildi va configured
- [ ] Backend Render'da deploy qilindi
- [ ] Frontend Netlify/Render'da deploy qilindi
- [ ] Environment variables to'g'ri sozlandi
- [ ] CORS to'g'ri configured
- [ ] API endpoints ishlayapti
- [ ] Frontend backend bilan bog'lanayapti
- [ ] Login/Register ishlayapti

Deployment muvaffaqiyatli bo'lgandan keyin, loyihangiz production'da ishlaydi! 🎉