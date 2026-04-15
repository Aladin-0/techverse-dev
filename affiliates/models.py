from django.db import models
from django.conf import settings
from decimal import Decimal

class Affiliate(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='affiliate_profile')
    code = models.SlugField(unique=True, help_text="Unique code used in affiliate links")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="Commission percentage (e.g. 10.00 for 10%)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.name} ({self.code})"

class AffiliateClick(models.Model):
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='clicks')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    referer = models.URLField(null=True, blank=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Click for {self.affiliate.code} at {self.clicked_at}"

class AffiliateSale(models.Model):
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='sales')
    order = models.OneToOneField('store.Order', on_delete=models.CASCADE, related_name='affiliate_sale')
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale for {self.affiliate.code} - Order #{self.order.id}"

    def calculate_commission(self):
        """Calculates commission based on order total and affiliate rate"""
        total = self.order.total_amount
        rate = self.affiliate.commission_rate
        return (total * rate / Decimal('100.00')).quantize(Decimal('0.01'))
