"""
Security utilities for rate limiting and user session management
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict
import re


class UserSession:
    """Track user activity and enforce resource quotas"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.file_ids: List[str] = []
        self.process_timestamps: List[datetime] = []
        self.total_bytes_uploaded = 0

    def add_file(self, file_id: str, file_size: int) -> None:
        """Register a new file upload"""
        self.file_ids.append(file_id)
        self.total_bytes_uploaded += file_size
        self.last_activity = datetime.now()

    def remove_file(self, file_id: str) -> None:
        """Remove a file from tracking"""
        if file_id in self.file_ids:
            self.file_ids.remove(file_id)

    def add_process(self) -> None:
        """Record a processing request"""
        self.process_timestamps.append(datetime.now())
        self.last_activity = datetime.now()
        # Keep only recent process timestamps (last 2 hours)
        cutoff = datetime.now() - timedelta(hours=2)
        self.process_timestamps = [ts for ts in self.process_timestamps if ts > cutoff]

    def get_recent_process_count(self, hours: int = 1) -> int:
        """Get number of processes in the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        return sum(1 for ts in self.process_timestamps if ts > cutoff)

    def is_expired(self, max_age_hours: int = 24) -> bool:
        """Check if session has expired due to inactivity"""
        return datetime.now() - self.last_activity > timedelta(hours=max_age_hours)


class UserSessionManager:
    """Manage user sessions with resource quotas"""

    # Resource limits
    MAX_FILES_PER_USER = 5
    MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100MB
    MAX_TOTAL_BYTES_PER_USER = 500 * 1024 * 1024  # 500MB total
    MAX_PROCESSES_PER_HOUR = 20
    SESSION_MAX_AGE_HOURS = 24

    def __init__(self):
        self.sessions: Dict[str, UserSession] = {}

    def get_or_create_session(self, session_id: str) -> UserSession:
        """Get existing session or create new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = UserSession(session_id)
        return self.sessions[session_id]

    def cleanup_expired_sessions(self) -> List[str]:
        """Remove expired sessions and return list of file_ids to clean"""
        expired_sessions = []
        files_to_clean = []

        for session_id, session in list(self.sessions.items()):
            if session.is_expired(self.SESSION_MAX_AGE_HOURS):
                expired_sessions.append(session_id)
                files_to_clean.extend(session.file_ids)

        for session_id in expired_sessions:
            del self.sessions[session_id]

        return files_to_clean

    def can_upload_file(self, session_id: str, file_size: int) -> tuple[bool, Optional[str]]:
        """Check if user can upload a file of given size"""
        session = self.get_or_create_session(session_id)

        if file_size > self.MAX_FILE_SIZE_BYTES:
            max_mb = self.MAX_FILE_SIZE_BYTES / (1024 * 1024)
            return False, f"File size exceeds maximum of {max_mb:.0f}MB"

        if len(session.file_ids) >= self.MAX_FILES_PER_USER:
            return False, f"Maximum {self.MAX_FILES_PER_USER} files per user. Delete some files first."

        if session.total_bytes_uploaded + file_size > self.MAX_TOTAL_BYTES_PER_USER:
            max_mb = self.MAX_TOTAL_BYTES_PER_USER / (1024 * 1024)
            return False, f"Total upload quota ({max_mb:.0f}MB) exceeded. Delete some files first."

        return True, None

    def can_process(self, session_id: str) -> tuple[bool, Optional[str]]:
        """Check if user can process audio"""
        session = self.get_or_create_session(session_id)

        recent_count = session.get_recent_process_count(hours=1)
        if recent_count >= self.MAX_PROCESSES_PER_HOUR:
            return False, f"Processing limit reached ({self.MAX_PROCESSES_PER_HOUR} per hour). Please wait."

        return True, None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and XSS"""
    # Remove any directory components
    filename = filename.split('\\')[-1].split('/')[-1]

    # Replace any non-alphanumeric characters (except . - _) with underscore
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')

    # Prevent hidden files
    if filename.startswith('.'):
        filename = '_' + filename

    return filename or 'unnamed_file'


def validate_audio_file_content(file_path: str, declared_extension: str) -> tuple[bool, Optional[str]]:
    """
    Validate that file content matches declared file type using magic bytes
    Returns (is_valid, error_message)
    """
    try:
        import magic
    except ImportError:
        # If python-magic not available, skip validation
        return True, None

    try:
        mime = magic.from_file(file_path, mime=True)

        # Map of allowed extensions to expected MIME types
        allowed_mimes = {
            '.wav': ['audio/x-wav', 'audio/wav', 'audio/wave'],
            '.mp3': ['audio/mpeg', 'audio/mp3'],
            '.flac': ['audio/flac', 'audio/x-flac'],
            '.ogg': ['audio/ogg', 'application/ogg'],
            '.m4a': ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
        }

        expected_mimes = allowed_mimes.get(declared_extension.lower(), [])
        if not expected_mimes:
            return False, f"Unsupported file extension: {declared_extension}"

        if mime not in expected_mimes:
            return False, f"File content does not match extension. Expected audio file, got {mime}"

        return True, None

    except Exception as e:
        # If validation fails, log but don't block (fail open for compatibility)
        print(f"Warning: File validation error: {e}")
        return True, None


def get_client_identifier(request) -> str:
    """
    Extract a client identifier from request (IP-based session ID)
    In production, consider adding cookie-based sessions for better UX
    """
    # Try to get real IP from headers (if behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    # Create session ID from IP
    return f"ip_{ip}"
