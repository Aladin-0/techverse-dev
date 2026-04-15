"""
Management command: seed_services

Creates 10 realistic service categories with multiple issues and prices.

Usage: python manage.py seed_services
       python manage.py seed_services --clear
"""

from django.core.management.base import BaseCommand
from services.models import ServiceCategory, ServiceIssue


SERVICE_DATA = [
    {
        "name": "Laptop Repair",
        "issues": [
            ("Screen Replacement", "3500.00"),
            ("Keyboard Replacement", "1200.00"),
            ("Battery Replacement", "1500.00"),
            ("Motherboard Repair", "4500.00"),
            ("Charging Port Repair", "800.00"),
            ("Cooling Fan Replacement", "900.00"),
            ("RAM / Storage Upgrade", "600.00"),
            ("OS Installation & Setup", "500.00"),
        ],
    },
    {
        "name": "Desktop / PC Repair",
        "issues": [
            ("Full System Diagnosis", "299.00"),
            ("Motherboard Replacement", "5000.00"),
            ("PSU Replacement", "1200.00"),
            ("GPU Installation / Replacement", "600.00"),
            ("OS Reinstallation", "500.00"),
            ("Virus & Malware Removal", "400.00"),
            ("RAM / Storage Upgrade", "400.00"),
            ("CPU Thermal Paste Replacement", "350.00"),
        ],
    },
    {
        "name": "Smartphone Repair",
        "issues": [
            ("Screen Replacement", "1500.00"),
            ("Battery Replacement", "700.00"),
            ("Charging Port Repair", "500.00"),
            ("Back Panel Replacement", "600.00"),
            ("Speaker / Microphone Repair", "450.00"),
            ("Camera Module Replacement", "900.00"),
            ("Water Damage Treatment", "1200.00"),
            ("Software / OS Repair", "350.00"),
        ],
    },
    {
        "name": "TV & Display Repair",
        "issues": [
            ("Panel Replacement", "8000.00"),
            ("Backlight Repair", "2500.00"),
            ("HDMI Port Repair", "600.00"),
            ("Power Board Replacement", "1500.00"),
            ("Remote Programming", "200.00"),
            ("Smart TV Software Reset", "300.00"),
            ("Speaker Repair", "700.00"),
            ("Stand / Mount Repair", "400.00"),
        ],
    },
    {
        "name": "Printer & Scanner Repair",
        "issues": [
            ("Print Head Cleaning & Alignment", "400.00"),
            ("Paper Feed Roller Replacement", "600.00"),
            ("Ink Cartridge System Repair", "500.00"),
            ("Driver Installation & Setup", "300.00"),
            ("Network / Wi-Fi Setup", "350.00"),
            ("Scanner Glass Replacement", "800.00"),
            ("Fuser Unit Replacement", "1500.00"),
            ("Full Service & Cleaning", "700.00"),
        ],
    },
    {
        "name": "Networking & Wi-Fi Setup",
        "issues": [
            ("Router Installation & Configuration", "499.00"),
            ("Wi-Fi Extender Setup", "349.00"),
            ("Network Troubleshooting", "399.00"),
            ("LAN Cable Wiring (per point)", "250.00"),
            ("Firewall & Security Configuration", "800.00"),
            ("Network Speed Optimization", "399.00"),
            ("VPN Setup", "500.00"),
            ("CCTV Network Integration", "1200.00"),
        ],
    },
    {
        "name": "Data Recovery",
        "issues": [
            ("Hard Disk Data Recovery", "3000.00"),
            ("SSD Data Recovery", "4000.00"),
            ("SD Card / USB Recovery", "1500.00"),
            ("RAID Recovery", "8000.00"),
            ("Deleted File Recovery", "1000.00"),
            ("Corrupted Partition Recovery", "2000.00"),
            ("Encrypted Drive Recovery", "5000.00"),
            ("Formatted Drive Recovery", "2500.00"),
        ],
    },
    {
        "name": "CCTV & Security Systems",
        "issues": [
            ("Camera Installation (per camera)", "500.00"),
            ("DVR / NVR Setup", "800.00"),
            ("Remote Access Configuration", "400.00"),
            ("Cable Wiring (per point)", "200.00"),
            ("Camera Replacement", "600.00"),
            ("System Upgrade", "1500.00"),
            ("Maintenance & Health Check", "700.00"),
            ("Motion Detection Setup", "350.00"),
        ],
    },
    {
        "name": "Smart Home & IoT Setup",
        "issues": [
            ("Smart Bulb & Switch Installation", "350.00"),
            ("Smart Speaker / Hub Setup", "400.00"),
            ("Smart TV Casting Setup", "250.00"),
            ("Automation Workflow Configuration", "700.00"),
            ("Smart Doorbell Installation", "500.00"),
            ("Voice Assistant Integration", "400.00"),
            ("Smart AC / Thermostat Setup", "600.00"),
            ("Full Smart Home Audit & Setup", "2500.00"),
        ],
    },
    {
        "name": "Software & IT Support",
        "issues": [
            ("Windows / macOS Installation", "500.00"),
            ("Driver Update & Optimization", "300.00"),
            ("Microsoft Office Setup", "400.00"),
            ("Antivirus Installation & Setup", "350.00"),
            ("Data Backup & Migration", "600.00"),
            ("Email Configuration", "300.00"),
            ("Remote IT Support (per hour)", "400.00"),
            ("Corporate Software Deployment", "1500.00"),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed 10 service categories with realistic repair issues and prices"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove existing service data before re-seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            ServiceIssue.objects.all().delete()
            ServiceCategory.objects.all().delete()
            self.stdout.write("  Cleared existing service data")

        total_categories = 0
        total_issues = 0

        for svc_data in SERVICE_DATA:
            cat, cat_created = ServiceCategory.objects.get_or_create(
                name=svc_data["name"]
            )
            if cat_created:
                total_categories += 1
                self.stdout.write(f"  ✅ Created category: {cat.name}")
            else:
                self.stdout.write(f"  Already exists: {cat.name}")

            for description, price in svc_data["issues"]:
                issue, issue_created = ServiceIssue.objects.get_or_create(
                    category=cat,
                    description=description,
                    defaults={"price": price},
                )
                if issue_created:
                    total_issues += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Seed complete! {total_categories} categories + {total_issues} service issues created."
            )
        )
