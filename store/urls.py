# store/urls.py - Updated with technician API endpoints and delete product

from django.urls import path
from . import views
from .technician_views import (
    TechnicianAssignedOrdersView,
    TechnicianAssignedServicesView,
    TechnicianStatsView,
    CompleteOrderView,
    CompleteServiceView
)

urlpatterns = [
    # Existing store URLs
    path('', views.product_list, name='product_list'),
    path('product/<slug:slug>/', views.product_detail, name='product_detail'),
    path('buy-now/<slug:slug>/', views.buy_now, name='buy_now'),
    path('select-address/<int:order_id>/', views.select_address, name='select_address'),
    path('payment/<int:order_id>/', views.payment_page, name='payment_page'),
    path('confirm-order/<int:order_id>/', views.confirm_order, name='confirm_order'),
    path('order-successful/<int:order_id>/', views.order_successful, name='order_successful'),
    path('update-order-status/<int:order_id>/', views.update_order_status, name='update_order_status'),

    # API endpoints
    path('api/categories/trending/', views.TrendingProductCategoryAPIView.as_view(), name='api_trending_categories'),
    path('api/categories/', views.ProductCategoryListAPIView.as_view(), name='api_product_category_list'),
    path('api/products/', views.ProductListAPIView.as_view(), name='api_product_list'),
    path('api/products/<slug:slug>/', views.ProductDetailAPIView.as_view(), name='api_product_detail'),
    path('api/addresses/', views.AddressListAPIView.as_view(), name='api_address_list'),
    path('api/addresses/create/', views.AddressCreateAPIView.as_view(), name='api_address_create'),
    path('api/addresses/<int:pk>/update/', views.AddressUpdateAPIView.as_view(), name='api_address_update'),
    path('api/addresses/<int:pk>/delete/', views.AddressDeleteAPIView.as_view(), name='api_address_delete'),

    # Order API endpoints
    path('api/orders/', views.UserOrdersListView.as_view(), name='api_orders_list'),
    path('api/orders/<int:pk>/', views.OrderDetailView.as_view(), name='api_order_detail'),
    path('api/orders/create/', views.create_order, name='api_create_order'),
    path('api/orders/create-bulk/', views.create_bulk_order, name='api_create_bulk_order'),
    path('api/orders/<int:order_id>/cancel/', views.cancel_order, name='api_cancel_order'),

    # Chatbot API endpoint
    path('api/chat/', views.chatbot_query, name='api_chatbot_query'),

    # Technician API endpoints
    path('api/technician/assigned-orders/', TechnicianAssignedOrdersView.as_view(), name='api_technician_orders'),
    path('api/technician/assigned-services/', TechnicianAssignedServicesView.as_view(), name='api_technician_services'),
    path('api/technician/stats/', TechnicianStatsView.as_view(), name='api_technician_stats'),
    path('api/technician/complete-order/<int:order_id>/', CompleteOrderView.as_view(), name='api_complete_order'),
    path('api/technician/complete-service/<int:service_id>/', CompleteServiceView.as_view(), name='api_complete_service'),

    # Admin endpoints
    path('admin/delete-product-image/<int:image_id>/', views.delete_product_image, name='delete_product_image'),
    path('admin-panel/products/<int:product_id>/delete/', views.delete_product, name='delete_product'),

    # Store Banners
    path('api/banners/', views.StoreBannerListAPIView.as_view(), name='api_banner_list'),
]
