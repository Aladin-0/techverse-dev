import json
import requests
import uuid
import time
import logging
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from .models import PaymentTransaction
from store.models import Order
from services.models import ServiceRequest
import os

logger = logging.getLogger(__name__)

# ─── Credentials (V2 API uses Client ID, Client Version, Client Secret) ───────
PHONEPE_CLIENT_ID = os.environ.get('PHONEPE_CLIENT_ID', '')
PHONEPE_CLIENT_SECRET = os.environ.get('PHONEPE_CLIENT_SECRET', '')
PHONEPE_CLIENT_VERSION = os.environ.get('PHONEPE_CLIENT_VERSION', '1')
PHONEPE_ENV = os.environ.get('PHONEPE_ENV', 'UAT')

if PHONEPE_ENV == 'PROD':
    PHONEPE_BASE_URL = 'https://api.phonepe.com/apis/pg'
    PHONEPE_AUTH_URL = 'https://api.phonepe.com/apis/identity-manager'
else:
    # UAT/Sandbox environment
    PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
    PHONEPE_AUTH_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'

# Endpoint paths (same for PROD and UAT)
TOKEN_PATH = '/v1/oauth/token'
PAY_PATH = '/checkout/v2/pay'
ORDER_STATUS_PATH = '/checkout/v2/order/{merchant_order_id}/status'

TOKEN_CACHE_KEY = 'phonepe_access_token'

# ─── Step 1: Get OAuth Token (cached until near expiry) ───────────────────────
def get_access_token():
    """Get a valid PhonePe V2 OAuth access token. Caches until near expiry."""
    cached = cache.get(TOKEN_CACHE_KEY)
    if cached:
        return cached

    url = f'{PHONEPE_AUTH_URL}{TOKEN_PATH}'
    data = {
        'client_id': PHONEPE_CLIENT_ID,
        'client_version': PHONEPE_CLIENT_VERSION,
        'client_secret': PHONEPE_CLIENT_SECRET,
        'grant_type': 'client_credentials',
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(url, data=data, headers=headers)
    if not response.ok:
        raise Exception(f'PhonePe token error {response.status_code}: {response.text}')
    token_data = response.json()

    access_token = token_data['access_token']
    expires_at = token_data.get('expires_at', 0)
    # Cache with 60 second buffer before actual expiry
    ttl = max(int(expires_at) - int(time.time()) - 60, 60)
    cache.set(TOKEN_CACHE_KEY, access_token, ttl)
    return access_token


# ─── Step 2: Create Payment Order ─────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    try:
        user = request.user
        order_id = request.data.get('order_id')
        service_request_id = request.data.get('service_request_id')

        if not order_id and not service_request_id:
            return Response({'error': 'Either order_id or service_request_id is required'}, status=400)

        amount = 0
        order = None
        service_request = None

        if order_id:
            order = Order.objects.get(id=order_id, customer=user)
            if order.status != 'PENDING':
                return Response({'error': 'Order is not in pending state'}, status=400)
            amount = float(order.total_amount)
        elif service_request_id:
            service_request = ServiceRequest.objects.get(id=service_request_id, customer=user)
            amount = 500.00

        # Create PaymentTransaction record
        merchant_order_id = f'ORD-{uuid.uuid4().hex[:16].upper()}'
        payment = PaymentTransaction.objects.create(
            user=user,
            transaction_id=merchant_order_id,
            amount=amount,
            order=order,
            service_request=service_request
        )

        # Amount in paise (multiply by 100)
        phonepe_amount = int(amount * 100)

        # Frontend redirect URL after payment
        frontend_base = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')
        redirect_url = f'{frontend_base}/payment-redirect/{merchant_order_id}'

        # Get OAuth token
        access_token = get_access_token()

        # Build PhonePe V2 Payment Request
        payload = {
            'merchantOrderId': merchant_order_id,
            'amount': phonepe_amount,
            'paymentFlow': {
                'type': 'PG_CHECKOUT',
                'message': 'Complete your payment',
                'merchantUrls': {
                    'redirectUrl': redirect_url,
                }
            }
        }

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'O-Bearer {access_token}',
        }

        url = f'{PHONEPE_BASE_URL}{PAY_PATH}'
        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code == 200 and response_data.get('redirectUrl'):
            pay_url = response_data['redirectUrl']
            payment.response_code = response_data.get('state', '')
            payment.save()
            return Response({'redirect_url': pay_url, 'transaction_id': merchant_order_id})
        else:
            payment.status = 'FAILED'
            payment.response_message = json.dumps(response_data)
            payment.save()
            return Response(
                {'error': 'Failed to initiate payment with gateway', 'details': response_data},
                status=400
            )

    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except ServiceRequest.DoesNotExist:
        return Response({'error': 'Service request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ─── Step 3: Verify Payment / Webhook Callback ────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def payment_callback(request):
    """
    Handles both the PhonePe Server-to-Server webhook and the status check
    after customer redirection.
    """
    from rest_framework.exceptions import ParseError, UnsupportedMediaType
    try:
        # Safely access request.data — malformed content-types (XML, plain text) raise ParseError or UnsupportedMediaType
        try:
            data = request.data
        except (ParseError, UnsupportedMediaType):
            return Response({'error': 'Invalid request body format'}, status=400)

        # Sanitize inputs — strip null bytes and control characters that can crash DB queries
        def sanitize(value):
            if not isinstance(value, str):
                return value
            return ''.join(c for c in value if c.isprintable() and c != '\x00')

        merchant_order_id = sanitize(data.get('merchantOrderId') or data.get('transactionId', '')) or None

        if not merchant_order_id:
            # Webhook: PhonePe V2 sends event in body
            event = sanitize(data.get('event', ''))
            payload = data.get('payload', {})
            if not isinstance(payload, dict):
                return Response({'error': 'Invalid payload format'}, status=400)
            merchant_order_id = sanitize(payload.get('merchantOrderId', '')) or None

            if not merchant_order_id:
                return Response({'error': 'No merchant order ID found'}, status=400)

            # Process webhook event - Never trust the payload state directly!
            # Instead, we just use it as a trigger to run the authenticated verification check.
            try:
                payment = PaymentTransaction.objects.get(transaction_id=merchant_order_id)
                if payment.status in ['SUCCESS', 'FAILED']:
                    return Response({'status': 'Already processed'})

                # Verify securely using PhonePe Status API
                verify_payment_status(merchant_order_id)

                payment.refresh_from_db()
                return Response({'status': 'Received and Verified', 'payment_status': payment.status})
            except PaymentTransaction.DoesNotExist:
                return Response({'error': 'Transaction not found'}, status=404)

        # Triggered by frontend after redirect — verify via Order Status API
        return verify_payment_status(merchant_order_id)

    except Exception as e:
        logger.exception(f'payment_callback error: {e}')
        return Response({'error': 'Internal error'}, status=500)


def verify_payment_status(merchant_order_id):
    """Check payment status via PhonePe V2 Order Status API."""
    try:
        # ─── DB-level lock: prevents race conditions on concurrent callbacks ────
        with transaction.atomic():
            try:
                payment = PaymentTransaction.objects.select_for_update().get(
                    transaction_id=merchant_order_id
                )
            except PaymentTransaction.DoesNotExist:
                return Response({'error': 'Transaction not found'}, status=404)

            # Short-circuit if already in terminal state (idempotency)
            if payment.status in ['SUCCESS', 'FAILED']:
                return Response({'status': payment.status})

            access_token = get_access_token()
            url = f"{PHONEPE_BASE_URL}{ORDER_STATUS_PATH.format(merchant_order_id=merchant_order_id)}"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'O-Bearer {access_token}',
            }

            response = requests.get(url, headers=headers)
            response_data = response.json()

            # Always read from PhonePe server — never from incoming payload
            state = response_data.get('state', '')
            paid_amount_paise = response_data.get('amount', 0)

            payment.response_code = state
            payment.response_message = json.dumps(response_data)

            if state == 'COMPLETED':
                # Security: Exact amount validation against DB record
                # IMPORTANT: Use Decimal arithmetic to avoid IEEE 754 floating-point errors
                # e.g. int(100.10 * 100) = 10009 (wrong), but round(100.10, 2) * 100 = 10010 (correct)
                db_amount_decimal = Decimal(str(payment.amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                expected_amount_paise = int(db_amount_decimal * 100)
                if int(paid_amount_paise) == expected_amount_paise:
                    payment.status = 'SUCCESS'
                    payment.save()
                    _fulfill_payment(payment)
                else:
                    payment.status = 'FAILED'
                    payment.response_code = 'AMOUNT_MISMATCH'
                    payment.response_message = (
                        f'Amount mismatch: Expected {expected_amount_paise} paise, '
                        f'got {paid_amount_paise} paise'
                    )
                    payment.save()
                    logger.warning(
                        f'PAYMENT MISMATCH: {merchant_order_id} '
                        f'expected {expected_amount_paise} got {paid_amount_paise}'
                    )
            elif state in ['FAILED', 'FAILED_COMPLETED']:
                payment.status = 'FAILED'
                payment.save()
            else:
                # PENDING or unknown state — don't change status yet
                payment.save()

        return Response({'status': payment.status, 'state': state})

    except Exception as e:
        logger.exception(f'Error verifying payment {merchant_order_id}: {e}')
        return Response({'error': str(e)}, status=500)


def _fulfill_payment(payment):
    """Fulfill the order or service request after a successful payment."""
    if payment.order:
        payment.order.status = 'PROCESSING'
        payment.order.save()
    elif payment.service_request:
        payment.service_request.status = 'CONFIRMED'
        payment.service_request.save()
