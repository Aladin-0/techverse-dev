from django.contrib import admin
from .models import Affiliate, AffiliateClick, AffiliateSale

@admin.register(Affiliate)
class AffiliateAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'commission_rate', 'is_active', 'created_at')
    search_fields = ('user__name', 'code', 'user__email')
    list_filter = ('is_active', 'created_at')
    prepopulated_fields = {'code': ('user',)} # This might need manual override if user isn't a string

@admin.register(AffiliateClick)
class AffiliateClickAdmin(admin.ModelAdmin):
    list_display = ('affiliate', 'ip_address', 'clicked_at')
    list_filter = ('affiliate', 'clicked_at')
    readonly_fields = ('affiliate', 'ip_address', 'user_agent', 'referer', 'clicked_at')

@admin.register(AffiliateSale)
class AffiliateSaleAdmin(admin.ModelAdmin):
    list_display = ('affiliate', 'order', 'commission_amount', 'created_at')
    list_filter = ('affiliate', 'created_at')
    readonly_fields = ('affiliate', 'order', 'commission_amount', 'created_at')
