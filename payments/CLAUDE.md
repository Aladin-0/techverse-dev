# Folder purpose
Contains Django views and models abstracting payment gateway logic, specifically integrating with the PhonePe V2 API for tracking transactions and handling callbacks.

# Subfolder map
- migrations — Database schema changes

# Main files
- admin.py — Expose payment records to Django administration interface
- models.py — Database schema covering transaction statuses, payment IDs, and order linking
- serializers.py — Payment API payload conversion into JSON
- urls.py — Route definitions to process checkout and gateway callbacks
- views.py — Gateway execution handling such as initiation and signature verification
