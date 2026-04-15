# users/serializers.py
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from allauth.account.adapter import get_adapter
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    # Tells the frontend if this user can login with email+password.
    # Returns False for Google-only users who haven't set a password yet.
    has_password = serializers.SerializerMethodField()

    def get_has_password(self, user):
        return user.has_usable_password()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'name', 'phone', 'role', 'email_notifications', 'sms_notifications', 'has_password']
        read_only_fields = ['id', 'email', 'role', 'has_password']

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['name', 'phone', 'email_notifications', 'sms_notifications']

class CustomRegisterSerializer(RegisterSerializer):
    # Explicitly disable username to avoid "username is required" errors
    username = None
    name = serializers.CharField(required=True, write_only=True)

    def get_cleaned_data(self):
        # Start with the default cleaned data (email, password1, password2, etc.)
        data = super().get_cleaned_data()
        # Remove username if present in upstream defaults
        data.pop('username', None)
        # Merge our custom field(s)
        data.update({
            'name': self.validated_data.get('name', ''),
        })
        return data

    # Guard in case upstream tries validating username
    def validate_username(self, username):
        return username

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        adapter.save_user(request, user, self)
        # Ensure our custom fields are persisted
        self.custom_signup(request, user)
        return user

    def custom_signup(self, request, user):
        # Persist custom fields (name, default role)
        user.name = self.validated_data.get('name', '')
        # Ensure default role is CUSTOMER for self-registrations
        try:
            # Access Role enum if available; otherwise set string
            from .models import CustomUser
            user.role = getattr(CustomUser.Role, 'CUSTOMER', 'CUSTOMER')
        except Exception:
            user.role = 'CUSTOMER'
        user.save()