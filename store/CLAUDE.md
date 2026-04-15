# Folder purpose
Contains models and view representations for the main e-commerce capabilities including categorizing products, tracking orders, and handling shipping addresses.

# Subfolder map
- management — Included scripts commonly used to seed fake products or store data
- migrations — Schema representations of product updates
- templates — Supplemental HTML pages specifically for the store

# Main files
- admin.py — Controls the visibility of products and orders in the Django admin site
- amazon_scraper.py — Script for pulling tech product info/prices from external listings
- forms.py — Server-side form validation relating to e-commerce inputs
- models.py — Essential definitions for Products, Categories, Specifications, Orders, and Items
- serializers.py — Transforms e-commerce objects to JSON for the frontend
- urls.py — Route URLs pointing to API product and order workflows
- views.py — Endpoints powering cart and catalog operations
