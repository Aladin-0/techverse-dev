# users/urls.py

from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .google_login_view import custom_google_login

urlpatterns = [
    # Template views
    path('login/', auth_views.LoginView.as_view(template_name='users/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('my-orders/', views.my_orders, name='my_orders'),
    path('add-address/', views.add_address, name='add_address'),
    path('technician/dashboard/', views.technician_dashboard, name='technician_dashboard'),

    # API endpoints
    path('csrf/', views.csrf_token_view, name='api-csrf'),
    path('me/', views.CurrentUserView.as_view(), name='api-me'),
    path('profile/', views.UserProfileUpdateView.as_view(), name='api-profile'),
    path('profile/validate/', views.ProfileValidationView.as_view(), name='api-profile-validate'),
    path('change-password/', views.ChangePasswordView.as_view(), name='api-change-password'),
    path('set-password/', views.SetPasswordView.as_view(), name='api-set-password'),
    path('delete-account/', views.DeleteAccountView.as_view(), name='api-delete-account'),
    path('logout-session/', views.LogoutView.as_view(), name='api-logout'),

    # Debug endpoints (staff only -- guarded server-side by IsAdminUser)
    path('debug-auth/', views.DebugAuthView.as_view(), name='debug-auth'),
    # NOTE: create-from-google/ has been permanently removed (account-takeover vector).
]
