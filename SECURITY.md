# Security Configuration for Public Deployment

This document outlines the security measures implemented for public access to the Pedalboard Audio Studio application.

## ⚠️ Important Security Notice

This application has been configured with **Standard Security** suitable for public hobby projects. However, always exercise caution when exposing services to the internet.

## Implemented Security Features

### 1. Rate Limiting (Per IP Address)

**Upload Endpoint**: 10 requests per minute per IP
**Process Endpoint**: 30 requests per minute per IP

Rate limiting prevents abuse and resource exhaustion attacks. Users exceeding these limits will receive a 429 error with a clear message.

### 2. Per-User Resource Quotas

Each user (identified by IP address) has the following limits:

- **Maximum Files**: 5 concurrent files
- **Maximum File Size**: 100MB per file
- **Total Storage**: 500MB total across all files
- **Processing Limit**: 20 audio processing operations per hour
- **Session Duration**: 24 hours of inactivity before automatic cleanup

### 3. File Validation

- **Extension Validation**: Only .wav, .mp3, .flac, .ogg, .m4a files allowed
- **Content Validation**: Files are checked using magic bytes to ensure content matches declared extension
- **Filename Sanitization**: Filenames are sanitized to prevent path traversal and XSS attacks
- **Size Enforcement**: Both per-file and total quota limits enforced

### 4. Disabled Features for Public Safety

- **VST3 Plugin Loading**: Disabled by default (can be re-enabled in `backend/effects.py` for private deployments)
- VST3 plugins can run arbitrary native code and pose a security risk for public deployments

### 5. Error Handling

- Production mode hides detailed error messages and stack traces
- Error messages are user-friendly and don't expose system internals
- All errors are logged server-side for monitoring

### 6. Session Management

- IP-based session tracking (no cookies required)
- Automatic cleanup of expired sessions and orphaned files
- Files older than 24 hours are automatically deleted

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# CORS Configuration - restrict to your frontend domain(s)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Debug mode - ONLY enable for local development
DEBUG=false
```

### Adjusting Resource Limits

To modify user quotas, edit `backend/security.py`:

```python
class UserSessionManager:
    # Adjust these values as needed
    MAX_FILES_PER_USER = 5
    MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100MB
    MAX_TOTAL_BYTES_PER_USER = 500 * 1024 * 1024  # 500MB
    MAX_PROCESSES_PER_HOUR = 20
    SESSION_MAX_AGE_HOURS = 24
```

To modify rate limits, edit the decorators in `backend/main.py`:

```python
@limiter.limit("10/minute")  # Upload rate limit
async def upload_audio(...)

@limiter.limit("30/minute")  # Process rate limit
async def process_audio(...)
```

## Deployment Recommendations

### For Railway + Cloudflare Pages

1. **Backend (Railway)**:
   ```bash
   # Environment Variables
   CORS_ALLOWED_ORIGINS=https://your-app.pages.dev
   DEBUG=false
   ```

2. **Frontend (Cloudflare Pages)**:
   ```bash
   # Build Environment Variables
   VITE_API_URL=https://your-railway-app.railway.app
   ```

### Additional Security Layers (Optional)

For production deployments, consider adding:

1. **Cloudflare Access** or **HTTP Basic Auth**: Add authentication layer
2. **Cloudflare WAF**: Web Application Firewall for DDoS protection
3. **Monitoring**: Set up logging and alerting for suspicious activity
4. **SSL/TLS**: Always use HTTPS (automatic with Railway/Cloudflare)
5. **Backups**: Regular backups if you need to preserve user presets

### Monitoring & Maintenance

Monitor these metrics:

- Upload frequency and sizes per IP
- Processing queue length and failures
- Disk usage in `uploads/` and `processed/` directories
- Error logs for patterns of abuse
- Rate limit violations

## Re-enabling VST3 (Private Deployments Only)

If you're running a private instance and trust all users:

1. Edit `backend/effects.py`
2. Uncomment the VST3 effect registration (lines 568-608)
3. Only load VST3 plugins from trusted sources

## Security Incident Response

If you detect abuse:

1. Check logs for the offending IP address
2. Consider implementing IP-based blocking via firewall/Cloudflare
3. Review and tighten rate limits if needed
4. Check disk usage and clean up if necessary

## Testing Security Measures

To verify security is working:

1. **Test rate limiting**: Rapidly upload files to trigger 429 errors
2. **Test file quotas**: Try uploading more than 5 files or files > 100MB
3. **Test file validation**: Try uploading a .txt file renamed to .mp3
4. **Test processing limits**: Attempt >20 process operations in an hour

## Dependencies

Security-related packages:

- `slowapi==0.1.9` - Rate limiting
- `python-magic==0.4.27` - File content validation (Linux/Mac)
- `python-magic-bin==0.4.14` - File content validation (Windows)

Keep these updated for security patches.

## Questions?

See the main [README.md](./README.md) for general deployment instructions.

---

**Last Updated**: 2025-01-30
**Security Level**: Standard (suitable for public hobby projects)
