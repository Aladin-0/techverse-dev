from rest_framework import serializers
from .models import Affiliate, AffiliateClick, AffiliateSale
from django.db.models import Sum
from decimal import Decimal

class AffiliateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Affiliate
        fields = ['id', 'user_name', 'code', 'commission_rate', 'is_active', 'created_at']

class AffiliateSaleSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_total = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = AffiliateSale
        fields = ['id', 'order_id', 'order_total', 'commission_amount', 'created_at']

class AffiliateDashboardSerializer(serializers.ModelSerializer):
    total_clicks = serializers.SerializerMethodField()
    total_sales = serializers.SerializerMethodField()
    total_earnings = serializers.SerializerMethodField()
    recent_sales = serializers.SerializerMethodField()
    
    class Meta:
        model = Affiliate
        fields = ['id', 'code', 'commission_rate', 'is_active', 'total_clicks', 'total_sales', 'total_earnings', 'recent_sales']

    def get_total_clicks(self, obj):
        return obj.clicks.count()

    def get_total_sales(self, obj):
        return obj.sales.count()

    def get_total_earnings(self, obj):
        return obj.sales.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0.00')

    def get_recent_sales(self, obj):
        sales = obj.sales.all().order_by('-created_at')[:10]
        return AffiliateSaleSerializer(sales, many=True).data
