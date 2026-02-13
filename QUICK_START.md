# Quick Start Guide

## Start the Application

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Start the server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Open your browser:**
   Navigate to http://localhost:8000/

## First Time Setup

1. **Register a new account:**
   - Click "Sign up"
   - Enter your email and password
   - Optionally add your first and last name
   - Click "Sign Up"

2. **Create your company:**
   - After registration, you'll see the company setup form
   - Enter your company name
   - Click "Create Company"

3. **Start using PayLinker:**
   - Add customers in the "Customers" tab
   - Create invoices in the "Invoices" tab
   - Payment links are automatically generated for each invoice

## API Testing

You can test the API using curl or any API client:

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","password2":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get companies (replace TOKEN with access token from login)
curl http://localhost:8000/api/companies/ \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

**Port already in use:**
- Change the port: `python manage.py runserver 8001`

**Static files not loading:**
- Run: `python manage.py collectstatic --noinput`

**Migration errors:**
- Run: `python manage.py migrate`





