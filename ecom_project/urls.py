# ecom_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import redirect_third_party_signup, LogoutView
from users.google_login_view import custom_google_login
from users import admin_panel_views

# Customize admin site
admin.site.site_header = "TechVerse Administration"
admin.site.site_title = "TechVerse Admin"
admin.site.index_title = "Welcome to TechVerse Administration"
admin.site.index_template = 'admin/index.html'

urlpatterns = [
    # Django Admin
    path('django-admin/', admin.site.urls),

    # ── React Admin Panel API ───────────────────────────────────────────────
    # Auth
    path('admin-panel/api/csrf/',    admin_panel_views.admin_csrf),
    path('admin-panel/api/login/',   admin_panel_views.admin_login),
    path('admin-panel/logout/',      admin_panel_views.admin_logout),

    # Dashboard + Analytics
    path('admin-panel/api/stats/',      admin_panel_views.admin_stats),
    path('admin-panel/api/analytics/',  admin_panel_views.admin_analytics),

    # Users
    path('admin-panel/api/users/',                          admin_panel_views.admin_users),
    path('admin-panel/api/users/create/',                   admin_panel_views.admin_user_create),
    path('admin-panel/api/users/<int:user_id>/edit/',       admin_panel_views.admin_user_edit),
    path('admin-panel/api/users/<int:user_id>/delete/',     admin_panel_views.admin_user_delete),

    # Products
    path('admin-panel/api/products/',                            admin_panel_views.admin_products),
    path('admin-panel/api/products/create/',                     admin_panel_views.admin_product_create),
    path('admin-panel/api/product/<int:product_id>/',            admin_panel_views.admin_product_detail),
    path('admin-panel/api/products/<int:product_id>/edit/',      admin_panel_views.admin_product_edit),
    path('admin-panel/api/products/<int:product_id>/delete/',    admin_panel_views.admin_product_delete),

    # Orders
    path('admin-panel/api/orders/',                         admin_panel_views.admin_orders),
    path('admin-panel/api/orders/<int:order_id>/',          admin_panel_views.admin_order_detail),
    path('admin-panel/api/orders/<int:order_id>/delete/',   admin_panel_views.admin_order_delete),
    path('admin-panel/api/update-order-status/',            admin_panel_views.admin_update_order_status),
    path('admin-panel/api/assign-technician/',              admin_panel_views.admin_assign_technician),

    # Services
    path('admin-panel/api/services/',                        admin_panel_views.admin_services),
    path('admin-panel/api/service/<int:service_id>/',        admin_panel_views.admin_service_detail),
    path('admin-panel/api/update-service-status/',           admin_panel_views.admin_update_service_status),
    path('admin-panel/api/assign-service-technician/',       admin_panel_views.admin_assign_service_technician),

    # Categories
    path('admin-panel/api/categories/',                        admin_panel_views.admin_categories),
    path('admin-panel/api/categories/create/',                 admin_panel_views.admin_category_create),
    path('admin-panel/api/categories/<int:cat_id>/edit/',      admin_panel_views.admin_category_edit),
    path('admin-panel/api/categories/<int:cat_id>/delete/',    admin_panel_views.admin_category_delete),

    # Banners (GET + POST all through one view, action param controls operation)
    path('admin-panel/api/banners/', admin_panel_views.admin_banners),

    # Affiliates
    path('admin-panel/api/affiliates/',                        admin_panel_views.admin_affiliates),
    path('admin-panel/api/affiliates/create/',                 admin_panel_views.admin_affiliate_create),
    path('admin-panel/api/affiliates/<int:aff_id>/',           admin_panel_views.admin_affiliate_detail),
    path('admin-panel/api/affiliates/<int:aff_id>/update/',    admin_panel_views.admin_affiliate_update),

    # Job Sheets
    path('admin-panel/api/job-sheets/',                          admin_panel_views.admin_job_sheets),
    path('admin-panel/api/job-sheets/<int:sheet_id>/',           admin_panel_views.admin_job_sheet_detail),
    path('admin-panel/api/job-sheets/<int:sheet_id>/delete/',    admin_panel_views.admin_job_sheet_delete),

    # Settings
    path('admin-panel/api/settings/', admin_panel_views.admin_settings),

    # ── AUTH ENDPOINTS ──────────────────────────────────────────────────────
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # Google OAuth
    path('auth/google/login/', custom_google_login, name='custom_google_login'),
    path('accounts/3rdparty/signup/', redirect_third_party_signup, name='redirect_3rdparty_signup'),
    path('accounts/', include('allauth.urls')),

    # App API URLs
    path('', include('services.urls')),
    path('', include('store.urls')),
    path('api/users/', include('users.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/affiliates/', include('affiliates.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
