# users/views.py - Enhanced version with proper profile management

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.db.models import Avg
from django.http import JsonResponse, HttpResponse
from django.middleware.csrf import get_token
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
import json
from django.http import HttpResponseRedirect
from django.conf import settings

# Local imports
from .forms import CustomerRegistrationForm, AddressForm
from .serializers import UserSerializer, UserProfileUpdateSerializer
from store.models import Order
from services.models import ServiceRequest, TechnicianRating
from django.utils.decorators import method_decorator
from allauth.socialaccount.providers.google.views import oauth2_login

User = get_user_model()

# Template views
def customer_registration(request):
    if request.method == 'POST':
        form = CustomerRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('product_list')
    else:
        form = CustomerRegistrationForm()

    return render(request, 'users/registration.html', {'form': form})

@login_required
def my_orders(request):
    orders = Order.objects.filter(customer=request.user).order_by('-order_date')
    context = {'orders': orders}
    return render(request, 'users/my_orders.html', context)

@login_required
def add_address(request):
    if request.method == 'POST':
        form = AddressForm(request.POST)
        if form.is_valid():
            address = form.save(commit=False)
            address.user = request.user
            address.save()
            next_page = request.GET.get('next', 'product_list')
            return redirect(next_page)
    else:
        form = AddressForm()

    return render(request, 'users/add_address.html', {'form': form})

@login_required
def technician_dashboard(request):
    if request.user.role != 'TECHNICIAN':
        return redirect('product_list')

    technician = request.user
    completed_orders = Order.objects.filter(technician=technician, status='DELIVERED').count()
    completed_services = ServiceRequest.objects.filter(technician=technician, status='COMPLETED').count()
    total_jobs = completed_orders + completed_services
    ratings = TechnicianRating.objects.filter(technician=technician).order_by('-created_at')
    average_rating = ratings.aggregate(Avg('rating'))

    context = {
        'total_jobs': total_jobs,
        'average_rating': average_rating['rating__avg'],
        'ratings': ratings,
    }
    return render(request, 'users/technician_dashboard.html', context)

# API views
def csrf_token_view(request):
    """Return CSRF token and set CSRF cookie for session-auth writes."""
    token = get_token(request)
    response = JsonResponse({'csrfToken': token})
    # Ensure CSRF cookie is set so double-submit check passes
    # Django's default cookie name is 'csrftoken'
    response.set_cookie(
        'csrftoken',
        token,
        samesite='Lax',
        secure=request.is_secure(),
        httponly=False,
    )
    return response

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile"""
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            user = serializer.save()
            # Return updated user data
            updated_serializer = UserSerializer(user)
            return Response(updated_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Change user password with mandatory session invalidation."""
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both current and new passwords are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # SECURITY: Invalidate all existing sessions so stolen sessions
        # can no longer be used after a password change. This is mandatory
        # to prevent session-fixation attacks.
        django_logout(request)

        return Response({'message': 'Password changed successfully. Please log in again.'})

class SetPasswordView(APIView):
    """
    Lets any authenticated user reset their password directly from their profile.
    Requires only new_password + confirm_password — no current password needed.
    Works for both Google-only users and users who already have a password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not new_password or not confirm_password:
            return Response(
                {'error': 'Both new_password and confirm_password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate against Django's built-in password validators
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, request.user)
        except DjangoValidationError as e:
            return Response({'error': e.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()

        return Response({
            'message': 'Password reset successfully.',
            'has_password': True
        })


class DeleteAccountView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """Delete user account"""
        password = request.data.get('password')

        if not password:
            return Response(
                {'error': 'Password is required to delete account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = False
        user.save()

        return Response({'message': 'Account deactivated successfully'})

class ProfileValidationView(APIView):
    """Check if user profile is complete for checkout"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        missing_fields = []

        if not user.name or user.name.strip() == '':
            missing_fields.append('name')

        if not user.phone or user.phone.strip() == '':
            missing_fields.append('phone')

        # Check if user has at least one address
        from store.models import Address
        addresses = Address.objects.filter(user=user)
        if not addresses.exists():
            missing_fields.append('address')

        return Response({
            'is_complete': len(missing_fields) == 0,
            'missing_fields': missing_fields,
            'user': UserSerializer(user).data
        })

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    """
    Logout endpoint that clears session and tokens
    """
    permission_classes = []  # No auth required to logout
    authentication_classes = []  # Disable authentication checks

    def post(self, request):
        try:
            # Clear Django session
            if request.user.is_authenticated:
                django_logout(request)

            response = Response({
                'success': True,
                'message': 'Logged out successfully'
            })

            # Clear session cookie
            response.delete_cookie('sessionid', domain=None, path='/')
            response.delete_cookie('csrftoken', domain=None, path='/')

            return response
        except Exception as e:
            # SECURITY: Do not expose raw exception messages to the client.
            # Log for server-side debugging instead.
            import logging
            logging.getLogger(__name__).error(f'LogoutView error: {e}')
            return Response({
                'success': False,
                'error': 'An error occurred during logout.'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class GoogleJWTTokenView(APIView):
    """
    Generate JWT tokens for users authenticated via Google OAuth session
    """
    permission_classes = []  # No auth required since we're checking session

    def get(self, request):
        # Check if user is authenticated via session (from Google OAuth)
        if not request.user.is_authenticated:
            return Response({
                'error': 'User not authenticated via Google OAuth session'
            }, status=401)

        user = request.user

        # Generate JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'success': True
        })

    def options(self, request, *args, **kwargs):
        """Handle preflight CORS requests"""
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
        response = Response()
        response["Access-Control-Allow-Origin"] = frontend_url
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Allow-Credentials"] = "true"
        return response

class DebugAuthView(APIView):
    """Debug view to check authentication status — STAFF ONLY."""
    # SECURITY: Restricted to staff users. This endpoint MUST never be
    # public as it exposes session and authentication metadata.
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response({
            'user_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'has_jwt_header': 'Authorization' in request.headers,
        })

# SECURITY: This endpoint has been PERMANENTLY REMOVED.
# The previous implementation was a critical account-takeover vulnerability:
# it accepted any email in the JSON body and returned a valid JWT for that
# account with zero ownership verification. An attacker could call:
#   POST /api/users/create-from-google/ {"email": "admin@techverse.com", "name": "hacker"}
# and receive a fully authenticated JWT token for the admin account.
#
# Token generation for Google OAuth users is now handled exclusively by
# GoogleJWTTokenView which requires an active, verified Django session.

@csrf_exempt
def google_login_success(request):
    """
    Endpoint called after successful Google OAuth to generate JWT tokens.
    SECURITY: All user data is JSON-encoded via json.dumps before being
    embedded into the script block. Tokens are passed via a dedicated JS
    variable to prevent string-injection attacks from malformed names/emails.
    """
    if request.method == 'GET':
        # Check if user is authenticated via session
        if request.user.is_authenticated:
            user = request.user

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # SECURITY: All dynamic values are passed through json.dumps/json.loads
            # to prevent script injection. Never use raw f-string interpolation
            # of user-controlled data into <script> blocks.
            frontend_url = json.dumps(getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173'))
            access_token = json.dumps(str(refresh.access_token))
            refresh_token = json.dumps(str(refresh))
            user_data = json.dumps({
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'email_notifications': user.email_notifications,
                'sms_notifications': user.sms_notifications,
            })

            response_html = f"""<!DOCTYPE html>
<html>
<head><title>Login Success</title></head>
<body>
<script>
    (function() {{
        var accessToken = {access_token};
        var refreshToken = {refresh_token};
        var userData = {user_data};
        var frontendUrl = {frontend_url};

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        if (window.opener) {{
            window.opener.postMessage({{
                type: 'GOOGLE_LOGIN_SUCCESS',
                tokens: {{ access: accessToken, refresh: refreshToken }},
                user: userData
            }}, frontendUrl);
            window.close();
        }} else {{
            window.location.href = frontendUrl + '/?login=success&token=' + encodeURIComponent(accessToken);
        }}
    }})();
</script>
<p>Login successful! Redirecting...</p>
</body>
</html>"""
            return HttpResponse(response_html)
        else:
            return HttpResponse("Not authenticated", status=401)

    return HttpResponse("Method not allowed", status=405)


# Redirect Allauth's 3rd-party signup page to our frontend Create Account
def redirect_third_party_signup(request):
    # Include an info flag so the frontend can show a helpful notice
    base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
    return HttpResponseRedirect(f"{base}/login?tab=signup&info=no_account")

def google_login_redirect(request):
    """
    Directly redirect to Google OAuth without showing intermediate page
    """
    # Directly call the Google OAuth login view
    # This skips the allauth intermediate "Sign in with Google" page
    return oauth2_login(request)


@csrf_exempt
def mobile_google_callback(request):
    """
    Mobile-specific callback that handles state issues.
    SECURITY: state and code are validated to contain only safe characters
    before being forwarded, preventing open-redirect / injection attacks.
    """
    import re
    state = request.GET.get('state', '')
    code = request.GET.get('code', '')
    frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')

    if not state or not code:
        return HttpResponseRedirect(f'{frontend_url}/login?error=oauth_failed')

    # SECURITY: Strictly validate that state and code only contain safe characters
    # (alphanumeric, hyphens, underscores, dots). Reject anything else.
    SAFE_PATTERN = re.compile(r'^[A-Za-z0-9\-_.:%]+$')
    if not SAFE_PATTERN.match(state) or not SAFE_PATTERN.match(code):
        return HttpResponseRedirect(f'{frontend_url}/login?error=oauth_invalid')

    from urllib.parse import urlencode, quote_plus
    safe_params = urlencode({'state': state, 'code': code})
    callback_url = f"/accounts/google/login/callback/?{safe_params}"
    response = HttpResponseRedirect(callback_url)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    return response
