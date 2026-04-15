# services/admin.py - Enhanced with technician assignment

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth import get_user_model
from .models import ServiceCategory, ServiceIssue, ServiceRequest, TechnicianRating

User = get_user_model()

class ServiceIssueInline(admin.TabularInline):
    model = ServiceIssue
    extra = 1

class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [ServiceIssueInline]

class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'service_category', 'status', 'request_date', 'technician_name', 'assignment_status')
    list_filter = ('status', 'request_date', 'service_category', 'technician')
    search_fields = ('id', 'customer__name', 'customer__email', 'custom_description')
    
    # Enhanced fieldsets with better organization
    fieldsets = (
        ('Service Request Information', {
            'fields': ('customer', 'service_category', 'issue', 'custom_description', 'service_location'),
            'classes': ('wide',)
        }),
        ('Request Status', {
            'fields': ('status',),
            'classes': ('wide',)
        }),
        ('Technician Assignment', {
            'fields': ('technician',),
            'classes': ('wide',),
            'description': 'Assign a technician to handle this service request'
        }),
    )
    
    readonly_fields = ('request_date',)
    
    def customer_name(self, obj):
        return obj.customer.name if obj.customer else 'N/A'
    customer_name.short_description = 'Customer'
    customer_name.admin_order_field = 'customer__name'
    
    def technician_name(self, obj):
        if obj.technician:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">{}</span>',
                obj.technician.name
            )
        return format_html('<span style="color: #dc3545;">Not Assigned</span>')
    technician_name.short_description = 'Assigned Technician'
    technician_name.admin_order_field = 'technician__name'
    
    def assignment_status(self, obj):
        if obj.technician:
            if obj.status == 'COMPLETED':
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
    assignment_status.short_description = 'Assignment Status'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "technician":
            # Only show users with TECHNICIAN role
            kwargs["queryset"] = User.objects.filter(role='TECHNICIAN')
            kwargs["empty_label"] = "Select Technician..."
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        if change and 'technician' in form.changed_data:
            # If technician was assigned, update status to ASSIGNED if still SUBMITTED
            if obj.technician and obj.status == 'SUBMITTED':
                obj.status = 'ASSIGNED'
        super().save_model(request, obj, form, change)

class TechnicianRatingAdmin(admin.ModelAdmin):
    list_display = ('technician_name', 'customer_name', 'rating', 'created_at', 'order', 'service_request')
    list_filter = ('technician', 'rating', 'created_at')
    search_fields = ('technician__name', 'customer__name')
    readonly_fields = ('created_at',)
    
    def technician_name(self, obj):
        return obj.technician.name if obj.technician else 'N/A'
    technician_name.short_description = 'Technician'
    technician_name.admin_order_field = 'technician__name'
    
    def customer_name(self, obj):
        return obj.customer.name if obj.customer else 'N/A'
    customer_name.short_description = 'Customer'
    customer_name.admin_order_field = 'customer__name'

admin.site.register(ServiceCategory, ServiceCategoryAdmin)
admin.site.register(ServiceRequest, ServiceRequestAdmin)
admin.site.register(TechnicianRating, TechnicianRatingAdmin)
