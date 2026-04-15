# users/adapter.py - WITH ENHANCED DEBUGGING

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import sys

User = get_user_model()


class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom adapter for regular email/password authentication"""
    
    def is_open_for_signup(self, request):
        return True
    
    def get_login_redirect_url(self, request):
        """Override account login redirect"""
        
        # Check if this is a social login
        # If user has social accounts, delegate to social adapter behavior
        if hasattr(request.user, 'socialaccount_set') and request.user.socialaccount_set.exists():
            
            try:
                user = request.user
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Build redirect URL with tokens
                frontend_url = settings.FRONTEND_BASE_URL
                redirect_url = (
                    f"{frontend_url}/?login=success"
                    f"&access={access_token}"
                    f"&refresh={refresh_token}"
                    f"&email={user.email}"
                )
                
                return redirect_url
                
            except Exception as e:
                import traceback
                traceback.print_exc()
                return f'{settings.FRONTEND_BASE_URL}/login?error=token_generation_failed'
        
        # Regular login - just redirect to frontend
        return settings.FRONTEND_BASE_URL

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom adapter for Google OAuth with JWT token generation"""
    
    def get_app(self, request, provider, client_id=None):
        """
        Override to get app config from settings (env vars) as primary source,
        falling back to DB if needed. This fixes dev environments with fresh DBs.
        """
        from django.conf import settings as django_settings

        # --- Try settings-based config first (no DB required) ---
        provider_conf = django_settings.SOCIALACCOUNT_PROVIDERS.get(provider, {})
        app_conf = provider_conf.get('APP', {})
        conf_client_id = app_conf.get('client_id')
        conf_secret = app_conf.get('secret')

        if conf_client_id and conf_secret:
            from allauth.socialaccount.models import SocialApp
            from django.contrib.sites.models import Site

            # Try to get or auto-create the SocialApp record so allauth is happy
            try:
                current_site = Site.objects.get_current(request)
            except Exception:
                current_site = None

            app, created = SocialApp.objects.get_or_create(
                provider=provider,
                defaults={
                    'name': f'{provider.capitalize()} OAuth',
                    'client_id': conf_client_id,
                    'secret': conf_secret,
                }
            )
            # Keep credentials in sync with env (useful when keys rotate)
            if app.client_id != conf_client_id or app.secret != conf_secret:
                app.client_id = conf_client_id
                app.secret = conf_secret
                app.save(update_fields=['client_id', 'secret'])

            if current_site and not app.sites.filter(pk=current_site.pk).exists():
                app.sites.add(current_site)

            return app

        # --- Fallback: look in DB (production behaviour) ---
        apps = SocialApp.objects.filter(provider=provider)
        valid_apps = [app for app in apps if app.name and app.client_id]

        if client_id:
            valid_apps = [app for app in valid_apps if app.client_id == client_id]

        if len(valid_apps) == 0:
            raise SocialApp.DoesNotExist(
                f"No {provider} app found. "
                f"Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env "
                f"or add a SocialApp record in admin."
            )

        return valid_apps[0]

    
    def on_authentication_error(self, request, provider, error=None, exception=None, extra_context=None):
        """Handle authentication errors"""
        error_msg = str(exception) if exception else "Authentication failed"
        return HttpResponseRedirect(
            f'{settings.FRONTEND_BASE_URL}/login?error=oauth_failed&message={error_msg}'
        )
    
    def save_user(self, request, sociallogin, form=None):
        """Enhanced user creation from Google OAuth"""
        try:
            user = sociallogin.user
            extra_data = sociallogin.account.extra_data
            
            # Set name from Google data
            if not user.name or user.name == '':
                user.name = extra_data.get('name', user.email.split('@')[0])
            
            # Set default role if not set
            if not hasattr(user, 'role') or not user.role:
                user.role = 'CUSTOMER'
            
            # Save the user
            user.save()
            
            return user
            
        except Exception as e:
            raise
    
    def get_login_redirect_url(self, request):
        """
        CRITICAL: Generate JWT tokens and redirect to frontend with tokens in URL
        """
        
        try:
            user = request.user
            
            if not user or not user.is_authenticated:
                return f'{settings.FRONTEND_BASE_URL}/login?error=no_user'
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Build redirect URL with tokens
            frontend_url = settings.FRONTEND_BASE_URL
            redirect_url = (
                f"{frontend_url}/?login=success"
                f"&access={access_token}"
                f"&refresh={refresh_token}"
                f"&email={user.email}"
            )
            
            return redirect_url
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return f'{settings.FRONTEND_BASE_URL}/login?error=token_generation_failed'
    
    def pre_social_login(self, request, sociallogin):
        """Auto-link social account to existing user by verified email"""
        if request.user.is_authenticated:


            return

        email = (sociallogin.user.email or '').strip().lower()
        if not email:


            return

        # Check if email is verified from Google
        email_verified = bool(
            sociallogin.account.extra_data.get('email_verified', False) or
            sociallogin.account.extra_data.get('verified_email', False)
        )

        if not email_verified:


            return

        # Try to find existing user with this email
        try:
            existing_user = User.objects.get(email__iexact=email)


            
            # Connect social account to existing user
            if not sociallogin.is_existing:
                sociallogin.connect(request, existing_user)


                
        except User.DoesNotExist:


            pass
        except User.MultipleObjectsReturned:


            existing_user = User.objects.filter(email__iexact=email).first()
            if existing_user and not sociallogin.is_existing:
                sociallogin.connect(request, existing_user)

