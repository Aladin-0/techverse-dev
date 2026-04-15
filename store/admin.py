# store/admin.py - Fixed with better error handling

from django.contrib import admin
from django.utils.html import format_html
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import Address, ProductCategory, Product, ProductImage, ProductSpecification, Order, OrderItem, StoreBanner

User = get_user_model()

# To show order items within the order detail page in admin
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('get_total_item_price_safe',)
    fields = ('product', 'quantity', 'price', 'get_total_item_price_safe')
    
    def get_total_item_price_safe(self, obj):
        """Safe method to get total item price"""
        try:
            if obj and obj.id:  # Make sure the object exists and is saved
                total = obj.get_total_item_price()
                if total is not None:
                    return f"₹{total}"
                else:
                    return "₹0.00"
            else:
                return "Not calculated yet"
        except Exception as e:
            return f"Error: {str(e)}"
    get_total_item_price_safe.short_description = "Total Price"

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'order_date', 'status', 'total_amount_safe', 'technician_name', 'assignment_status')
    list_filter = ('status', 'order_date', 'technician')
    search_fields = ('customer__name', 'customer__email', 'id')
    inlines = [OrderItemInline]
    
    # Enhanced fieldsets with better organization
    fieldsets = (
        ('Order Information', {
            'fields': ('customer', 'order_date', 'shipping_address'),
            'classes': ('wide',)
        }),
        ('Order Status', {
            'fields': ('status',),
            'classes': ('wide',)
        }),
        ('Technician Assignment', {
            'fields': ('technician',),
            'classes': ('wide',),
            'description': 'Assign a technician to handle this order delivery/installation'
        }),
    )
    
    readonly_fields = ('order_date',)
    
    def customer_name(self, obj):
        try:
            return obj.customer.name if obj.customer else 'N/A'
        except:
            return 'Error loading customer'
    customer_name.short_description = 'Customer'
    customer_name.admin_order_field = 'customer__name'
    
    def technician_name(self, obj):
        try:
            if obj.technician:
                return format_html(
                    '<span style="color: #28a745; font-weight: bold;">{}</span>',
                    obj.technician.name
                )
            return format_html('<span style="color: #dc3545;">Not Assigned</span>')
        except:
            return format_html('<span style="color: #dc3545;">Error</span>')
    technician_name.short_description = 'Assigned Technician'
    technician_name.admin_order_field = 'technician__name'
    
    def total_amount_safe(self, obj):
        """Safe method to get total amount"""
        try:
            total = obj.total_amount
            if total is not None:
                return f"₹{total}"
            else:
                return "₹0.00"
        except Exception as e:
            return f"Error: {str(e)[:50]}"
    total_amount_safe.short_description = 'Total Amount'
    
    def assignment_status(self, obj):
        try:
            if obj.technician:
                if obj.status == 'DELIVERED':
                    return format_html(
                        '<span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✓ Completed</span>'
                    )
                else:
                    return format_html(
                        '<span style="background: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 3px; font-size: 11px;">⏳ In Progress</span>'
                    )
            return format_html(
                '<span style="background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; font-size: 11px;">⚠ Needs Assignment</span>'
            )
        except:
            return format_html(
                '<span style="background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; font-size: 11px;">Error</span>'
            )
    assignment_status.short_description = 'Assignment Status'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "technician":
            # Only show users with TECHNICIAN role
            kwargs["queryset"] = User.objects.filter(role='TECHNICIAN')
            kwargs["empty_label"] = "Select Technician..."
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        if change and 'technician' in form.changed_data:
            # If technician was assigned, update status to PROCESSING if still PENDING
            if obj.technician and obj.status == 'PENDING':
                obj.status = 'PROCESSING'
        super().save_model(request, obj, form, change)

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        if obj:  # Editing an existing object
            readonly_fields.append('total_amount_safe')
        return readonly_fields

class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

# Inline for additional product images
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'order', 'image_preview')
    readonly_fields = ('image_preview',)
    ordering = ['order']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"

# Inline for product specifications
class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1
    fields = ('name', 'value', 'order')
    ordering = ['order']

# Enhanced Product admin
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'is_featured', 'is_active', 'main_image_preview')
    list_filter = ('category', 'brand', 'is_featured', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'brand', 'model_number')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'main_image_preview')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'brand', 'model_number')
        }),
        ('Amazon Affiliate', {
            'fields': ('is_amazon_affiliate', 'amazon_affiliate_link'),
            'description': 'Check the box and provide an Amazon link to automatically fetch details and photos on save.'
        }),
        ('Description & Media', {
            'fields': ('description', 'image', 'main_image_preview', 'features')
        }),
        ('Pricing & Inventory', {
            'fields': ('price', 'delivery_time_info')
        }),
        ('Product Details', {
            'fields': ('weight', 'dimensions', 'warranty_period')
        }),
        ('SEO & Visibility', {
            'fields': ('meta_description', 'is_featured', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductImageInline, ProductSpecificationInline]
    
    def main_image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return "No image"
    main_image_preview.short_description = "Main Image Preview"

class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'alt_text', 'is_primary', 'order', 'image_preview')
    list_filter = ('is_primary', 'product__category')
    search_fields = ('product__name', 'alt_text')
    ordering = ['product', 'order']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"

class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'value', 'order')
    list_filter = ('name', 'product__category')
    search_fields = ('product__name', 'name', 'value')
    ordering = ['product', 'order']

# Register your models here
admin.site.register(Address)
admin.site.register(ProductCategory, ProductCategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductImage, ProductImageAdmin)
admin.site.register(ProductSpecification, ProductSpecificationAdmin)
admin.site.register(Order, OrderAdmin)


class StoreBannerAdmin(admin.ModelAdmin):
    list_display = ('order', 'banner_preview', 'button_text', 'product', 'is_active')
    list_display_links = ('banner_preview',)
    list_filter = ('is_active',)
    list_editable = ('order', 'is_active')
    ordering = ['order']

    def banner_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 200px; height: 60px; object-fit: cover; border-radius: 6px;" />',
                obj.image.url
            )
        return "No image"
    banner_preview.short_description = "Preview"

admin.site.register(StoreBanner, StoreBannerAdmin)