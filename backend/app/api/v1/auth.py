from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register():
    """Register a new user to CampusOS AI."""
    return {"message": "User registered successfully"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return tokens."""
    return {
        "access_token": "mock_access_token",
        "refresh_token": "mock_refresh_token",
        "token_type": "bearer",
    }


@router.post("/refresh")
def refresh_token(refresh_token: str):
    """Refresh access token using a valid refresh token."""
    return {
        "access_token": "mock_new_access_token",
        "refresh_token": "mock_new_refresh_token",
        "token_type": "bearer",
    }


@router.post("/forgot-password")
def forgot_password(email: str):
    """Send reset password link/OTP to user email."""
    return {"message": f"Password reset email sent to {email}"}


@router.post("/verify-otp")
def verify_otp(email: str, otp: str):
    """Verify OTP sent to user email/phone."""
    return {"message": "OTP verified successfully"}


@router.post("/google")
def google_login(token: str):
    """Sign-in / sign-up with Google OAuth."""
    return {"access_token": "google_mock_access_token", "token_type": "bearer"}


@router.post("/microsoft")
def microsoft_login(token: str):
    """Sign-in / sign-up with Microsoft OAuth."""
    return {"access_token": "microsoft_mock_access_token", "token_type": "bearer"}
