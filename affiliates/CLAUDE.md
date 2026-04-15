# Folder purpose
Contains Django models and views that power the affiliate marketing tracking and workflows for the platform.

# Subfolder map
- migrations — Database schema changes

# Main files
- admin.py — Registers affiliate models in the Django admin interface
- apps.py — Django application configuration file
- models.py — Database models defining affiliate users, codes, or earnings
- serializers.py — Data serialization logic converting affiliate records to and from JSON
- urls.py — Maps URLs to the affiliate view handlers
- views.py — Request handlers driving affiliate workflows
