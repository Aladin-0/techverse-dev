# services/views.py - Complete file with rating functions

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import ServiceCategory, ServiceRequest, TechnicianRating
from .forms import ServiceRequestForm, RatingForm
from store.models import Order
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from .serializers import ServiceCategorySerializer, ServiceRequestSerializer, ServiceRequestHistorySerializer
from .models import JobSheet, JobSheetMaterial
from .serializers import JobSheetSerializer, JobSheetDetailSerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q

@login_required
def select_service_category(request):
    categories = ServiceCategory.objects.all()
    return render(request, 'services/select_category.html', {'categories': categories})

@login_required
def create_service_request(request, category_id):
    category = get_object_or_404(ServiceCategory, id=category_id)

    if request.method == 'POST':
        form = ServiceRequestForm(request.POST, user=request.user, category=category)
        if form.is_valid():
            service_request = form.save(commit=False)
            service_request.customer = request.user
            service_request.service_category = category
            service_request.save()

            # Check if this service is free for this AMC user
            if request.user.role == 'AMC' and request.user.has_free_service(category):
                # Service is free for this AMC user - skip payment
                service_request.status = 'SUBMITTED'
                service_request.save()
                return redirect('request_successful')
            elif request.user.role == 'AMC':
                # AMC user but this specific service is not free
                return redirect('service_payment_page', request_id=service_request.id)
            else:
                # Regular customer - go to payment page
                return redirect('service_payment_page', request_id=service_request.id)
    else:
        form = ServiceRequestForm(user=request.user, category=category)

    # Pass information about whether this service is free for this user
    is_free_for_user = (
        request.user.role == 'AMC' and 
        request.user.has_free_service(category)
    )

    return render(request, 'services/create_request.html', {
        'form': form, 
        'category': category,
        'is_free_for_user': is_free_for_user
    })

@login_required
def request_successful(request):
    return render(request, 'services/request_successful.html')

@login_required
def service_payment_page(request, request_id):
    service_request = get_object_or_404(ServiceRequest, id=request_id, customer=request.user)
    fee = 500
    context = {
        'service_request': service_request,
        'fee': fee,
    }
    return render(request, 'services/service_payment_page.html', context)

@login_required
def confirm_service_request(request, request_id):
    service_request = get_object_or_404(ServiceRequest, id=request_id, customer=request.user)
    service_request.status = 'SUBMITTED'
    service_request.save()
    return redirect('request_successful')

@login_required
def rate_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, customer=request.user)
    if order.status != 'DELIVERED' or not order.technician:
        return redirect('my_orders')

    if request.method == 'POST':
        form = RatingForm(request.POST)
        if form.is_valid():
            rating = form.save(commit=False)
            rating.customer = request.user
            rating.technician = order.technician
            rating.order = order
            rating.save()
            return redirect('my_orders')
    else:
        form = RatingForm()

    context = {
        'form': form,
        'order': order
    }
    return render(request, 'services/rate_technician.html', context)

@login_required
def update_service_status(request, request_id):
    if request.method == 'POST':
        service_request = get_object_or_404(ServiceRequest, id=request_id, technician=request.user)
        
        # Check if job sheet exists and is approved
        if hasattr(service_request, 'job_sheet'):
            job_sheet = service_request.job_sheet
            if job_sheet.approval_status != 'APPROVED':
                # Return error message
                from django.contrib import messages
                messages.error(request, 'Cannot complete service. Job sheet must be approved by customer first.')
                return redirect('technician_dashboard')
        else:
            # No job sheet created yet
            from django.contrib import messages
            messages.error(request, 'Cannot complete service. Please create a job sheet first.')
            return redirect('technician_dashboard')
        
        # If job sheet is approved, allow completion
        service_request.status = 'COMPLETED'
        service_request.save()
        
    return redirect('technician_dashboard')

# API Views
class ServiceCategoryListAPIView(APIView):
    """
    API view to list all service categories and their nested issues.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, format=None):
        categories = ServiceCategory.objects.all()
        serializer = ServiceCategorySerializer(
            categories, 
            many=True,
            context={'request': request}  # Pass request context
        )
        return Response(serializer.data)

class ServiceRequestCreateAPIView(generics.CreateAPIView):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class ServiceRequestHistoryAPIView(generics.ListAPIView):
    """
    API view to list the current user's service requests (history).
    Includes technician info and whether the request can be rated.
    """
    serializer_class = ServiceRequestHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db import models
        return ServiceRequest.objects.filter(
            customer=self.request.user
        ).filter(
            models.Q(payments__status='SUCCESS') | 
            ~models.Q(status='SUBMITTED')
        ).prefetch_related('payments').distinct().order_by('-request_date')

# Rating API Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_rating(request):
    """
    Create a rating for a technician based on order or service request
    """
    try:
        data = request.data
        rating_value = data.get('rating')
        comment = data.get('comment', '')
        order_id = data.get('order_id')
        service_request_id = data.get('service_request_id')
        

        
        # Validation
        if not rating_value or rating_value not in [1, 2, 3, 4, 5]:
            return Response(
                {'error': 'Valid rating (1-5) is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not order_id and not service_request_id:
            return Response(
                {'error': 'Either order_id or service_request_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order_id and service_request_id:
            return Response(
                {'error': 'Cannot rate both order and service request at the same time'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle order rating
        if order_id:
            try:
                order = Order.objects.get(id=order_id, customer=request.user)
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Order not found or you do not have permission to rate it'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not order.technician:
                return Response(
                    {'error': 'No technician assigned to this order'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if order.status != 'DELIVERED':
                return Response(
                    {'error': 'Can only rate delivered orders'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already rated
            if TechnicianRating.objects.filter(order=order, customer=request.user).exists():
                return Response(
                    {'error': 'You have already rated this order'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create rating
            rating = TechnicianRating.objects.create(
                technician=order.technician,
                customer=request.user,
                order=order,
                rating=rating_value,
                comment=comment
            )
            

            
            return Response({
                'message': 'Rating submitted successfully',
                'rating': {
                    'id': rating.id,
                    'rating': rating.rating,
                    'comment': rating.comment,
                    'technician_name': rating.technician.name,
                    'created_at': rating.created_at
                }
            }, status=status.HTTP_201_CREATED)
        
        # Handle service request rating
        if service_request_id:
            try:
                service_request = ServiceRequest.objects.get(
                    id=service_request_id, 
                    customer=request.user
                )
            except ServiceRequest.DoesNotExist:
                return Response(
                    {'error': 'Service request not found or you do not have permission to rate it'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not service_request.technician:
                return Response(
                    {'error': 'No technician assigned to this service request'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if service_request.status != 'COMPLETED':
                return Response(
                    {'error': 'Can only rate completed service requests'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already rated
            if TechnicianRating.objects.filter(
                service_request=service_request, 
                customer=request.user
            ).exists():
                return Response(
                    {'error': 'You have already rated this service request'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create rating
            rating = TechnicianRating.objects.create(
                technician=service_request.technician,
                customer=request.user,
                service_request=service_request,
                rating=rating_value,
                comment=comment
            )
            

            
            return Response({
                'message': 'Rating submitted successfully',
                'rating': {
                    'id': rating.id,
                    'rating': rating.rating,
                    'comment': rating.comment,
                    'technician_name': rating.technician.name,
                    'created_at': rating.created_at
                }
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_ratings(request):
    """
    Get all ratings submitted by the current user
    """
    try:
        ratings = TechnicianRating.objects.filter(customer=request.user).order_by('-created_at')
        
        ratings_data = []
        for rating in ratings:
            rating_data = {
                'id': rating.id,
                'rating': rating.rating,
                'comment': rating.comment,
                'technician_name': rating.technician.name,
                'created_at': rating.created_at,
                'type': 'order' if rating.order else 'service',
            }
            
            if rating.order:
                rating_data['order_id'] = rating.order.id
                rating_data['order_total'] = str(rating.order.total_amount)
            
            if rating.service_request:
                rating_data['service_request_id'] = rating.service_request.id
                rating_data['service_category'] = rating.service_request.service_category.name
            
            ratings_data.append(rating_data)
        
        return Response({
            'ratings': ratings_data,
            'count': len(ratings_data)
        })
        
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def test_rating_endpoint(request):
    """
    Test endpoint to check if rating API is working
    """
    if request.method == 'GET':
        return Response({
            'message': 'Rating endpoint is working!',
            'user': request.user.email,
            'user_id': request.user.id,
            'is_authenticated': request.user.is_authenticated,
        })
    
    if request.method == 'POST':
        return Response({
            'message': 'POST request received',
            'data': request.data,
            'user': request.user.email,
        })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_job_sheet(request):
    """
    Create a job sheet for a service request (Technician only)
    """
    try:
        # Check if user is a technician
        if request.user.role != 'TECHNICIAN':
            return Response(
                {'error': 'Only technicians can create job sheets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        service_request_id = data.get('service_request_id')
        
        # Get service request
        try:
            service_request = ServiceRequest.objects.get(
                id=service_request_id,
                technician=request.user
            )
        except ServiceRequest.DoesNotExist:
            return Response(
                {'error': 'Service request not found or not assigned to you'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if job sheet already exists
        if hasattr(service_request, 'job_sheet'):
            return Response(
                {'error': 'Job sheet already exists for this service request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare job sheet data
        job_sheet_data = {
            'service_request': service_request.id,
            'customer_name': data.get('customer_name', service_request.customer.name),
            'customer_contact': data.get('customer_contact', service_request.customer.phone),
            'service_address': data.get('service_address', str(service_request.service_location)),
            'equipment_type': data.get('equipment_type'),
            'serial_number': data.get('serial_number', ''),
            'equipment_brand': data.get('equipment_brand', ''),
            'equipment_model': data.get('equipment_model', ''),
            'problem_description': data.get('problem_description'),
            'work_performed': data.get('work_performed'),
            'date_of_service': data.get('date_of_service'),
            'start_time': data.get('start_time'),
            'finish_time': data.get('finish_time'),
            'materials': data.get('materials', [])
        }
        
        serializer = JobSheetSerializer(data=job_sheet_data)
        
        if serializer.is_valid():
            job_sheet = serializer.save(created_by=request.user)
            
            return Response(
                {
                    'message': 'Job sheet created successfully',
                    'job_sheet': JobSheetDetailSerializer(job_sheet).data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_job_sheets(request):
    """
    Get job sheets based on user role
    - Technician: Their created job sheets
    - Customer: Job sheets for their service requests
    """
    try:
        if request.user.role == 'TECHNICIAN':
            job_sheets = JobSheet.objects.filter(created_by=request.user).select_related(
                'service_request', 'service_request__customer', 'service_request__service_category'
            ).prefetch_related('materials')
        
        else:
            job_sheets = JobSheet.objects.filter(
                service_request__customer=request.user
            ).select_related(
                'service_request', 'created_by', 'service_request__service_category'
            ).prefetch_related('materials')
        
        serializer = JobSheetDetailSerializer(job_sheets, many=True)
        return Response(serializer.data)
        
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_job_sheet_detail(request, job_sheet_id):
    """
    Get detailed job sheet information
    """
    try:
        # Get job sheet with related data
        job_sheet = JobSheet.objects.select_related(
            'service_request',
            'service_request__customer',
            'service_request__service_category',
            'created_by'
        ).prefetch_related('materials').get(id=job_sheet_id)
        
        # Check permissions
        if request.user.role == 'TECHNICIAN':
            if job_sheet.created_by != request.user:
                return Response(
                    {'error': 'Not authorized to view this job sheet'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            if job_sheet.service_request.customer != request.user:
                return Response(
                    {'error': 'Not authorized to view this job sheet'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = JobSheetDetailSerializer(job_sheet)
        return Response(serializer.data)
        
    except JobSheet.DoesNotExist:
        return Response(
            {'error': 'Job sheet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_job_sheet(request, job_sheet_id):
    """
    Customer approves a job sheet
    """
    try:
        job_sheet = JobSheet.objects.select_related('service_request').get(id=job_sheet_id)
        
        # Check if customer owns this service request
        if job_sheet.service_request.customer != request.user:
            return Response(
                {'error': 'Not authorized to approve this job sheet'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already approved or declined
        if job_sheet.approval_status != 'PENDING':
            return Response(
                {'error': f'Job sheet already {job_sheet.approval_status.lower()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve job sheet
        job_sheet.approval_status = 'APPROVED'
        job_sheet.approved_at = timezone.now()
        job_sheet.save()
        
        return Response(
            {
                'message': 'Job sheet approved successfully',
                'job_sheet': JobSheetDetailSerializer(job_sheet).data
            },
            status=status.HTTP_200_OK
        )
        
    except JobSheet.DoesNotExist:
        return Response(
            {'error': 'Job sheet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def decline_job_sheet(request, job_sheet_id):
    """
    Customer declines a job sheet with reason
    """
    try:
        job_sheet = JobSheet.objects.select_related('service_request').get(id=job_sheet_id)
        
        # Check if customer owns this service request
        if job_sheet.service_request.customer != request.user:
            return Response(
                {'error': 'Not authorized to decline this job sheet'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already approved or declined
        if job_sheet.approval_status != 'PENDING':
            return Response(
                {'error': f'Job sheet already {job_sheet.approval_status.lower()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get decline reason
        reason = request.data.get('reason', 'No reason provided')
        
        # Decline job sheet
        job_sheet.approval_status = 'DECLINED'
        job_sheet.declined_reason = reason
        job_sheet.save()
        
        return Response(
            {
                'message': 'Job sheet declined',
                'job_sheet': JobSheetDetailSerializer(job_sheet).data
            },
            status=status.HTTP_200_OK
        )
        
    except JobSheet.DoesNotExist:
        return Response(
            {'error': 'Job sheet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def complete_service_request(request, service_id):
    """
    Technician completes a service request
    Only allowed if job sheet is approved
    """
    try:
        # Check if user is technician
        if request.user.role != 'TECHNICIAN':
            return Response(
                {'error': 'Only technicians can complete service requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get service request
        service_request = get_object_or_404(
            ServiceRequest,
            id=service_id,
            technician=request.user
        )
        
        # Check if job sheet exists
        if not hasattr(service_request, 'job_sheet'):
            return Response(
                {'error': 'Cannot complete service. Please create a job sheet first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job_sheet = service_request.job_sheet
        
        # Check if job sheet is approved
        if job_sheet.approval_status == 'PENDING':
            return Response(
                {'error': 'Cannot complete service. Job sheet is pending customer approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif job_sheet.approval_status == 'DECLINED':
            return Response(
                {'error': 'Cannot complete service. Job sheet was declined by customer.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif job_sheet.approval_status != 'APPROVED':
            return Response(
                {'error': 'Cannot complete service. Invalid job sheet status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Job sheet is approved - allow completion
        service_request.status = 'COMPLETED'
        service_request.save()
        
        return Response(
            {'message': 'Service completed successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:

        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Added Custom Trending Analytics Endpoint
class TrendingServiceCategoriesAPIView(APIView):
    """
    API view to list Top 5 Trending Service Categories of the week.
    Fallback to all-time Top 5 if no bookings in the last 7 days.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        one_week_ago = timezone.now() - timedelta(days=7)
        
        # Get top 5 from the past 7 days based on real ServiceRequests counts
        trending_categories = ServiceCategory.objects.annotate(
            weekly_requests=Count('servicerequest', filter=Q(servicerequest__request_date__gte=one_week_ago))
        ).filter(weekly_requests__gt=0).order_by('-weekly_requests')[:5]

        # Fallback if no bookings this week at all
        if not trending_categories.exists():
            trending_categories = ServiceCategory.objects.annotate(
                all_time_requests=Count('servicerequest')
            ).order_by('-all_time_requests')[:5]
            
            # If the database is completely empty just take the first 5 categories
            if not trending_categories.exists():
                trending_categories = ServiceCategory.objects.all()[:5]

        serializer = ServiceCategorySerializer(
            trending_categories, 
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
