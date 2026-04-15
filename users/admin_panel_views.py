# users/admin_panel_views.py
# Complete Admin Panel API — replaces the deleted admin_panel Django app.
# All endpoints are staff-only unless noted.

import json
import os
from decimal import Decimal
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.utils.text import slugify
import uuid

from store.models import Product, ProductCategory, ProductImage, ProductSpecification, Order, OrderItem, StoreBanner
from services.models import ServiceRequest, ServiceCategory, JobSheet, ServiceIssue
from affiliates.models import Affiliate, AffiliateSale

User = get_user_model()


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def staff_required(fn):
    """Decorator: returns 403 JSON if user is not staff."""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        return fn(request, *args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper


def parse_body(request):
    try:
        return json.loads(request.body)
    except Exception:
        return {}


def media_url(request, path):
    if not path:
        return None
    if str(path).startswith('http'):
        return str(path)
    return request.build_absolute_uri(f'/media/{path}')


# ─── AUTH ─────────────────────────────────────────────────────────────────────

@ensure_csrf_cookie
def admin_csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})


@csrf_exempt
@require_http_methods(["POST"])
def admin_login(request):
    data = parse_body(request)
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not email or not password:
        return JsonResponse({'error': 'Email and password are required'}, status=400)
    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({'success': False, 'error': 'Invalid email or password'}, status=401)
    if not user.is_staff:
        return JsonResponse({'success': False, 'error': 'You do not have admin access'}, status=403)
    login(request, user)
    return JsonResponse({'success': True, 'user': {'name': user.name or user.email, 'email': user.email, 'is_staff': user.is_staff}})


def admin_logout(request):
    logout(request)
    return JsonResponse({'success': True})


# ─── STATS / DASHBOARD ────────────────────────────────────────────────────────

@staff_required
def admin_stats(request):
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue = OrderItem.objects.filter(
        order__status='DELIVERED'
    ).aggregate(total=Sum('price'))['total'] or Decimal('0')
    monthly_revenue = OrderItem.objects.filter(
        order__status='DELIVERED',
        order__order_date__gte=month_start
    ).aggregate(total=Sum('price'))['total'] or Decimal('0')

    return JsonResponse({
        'total_products': Product.objects.count(),
        'active_products': Product.objects.filter(is_active=True).count(),
        'total_orders': Order.objects.count(),
        'pending_orders': Order.objects.filter(status='PENDING').count(),
        'total_services': ServiceRequest.objects.count(),
        'total_users': User.objects.count(),
        'total_revenue': str(revenue),
        'monthly_revenue': str(monthly_revenue),
    })


# ─── ANALYTICS ───────────────────────────────────────────────────────────────

@staff_required
def admin_analytics(request):
    days = int(request.GET.get('days', 30))
    since = timezone.now() - timedelta(days=days)

    orders = Order.objects.filter(order_date__gte=since)
    revenue = OrderItem.objects.filter(
        order__in=orders, order__status='DELIVERED'
    ).aggregate(total=Sum('price'))['total'] or Decimal('0')

    # Daily revenue for chart
    daily = []
    for i in range(days):
        day = timezone.now() - timedelta(days=days - 1 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        rev = OrderItem.objects.filter(
            order__status='DELIVERED',
            order__order_date__gte=day_start,
            order__order_date__lt=day_end
        ).aggregate(t=Sum('price'))['t'] or Decimal('0')
        ord_count = Order.objects.filter(order_date__gte=day_start, order_date__lt=day_end).count()
        daily.append({'date': day_start.strftime('%Y-%m-%d'), 'revenue': str(rev), 'orders': ord_count})

    return JsonResponse({
        'total_revenue': str(revenue),
        'total_orders': orders.count(),
        'avg_order_value': str(revenue / orders.count() if orders.count() else 0),
        'total_customers': User.objects.filter(role='CUSTOMER').count(),
        'daily': daily,
    })


# ─── USERS ────────────────────────────────────────────────────────────────────

@staff_required
def admin_users(request):
    qs = User.objects.all().order_by('-date_joined')
    role = request.GET.get('role', '')
    search = request.GET.get('search', '')
    if role:
        qs = qs.filter(role__iexact=role)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))

    data = []
    for u in qs:
        data.append({
            'id': u.id,
            'name': u.name or '',
            'email': u.email,
            'phone': u.phone or '',
            'role': u.role,
            'is_active': u.is_active,
            'is_staff': u.is_staff,
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
        })
    return JsonResponse({'users': data, 'total': len(data)})


@csrf_exempt
@staff_required
def admin_user_create(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    name = request.POST.get('name', '').strip()
    email = request.POST.get('email', '').strip().lower()
    password = request.POST.get('password', '')
    role = request.POST.get('role', 'CUSTOMER')
    phone = request.POST.get('phone', '')
    if not email or not password:
        return JsonResponse({'error': 'Email and password are required'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email already registered'}, status=400)
    is_staff = role == 'ADMIN'
    u = User.objects.create_user(email=email, password=password, name=name, role=role, phone=phone, is_staff=is_staff)
    return JsonResponse({'success': True, 'id': u.id})


@csrf_exempt
@staff_required
def admin_user_edit(request, user_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    u.name = request.POST.get('name', u.name)
    u.phone = request.POST.get('phone', u.phone)
    role = request.POST.get('role', u.role)
    u.role = role
    u.is_staff = role == 'ADMIN'
    is_active = request.POST.get('is_active')
    if is_active is not None:
        u.is_active = is_active in ('true', '1', 'True')
    password = request.POST.get('password', '')
    if password:
        u.set_password(password)
    u.save()
    return JsonResponse({'success': True})


@csrf_exempt
@staff_required
def admin_user_delete(request, user_id):
    try:
        u = User.objects.get(id=user_id)
        if u == request.user:
            return JsonResponse({'error': 'Cannot delete your own account'}, status=400)
        u.delete()
        return JsonResponse({'success': True})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)


# ─── PRODUCTS ─────────────────────────────────────────────────────────────────

def _product_dict(request, p):
    return {
        'id': p.id,
        'name': p.name or '',
        'slug': p.slug or '',
        'category': {'id': p.category_id, 'name': p.category.name} if p.category else None,
        'price': str(p.price) if p.price else '0',
        'brand': p.brand or '',
        'model_number': p.model_number or '',
        'description': p.description or '',
        'image': media_url(request, p.image) if p.image else None,
        'is_active': p.is_active,
        'is_featured': p.is_featured,
        'is_amazon_affiliate': p.is_amazon_affiliate,
        'amazon_affiliate_link': p.amazon_affiliate_link or '',
        'delivery_time_info': p.delivery_time_info or '',
        'warranty_period': p.warranty_period or '',
        'features': p.features or '',
        'weight': str(p.weight) if p.weight else '',
        'dimensions': p.dimensions or '',
        'meta_description': p.meta_description or '',
        'created_at': p.created_at.isoformat(),
        'additional_images': [
            {'id': img.id, 'image': media_url(request, img.image)} for img in p.additional_images.all()
        ],
        'specifications': [
            {'id': s.id, 'name': s.name, 'value': s.value} for s in p.specifications.all()
        ],
    }


@staff_required
def admin_products(request):
    qs = Product.objects.select_related('category').prefetch_related('additional_images', 'specifications').order_by('-created_at')
    cat = request.GET.get('category', '')
    status = request.GET.get('status', '')
    search = request.GET.get('search', '')
    if cat:
        qs = qs.filter(category__name__iexact=cat)
    if status == 'active':
        qs = qs.filter(is_active=True)
    elif status == 'inactive':
        qs = qs.filter(is_active=False)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(brand__icontains=search))

    return JsonResponse({
        'products': [_product_dict(request, p) for p in qs],
        'total': qs.count(),
        'active': qs.filter(is_active=True).count(),
        'featured': qs.filter(is_featured=True).count(),
    })


@staff_required
def admin_product_detail(request, product_id):
    try:
        p = Product.objects.select_related('category').prefetch_related('additional_images', 'specifications').get(id=product_id)
        return JsonResponse(_product_dict(request, p))
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)


@csrf_exempt
@staff_required
def admin_product_create(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    post = request.POST
    cat_id = post.get('category_id') or post.get('category')
    try:
        category = ProductCategory.objects.get(id=cat_id)
    except (ProductCategory.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'Invalid category'}, status=400)

    is_affiliate = post.get('is_amazon_affiliate') in ('true', '1', 'True', True)
    p = Product(
        category=category,
        name=post.get('name', ''),
        description=post.get('description', ''),
        price=post.get('price') or None,
        brand=post.get('brand', ''),
        model_number=post.get('model_number', ''),
        delivery_time_info=post.get('delivery_time_info', 'Delivery within 2-3 days'),
        warranty_period=post.get('warranty_period', '1 Year'),
        features=post.get('features', ''),
        weight=post.get('weight') or None,
        dimensions=post.get('dimensions', ''),
        meta_description=post.get('meta_description', ''),
        is_active=post.get('is_active') in ('true', '1', 'True', True),
        is_featured=post.get('is_featured') in ('true', '1', 'True', True),
        is_amazon_affiliate=is_affiliate,
        amazon_affiliate_link=post.get('amazon_affiliate_link', '') if is_affiliate else '',
    )
    if 'image' in request.FILES:
        p.image = request.FILES['image']
    p.save()

    # Specs
    specs_json = post.get('specifications', '[]')
    try:
        specs = json.loads(specs_json)
        for s in specs:
            if s.get('name') and s.get('value'):
                ProductSpecification.objects.create(product=p, name=s['name'], value=s['value'])
    except Exception:
        pass

    return JsonResponse({'success': True, 'id': p.id, 'slug': p.slug})


@csrf_exempt
@staff_required
def admin_product_edit(request, product_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        p = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    post = request.POST
    cat_id = post.get('category_id') or post.get('category')
    if cat_id:
        try:
            p.category = ProductCategory.objects.get(id=cat_id)
        except ProductCategory.DoesNotExist:
            pass

    for field in ['name', 'description', 'brand', 'model_number', 'delivery_time_info', 'warranty_period', 'features', 'dimensions', 'meta_description', 'amazon_affiliate_link']:
        if field in post:
            setattr(p, field, post[field])
    if 'price' in post and post['price']:
        p.price = post['price']
    if 'weight' in post and post['weight']:
        p.weight = post['weight']
    if 'is_active' in post:
        p.is_active = post['is_active'] in ('true', '1', 'True')
    if 'is_featured' in post:
        p.is_featured = post['is_featured'] in ('true', '1', 'True')
    if 'is_amazon_affiliate' in post:
        p.is_amazon_affiliate = post['is_amazon_affiliate'] in ('true', '1', 'True')
    if 'image' in request.FILES:
        p.image = request.FILES['image']
    p.save()

    specs_json = post.get('specifications')
    if specs_json:
        try:
            specs = json.loads(specs_json)
            p.specifications.all().delete()
            for s in specs:
                if s.get('name') and s.get('value'):
                    ProductSpecification.objects.create(product=p, name=s['name'], value=s['value'])
        except Exception:
            pass

    return JsonResponse({'success': True})


@csrf_exempt
@staff_required
def admin_product_delete(request, product_id):
    try:
        p = Product.objects.get(id=product_id)
        if p.image:
            try:
                if os.path.isfile(p.image.path):
                    os.remove(p.image.path)
            except Exception:
                pass
        for img in p.additional_images.all():
            try:
                if img.image and os.path.isfile(img.image.path):
                    os.remove(img.image.path)
            except Exception:
                pass
        p.delete()
        return JsonResponse({'success': True})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)


# ─── ORDERS ───────────────────────────────────────────────────────────────────

def _order_dict(o):
    items = []
    for item in o.items.all():
        items.append({
            'id': item.id,
            'product_name': item.product.name if item.product else '',
            'quantity': item.quantity,
            'price': str(item.price) if item.price else '0',
            'total': str(item.quantity * item.price) if item.price else '0'
        })
        
    payment = o.payments.order_by('-created_at').first()
    
    return {
        'id': o.id,
        'customer': {'id': o.customer_id, 'name': o.customer.name if o.customer else '', 'email': o.customer.email if o.customer else '', 'phone': getattr(o.customer, 'phone_number', '') if o.customer else ''},
        'technician': {'id': o.technician_id, 'name': o.technician.name if o.technician else ''} if o.technician else None,
        'status': o.status,
        'order_date': o.order_date.isoformat(),
        'delivered_at': o.delivered_at.isoformat() if o.delivered_at else None,
        'total_amount': str(o.total_amount),
        'transaction_id': payment.transaction_id if payment else None,
        'payment_status': payment.status if payment else None,
        'payment_date': payment.created_at.isoformat() if payment else None,
        'shipping_address': (
            f"{o.shipping_address.street_address}, {o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.pincode}"
            if o.shipping_address else None
        ),
        'items': items,
    }


@staff_required
def admin_orders(request):
    qs = Order.objects.select_related('customer', 'technician', 'shipping_address').prefetch_related('items__product', 'payments').order_by('-order_date')
    status = request.GET.get('status', '')
    search = request.GET.get('search', '')
    payment = request.GET.get('payment', 'SUCCESS')
    
    if payment == 'SUCCESS':
        qs = qs.filter(payments__status='SUCCESS').distinct()
    elif payment == 'UNPAID':
        qs = qs.exclude(payments__status='SUCCESS').distinct()
        
    if status:
        qs = qs.filter(status__iexact=status)
    if search:
        qs = qs.filter(Q(customer__name__icontains=search) | Q(customer__email__icontains=search))
        
    # Optional pagination
    return JsonResponse({'orders': [_order_dict(o) for o in qs], 'total': qs.count()})


@staff_required
def admin_order_detail(request, order_id):
    try:
        o = Order.objects.select_related('customer', 'technician', 'shipping_address').prefetch_related('items__product', 'payments').get(id=order_id)
        return JsonResponse({'success': True, 'order': _order_dict(o)})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)


@csrf_exempt
@staff_required
def admin_update_order_status(request):
    data = parse_body(request)
    order_id = data.get('order_id')
    new_status = data.get('status', '').upper()
    valid = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if new_status not in valid:
        return JsonResponse({'error': f'Invalid status. Use one of: {valid}'}, status=400)
    try:
        o = Order.objects.get(id=order_id)
        o.status = new_status
        o.save()
        return JsonResponse({'success': True, 'status': o.status})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)


@csrf_exempt
@staff_required
def admin_assign_technician(request):
    data = parse_body(request)
    order_id = data.get('order_id')
    tech_id = data.get('technician_id')
    try:
        o = Order.objects.get(id=order_id)
        tech = User.objects.get(id=tech_id, role='TECHNICIAN')
        o.technician = tech
        o.save()
        return JsonResponse({'success': True})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Technician not found'}, status=404)


@csrf_exempt
@staff_required
def admin_order_delete(request, order_id):
    try:
        Order.objects.get(id=order_id).delete()
        return JsonResponse({'success': True})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)


# ─── SERVICES ─────────────────────────────────────────────────────────────────

def _service_dict(s):
    payment = s.payments.order_by('-created_at').first()
    amount = '0'
    if s.issue and s.issue.price:
        amount = str(s.issue.price)
    elif s.service_category and s.service_category.custom_request_price:
        amount = str(s.service_category.custom_request_price)
    elif payment:
        amount = str(payment.amount)
        
    return {
        'id': s.id,
        'customer': {'id': s.customer_id, 'name': s.customer.name, 'email': s.customer.email, 'phone': s.customer.phone or ''},
        'technician': {'id': s.technician_id, 'name': s.technician.name} if s.technician else None,
        'service_category': {'id': s.service_category_id, 'name': s.service_category.name} if s.service_category else None,
        'issue': {'description': s.issue.description, 'price': str(s.issue.price)} if s.issue else None,
        'custom_description': s.custom_description or '',
        'total_amount': amount,
        'transaction_id': payment.transaction_id if payment else None,
        'payment_status': payment.status if payment else None,
        'payment_date': payment.created_at.isoformat() if payment else None,
        'service_location': {
            'street_address': s.service_location.street_address,
            'city': s.service_location.city,
            'state': s.service_location.state,
            'pincode': s.service_location.pincode,
        } if s.service_location else None,
        'request_date': s.request_date.isoformat(),
        'status': s.status,
    }


@staff_required
def admin_services(request):
    qs = ServiceRequest.objects.select_related('customer', 'technician', 'service_category', 'issue', 'service_location').prefetch_related('payments').order_by('-request_date')
    status = request.GET.get('status', '')
    search = request.GET.get('search', '')
    payment = request.GET.get('payment', 'SUCCESS')
    
    if payment == 'SUCCESS':
        qs = qs.filter(payments__status='SUCCESS').distinct()
    elif payment == 'UNPAID':
        qs = qs.exclude(payments__status='SUCCESS').distinct()
        
    if status:
        qs = qs.filter(status__iexact=status)
    if search:
        qs = qs.filter(Q(customer__name__icontains=search) | Q(customer__email__icontains=search))
    return JsonResponse({'services': [_service_dict(s) for s in qs], 'total': qs.count()})


@staff_required
def admin_service_detail(request, service_id):
    try:
        s = ServiceRequest.objects.select_related('customer', 'technician', 'service_category', 'issue', 'service_location').prefetch_related('payments').get(id=service_id)
        return JsonResponse({'success': True, 'service': _service_dict(s)})
    except ServiceRequest.DoesNotExist:
        return JsonResponse({'error': 'Service not found'}, status=404)


@csrf_exempt
@staff_required
def admin_update_service_status(request):
    data = parse_body(request)
    service_id = data.get('service_id')
    new_status = data.get('status', '').upper()
    valid = ['SUBMITTED', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if new_status not in valid:
        return JsonResponse({'error': f'Invalid status'}, status=400)
    try:
        s = ServiceRequest.objects.get(id=service_id)
        s.status = new_status
        s.save()
        return JsonResponse({'success': True})
    except ServiceRequest.DoesNotExist:
        return JsonResponse({'error': 'Service not found'}, status=404)


@csrf_exempt
@staff_required
def admin_assign_service_technician(request):
    data = parse_body(request)
    service_id = data.get('service_id')
    tech_id = data.get('technician_id')
    try:
        s = ServiceRequest.objects.get(id=service_id)
        tech = User.objects.get(id=tech_id, role='TECHNICIAN')
        s.technician = tech
        s.status = 'ASSIGNED'
        s.save()
        return JsonResponse({'success': True})
    except ServiceRequest.DoesNotExist:
        return JsonResponse({'error': 'Service not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Technician not found'}, status=404)


# ─── CATEGORIES ───────────────────────────────────────────────────────────────

@staff_required
def admin_categories(request):
    cats = ProductCategory.objects.annotate(product_count=Count('products')).order_by('name')
    scats = ServiceCategory.objects.annotate(
        issues_count=Count('issues', distinct=True),
        service_count=Count('servicerequest', distinct=True)
    ).prefetch_related('issues').order_by('name')

    service_cat_list = []
    for sc in scats:
        service_cat_list.append({
            'id': sc.id,
            'name': sc.name,
            'custom_request_price': str(sc.custom_request_price),
            'issues_count': sc.issues_count,
            'service_count': sc.service_count,
            'issues': [{'id': i.id, 'description': i.description, 'price': str(i.price)} for i in sc.issues.all()]
        })

    return JsonResponse({
        'categories': [{'id': c.id, 'name': c.name, 'slug': c.slug, 'product_count': c.product_count} for c in cats],
        'service_categories': service_cat_list
    })


@csrf_exempt
@staff_required
def admin_category_create(request):
    cat_type = request.POST.get('type', 'product')
    name = request.POST.get('name', '').strip()
    if not name:
        return JsonResponse({'error': 'Name is required'}, status=400)

    if cat_type == 'service':
        if ServiceCategory.objects.filter(name__iexact=name).exists():
            return JsonResponse({'error': 'Service category already exists'}, status=400)
        custom_price = request.POST.get('custom_request_price', '500')
        sc = ServiceCategory.objects.create(name=name, custom_request_price=custom_price)
        
        issue_descs = request.POST.getlist('issue_descriptions[]')
        issue_prices = request.POST.getlist('issue_prices[]')
        for desc, price in zip(issue_descs, issue_prices):
            if desc.strip():
                ServiceIssue.objects.create(category=sc, description=desc.strip(), price=price)
        return JsonResponse({'success': True, 'id': sc.id})
    else:
        slug = request.POST.get('slug') or slugify(name) + '-' + uuid.uuid4().hex[:4]
        if ProductCategory.objects.filter(name__iexact=name).exists():
            return JsonResponse({'error': 'Category already exists'}, status=400)
        c = ProductCategory.objects.create(name=name, slug=slug)
        return JsonResponse({'success': True, 'id': c.id})


@csrf_exempt
@staff_required
def admin_category_edit(request, cat_id):
    cat_type = request.POST.get('type', 'product')
    
    if cat_type == 'service':
        try:
            sc = ServiceCategory.objects.get(id=cat_id)
        except ServiceCategory.DoesNotExist:
            return JsonResponse({'error': 'Service category not found'}, status=404)
        
        name = request.POST.get('name', sc.name).strip()
        sc.name = name
        if 'custom_request_price' in request.POST:
            sc.custom_request_price = request.POST.get('custom_request_price')
        sc.save()

        # Update issues: simply delete existing and recreate from payload
        if 'issue_descriptions[]' in request.POST:
            sc.issues.all().delete()
            issue_descs = request.POST.getlist('issue_descriptions[]')
            issue_prices = request.POST.getlist('issue_prices[]')
            for desc, price in zip(issue_descs, issue_prices):
                if desc.strip():
                    ServiceIssue.objects.create(category=sc, description=desc.strip(), price=price)
                    
        return JsonResponse({'success': True})
    else:
        try:
            c = ProductCategory.objects.get(id=cat_id)
        except ProductCategory.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)
        name = request.POST.get('name', c.name).strip()
        c.name = name
        c.slug = request.POST.get('slug', c.slug) or slugify(name)
        c.save()
        return JsonResponse({'success': True})


@csrf_exempt
@staff_required
def admin_category_delete(request, cat_id):
    data = parse_body(request)
    cat_type = request.POST.get('type') or data.get('type', 'product')
    
    if cat_type == 'service':
        try:
            ServiceCategory.objects.get(id=cat_id).delete()
            return JsonResponse({'success': True})
        except ServiceCategory.DoesNotExist:
            return JsonResponse({'error': 'Service category not found'}, status=404)
    else:
        try:
            ProductCategory.objects.get(id=cat_id).delete()
            return JsonResponse({'success': True})
        except ProductCategory.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)


# ─── BANNERS ──────────────────────────────────────────────────────────────────

def _banner_dict(request, b):
    return {
        'id': b.id,
        'image': media_url(request, b.image) if b.image else None,
        'button_text': b.button_text or '',
        'product': b.product_id,                          # the numeric ID the frontend dropdown needs
        'product_name': b.product.name if b.product else None,
        'external_link': b.external_link or '',
        'order': b.order,
        'is_active': b.is_active,
    }


@csrf_exempt
@staff_required
def admin_banners(request):
    if request.method == 'GET':
        banners = StoreBanner.objects.select_related('product').order_by('order')
        # Include product list so the frontend dropdown is populated
        products = Product.objects.filter(is_active=True).order_by('name').values('id', 'name')
        return JsonResponse({
            'banners': [_banner_dict(request, b) for b in banners],
            'products': list(products),
            'total': banners.count(),
            'active': banners.filter(is_active=True).count(),
            'with_product_link': banners.filter(product__isnull=False).count(),
        })

    action = request.POST.get('action', '')

    if action == 'create':
        b = StoreBanner(
            button_text=request.POST.get('button_text', ''),
            external_link=request.POST.get('external_link', ''),
            order=int(request.POST.get('order', 0)),
            # Accept 'on' (HTML checkbox), 'true', '1', 'True'
            is_active=request.POST.get('is_active', '') in ('on', 'true', '1', 'True'),
        )
        # Frontend sends product as numeric ID
        product_id = request.POST.get('product', '').strip()
        if product_id:
            try:
                b.product = Product.objects.get(id=int(product_id))
            except (Product.DoesNotExist, ValueError):
                pass
        if 'image' in request.FILES:
            b.image = request.FILES['image']
        b.save()
        return JsonResponse({'success': True, 'id': b.id, 'banner': _banner_dict(request, b)})

    if action == 'edit':
        banner_id = request.POST.get('banner_id')
        try:
            b = StoreBanner.objects.get(id=banner_id)
        except StoreBanner.DoesNotExist:
            return JsonResponse({'error': 'Banner not found'}, status=404)
        b.button_text = request.POST.get('button_text', b.button_text)
        b.external_link = request.POST.get('external_link', b.external_link)
        if 'order' in request.POST:
            b.order = int(request.POST['order'])
        if 'is_active' in request.POST:
            # Accept 'on' (HTML checkbox), 'true', '1', 'True'
            b.is_active = request.POST['is_active'] in ('on', 'true', '1', 'True')
        # Frontend sends product as numeric ID
        product_id = request.POST.get('product', '').strip()
        if product_id:
            try:
                b.product = Product.objects.get(id=int(product_id))
            except (Product.DoesNotExist, ValueError):
                b.product = None
        elif 'product' in request.POST:  # explicitly cleared to empty string
            b.product = None
        if 'image' in request.FILES:
            b.image = request.FILES['image']
        b.save()
        return JsonResponse({'success': True, 'banner': _banner_dict(request, b)})

    if action == 'delete':
        banner_id = request.POST.get('banner_id')
        try:
            b = StoreBanner.objects.get(id=banner_id)
            if b.image:
                try:
                    if os.path.isfile(b.image.path):
                        os.remove(b.image.path)
                except Exception:
                    pass
            b.delete()
            return JsonResponse({'success': True})
        except StoreBanner.DoesNotExist:
            return JsonResponse({'error': 'Banner not found'}, status=404)

    return JsonResponse({'error': 'Invalid action'}, status=400)


# ─── AFFILIATES ───────────────────────────────────────────────────────────────

def _affiliate_dict(a):
    total_sales = a.sales.count()
    total_revenue = a.sales.aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')
    total_clicks = a.clicks.count()
    return {
        'id': a.id,
        'user': {'id': a.user_id, 'name': a.user.name, 'email': a.user.email},
        'code': a.code,
        'commission_rate': str(a.commission_rate),
        'is_active': a.is_active,
        'created_at': a.created_at.isoformat(),
        'total_sales': total_sales,
        'total_revenue': str(total_revenue),
        'total_clicks': total_clicks,
    }


@staff_required
def admin_affiliates(request):
    affs = Affiliate.objects.select_related('user').prefetch_related('sales', 'clicks').order_by('-created_at')
    return JsonResponse({'affiliates': [_affiliate_dict(a) for a in affs]})


@csrf_exempt
@staff_required
def admin_affiliate_create(request):
    email = request.POST.get('email', '').strip().lower()
    code = request.POST.get('code', '').strip()
    commission_rate = request.POST.get('commission_rate', '5.00')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found with that email'}, status=404)
    if Affiliate.objects.filter(user=user).exists():
        return JsonResponse({'error': 'This user already has an affiliate profile'}, status=400)
    if not code:
        code = slugify(user.name or user.email.split('@')[0]) + '-' + uuid.uuid4().hex[:4]
    a = Affiliate.objects.create(user=user, code=code, commission_rate=commission_rate)
    user.role = 'AFFILIATE'
    user.save(update_fields=['role'])
    return JsonResponse({'success': True, 'id': a.id})


@staff_required
def admin_affiliate_detail(request, aff_id):
    try:
        a = Affiliate.objects.select_related('user').prefetch_related('sales', 'clicks').get(id=aff_id)
        return JsonResponse(_affiliate_dict(a))
    except Affiliate.DoesNotExist:
        return JsonResponse({'error': 'Affiliate not found'}, status=404)


@csrf_exempt
@staff_required
def admin_affiliate_update(request, aff_id):
    try:
        a = Affiliate.objects.get(id=aff_id)
    except Affiliate.DoesNotExist:
        return JsonResponse({'error': 'Affiliate not found'}, status=404)
    data = parse_body(request)
    if 'commission_rate' in data:
        a.commission_rate = data['commission_rate']
    if 'is_active' in data:
        a.is_active = data['is_active']
    if 'code' in data:
        a.code = data['code']
    a.save()
    return JsonResponse({'success': True})


# ─── JOB SHEETS ───────────────────────────────────────────────────────────────

def _jobsheet_dict(j):
    return {
        'id': j.id,
        'service_request_id': j.service_request_id,
        'customer_name': j.customer_name,
        'customer_contact': j.customer_contact,
        'equipment_type': j.equipment_type,
        'problem_description': j.problem_description,
        'work_performed': j.work_performed,
        'approval_status': j.approval_status,
        'date_of_service': j.date_of_service.isoformat() if j.date_of_service else None,
        'created_at': j.created_at.isoformat(),
    }


@staff_required
def admin_job_sheets(request):
    sheets = JobSheet.objects.select_related('service_request').order_by('-created_at')
    return JsonResponse({'job_sheets': [_jobsheet_dict(j) for j in sheets]})


@staff_required
def admin_job_sheet_detail(request, sheet_id):
    try:
        j = JobSheet.objects.get(id=sheet_id)
        return JsonResponse(_jobsheet_dict(j))
    except JobSheet.DoesNotExist:
        return JsonResponse({'error': 'Job sheet not found'}, status=404)


@csrf_exempt
@staff_required
def admin_job_sheet_delete(request, sheet_id):
    try:
        JobSheet.objects.get(id=sheet_id).delete()
        return JsonResponse({'success': True})
    except JobSheet.DoesNotExist:
        return JsonResponse({'error': 'Job sheet not found'}, status=404)


# ─── SETTINGS ─────────────────────────────────────────────────────────────────

@csrf_exempt
@staff_required
def admin_settings(request):
    # Settings are just acknowledged — store in session or a simple model if needed
    if request.method == 'POST':
        return JsonResponse({'success': True})
    return JsonResponse({'settings': {}})
