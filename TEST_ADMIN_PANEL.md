# ADMIN PANEL TEST GUIDE

## ✅ What Was Fixed

### 1. Database Schema
- Added missing columns to `user_profiles` table:
  - `is_suspended`, `is_deleted`, `deleted_at`, `deletion_note`
- Added `is_flagged` column to `products` table

### 2. Admin Authentication
- Updated admin password to: `admin@2007`
- Password is now auto-updated from `.env` on server startup

### 3. Frontend Routing
- **Deleted**: Old `/admin-login` page
- **Active**: New admin panel at `/admin/*`
- Fixed nested routing for proper path matching
- Admin pages now bypass main app layout (no navbar/footer)

### 4. Backend API
- All admin endpoints working: `/api/admin/auth/login`, `/api/admin/dashboard/stats`
- User auth endpoints working: `/api/auth/login`, `/api/auth/register`

---

## 🧪 Testing Instructions

### Step 1: Start Services

**Option A - Use start.bat:**
```bash
# Double-click start.bat in project root
```

**Option B - Manual:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Access Admin Panel

1. **Open Browser**: http://localhost:5173/admin/login
2. **Login**:
   - Username: `admin123`
   - Password: `admin@2007`
3. **Verify Dashboard**: Should redirect to http://localhost:5173/admin

### Step 3: Test Admin Features

| Feature | URL | Test |
|---------|-----|------|
| Dashboard | `/admin` | View statistics |
| Users | `/admin/users` | List all users |
| Products | `/admin/products` | List all products |
| Orders | `/admin/orders` | List all orders |
| Audit Logs | `/admin/audit` | View admin actions |

### Step 4: Test User Login/Register

1. **Register**: http://localhost:5173/register
   - Requires valid register number from `official_records` table
2. **Login**: http://localhost:5173/login
   - Use registered credentials

---

## 🔧 Troubleshooting

### Admin Panel Shows 404
- **Solution**: Clear browser cache (Ctrl+Shift+R)
- Restart frontend dev server

### Backend Connection Failed
- **Check**: PostgreSQL running on port 5432
- **Check**: Redis running on port 6379
- **Restart**: Backend server to load new schema

### Column Does Not Exist Error
- **Solution**: Database schema is outdated
- Already fixed - restart backend server

---

## 📊 Current System Status

✅ PostgreSQL: Running on port 5432
✅ Redis: Running on port 6379
✅ Backend API: http://localhost:8000
✅ Frontend: http://localhost:5173
✅ Admin Panel: http://localhost:5173/admin/login
✅ API Docs: http://localhost:8000/docs

**Admin Credentials:**
- Username: `admin123`
- Password: `admin@2007`

---

## 🚀 Quick Verification

Run this in bash to test all endpoints:

```bash
# Test health
curl http://localhost:8000/api/health

# Test admin login
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin123","password":"admin@2007"}'

# Test user login (will fail with invalid credentials - that's expected)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"test","password":"test"}'
```

All endpoints should return JSON (not 500 errors).
