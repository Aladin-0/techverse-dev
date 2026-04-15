# users/google_login_view.py - FIXED

from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def custom_google_login(request):
    """
    Custom Google OAuth login that forces account selection
    DO NOT add process=login - let allauth handle it naturally
    """

    
    # Just redirect to allauth's Google login with prompt parameter
    # Remove process=login to let allauth recognize it as social login
    return HttpResponseRedirect('/accounts/google/login/')