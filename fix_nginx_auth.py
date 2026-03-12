with open('nginx/conf.d/default.conf', 'r') as f:
    config = f.read()

# Add location /auth/ and /accounts/ if they don't exist
if 'location /auth/' not in config:
    config = config.replace(
        'location /api/ {',
        'location /auth/ {\n        proxy_pass http://backend:8000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n    location /accounts/ {\n        proxy_pass http://backend:8000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n    location /api/ {'
    )

with open('nginx/conf.d/default.conf', 'w') as f:
    f.write(config)

print("Nginx proxy configured for auth!")
