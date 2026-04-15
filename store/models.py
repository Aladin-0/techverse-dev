# store/models.py - Fixed with proper error handling

from django.db import models
from django.conf import settings # To get the CustomUser model
from decimal import Decimal


class StoreBanner(models.Model):
    """Hero banners for the Store page — admin-managed, image-only slides."""
    image = models.ImageField(upload_to='banners/', help_text="Banner image (recommended 1400×400)")
    button_text = models.CharField(max_length=50, blank=True, help_text="CTA button label, e.g. 'Shop Now'. Leave blank for no button.")
    product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Link button to this product page (optional)"
    )
    external_link = models.URLField(max_length=500, blank=True, help_text="External URL if no product is linked (optional)")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower = first)")
    is_active = models.BooleanField(default=True, help_text="Show this banner on the store")

    class Meta:
        ordering = ['order']
        verbose_name = 'Store Banner'
        verbose_name_plural = 'Store Banners'

    def __str__(self):
        return f"Banner #{self.order} ({'active' if self.is_active else 'hidden'})"

class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Addresses'

    def __str__(self):
        return f"{self.user.name}'s Address in {self.city}"

class ProductCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, help_text="A unique, URL-friendly name for the category.")

    class Meta:
        verbose_name_plural = 'Product Categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(ProductCategory, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True, help_text="A unique, URL-friendly name for the product.")
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True, help_text="Main product image")  # Main image
    delivery_time_info = models.CharField(max_length=255, help_text="e.g., 'Delivered within 2-3 business days'")
    
    # New fields for enhanced product details
    brand = models.CharField(max_length=100, blank=True, help_text="Product brand name")
    model_number = models.CharField(max_length=100, blank=True, help_text="Product model number")
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    dimensions = models.CharField(max_length=100, blank=True, help_text="L x W x H in cm")
    warranty_period = models.CharField(max_length=50, default="1 Year", help_text="Warranty period")
    features = models.TextField(blank=True, help_text="Comma-separated list of key features")
    
    # SEO and metadata
    meta_description = models.CharField(max_length=160, blank=True, help_text="SEO meta description")
    is_featured = models.BooleanField(default=False, help_text="Mark as featured product")
    is_active = models.BooleanField(default=True, help_text="Product is active and visible")
    
    # Amazon Affiliate Feature
    is_amazon_affiliate = models.BooleanField(default=False, help_text="Is this an Amazon affiliate product?")
    amazon_affiliate_link = models.URLField(max_length=1000, blank=True, null=True, help_text="Amazon Affiliate Link")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_amazon_affiliate', '-created_at']

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        # Provide default slug if empty to avoid DB errors on initial save
        if not self.slug and self.name:
            from django.utils.text import slugify
            import uuid
            self.slug = f"{slugify(self.name)[:200]}-{uuid.uuid4().hex[:6]}"
            
        super().save(*args, **kwargs)
        
        # If it's an amazon affiliate and missing name/price/image, try fetching it
        if self.is_amazon_affiliate and self.amazon_affiliate_link:
            from decimal import Decimal
            needs_fetch = not self.name or not self.price or self.price == Decimal('0.00') or not self.image
            
            # Prevent infinite recursion via a custom flag
            if needs_fetch and not getattr(self, '_fetching_amazon', False):
                self._fetching_amazon = True
                try:
                    from services.amazon_scraper import populate_product_from_amazon
                    populate_product_from_amazon(self)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Amazon scraping failed for Product {self.id}: {e}")
                finally:
                    self._fetching_amazon = False
    
    def get_features_list(self):
        """Return features as a list"""
        if self.features:
            return [feature.strip() for feature in self.features.split(',') if feature.strip()]
        return []
    
    @property
    def main_image_url(self):
        """Get the main image URL"""
        if self.image:
            return self.image.url
        return None
    
    @property
    def all_images(self):
        """Get all images including main image and additional images - FIXED to avoid duplicates"""
        images = []
        seen_urls = set()
        
        # Add main image first if it exists
        if self.image:
            main_url = self.image.url
            images.append(main_url)
            seen_urls.add(main_url)
        
        # Add additional images, avoiding duplicates
        additional_images = self.additional_images.all().order_by('order', 'id')
        for img_obj in additional_images:
            if img_obj.image:
                img_url = img_obj.image.url
                if img_url not in seen_urls:
                    images.append(img_url)
                    seen_urls.add(img_url)
        
        return images

class ProductImage(models.Model):
    """Additional images for products"""
    product = models.ForeignKey(Product, related_name='additional_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/additional/')
    alt_text = models.CharField(max_length=255, blank=True, help_text="Alternative text for the image")
    is_primary = models.BooleanField(default=False, help_text="Set as primary image")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
    
    def __str__(self):
        return f"{self.product.name} - Image {self.order}"
    
    def save(self, *args, **kwargs):
        """Override save to ensure only one primary image per product"""
        if self.is_primary:
            # Set all other images for this product to not primary
            ProductImage.objects.filter(
                product=self.product, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Override delete to remove image file from filesystem"""
        if self.image:
            try:
                import os
                if os.path.isfile(self.image.path):
                    os.remove(self.image.path)
            except (ValueError, OSError):
                pass  # Handle cases where file doesn't exist
        super().delete(*args, **kwargs)

class ProductSpecification(models.Model):
    """Technical specifications for products"""
    product = models.ForeignKey(Product, related_name='specifications', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="Specification name (e.g., 'Processor', 'RAM')")
    value = models.CharField(max_length=255, help_text="Specification value")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    
    class Meta:
        ordering = ['order', 'name']
        unique_together = ['product', 'name']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}: {self.value}"

class Order(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    # MAKE SURE THIS FIELD EXISTS
    technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders', limit_choices_to={'role': 'TECHNICIAN'})
    order_date = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when order was marked as Delivered")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    affiliate = models.ForeignKey('affiliates.Affiliate', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')

    def save(self, *args, **kwargs):
        """Auto-stamp delivered_at when status transitions to DELIVERED."""
        if self.pk:
            try:
                old = Order.objects.get(pk=self.pk)
                if old.status != 'DELIVERED' and self.status == 'DELIVERED' and not self.delivered_at:
                    from django.utils import timezone
                    self.delivered_at = timezone.now()
            except Order.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} by {self.customer.name if self.customer else 'Guest'}"

    @property
    def total_amount(self):
        """Calculate total amount with proper error handling"""
        try:
            total = Decimal('0.00')
            for item in self.items.all():
                item_total = item.get_total_item_price()
                if item_total is not None:
                    total += item_total
            return total
        except Exception as e:

            return Decimal('0.00')

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Price at time of order

    def __str__(self):
        return f"{self.quantity} of {self.product.name}"

    def get_total_item_price(self):
        """Calculate total item price with proper error handling"""
        try:
            # Use the stored price from order time, fallback to current product price
            item_price = self.price
            if item_price is None:
                if self.product and self.product.price:
                    item_price = self.product.price
                    # Update the stored price for future reference
                    self.price = item_price
                    self.save(update_fields=['price'])
                else:

                    return Decimal('0.00')
            
            if self.quantity and item_price:
                return Decimal(str(self.quantity)) * Decimal(str(item_price))
            else:

                return Decimal('0.00')
                
        except Exception as e:

            return Decimal('0.00')
    
    def save(self, *args, **kwargs):
        """Override save to ensure price is set"""
        if self.price is None and self.product:
            self.price = self.product.price
        super().save(*args, **kwargs)