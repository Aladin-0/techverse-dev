# users/google_callback.py - With forced account selection and proper logout

from django.http import HttpResponseRedirect, HttpResponse
from django.conf import settings
from django.contrib.auth import logout
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
import sys


@csrf_exempt
def custom_google_callback(request):
    """
    Custom callback that intercepts the Google OAuth flow and generates JWT tokens
    """
    
    # Check if user is authenticated
    if not request.user.is_authenticated:
        return HttpResponseRedirect(f'{settings.FRONTEND_BASE_URL}/login?error=not_authenticated')
    
    user = request.user
    
    try:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Build redirect URL with tokens
        redirect_url = (
            f"{settings.FRONTEND_BASE_URL}/?login=success"
            f"&access={access_token}"
            f"&refresh={refresh_token}"
            f"&email={user.email}"
        )
        
        # IMPORTANT: Logout from Django session after generating tokens
        # This prevents the "sticky session" issue where Google reuses the same account
        logout(request)
        
        return HttpResponseRedirect(redirect_url)
        
    except Exception as e:
        return HttpResponseRedirect(f'{settings.FRONTEND_BASE_URL}/login?error=token_generation_failed')


@csrf_exempt
def force_google_logout(request):
    """
    Endpoint to force logout from Google OAuth session before redirecting to login
    """
    # Logout from Django session
    logout(request)
    
    # Redirect to Google login with prompt=select_account
    # This forces Google to show the account selection screen
    return HttpResponseRedirect('/accounts/google/login/?prompt=select_account')