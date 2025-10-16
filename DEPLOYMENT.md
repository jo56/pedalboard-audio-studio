# Deployment Guide

This guide covers deploying the Pedalboard Audio Studio to various hosting platforms.

## Table of Contents

- [Cloudflare Pages + Railway (Recommended)](#cloudflare-pages--railway-recommended)
- [Railway (Monorepo Alternative)](#railway-monorepo-alternative)
- [Vercel + Railway](#vercel--railway)
- [Render (Alternative)](#render-alternative)

## Cloudflare Pages + Railway (Recommended)

Serve the FastAPI backend from Railway and ship the static React build from Cloudflare's global CDN for fast loads and simple scale.

### Prerequisites

- Railway account (https://railway.app)
- Cloudflare account (https://cloudflare.com)
- GitHub repository containing this project

### Backend on Railway

1. Go to https://railway.app and create a new project from your GitHub repo.
2. Add a service using the `backend` directory:
   - **Name**: `pedalboard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install uv && uv sync`
   - **Start Command**: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Healthcheck Path**: `/`
3. Configure variables:
   - `CORS_ALLOWED_ORIGINS`: include your Cloudflare Pages domain(s), e.g. `https://<your-project>.pages.dev`
   - Optional: `PYTHON_VERSION=3.11`
4. Attach a Railway volume if you want uploads or presets to persist across deployments.
5. Deploy the service and note the public API URL (e.g. `https://pedalboard-backend.up.railway.app`).

### Frontend on Cloudflare Pages

1. Visit https://dash.cloudflare.com and create a new Pages project.
2. Connect the same GitHub repository and set the build settings:
   - **Framework preset**: Vite
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Under *Settings → Environment Variables*, set `VITE_API_URL` for both *Preview* and *Production* stages to the Railway backend URL from the previous step.
4. Deploy. Cloudflare provides preview and production URLs and will automatically issue TLS certificates.
5. If you later add a custom domain, remember to append it to `CORS_ALLOWED_ORIGINS` on Railway and redeploy the backend.

## Railway (Monorepo Alternative)

If you want everything on Railway, you can deploy the backend and frontend as separate services (or even serve the frontend from FastAPI).

### Option 1: Separate Backend and Frontend Services

1. Create a new Railway project from your GitHub repo.
2. **Backend service**
   - **Name**: `pedalboard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install uv && uv sync`
   - **Start Command**: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add variables such as `PYTHON_VERSION=3.11` if desired.
3. **Frontend service**
   - **Name**: `pedalboard-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Set `VITE_API_URL` to the backend service URL.
4. On the backend service, set `CORS_ALLOWED_ORIGINS` to include the frontend Railway domain, e.g. `https://<your-frontend-service>.up.railway.app`.

### Option 2: Single Service Hosting Everything

1. Build the frontend locally within the deployment:
   ```bash
   cd frontend && npm run build
   ```
2. Serve the compiled frontend through FastAPI:
   ```python
   from fastapi.staticfiles import StaticFiles

   app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
   ```
3. Deploy only the backend with a combined build/start command:
   - **Root Directory**: `/`
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && pip install uv && uv sync`
   - **Start Command**: `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port $PORT`

## Vercel + Railway

Similar to Cloudflare Pages, but using Vercel for the frontend.

### Backend on Railway

Reuse the **Backend on Railway** steps from the recommended setup above.

### Frontend on Vercel

1. Go to https://vercel.com
2. Click "Add New" -> "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add environment variable:
   - `VITE_API_URL`: `https://<your-backend-service>.railway.app`

6. Click "Deploy"

7. Add `CORS_ALLOWED_ORIGINS=https://<your-project>.vercel.app` in Railway so the backend accepts calls from the Vercel deployment.

## Render (Alternative)

Render is an alternative to Railway for the backend.

### Backend on Render

1. Go to https://render.com
2. Click "New" -> "Web Service"
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
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of production frontend origins (for example `https://your-project.pages.dev`)

**Frontend:**
- `VITE_API_URL`: Your backend API URL

### Environment Files

Copy the provided `.env.example` files in `backend/` and `frontend/` as a starting point for local development or to document the variables you set in each hosting provider’s dashboard.

### CORS Configuration

Always set the backend `CORS_ALLOWED_ORIGINS` environment variable with every production frontend domain (comma separated). The defaults already cover local development addresses.

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
- Confirm `CORS_ALLOWED_ORIGINS` on the backend includes the frontend domain and redeploy after updating the variable.

## Cost Estimates

- **Railway**: $5/month per service (hobby plan)
- **Cloudflare Pages**: Free tier available (unlimited requests)
- **Vercel**: Free tier available (100GB bandwidth)
- **Render**: Free tier available with limitations

Most hobby projects can run entirely on free tiers!
