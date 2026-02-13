# PayLinker - Payment Link Management System

A modern, full-stack web application for managing companies, customers, invoices, and payment links.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with registration and login
- 🏢 **Company Management**: Create and manage your company profile
- 👥 **Customer Management**: Add and manage customers for your company
- 📄 **Invoice Management**: Create invoices for customers
- 🔗 **Payment Links**: Generate secure payment links with expiration dates
- 📊 **Dashboard**: View statistics and overview of your business

## Technology Stack

### Backend
- Django 5.2
- Django REST Framework
- JWT Authentication (djangorestframework-simplejwt)
- SQLite (development)

### Frontend
- React 18 (via CDN)
- Tailwind CSS (via CDN)
- Font Awesome Icons
- Babel (for JSX transpilation)

## Installation & Setup

### Prerequisites
- Python 3.12+
- Virtual environment (recommended)

### Backend Setup

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
   ```

3. **Run migrations:**
   ```bash
   cd backend
   python manage.py migrate
   ```

4. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

### Running the Application

**Option 1: Using the provided script:**
```bash
./run_server.sh
```

**Option 2: Manual start:**
```bash
cd backend
source ../venv/bin/activate
python manage.py runserver
```

The application will be available at:
- **Frontend**: http://localhost:8000/
- **API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Get user profile

### Companies
- `GET /api/companies/` - List user's companies
- `POST /api/companies/` - Create new company
- `GET /api/companies/{id}/` - Get company details
- `PATCH /api/companies/{id}/` - Update company
- `GET /api/companies/{id}/stats/` - Get company statistics

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create new customer
- `GET /api/customers/{id}/` - Get customer details

### Invoices
- `GET /api/invoices/` - List invoices
- `POST /api/invoices/` - Create new invoice
- `POST /api/invoices/{id}/create_payment_link/` - Create payment link for invoice

### Payment Links
- `GET /api/payment-links/` - List payment links
- `GET /api/payment-links/{id}/` - Get payment link details
- `GET /api/payment-links/{id}/verify/` - Verify payment link validity

## Usage Guide

### 1. Registration & Login
1. Navigate to the application
2. Click "Sign up" to create a new account
3. Fill in your email, password, and optional name fields
4. After registration, you'll be automatically logged in

### 2. Company Setup
1. After login, you'll be prompted to create a company
2. Enter your company name and click "Create Company"
3. You'll be redirected to the dashboard

### 3. Managing Customers
1. Navigate to the "Customers" tab
2. Click "Add Customer" button
3. Fill in customer details (name, phone, email)
4. Customers will appear in the list

### 4. Creating Invoices & Payment Links
1. Navigate to the "Invoices" tab
2. Click "Create Invoice"
3. Select a customer and enter the amount
4. Click "Create Invoice & Payment Link"
5. A payment link will be automatically generated
6. Click "View Link" to see the payment URL

### 5. Dashboard Overview
- View company statistics
- See total customers, invoices, and revenue
- Quick access to recent invoices

## Security Features

- JWT token-based authentication
- Password validation
- CORS protection
- User-specific data isolation (users can only access their own companies)
- Secure token storage in localStorage

## Development Notes

- The application uses SQLite for development
- Static files are served through Django in development
- Frontend is built with React using CDN (no build step required)
- API uses Django REST Framework with JWT authentication

## Project Structure

```
paylinker/
├── backend/
│   ├── apps/
│   │   ├── accounts/      # User authentication & profiles
│   │   ├── companies/     # Company management
│   │   ├── customers/     # Customer management
│   │   ├── billing/       # Invoices & payment links
│   │   ├── core/          # Base models
│   │   └── services/      # Services (future expansion)
│   ├── config/            # Django configuration
│   ├── templates/         # HTML templates
│   └── static/            # Static files (JS, CSS)
├── frontend/              # Frontend source files
├── venv/                  # Python virtual environment
└── run_server.sh          # Server startup script
```

## Future Enhancements

- Email notifications for payment links
- Payment gateway integration
- Invoice PDF generation
- Advanced analytics and reporting
- Multi-currency support
- User roles and permissions

## License

This project is for educational/demonstration purposes.





