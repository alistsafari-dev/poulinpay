#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "import socket; s=socket.socket(); s.connect(('${POSTGRES_HOST:-db}', int('${POSTGRES_PORT:-5432}'))); s.close()" 2>/dev/null; do
  sleep 1
done

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 3 --timeout 120
