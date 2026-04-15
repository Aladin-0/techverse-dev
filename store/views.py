# store/views.py - Updated with ProductDetailAPIView and delete_product

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Product, Order, OrderItem, Address, StoreBanner, ProductCategory
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (
    ProductSerializer, ProductDetailSerializer, AddressSerializer,
    AddressCreateUpdateSerializer, OrderSerializer, StoreBannerSerializer
)
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)
import os
from services.models import ServiceRequest
from django.db import transaction
from affiliates.models import Affiliate, AffiliateSale
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

def product_list(request):
    products = Product.objects.filter(is_active=True)
    context = {
        'products': products
    }
    return render(request, 'store/product_list.html', context)

def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    context = {
        'product': product
    }
    return render(request, 'store/product_detail.html', context)

@login_required
def buy_now(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)

    # Stock validation removed

    order = Order.objects.create(customer=request.user, status='PENDING')

    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        quantity=1,
        price=product.price
    )

    return redirect('select_address', order_id=order.id)

@login_required
def select_address(request, order_id):
    order = get_object_or_404(Order, id=order_id, customer=request.user)
    addresses = Address.objects.filter(user=request.user)

    if request.method == 'POST':
        address_id = request.POST.get('address')
        if address_id:
            selected_address = get_object_or_404(Address, id=address_id, user=request.user)
            order.shipping_address = selected_address
            order.save()
            return redirect('payment_page', order_id=order.id)

    context = {
        'order': order,
        'addresses': addresses
    }
    return render(request, 'store/select_address.html', context)

@login_required
def payment_page(request, order_id):
    order = get_object_or_404(Order, id=order_id, customer=request.user)
    context = {
        'order': order
    }
    return render(request, 'store/payment_page.html', context)

@login_required
def confirm_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, customer=request.user)

    # Deduct stock logic removed

    order.status = 'PROCESSING'
    order.save()

    # NEW: Create AffiliateSale if order has an affiliate
    if order.affiliate and order.affiliate.is_active:
        try:
            # Avoid duplicate sales for the same order
            if not hasattr(order, 'affiliate_sale'):
                sale = AffiliateSale(
                    affiliate=order.affiliate,
                    order=order,
                    commission_amount=Decimal('0.00') # Placeholder
                )
                sale.commission_amount = sale.calculate_commission()
                sale.save()
        except Exception as e:
            print(f"Affiliate sale tracking error: {e}")

    return redirect('order_successful', order_id=order.id)

@login_required
def order_successful(request, order_id):
    order = get_object_or_404(Order, id=order_id, customer=request.user)
    context = {
        'order': order
    }
    return render(request, 'store/order_successful.html', context)

@login_required
def update_order_status(request, order_id):
    if request.method == 'POST':
        order = get_object_or_404(Order, id=order_id, technician=request.user)
        order.status = 'DELIVERED'
        order.save()
    return redirect('technician_dashboard')

# API Views
class TrendingProductCategoryAPIView(APIView):
    """
    API view to get week's trending categories based on actual item sales.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request, format=None):
        recent_cutoff = timezone.now() - timedelta(days=7)
        top_cats = list(OrderItem.objects.filter(
            order__order_date__gte=recent_cutoff,
            # ensure valid active product
            product__isnull=False,
            product__category__isnull=False,
            product__is_active=True
        ).values(
            'product__category__id', 
            'product__category__name', 
            'product__category__slug'
        ).annotate(
            sales=Sum('quantity')
        ).order_by('-sales')[:10])

        if len(top_cats) < 10:
            # Pad to 10 with general categories if not enough sales
            existing_ids = [c['product__category__id'] for c in top_cats]
            needed = 10 - len(top_cats)
            # Only pad with categories that actually contain active products
            fallback = ProductCategory.objects.filter(products__is_active=True).distinct().exclude(id__in=existing_ids)[:needed]
            for c in fallback:
                top_cats.append({'product__category__id': c.id, 'product__category__name': c.name, 'product__category__slug': c.slug, 'sales': 0})

        data = []
        for c in top_cats:
            cat_id = c['product__category__id']
            # Find the best selling product in this category
            top_prod_in_cat = OrderItem.objects.filter(
                order__order_date__gte=recent_cutoff,
                product__category_id=cat_id,
                product__image__isnull=False
            ).values('product_id').annotate(
                total_qty=Sum('quantity')
            ).order_by('-total_qty').first()
            
            top_img_url = None
            if top_prod_in_cat:
                prod = Product.objects.get(id=top_prod_in_cat['product_id'])
                if hasattr(prod, 'image') and prod.image:
                    top_img_url = request.build_absolute_uri(prod.image.url)

            # If no recent sales with image, fallback to any product in category
            if not top_img_url:
                fb_prod = Product.objects.filter(category_id=cat_id).exclude(image='').first()
                if fb_prod and fb_prod.image:
                    top_img_url = request.build_absolute_uri(fb_prod.image.url)

            data.append({
                'id': cat_id,
                'name': c['product__category__name'],
                'slug': c['product__category__slug'],
                'recent_sales': c['sales'],
                'top_image': top_img_url
            })
            
        return Response({'categories': data})

class ProductCategoryListAPIView(APIView):
    """
    API view to list all product categories.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request, format=None):
        # Only return categories that have at least one active product
        categories = ProductCategory.objects.filter(products__is_active=True).distinct()
        # Simple serialization
        data = [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in categories]
        return Response({'categories': data})

class ProductListAPIView(APIView):
    """
    API view to list all active products.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request, format=None):
        products = Product.objects.filter(is_active=True).select_related('category').prefetch_related('additional_images', 'specifications')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class ProductDetailAPIView(generics.RetrieveAPIView):
    """
    API view to get detailed product information by slug.
    """
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category').prefetch_related('additional_images', 'specifications')

    def get_object(self):
        slug = self.kwargs.get('slug')
        try:
            return self.get_queryset().get(slug=slug)
        except Product.DoesNotExist:
            from django.http import Http404
            raise Http404("Product not found")

class AddressListAPIView(generics.ListAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

class AddressCreateAPIView(generics.CreateAPIView):
    queryset = Address.objects.all()
    serializer_class = AddressCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

class AddressUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = AddressCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        address_id = self.kwargs.get('pk')
        return get_object_or_404(queryset, id=address_id)

class AddressDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        address_id = self.kwargs.get('pk')
        return get_object_or_404(queryset, id=address_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Don't allow deletion of default address if it's the only one
        if instance.is_default:
            user_addresses = Address.objects.filter(user=request.user)
            if user_addresses.count() == 1:
                return Response(
                    {'error': 'Cannot delete the only address'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif user_addresses.count() > 1:
                # Set another address as default before deleting
                next_address = user_addresses.exclude(id=instance.id).first()
                next_address.is_default = True
                next_address.save()

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserOrdersListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        ).select_related(
            'shipping_address', 'technician'
        ).prefetch_related(
            'items__product', 'payments'
        ).order_by('-order_date')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@transaction.atomic
def create_order(request):
    """
    Create a new order from cart/buy-now
    """
    try:
        # Get data from request
        product_slug = request.data.get('product_slug')
        quantity = request.data.get('quantity', 1)
        address_id = request.data.get('address_id')
        affiliate_code = request.data.get('affiliate_code')

        if not all([product_slug, address_id]):
            return Response(
                {'error': 'Product and address are required'},
                status=400
            )

        # Get address
        address = get_object_or_404(Address, id=address_id, user=request.user)

        # Get product with lock to prevent race conditions
        try:
            product = Product.objects.select_for_update().get(slug=product_slug, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # Stock check removed

        # Create order
        affiliate = None
        if affiliate_code:
            try:
                affiliate = Affiliate.objects.get(code=affiliate_code, is_active=True)
            except Affiliate.DoesNotExist:
                pass

        order = Order.objects.create(
            customer=request.user,
            status='PENDING',
            shipping_address=address,
            affiliate=affiliate
        )

        # Create order item
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price=product.price
        )

        # Serialize and return
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=201)

    except Exception as e:
        logger.exception("Error in create_order")
        return Response({'error': 'An unexpected error occurred. Please try again.'}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@transaction.atomic
def create_bulk_order(request):
    """
    Create a single order that aggregates multiple cart items.
    Expected payload: { address_id: number, items: [{ product_slug, quantity }] }
    """
    try:
        address_id = request.data.get('address_id')
        items = request.data.get('items', [])
        affiliate_code = request.data.get('affiliate_code')

        if not address_id or not items:
            return Response({'error': 'Items and address are required'}, status=400)

        # Validate address
        address = get_object_or_404(Address, id=address_id, user=request.user)

        # Validate stock for all items
        validated_items = []
        for raw in items:
            product_slug = raw.get('product_slug')
            quantity = int(raw.get('quantity', 1))
            if not product_slug:
                return Response({'error': 'Each item must include product_slug'}, status=400)

            # Use select_for_update to lock rows during this transaction
            try:
                product = Product.objects.select_for_update().get(slug=product_slug, is_active=True)
            except Product.DoesNotExist:
                return Response({'error': f'Product {product_slug} not found'}, status=404)

            # Stock check removed

            validated_items.append((product, quantity))

        # Create the single order
        affiliate = None
        if affiliate_code:
            try:
                affiliate = Affiliate.objects.get(code=affiliate_code, is_active=True)
            except Affiliate.DoesNotExist:
                pass

        order = Order.objects.create(
            customer=request.user,
            status='PENDING',
            shipping_address=address,
            affiliate=affiliate
        )

        # Create order items
        for product, quantity in validated_items:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price
            )

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=201)

    except Exception as e:
        logger.exception("Error in create_bulk_order")
        return Response({'error': 'An unexpected error occurred. Please try again.'}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, order_id):
    """
    Cancel an order (only if pending/processing)
    """
    try:
        order = get_object_or_404(Order, id=order_id, customer=request.user)

        if order.status not in ['PENDING', 'PROCESSING']:
            return Response(
                {'error': 'Order cannot be cancelled'},
                status=400
            )

        # Stock restore logic removed

        order.status = 'CANCELLED'
        order.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    except Exception as e:
        logger.exception("Error in cancel_order")
        return Response({'error': 'An unexpected error occurred. Please try again.'}, status=500)

@staff_member_required
@require_http_methods(["POST"])
# SECURITY: @csrf_exempt was removed. Staff-only write endpoints MUST enforce
# CSRF to prevent cross-site request forgery from malicious third-party pages.
def delete_product_image(request, image_id):
    try:
        from .models import ProductImage
        image = ProductImage.objects.get(id=image_id)

        # Delete the actual file
        if image.image:
            if os.path.isfile(image.image.path):
                os.remove(image.image.path)

        # Delete the database record
        image.delete()

        return JsonResponse({'success': True})
    except ProductImage.DoesNotExist:
        return JsonResponse({'error': 'Image not found'}, status=404)
    except Exception as e:
        logger.exception("Error deleting product image")
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def delete_product(request, product_id):
    """Delete a product from admin panel"""
    try:
        product = Product.objects.get(id=product_id)
        
        # Delete product images from disk
        if product.image:
            if os.path.isfile(product.image.path):
                os.remove(product.image.path)
        
        # Delete additional images
        for img in product.additional_images.all():
            if img.image and os.path.isfile(img.image.path):
                os.remove(img.image.path)
        
        # Delete the product (cascade will delete related objects)
        product.delete()
        
        return Response({'success': True, 'message': 'Product deleted successfully'}, status=200)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)
    except Exception as e:
        logger.exception("Error in delete_product")
        return Response({'error': 'An unexpected error occurred.'}, status=500)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_assigned_services(request):
    """Get services assigned to technician with job sheet status"""
    if request.user.role != 'TECHNICIAN':
        return Response({'error': 'Unauthorized'}, status=403)

    # Get services with related data including JobSheet via reverse relation
    services = ServiceRequest.objects.filter(
        technician=request.user
    ).select_related(
        'customer',
        'service_category',
        'service_location',
        'issue'
    ).prefetch_related('job_sheet')

    services_data = []
    for service in services:
        has_job_sheet = False
        job_sheet_status = None
        job_sheet_id = None

        try:
            if hasattr(service, 'job_sheet'):
                job_sheet = service.job_sheet
                has_job_sheet = True
                job_sheet_status = job_sheet.approval_status
                job_sheet_id = job_sheet.id
        except Exception:
             pass

        service_data = {
            'id': service.id,
            'customer': {
                'name': service.customer.name,
                'phone': service.customer.phone,
            },
            'service_category': {
                'name': service.service_category.name,
            },
            'issue': {
                'description': service.issue.description
            } if service.issue else None,
            'custom_description': service.custom_description,
            'service_location': {
                'street_address': service.service_location.street_address,
                'city': service.service_location.city,
                'state': service.service_location.state,
                'pincode': service.service_location.pincode,
            },
            'request_date': service.request_date.isoformat(),
            'status': service.status,
            'has_job_sheet': has_job_sheet,
            'job_sheet_status': job_sheet_status,
            'job_sheet_id': job_sheet_id,
        }
        services_data.append(service_data)

    return Response(services_data)


from google import genai as google_genai
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chatbot_query(request):
    """
    Handle queries for the AI Chatbot using the new google.genai SDK.
    Rate-limited to 20 requests per hour per IP for anonymous users.
    """
    # --- Rate Limiting ---
    from django.core.cache import cache
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()
    rate_key = f'chatbot_rate_{ip}'
    request_count = cache.get(rate_key, 0)
    MAX_REQUESTS_PER_HOUR = 20
    if request_count >= MAX_REQUESTS_PER_HOUR:
        return Response(
            {'error': 'Rate limit exceeded. Please try again in an hour.'},
            status=429
        )
    cache.set(rate_key, request_count + 1, timeout=3600)
    # --- End Rate Limiting ---

    try:
        user_message = request.data.get('message')
        history_data = request.data.get('history', [])
        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # 1. Build Store Context — compute a short "key name" for each product
        products = list(Product.objects.filter(is_active=True))

        def get_short_name(full_name):
            # Use text before first comma as the canonical short name
            return full_name.split(',')[0].strip()

        product_map = {}
        for p in products:
            sn = get_short_name(p.name)
            product_map[sn.lower()] = (p, sn)

        store_context = "You are the TechVerse AI Support Assistant for a tech repair and products store.\n\n"
        store_context += "RULES:\n"
        store_context += "- Detect the user's language automatically and reply in that same language (English, Hindi, or Marathi).\n"
        store_context += "- Keep replies SHORT and conversational (1-3 sentences max). Never write long paragraphs.\n"
        store_context += "- DO NOT introduce yourself or say 'Welcome' or 'Namaste' on every message. Just answer directly.\n"
        store_context += "- Remember the conversation history provided below.\n"
        store_context += "- IMPORTANT: When mentioning a product, use its exact Key Name so we can show a product card to the user.\n\n"
        store_context += "INVENTORY (use these exact Key Names when mentioning products):\n"

        # Search filter: only pass the most relevant products to Gemini (saves tokens)
        import re
        words = [w.lower() for w in re.findall(r'\b\w+\b', user_message) if len(w) > 2]
        
        context_products = []
        for p in products:
            score = 0
            if words:
                search_text = f"{p.name} {p.brand or ''} {p.category.name if p.category else ''}".lower()
                score = sum(1 for w in words if w in search_text)
            
            if score > 0:
                context_products.append((score, p))
                
        context_products.sort(key=lambda x: x[0], reverse=True)
        
        # Take Top 8 most relevant, or if no matches, just a random sample of 8 active products
        top_products = [p for score, p in context_products[:8]] if context_products else products[:8]

        for p in top_products:
            sn = get_short_name(p.name)
            store_context += f"- Key Name: \"{sn}\" | Category: {p.category.name if p.category else 'Misc'} | Price: ₹{p.price}"
            if p.brand:
                store_context += f" | Brand: {p.brand}"
            store_context += "\n"

        # 2. Build conversation history string
        history_text = ""
        if history_data:
            history_text = "\nCONVERSATION SO FAR:\n"
            for msg in history_data[-10:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"

        full_prompt = f"{store_context}{history_text}\nUser: {user_message}\nAssistant:"

        # 3. Get API key
        api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))

        if not api_key:
            return Response({'reply': "I'm not fully connected yet — please ask an admin to configure the AI service."})

        # 4. Call Gemini API with new SDK
        client = google_genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt
        )

        reply_text = response.text.strip() if response.text else "Sorry, I couldn't process that. Please try again."

        # 5. Detect products mentioned in the reply using short key names
        mentioned_products = []
        reply_lower = reply_text.lower()
        seen_ids = set()
        for short_name_lower, (p, short_name) in product_map.items():
            if short_name_lower in reply_lower and p.id not in seen_ids:
                seen_ids.add(p.id)
                mentioned_products.append({
                    'id': p.id,
                    'name': short_name,
                    'slug': p.slug,
                    'price': str(p.price),
                    'category': p.category.name if p.category else '',
                    'brand': p.brand or '',
                    'image': request.build_absolute_uri(p.image.url) if p.image else None,
                })

        return Response({'reply': reply_text, 'products': mentioned_products[:3]})

    except Exception as e:
        error_str = str(e)
        if '429' in error_str or 'QUOTA' in error_str.upper() or 'EXHAUSTED' in error_str.upper():
            return Response({'reply': "I'm a bit busy right now due to high traffic. Please try again in a few minutes!"})
        logger.exception("Chatbot error")
        return Response({'error': 'AI service temporarily unavailable.'}, status=500)


class StoreBannerListAPIView(APIView):
    """Public endpoint — returns active store banners ordered by display order."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        banners = StoreBanner.objects.filter(is_active=True).order_by('order')
        serializer = StoreBannerSerializer(banners, many=True)
        return Response(serializer.data)
