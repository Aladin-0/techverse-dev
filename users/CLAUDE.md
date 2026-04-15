# Folder purpose
Powers authentication operations natively overriding Django's default mechanisms. Governs role-assignments (Customers, Technicians, AMC users, Admins) and integrates third-party Google OAuth logic.

# Subfolder map
- management — Command-line scripts for mass-creating or testing users
- migrations — Relational schema defining the custom user base

# Main files
- adapter.py — Controls specific flows inside the Google OAuth interaction pipeline
- admin.py — Handles role and permission mapping in the administration dashboard
- admin_views.py — Dedicated logic extending the admin panel's user manipulation endpoints
- forms.py — Server-side validations targeting custom account requirements
- google_callback.py — Endpoint handling the return trip from a successful Google authorization
- google_login_view.py — Endpoint that initiates the OAuth journey
- models.py — The customized abstract base class mapping emails instead of usernames and storing role definitions
- serializers.py — Provides clean JSON representations of accounts, ensuring safe token issuance
- urls.py — Endpoints focused on login, registration, and refresh operations
- views.py — Auth workflows orchestrating standard token returns
