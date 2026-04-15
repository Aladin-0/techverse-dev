from django.urls import path
from .views import VerifyAffiliateAPIView, AffiliateDashboardAPIView, CreatorProfileAPIView

urlpatterns = [
    path('verify/<slug:code>/', VerifyAffiliateAPIView.as_view(), name='verify-affiliate'),
    path('dashboard/', AffiliateDashboardAPIView.as_view(), name='affiliate-dashboard'),
    path('creator/<slug:code>/', CreatorProfileAPIView.as_view(), name='creator-profile'),
]
