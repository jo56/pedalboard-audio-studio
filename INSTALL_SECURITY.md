# Installing Security Updates

Follow these steps to install the security enhancements for public deployment.

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
uv sync
```

This will install the new security dependencies:
- `slowapi` - Rate limiting
- `python-magic-bin` (Windows) or `python-magic` (Linux/Mac) - File validation

### 2. No Frontend Changes Required

The frontend updates are already in place. No additional npm packages needed.

### 3. Set Environment Variables

Create or update `backend/.env`:

```bash
# For local development
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true

# For production (update with your actual domains)
# CORS_ALLOWED_ORIGINS=https://your-app.pages.dev,https://your-custom-domain.com
# DEBUG=false
```

### 4. Test Locally

Start the backend:
```bash
cd backend
uv run uvicorn main:app --reload
```

Start the frontend:
```bash
cd frontend
npm run dev
```

### 5. Test Security Features

Try these tests:

**Rate Limiting Test:**
- Rapidly click "Process Audio" multiple times
- You should see rate limit errors after ~30 requests/minute

**File Size Test:**
- Try uploading a file larger than 100MB
- You should see a quota error

**File Validation Test:**
- Rename a text file to .mp3 and try uploading
- You should see a validation error

## What Changed?

### New Files
- `backend/security.py` - Session management and validation utilities
- `SECURITY.md` - Security documentation
- This file (`INSTALL_SECURITY.md`)

### Modified Files

**Backend:**
- `backend/pyproject.toml` - Added security dependencies
- `backend/main.py` - Added rate limiting, quota checks, enhanced validation
- `backend/effects.py` - Disabled VST3 by default (commented out)

**Frontend:**
- `frontend/src/utils/errorHandler.ts` - Better error messages for rate limits
- `frontend/src/App.tsx` - Uses new error message handler

## Deployment Updates

### Railway (Backend)

Update build command to:
```bash
pip install uv && uv sync
```

Add environment variables:
```
CORS_ALLOWED_ORIGINS=https://your-cloudflare-pages-url.pages.dev
DEBUG=false
```

### Cloudflare Pages (Frontend)

No changes needed. Ensure `VITE_API_URL` points to your Railway backend.

## Reverting Changes

If you need to revert to the original (no security):

1. Checkout the previous commit before security changes
2. Or manually:
   - Remove rate limiter imports and decorators from `main.py`
   - Remove session_manager checks
   - Uncomment VST3 in `effects.py`

## Troubleshooting

**ImportError: No module named 'slowapi'**
- Run `uv sync` in the backend directory

**File validation not working**
- `python-magic` installation issues are non-fatal
- Validation will be skipped if the library isn't available
- On Windows, ensure `python-magic-bin` is installed

**Rate limits too strict**
- Edit the `@limiter.limit()` decorators in `backend/main.py`
- Adjust values in `backend/security.py`

**CORS errors**
- Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Ensure no trailing slashes in URLs

## Support

For issues, see:
- [SECURITY.md](./SECURITY.md) - Security configuration details
- [README.md](./README.md) - General setup and usage
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guides

---

**Ready for Public Access**: Once installed and tested, your app is ready to be shared publicly with appropriate security measures in place.
