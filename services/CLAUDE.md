# Folder purpose
Powers the service lifecycle ranging from booking AMC/general repairs to managing technician tasks and job sheets. Connects customers to technicians through auto or manual assignment workflows.

# Subfolder map
- management — Contains custom management scripts, like populating dummy service data
- migrations — Database schema changes over time

# Main files
- admin.py — Maps service models (Categories, Issues, Tickets) for site administrators
- models.py — Schema outlining Service Requests, Job Sheets, Materials usage, and Technician reviews
- serializers.py — Transforms service data logic for REST API consumption
- technician_views.py — Distinct views strictly for technician job interaction
- urls.py — Maps routing entries between API endpoints and dispatch views
- views.py — General handlers accommodating customer creation of services and tracking
