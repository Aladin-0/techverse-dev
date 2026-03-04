# ecom_project/urls.py - FIXED VERSION

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from users.admin_views import admin_dashboard
from users.views import redirect_third_party_signup, LogoutView
from users.google_login_view import custom_google_login

# Customize admin site
admin.site.site_header = "TechVerse Administration"
admin.site.site_title = "TechVerse Admin"
admin.site.index_title = "Welcome to TechVerse Administration"
admin.site.index_template = 'admin/index.html'

urlpatterns = [
    # Custom Admin Panel
    path('admin-panel/', include('admin_panel.urls')),
    
    # Django Admin
    path('django-admin/', admin.site.urls),
    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),

    # AUTH ENDPOINTS
    # Override dj-rest-auth logout with our custom CSRF-exempt one
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),

    # Then include the rest of dj-rest-auth
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # Custom Google OAuth (BEFORE allauth URLs)
    path('auth/google/login/', custom_google_login, name='custom_google_login'),
    path('accounts/3rdparty/signup/', redirect_third_party_signup, name='redirect_3rdparty_signup'),

    # Allauth URLs
    path('accounts/', include('allauth.urls')),

    # API URLs - Include services API endpoints under /api/
    path('', include('services.urls')),  # This includes /api/categories/, /api/job-sheets/, etc.
    
    # App URLs
    path('', include('store.urls')),
    path('api/users/', include('users.urls')),
    path('api/payments/', include('payments.urls')),
]

# Override admin index view
admin.site.index = admin_dashboard

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
