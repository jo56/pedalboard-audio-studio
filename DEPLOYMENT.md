# Deployment Guide

This guide covers deploying the Pedalboard Audio Studio to various hosting platforms.

## Table of Contents

- [Railway (Fullstack - Recommended)](#railway-fullstack---recommended)
- [Cloudflare Pages + Railway](#cloudflare-pages--railway)
- [Vercel + Railway](#vercel--railway)
- [Render (Alternative)](#render-alternative)

## Railway (Fullstack - Recommended)

Railway is the easiest option for deploying this fullstack app. It can handle both the Python backend and React frontend in a single deployment.

### Prerequisites

- Railway account (https://railway.app)
- GitHub account with this repository

### Option 1: Monorepo Deployment (Separate Services)

This is the recommended approach for maximum flexibility.

#### 1. Create New Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

#### 2. Deploy Backend Service

1. Click "New Service" → "GitHub Repo" → Select your repo
2. Configure the backend service:
   - **Name**: `pedalboard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install uv && uv sync`
   - **Start Command**: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Healthcheck Path**: `/`

3. Add environment variables (optional):
   - `PYTHON_VERSION`: `3.11`
   - `PORT`: `8000` (Railway auto-assigns this)

4. Railway will auto-detect the Python app and deploy it.

#### 3. Deploy Frontend Service

1. Click "New Service" → "GitHub Repo" → Select the same repo
2. Configure the frontend service:
   - **Name**: `pedalboard-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

3. Add environment variables:
   - `VITE_API_URL`: `https://<your-backend-service>.railway.app`

   Replace `<your-backend-service>` with the URL Railway assigned to your backend service.

4. The frontend will build and deploy automatically.

#### 4. Configure Frontend API URL

Update `frontend/src/api.ts` to use the environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

#### 5. Enable CORS on Backend

Update `backend/main.py` to allow your frontend domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://<your-frontend-service>.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 2: Single Service Deployment

Alternatively, you can serve the frontend as static files from the backend:

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```

2. Update `backend/main.py` to serve static files:
   ```python
   from fastapi.staticfiles import StaticFiles

   # Add after other routes
   app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
   ```

3. Deploy only the backend with:
   - **Root Directory**: `/`
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && pip install uv && uv sync`
   - **Start Command**: `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port $PORT`

## Cloudflare Pages + Railway

Deploy the frontend on Cloudflare Pages (free, fast CDN) and backend on Railway.

### Backend on Railway

Follow the "Deploy Backend Service" steps from the Railway section above.

### Frontend on Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages → Create application → Pages
3. Connect to Git → Select your repository
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`

5. Add environment variable:
   - `VITE_API_URL`: `https://<your-backend-service>.railway.app`

6. Click "Save and Deploy"

7. Update CORS settings in `backend/main.py` to include your Cloudflare Pages URL:
   ```python
   allow_origins=[
       "https://<your-project>.pages.dev"
   ]
   ```

## Vercel + Railway

Similar to Cloudflare Pages, but using Vercel for the frontend.

### Backend on Railway

Follow the "Deploy Backend Service" steps from the Railway section.

### Frontend on Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add environment variable:
   - `VITE_API_URL`: `https://<your-backend-service>.railway.app`

6. Click "Deploy"

7. Update CORS in `backend/main.py` to include your Vercel domain:
   ```python
   allow_origins=[
       "https://<your-project>.vercel.app"
   ]
   ```

## Render (Alternative)

Render is an alternative to Railway for the backend.

### Backend on Render

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pedalboard-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install uv && uv sync`
   - **Start Command**: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Click "Create Web Service"

6. Use the Render URL in your frontend's `VITE_API_URL` environment variable.

## Important Notes

### File Storage

All deployment options above use **ephemeral storage**, meaning uploaded files will be deleted when the service restarts. For production use, consider:

1. **AWS S3 / Cloudflare R2**: Store uploaded and processed files in object storage
2. **Railway Volumes**: Attach persistent volumes to your Railway services
3. **Temporary processing**: Process files on-the-fly and don't persist them

### Environment Variables Summary

**Backend:**
- `PORT`: Auto-assigned by platform
- `PYTHON_VERSION`: `3.11` (optional, usually auto-detected)

**Frontend:**
- `VITE_API_URL`: Your backend API URL

### CORS Configuration

Always update your backend's CORS settings to include your frontend domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",           # Local development
        "https://your-frontend.com"        # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing Your Deployment

After deployment:

1. Visit your frontend URL
2. Upload an audio file
3. Add some effects
4. Click "Process Audio"
5. Verify the processed audio can be played and downloaded

## Troubleshooting

### Backend issues:
- Check Railway/Render logs for Python errors
- Verify `pyproject.toml` is in the root of `backend/`
- Ensure `uvicorn` is listed in the `project.dependencies` section

### Frontend issues:
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure API endpoints are accessible

### CORS errors:
- Add your frontend domain to backend's CORS allowed origins
- Redeploy backend after CORS changes

## Cost Estimates

- **Railway**: $5/month per service (hobby plan)
- **Cloudflare Pages**: Free tier available (unlimited requests)
- **Vercel**: Free tier available (100GB bandwidth)
- **Render**: Free tier available with limitations

Most hobby projects can run entirely on free tiers!
