#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Dev-only setup (configures Site domain for localhost, etc.)
if [ "$DEBUG" = "True" ]; then
    echo "Running dev_setup..."
    python manage.py dev_setup
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the server
echo "Starting server..."
exec "$@"
