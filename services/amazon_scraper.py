import requests
from bs4 import BeautifulSoup
import re
from decimal import Decimal
from django.core.files.base import ContentFile
import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

def fetch_amazon_details(url):
    """
    Fetches product details from an Amazon URL.
    Returns a dict with: title, price, description, images (list of URLs), brand.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch Amazon URL {url}: {e}")
        return None

    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Check for CAPTCHA
    if "captcha" in response.text.lower() and "type the characters you see in this image" in response.text.lower():
        logger.error("Amazon returned a CAPTCHA page.")
        return None

    details = {
        'title': '',
        'price': None,
        'description': '',
        'images': [],
        'brand': '',
        'features': []
    }

    # Title
    title_span = soup.find('span', id='productTitle')
    if title_span:
        details['title'] = title_span.get_text(strip=True)

    # Price
    # Amazon has many price classes depending on formatting
    price_span = soup.find('span', class_='a-price-whole')
    price_fraction = soup.find('span', class_='a-price-fraction')
    
    if price_span:
        price_text = price_span.get_text(strip=True).replace(',', '').replace('.', '')
        if price_fraction:
            price_text += '.' + price_fraction.get_text(strip=True)
        try:
            details['price'] = Decimal(price_text)
        except:
            pass
    
    if not details['price']:
        # Alternative price spot
        price_string = soup.find('span', id='priceblock_ourprice') or soup.find('span', id='priceblock_dealprice')
        if price_string:
            p_text = price_string.get_text(strip=True).replace(',', '')
            match = re.search(r'([\d.]+)', p_text)
            if match:
                try:
                    details['price'] = Decimal(match.group(1))
                except:
                    pass

    # Features / Bullet points
    feature_bullets = soup.find('div', id='feature-bullets')
    if feature_bullets:
        bullets = feature_bullets.find_all('li', class_='a-spacing-mini')
        for bullet in bullets:
            text = bullet.get_text(strip=True)
            if text:
                details['features'].append(text)
        
        details['description'] = '\n'.join(details['features'])

    # Specifications
    specs = {}
    
    # 1. Top short summary table
    tables = soup.find_all('table', class_='a-normal a-spacing-micro')
    for table in tables:
        for tr in table.find_all('tr'):
            tds = tr.find_all('td')
            if len(tds) == 2:
                key = tds[0].get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                val = tds[1].get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                specs[key] = val

    # 2. Lower technical specifications and product info tables
    tech_tables = soup.find_all('table', id=lambda x: x and x.startswith('productDetails_techSpec_section_'))
    for tech_table in tech_tables:
        for tr in tech_table.find_all('tr'):
            th = tr.find('th')
            td = tr.find('td')
            if th and td:
                key = th.get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                val = td.get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                specs[key] = val

    # 3. Product Information tables (prodDetTable)
    prod_tables = soup.find_all('table', class_='prodDetTable')
    for prod_table in prod_tables:
        for tr in prod_table.find_all('tr'):
            th = tr.find('th')
            td = tr.find('td')
            if th and td:
                key = th.get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                val = td.get_text(strip=True).replace('\u200f', '').replace('\u200e', '')
                specs[key] = val

    # 4. Detail bullets (like ASIN, Item Weight, outside of tables)
    detail_bullets = soup.find('div', id='detailBullets_feature_div')
    if detail_bullets:
        for span in detail_bullets.find_all('span', class_='a-list-item'):
            texts = [t.string for t in span.children if t.name == 'span' and t.string]
            if texts and len(texts) >= 2:
                key = texts[0].strip().replace('\u200f', '').replace('\u200e', '').replace(':', '')
                val = texts[1].strip()
                if key and val:
                    specs[key] = val

    # 5. Fallback info array `#productDetails_db_sections`
    info_table = soup.select_one('#productDetails_db_sections table')
    if info_table:
        for tr in info_table.find_all('tr'):
            th = tr.find('th')
            td = tr.find('td')
            if th and td:
                specs[th.get_text(strip=True)] = td.get_text(strip=True)

    details['specs'] = specs

    # Brand
    brand_a = soup.find('a', id='bylineInfo')
    if brand_a:
        brand_text = brand_a.get_text(strip=True)
        if brand_text.lower().startswith('visit the '):
            brand_text = brand_text[10:].replace(' Store', '').strip()
        elif brand_text.lower().startswith('brand: '):
            brand_text = brand_text[7:].strip()
        details['brand'] = brand_text

    # Images (up to 5)
    # Amazon stores high-res images in a JS variable string "colorImages" or similar
    script_tags = soup.find_all('script')
    images = []
    for script in script_tags:
        if script.string and 'ImageBlockATF' in script.string:
            match = re.search(r"\'colorImages\':\s*(\{.*?\})", script.string)
            if match:
                try:
                    data = json.loads(match.group(1))
                    main_images = data.get('initial', [])
                    for img in main_images:
                        # Extract the high-res URL
                        large_url = img.get('large') or img.get('hiRes') or (img.get('main') and list(img.get('main').keys())[0])
                        if large_url and large_url not in images:
                            images.append(large_url)
                except:
                    pass
            break
            
    if not images:
        # Fallback to image gallery div
        img_tags = soup.select('div#altImages img')
        for img in img_tags:
            src = img.get('src')
            if src:
                # convert thumbnail to high-res by removing the sizing segment (e.g., ._AC_US40_.jpg -> .jpg)
                high_res = re.sub(r'\._.+?_\.', '.', src)
                if high_res not in images and not src.endswith('play-button.png'):
                    images.append(high_res)

    # Ensure no videos, keep max 5
    filtered_images = [img for img in images if not img.endswith('.mp4') and 'video' not in img.lower() and 'play-icon' not in img.lower()]
    details['images'] = filtered_images[:5]

    return details

def populate_product_from_amazon(product_instance):
    """
    Given a Product instance with an amazon_affiliate_link,
    fetches the data and populates empty fields. Download images and associate.
    """
    if not product_instance.amazon_affiliate_link:
        return

    details = fetch_amazon_details(product_instance.amazon_affiliate_link)
    if not details:
        return

    # Update simple fields if empty or if they are the temporary placeholders
    if (not product_instance.name or product_instance.name == 'Temp Name') and details['title']:
        # Truncate title if too long
        title = details['title'][:250]
        product_instance.name = title
        
        # Regenerate slug if it's 'temp-name' or empty
        from django.utils.text import slugify
        import uuid
        if not product_instance.slug or product_instance.slug.startswith('temp-name'):
            base_slug = slugify(product_instance.name)[:200]
            product_instance.slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        
    if not product_instance.price and details['price']:
        product_instance.price = details['price']
    elif product_instance.price is None:
        product_instance.price = Decimal('0.00')
        
    if (not product_instance.description or product_instance.description == 'Temp Description') and details['description']:
        product_instance.description = details['description']
        
    if not product_instance.brand and details['brand']:
        product_instance.brand = details['brand'][:100]
        
    if not product_instance.features and details['features']:
        product_instance.features = ', '.join(details['features'])

    # Save to get an ID before saving images
    product_instance.save()

    # Save specifications
    specs = details.get('specs', {})
    if specs:
        from store.models import ProductSpecification
        # Clear existing specs to avoid duplicates if this is an update
        ProductSpecification.objects.filter(product=product_instance).delete()
        
        spec_objs = []
        for i, (key, value) in enumerate(specs.items()):
            k = str(key).strip()[:100]
            v = str(value).strip()[:255]
            if k and v:
                spec_objs.append(ProductSpecification(
                    product=product_instance,
                    name=k,
                    value=v,
                    order=i
                ))
        if spec_objs:
            ProductSpecification.objects.bulk_create(spec_objs)

    # Download images
    images = details['images']
    if images:
        headers = {'User-Agent': 'Mozilla/5.0'}
        for i, img_url in enumerate(images):
            try:
                req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    img_data = response.read()
                    
                filename = f"amazon_img_{product_instance.id}_{i}.jpg"
                
                if i == 0 and not product_instance.image:
                    # Save as main image
                    product_instance.image.save(filename, ContentFile(img_data), save=True)
                else:
                    # Save as additional image
                    from store.models import ProductImage
                    prod_img = ProductImage(product=product_instance, order=i, is_primary=(i==0))
                    prod_img.image.save(filename, ContentFile(img_data), save=True)
            except Exception as e:
                logger.error(f"Failed to download image {img_url}: {e}")
                
    return product_instance
