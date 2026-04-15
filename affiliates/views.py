from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Affiliate, AffiliateClick, AffiliateSale
from .serializers import AffiliateDashboardSerializer, AffiliateSerializer
from django.utils import timezone

class VerifyAffiliateAPIView(APIView):
    """
    Checks if an affiliate code is valid and active.
    Used by the frontend when a user lands on a /:code link.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, code):
        affiliate = get_object_or_404(Affiliate, code=code.strip())
        if not affiliate.is_active:
            return Response({'error': 'Affiliate link has been terminated'}, status=status.HTTP_403_FORBIDDEN)
        
        # Record the click
        AffiliateClick.objects.create(
            affiliate=affiliate,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            referer=request.META.get('HTTP_REFERER')
        )
        
        return Response({
            'success': True,
            'affiliate_name': affiliate.user.name,
            'code': affiliate.code
        })

class AffiliateDashboardAPIView(APIView):
    """
    Returns statistics and revenue for the creator.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            affiliate = request.user.affiliate_profile
        except Affiliate.DoesNotExist:
            return Response({'error': 'No affiliate profile found'}, status=status.HTTP_404_NOT_FOUND)
            
        if not affiliate.is_active:
             return Response({'error': 'Affiliate account is terminated'}, status=status.HTTP_403_FORBIDDEN)
             
        serializer = AffiliateDashboardSerializer(affiliate)
        return Response(serializer.data)

class CreatorProfileAPIView(APIView):
    """
    Publicly visible stats for a creator if they are active.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, code):
        affiliate = get_object_or_404(Affiliate, code=code.strip())
        if not affiliate.is_active:
             return Response({'error': 'This page is no longer available'}, status=status.HTTP_410_GONE)
        
        serializer = AffiliateDashboardSerializer(affiliate)
        return Response(serializer.data)
