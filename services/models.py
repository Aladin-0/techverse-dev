# services/models.py

from django.db import models
from django.conf import settings
from store.models import Address

class ServiceCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    custom_request_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=500.00,
        help_text="Default price to charge for custom service requests in this category."
    )

    class Meta:
        verbose_name_plural = 'Service Categories'

    def __str__(self):
        return self.name

class ServiceIssue(models.Model):
    category = models.ForeignKey(ServiceCategory, related_name='issues', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.category.name} - {self.description}"

class ServiceRequest(models.Model):
    STATUS_CHOICES = (
        ('SUBMITTED', 'Submitted'),
        ('CONFIRMED', 'Confirmed'),
        ('ASSIGNED', 'Technician Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_services', limit_choices_to={'role': 'TECHNICIAN'})
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE)
    issue = models.ForeignKey(ServiceIssue, on_delete=models.SET_NULL, null=True, blank=True)
    custom_description = models.TextField(blank=True, help_text="If your issue isn't listed, describe it here.")
    service_location = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    request_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')

    def __str__(self):
        return f"Service Request #{self.id} by {self.customer.name}"

class TechnicianRating(models.Model):
    RATING_CHOICES = (
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    )

    technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings_received', limit_choices_to={'role': 'TECHNICIAN'})
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings_given')

    # Link to the job being rated. Can be an Order or a ServiceRequest.
    order = models.OneToOneField('store.Order', on_delete=models.CASCADE, null=True, blank=True, related_name='rating')
    service_request = models.OneToOneField('ServiceRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='rating')

    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for {self.technician.name} by {self.customer.name} - {self.rating} stars"

class JobSheet(models.Model):
    """
    Professional Job Sheet created by technicians during service
    """
    APPROVAL_STATUS = (
        ('PENDING', 'Pending Customer Approval'),
        ('APPROVED', 'Approved by Customer'),
        ('DECLINED', 'Declined by Customer'),
    )
    
    # Reference to service request
    service_request = models.OneToOneField(
        ServiceRequest, 
        on_delete=models.CASCADE, 
        related_name='job_sheet'
    )
    
    # Customer Information (auto-filled from service request)
    customer_name = models.CharField(max_length=255)
    customer_contact = models.CharField(max_length=20)
    service_address = models.TextField()
    
    # Equipment Details
    equipment_type = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=100, blank=True)
    equipment_brand = models.CharField(max_length=100, blank=True)
    equipment_model = models.CharField(max_length=100, blank=True)
    
    # Problem & Work Details
    problem_description = models.TextField()
    work_performed = models.TextField()
    
    # Time Tracking
    date_of_service = models.DateField()
    start_time = models.TimeField()
    finish_time = models.TimeField()
    total_time_taken = models.DurationField(blank=True, null=True)  # Auto-calculated
    
    # Approval Status
    approval_status = models.CharField(
        max_length=20, 
        choices=APPROVAL_STATUS, 
        default='PENDING'
    )
    customer_signature = models.TextField(blank=True, null=True)  # For future digital signature
    approved_at = models.DateTimeField(blank=True, null=True)
    declined_reason = models.TextField(blank=True, null=True)
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_job_sheets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Job Sheet #{self.id} - Service Request #{self.service_request.id}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate total time taken
        if self.start_time and self.finish_time:
            from datetime import datetime, timedelta
            start = datetime.combine(datetime.today(), self.start_time)
            finish = datetime.combine(datetime.today(), self.finish_time)
            self.total_time_taken = finish - start
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Job Sheet'
        verbose_name_plural = 'Job Sheets'


class JobSheetMaterial(models.Model):
    """
    Materials used in a job sheet
    """
    job_sheet = models.ForeignKey(
        JobSheet, 
        on_delete=models.CASCADE, 
        related_name='materials'
    )
    
    date_used = models.DateField()
    item_description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    
    def save(self, *args, **kwargs):
        # Auto-calculate total cost
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.item_description} - ₹{self.total_cost}"
    
    class Meta:
        ordering = ['date_used', 'id']
        verbose_name = 'Job Sheet Material'
        verbose_name_plural = 'Job Sheet Materials'


class ServiceSettings(models.Model):
    """
    Singleton model for global service settings.
    """
    custom_request_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=500.00, 
        help_text="Default price to charge for custom service requests where no specific issue is selected."
    )

    class Meta:
        verbose_name = "Service Setting"
        verbose_name_plural = "Service Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Global Service Settings"


