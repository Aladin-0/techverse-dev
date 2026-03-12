with open('nginx/conf.d/default.conf', 'r') as f:
    config = f.read()

# Replace $scheme with https for the proxy headers
config = config.replace('proxy_set_header X-Forwarded-Proto $scheme;', 'proxy_set_header X-Forwarded-Proto https;')

with open('nginx/conf.d/default.conf', 'w') as f:
    f.write(config)

print("Nginx updated to force HTTPS proxy headers!")
