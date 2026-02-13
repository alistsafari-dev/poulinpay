#!/bin/bash

# PayLinker Server Startup Script

echo "Starting PayLinker Application..."
echo "=================================="

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Change to backend directory
cd backend

echo ""
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo ""
echo "Starting Django development server..."
echo "Backend API: http://localhost:8000/api/"
echo "Frontend: http://localhost:8000/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python manage.py runserver





