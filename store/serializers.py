# store/serializers.py - Updated with better can_rate logic
from rest_framework import serializers
from .models import Product, ProductCategory, ProductImage, ProductSpecification, Address, Order, OrderItem, StoreBanner

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['id', 'name', 'value', 'order']

class ProductSerializer(serializers.ModelSerializer):
    # To show the category name instead of just its ID
    category = ProductCategorySerializer(read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    features_list = serializers.SerializerMethodField()
    all_images = serializers.SerializerMethodField()
    specifications_dict = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'image', 'category', 
            'delivery_time_info', 'brand', 'model_number', 'weight', 
            'dimensions', 'warranty_period', 'features', 'features_list', 
            'is_featured', 'is_active', 'additional_images', 'specifications',
            'all_images', 'specifications_dict', 'created_at', 'updated_at',
            'is_amazon_affiliate', 'amazon_affiliate_link'
        ]

    def get_features_list(self, obj):
        return obj.get_features_list()
    
    def get_all_images(self, obj):
        """Return all images avoiding duplicates - uses the fixed model property"""
        return obj.all_images

    def get_specifications_dict(self, obj):
        specs_dict = {spec.name: spec.value.strip() for spec in obj.specifications.all()}
        if not specs_dict:
            specs_dict = {
                'Brand': getattr(obj, 'brand', '') or 'TechVerse',
                'Model': getattr(obj, 'model_number', '') or obj.name,
                'Warranty': getattr(obj, 'warranty_period', '') or '1 Year',
            }
        return specs_dict

class ProductDetailSerializer(ProductSerializer):
    """Extended serializer for product detail view with all related data"""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Add computed fields for frontend
        data['specifications_dict'] = {
            spec['name']: spec['value'] 
            for spec in data.get('specifications', [])
        }
        
        # Add default specifications if none exist
        if not data['specifications_dict']:
            specs = {}
            if data.get('brand'): specs['Brand'] = data['brand']
            if data.get('model_number'): specs['Model'] = data['model_number']
            if data.get('warranty_period'): specs['Warranty'] = data['warranty_period']
            data['specifications_dict'] = specs
        
        # Add default features if none exist
        if not data['features_list']:
            data['features_list'] = []
        
        return data

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street_address', 'city', 'state', 'pincode', 'is_default']

class AddressCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['street_address', 'city', 'state', 'pincode', 'is_default']
    
    def create(self, validated_data):
        # If this address is being set as default, remove default from others
        if validated_data.get('is_default', False):
            Address.objects.filter(
                user=self.context['request'].user, 
                is_default=True
            ).update(is_default=False)
        
        return Address.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        # If this address is being set as default, remove default from others
        if validated_data.get('is_default', False):
            Address.objects.filter(
                user=instance.user, 
                is_default=True
            ).exclude(id=instance.id).update(is_default=False)
        
        return super().update(instance, validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_slug', 'product_image', 'quantity', 'price']
    
    def get_product_image(self, obj):
        """Get the product image URL"""
        try:
            if obj.product and obj.product.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.product.image.url)
                else:
                    return obj.product.image.url
            return None
        except Exception:
            return None

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address_details = AddressSerializer(source='shipping_address', read_only=True)
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    technician_phone = serializers.CharField(source='technician.phone', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    can_rate = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    payment_amount = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()
    delivery_duration = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_date', 'delivered_at', 'status', 'total_amount',
            'items', 'shipping_address_details', 'technician_name',
            'technician_phone', 'customer_name', 'customer_phone',
            'customer_email', 'can_rate', 'transaction_id',
            'payment_amount', 'payment_date', 'delivery_duration',
        ]

    def _get_payment(self, obj):
        try:
            return obj.payments.filter(status='SUCCESS').first()
        except Exception:
            return None

    def get_transaction_id(self, obj):
        """Return the PhonePe transaction ID if the order was paid successfully."""
        p = self._get_payment(obj)
        return p.transaction_id if p else None

    def get_payment_amount(self, obj):
        p = self._get_payment(obj)
        return str(p.amount) if p else None

    def get_payment_date(self, obj):
        """Return the timestamp of successful payment."""
        p = self._get_payment(obj)
        return p.updated_at.isoformat() if p else None

    def get_delivery_duration(self, obj):
        """Return human-readable duration between order placement and delivery."""
        try:
            if obj.delivered_at and obj.order_date:
                delta = obj.delivered_at - obj.order_date
                total_seconds = int(delta.total_seconds())
                days = delta.days
                hours = (total_seconds % 86400) // 3600
                minutes = (total_seconds % 3600) // 60
                if days > 0:
                    return f"{days}d {hours}h"
                elif hours > 0:
                    return f"{hours}h {minutes}m"
                else:
                    return f"{minutes}m"
        except Exception:
            pass
        return None

    def get_can_rate(self, obj):
        """Check if user can rate this order"""
        try:
            from services.models import TechnicianRating
            return (
                obj.status == 'DELIVERED' and
                obj.technician is not None and
                not TechnicianRating.objects.filter(
                    order=obj,
                    customer=obj.customer
                ).exists()
            )
        except Exception:
            return False




class StoreBannerSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source='product.slug', read_only=True, default=None)

    class Meta:
        model = StoreBanner
        fields = ['id', 'image', 'button_text', 'product_slug', 'external_link', 'order', 'is_active']