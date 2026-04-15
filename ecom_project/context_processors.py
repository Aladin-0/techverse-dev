from django.conf import settings

def frontend_url(request):
    """
    Return the frontend base URL from settings to all templates.
    """
    return {
        'frontend_url': settings.FRONTEND_BASE_URL
    }
