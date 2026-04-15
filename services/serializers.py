# services/serializers.py
from rest_framework import serializers
from .models import ServiceCategory, ServiceIssue, ServiceRequest , JobSheet, JobSheetMaterial


class ServiceIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceIssue
        fields = ['id', 'description', 'price']

class ServiceCategorySerializer(serializers.ModelSerializer):
    issues = ServiceIssueSerializer(many=True, read_only=True)  # ← FIXED: Added this line
    is_free_for_user = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'issues', 'is_free_for_user']

    def get_is_free_for_user(self, obj):
        """Check if this service category is free for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.role == 'AMC':
                return request.user.has_free_service(obj)
        return False

class ServiceRequestSerializer(serializers.ModelSerializer):
    # We make customer read-only because we'll set it automatically in the view
    customer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id',
            'customer',
            'service_category',
            'issue',
            'custom_description',
            'service_location',
            'status',
        ]

class ServiceRequestHistorySerializer(serializers.ModelSerializer):
    service_category_name = serializers.CharField(source='service_category.name', read_only=True)
    issue_description = serializers.CharField(source='issue.description', read_only=True)
    issue_price = serializers.DecimalField(source='issue.price', max_digits=10, decimal_places=2, read_only=True)
    technician_name = serializers.SerializerMethodField()
    request_date = serializers.DateTimeField(read_only=True)
    can_rate = serializers.SerializerMethodField()
    service_location = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = [
            'id',
            'service_category_name',
            'issue_description',
            'issue_price',
            'custom_description',
            'service_location',
            'request_date',
            'status',
            'technician_name',
            'can_rate',
            'payment_status',
            'transaction_id',
            'payment_date',
        ]

    def get_technician_name(self, obj):
        return obj.technician.name if obj.technician else None

    def get_can_rate(self, obj):
        has_rating = hasattr(obj, 'rating') and obj.rating is not None
        return bool(obj.technician and obj.status == 'COMPLETED' and not has_rating)

    def get_payment_status(self, obj):
        latest = obj.payments.order_by('-created_at').first()
        return latest.status if latest else None
        
    def get_transaction_id(self, obj):
        latest = obj.payments.filter(status='SUCCESS').order_by('-created_at').first()
        return latest.provider_order_id if latest else None
        
    def get_payment_date(self, obj):
        latest = obj.payments.filter(status='SUCCESS').order_by('-created_at').first()
        return latest.created_at if latest else None

    def get_service_location(self, obj):
        loc = obj.service_location
        if not loc:
            return None
        return {
            'street_address': getattr(loc, 'street_address', ''),
            'city': getattr(loc, 'city', ''),
            'state': getattr(loc, 'state', ''),
            'pincode': getattr(loc, 'pincode', ''),
        }

class JobSheetMaterialSerializer(serializers.ModelSerializer):
    """Serializer for materials used in job sheet"""
    
    class Meta:
        model = JobSheetMaterial
        fields = [
            'id',
            'date_used',
            'item_description',
            'quantity',
            'unit_cost',
            'total_cost'
        ]
        read_only_fields = ['total_cost']

class JobSheetSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating job sheets"""
    materials = JobSheetMaterialSerializer(many=True, required=False)
    technician_name = serializers.SerializerMethodField()
    service_category_name = serializers.CharField(source='service_request.service_category.name', read_only=True)
    
    class Meta:
        model = JobSheet
        fields = [
            'id',
            'service_request',
            'customer_name',
            'customer_contact',
            'service_address',
            'equipment_type',
            'serial_number',
            'equipment_brand',
            'equipment_model',
            'problem_description',
            'work_performed',
            'date_of_service',
            'start_time',
            'finish_time',
            'total_time_taken',
            'approval_status',
            'declined_reason',
            'materials',
            'technician_name',
            'service_category_name',
            'created_at',
            'updated_at',
            'approved_at'
        ]
        read_only_fields = [
            'total_time_taken', 
            'created_at', 
            'updated_at', 
            'approved_at',
            'technician_name',
            'service_category_name'
        ]
    
    def get_technician_name(self, obj):
        return obj.created_by.name if obj.created_by else None
    
    def create(self, validated_data):
        materials_data = validated_data.pop('materials', [])
        
        # Create job sheet
        job_sheet = JobSheet.objects.create(**validated_data)
        
        # Create materials
        for material_data in materials_data:
            JobSheetMaterial.objects.create(job_sheet=job_sheet, **material_data)
        
        return job_sheet
    
    def update(self, instance, validated_data):
        materials_data = validated_data.pop('materials', None)
        
        # Update job sheet fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update materials if provided
        if materials_data is not None:
            # Delete existing materials
            instance.materials.all().delete()
            
            # Create new materials
            for material_data in materials_data:
                JobSheetMaterial.objects.create(job_sheet=instance, **material_data)
        
        return instance

class JobSheetDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for viewing job sheets"""
    materials = JobSheetMaterialSerializer(many=True, read_only=True)
    technician_name = serializers.CharField(source='created_by.name', read_only=True)
    technician_phone = serializers.CharField(source='created_by.phone', read_only=True)
    service_category_name = serializers.CharField(source='service_request.service_category.name', read_only=True)
    service_request_id = serializers.IntegerField(source='service_request.id', read_only=True)
    total_material_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = JobSheet
        fields = [
            'id',
            'service_request_id',
            'service_category_name',
            'customer_name',
            'customer_contact',
            'service_address',
            'equipment_type',
            'serial_number',
            'equipment_brand',
            'equipment_model',
            'problem_description',
            'work_performed',
            'date_of_service',
            'start_time',
            'finish_time',
            'total_time_taken',
            'approval_status',
            'declined_reason',
            'materials',
            'total_material_cost',
            'technician_name',
            'technician_phone',
            'created_at',
            'updated_at',
            'approved_at'
        ]
    
    def get_total_material_cost(self, obj):
        return sum(material.total_cost for material in obj.materials.all())