# Folder purpose
Holds the reverse proxy and static file serving configurations for deploying the stack via Nginx. 

# Subfolder map
- conf.d — Optional configurations dynamically included by the main process

# Main files
- nginx.conf — The core Nginx deployment file that routes traffic between the Django backend and Vite frontend
- nginx.conf.backup — Preserved fallback configuration copy
