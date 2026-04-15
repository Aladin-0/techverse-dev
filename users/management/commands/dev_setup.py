"""
Management command: dev_setup

Run automatically on startup in development to ensure the database has the
required `Site` record with localhost domain. This fixes allauth's site-based
OAuth lookups in environments with a fresh database.

Usage: python manage.py dev_setup
"""

from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Set up development environment (Site domain, SocialApp credentials)"

    def handle(self, *args, **options):
        self._fix_site()
        self.stdout.write(self.style.SUCCESS("✅  dev_setup complete"))

    def _fix_site(self):
        """Ensure Site #1 uses localhost so allauth OAuth works in dev."""
        from django.contrib.sites.models import Site

        domain = "localhost:8000" if settings.DEBUG else "techverseservices.in"
        name = "Techverse Dev" if settings.DEBUG else "Techverse"

        site, created = Site.objects.update_or_create(
            id=settings.SITE_ID,
            defaults={"domain": domain, "name": name},
        )
        action = "Created" if created else "Updated"
        self.stdout.write(f"  {action} Site → {site.domain}")
