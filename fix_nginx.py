import re

with open('nginx/conf.d/default.conf', 'r') as f:
    config = f.read()

# Replace the proxy_pass for media with alias
config = re.sub(
    r'location /media/ \{[^}]*proxy_pass http://backend:8000/media/;[^}]*\}',
    'location /media/ {\n        alias /app/media/;\n        expires 30d;\n        add_header Cache-Control "public, no-transform";\n    }',
    config
)

with open('nginx/conf.d/default.conf', 'w') as f:
    f.write(config)

print("Nginx config patched!")
