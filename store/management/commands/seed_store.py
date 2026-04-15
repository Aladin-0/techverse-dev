"""
Management command: seed_store

Creates 5 test product categories and 5 test products with images and specs.

Usage: python manage.py seed_store
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from store.models import ProductCategory, Product, ProductSpecification


CATEGORIES = [
    {"name": "Laptops & Computers", "slug": "laptops-computers"},
    {"name": "Audio & Headphones", "slug": "audio-headphones"},
    {"name": "Smartphones & Tablets", "slug": "smartphones-tablets"},
    {"name": "Monitors & Displays", "slug": "monitors-displays"},
    {"name": "Keyboards & Peripherals", "slug": "keyboards-peripherals"},
]

PRODUCTS = [
    {
        "category_slug": "laptops-computers",
        "name": "Samsung Galaxy Book Pro 360",
        "slug": "samsung-galaxy-book-pro-360",
        "description": (
            "The Samsung Galaxy Book Pro 360 is an ultra-slim 2-in-1 laptop that delivers "
            "stunning performance and versatility. With its Intel Core i7 processor, brilliant "
            "AMOLED touchscreen, and S Pen support, this laptop is perfect for professionals "
            "and creatives who demand the best. The lightweight design and all-day battery life "
            "make it the ideal companion for work and play on the go."
        ),
        "price": "89999.00",
        "image": "products/laptop.png",
        "delivery_time_info": "Delivered within 3-5 business days",
        "brand": "Samsung",
        "model_number": "NP950QED-KA2IN",
        "weight": "1.04",
        "dimensions": "30.4 x 20.2 x 1.12 cm",
        "warranty_period": "1 Year",
        "features": "Intel Core i7-1260P,16GB LPDDR5 RAM,512GB NVMe SSD,13.3-inch Super AMOLED Display,S Pen Included,Windows 11 Home,30W Fast Charging",
        "meta_description": "Buy Samsung Galaxy Book Pro 360 ultrabook with Intel Core i7, AMOLED display, and S Pen support.",
        "is_featured": True,
        "specs": [
            ("Processor", "Intel Core i7-1260P (12th Gen)"),
            ("RAM", "16 GB LPDDR5"),
            ("Storage", "512 GB NVMe SSD"),
            ("Display", "13.3-inch Super AMOLED, 1920x1080, 60Hz"),
            ("Battery", "63Wh, up to 21 hours"),
            ("OS", "Windows 11 Home"),
            ("Ports", "2x Thunderbolt 4, USB-A 3.2, MicroSD, 3.5mm Jack"),
            ("Connectivity", "Wi-Fi 6E, Bluetooth 5.1"),
        ],
    },
    {
        "category_slug": "audio-headphones",
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "slug": "sony-wh-1000xm5",
        "description": (
            "The Sony WH-1000XM5 redefines noise cancellation with eight microphones and "
            "two processors for the most advanced noise cancellation ever, so you can focus "
            "on what matters. With up to 30-hour battery life and quick charging, crystal-clear "
            "hands-free calling, and optimized sound for music, these headphones set a new "
            "standard for premium listening experience."
        ),
        "price": "29990.00",
        "image": "products/headphones.png",
        "delivery_time_info": "Delivered within 2-3 business days",
        "brand": "Sony",
        "model_number": "WH-1000XM5/B",
        "weight": "0.25",
        "dimensions": "26.5 x 19.3 x 7.3 cm",
        "warranty_period": "1 Year",
        "features": "Industry-leading Active Noise Cancellation,30-Hour Battery Life,Multipoint Connection (2 devices),360 Reality Audio,Quick Charge (3 min = 3 hours),USB-C Charging,Built-in Alexa & Google Assistant",
        "meta_description": "Sony WH-1000XM5 wireless headphones with industry-leading noise cancellation and 30-hour battery life.",
        "is_featured": True,
        "specs": [
            ("Driver Unit", "30mm, dome type"),
            ("Frequency Response", "4 Hz – 40,000 Hz"),
            ("Noise Cancellation", "Dual Processor (V1 + QN1)"),
            ("Microphones", "8 microphones"),
            ("Battery Life", "30 hours (NC on), 40 hours (NC off)"),
            ("Charging", "USB-C, 3 min quick charge = 3 hours playtime"),
            ("Connectivity", "Bluetooth 5.2, NFC"),
            ("Codec Support", "LDAC, AAC, SBC"),
        ],
    },
    {
        "category_slug": "smartphones-tablets",
        "name": "Samsung Galaxy S24 Ultra",
        "slug": "samsung-galaxy-s24-ultra",
        "description": (
            "The Samsung Galaxy S24 Ultra is the pinnacle of smartphone engineering. "
            "Featuring the world's first 200MP camera system on a smartphone, a built-in "
            "titanium S Pen for precise writing and creativity, and the Snapdragon 8 Gen 3 "
            "processor for blazing-fast performance. The massive 5000mAh battery ensures "
            "you stay powered all day. With Galaxy AI features, your smartphone experience "
            "is smarter than ever."
        ),
        "price": "134999.00",
        "image": "products/smartphone.png",
        "delivery_time_info": "Delivered within 2-4 business days",
        "brand": "Samsung",
        "model_number": "SM-S928BZKGINS",
        "weight": "0.232",
        "dimensions": "16.28 x 7.92 x 0.86 cm",
        "warranty_period": "1 Year",
        "features": "200MP Quad-Camera System,Built-in Titanium S Pen,Snapdragon 8 Gen 3,6.8-inch Dynamic AMOLED 2X Display,5000mAh Battery,45W Fast Charging,Galaxy AI Features,IP68 Water Resistance",
        "meta_description": "Samsung Galaxy S24 Ultra with 200MP camera, S Pen, and Snapdragon 8 Gen 3 processor.",
        "is_featured": True,
        "specs": [
            ("Processor", "Snapdragon 8 Gen 3 for Galaxy"),
            ("RAM", "12 GB"),
            ("Storage", "256 GB / 512 GB / 1 TB"),
            ("Display", "6.8-inch Dynamic AMOLED 2X, 3088x1440, 120Hz"),
            ("Main Camera", "200MP (OIS) + 12MP Ultra-wide + 10MP telephoto (3x) + 50MP telephoto (5x)"),
            ("Battery", "5000 mAh, 45W wired + 15W wireless"),
            ("OS", "Android 14, One UI 6.1"),
            ("IP Rating", "IP68 (2m for 30 min)"),
        ],
    },
    {
        "category_slug": "monitors-displays",
        "name": "Samsung Odyssey G7 32\" 4K Gaming Monitor",
        "slug": "samsung-odyssey-g7-32-4k",
        "description": (
            "The Samsung Odyssey G7 32-inch 4K Gaming Monitor delivers breathtaking visuals "
            "with a 144Hz refresh rate and 1ms GTG response time. The 1000R curved display "
            "wraps your field of view for a truly immersive gaming experience. HDR600 "
            "certification ensures stunning highlights and deep blacks, while FreeSync Premium "
            "Pro technology eliminates screen tearing for the smoothest gameplay possible."
        ),
        "price": "64999.00",
        "image": "products/monitor.png",
        "delivery_time_info": "Delivered within 5-7 business days",
        "brand": "Samsung",
        "model_number": "LC32G75TQSWXXL",
        "weight": "6.3",
        "dimensions": "71.4 x 50.1 x 32.0 cm",
        "warranty_period": "3 Years",
        "features": "32-inch 4K (3840x2160) VA Panel,144Hz Refresh Rate,1ms GTG Response Time,1000R Curved Display,HDR600 Certified,AMD FreeSync Premium Pro,RGB Infinity Core Lighting,2x HDMI 2.0 + 1x DisplayPort 1.4",
        "meta_description": "Samsung Odyssey G7 32-inch 4K 144Hz curved gaming monitor with HDR600 and FreeSync Premium Pro.",
        "is_featured": False,
        "specs": [
            ("Panel Type", "VA (Vertical Alignment)"),
            ("Resolution", "3840 x 2160 (4K UHD)"),
            ("Refresh Rate", "144 Hz"),
            ("Response Time", "1 ms (GTG)"),
            ("Curvature", "1000R"),
            ("HDR", "HDR600"),
            ("Ports", "2x HDMI 2.0, 1x DisplayPort 1.4, 2x USB 3.0 Hub"),
            ("Sync Technology", "AMD FreeSync Premium Pro"),
        ],
    },
    {
        "category_slug": "keyboards-peripherals",
        "name": "Redragon K556 RGB Mechanical Gaming Keyboard",
        "slug": "redragon-k556-rgb-mechanical",
        "description": (
            "The Redragon K556 is a premium TKL mechanical gaming keyboard built for serious "
            "gamers. Featuring Redragon Outemu Red switches for ultra-smooth linear keystrokes "
            "and tactile feedback, this keyboard offers 16.8 million color RGB backlighting with "
            "customizable lighting effects. The full aluminum construction ensures durability, "
            "while the ergonomic design with detachable wrist rest reduces fatigue during "
            "long gaming sessions."
        ),
        "price": "3999.00",
        "image": "products/keyboard.png",
        "delivery_time_info": "Delivered within 1-3 business days",
        "brand": "Redragon",
        "model_number": "K556-RGB",
        "weight": "0.98",
        "dimensions": "36.2 x 13.5 x 3.7 cm",
        "warranty_period": "2 Years",
        "features": "Outemu Red Mechanical Switches,TKL (Tenkeyless) Layout,16.8M RGB Per-Key Lighting,Full Aluminum Top Frame,N-Key Rollover Anti-Ghosting,Detachable Ergonomic Wrist Rest,USB Gold-Plated Connector,Windows/Mac Compatible",
        "meta_description": "Redragon K556 TKL RGB mechanical gaming keyboard with Outemu Red switches and aluminum frame.",
        "is_featured": False,
        "specs": [
            ("Switch Type", "Outemu Red (Linear)"),
            ("Layout", "TKL (87 keys)"),
            ("Backlighting", "16.8M RGB Per-Key"),
            ("Anti-Ghosting", "N-Key Rollover (full)"),
            ("Construction", "Full Aluminum Top Frame"),
            ("Cable", "1.8m Braided USB-A"),
            ("Supported OS", "Windows 7/8/10/11, macOS"),
            ("Polling Rate", "1000 Hz"),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed 5 demo categories and 5 demo products with images and specs"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove existing seeded data before re-seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            Product.objects.all().delete()
            ProductCategory.objects.all().delete()
            self.stdout.write("  Cleared existing data")

        # Create categories
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = ProductCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"]},
            )
            action = "Created" if created else "Already exists"
            self.stdout.write(f"  {action} category: {cat.name}")
            cat_map[cat_data["slug"]] = cat

        # Create products
        for prod_data in PRODUCTS:
            specs = prod_data.pop("specs")
            cat = cat_map[prod_data.pop("category_slug")]

            prod, created = Product.objects.get_or_create(
                slug=prod_data["slug"],
                defaults={**prod_data, "category": cat},
            )

            if created:
                # Add specifications
                for order, (name, value) in enumerate(specs):
                    ProductSpecification.objects.get_or_create(
                        product=prod,
                        name=name,
                        defaults={"value": value, "order": order},
                    )
                self.stdout.write(self.style.SUCCESS(f"  ✅ Created product: {prod.name}"))
            else:
                self.stdout.write(f"  Already exists: {prod.name}")

        self.stdout.write(self.style.SUCCESS("\n✅ Seed complete! 5 categories + 5 products created."))
