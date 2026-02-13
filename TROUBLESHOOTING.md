# Troubleshooting Guide

## "Failed to fetch" Error on Sign Up

If you're getting a "Failed to fetch" error when trying to sign up, follow these steps:

### 1. Check if the Backend Server is Running

Make sure the Django server is running:

```bash
cd backend
source ../venv/bin/activate
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### 2. Check Browser Console

Open your browser's developer tools (F12) and check the Console tab for detailed error messages.

### 3. Test the API Directly

You can test if the API is working by running this command in a new terminal:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","password2":"testpass123"}'
```

If this works, you should get a JSON response with user data and tokens.

### 4. Check CORS Configuration

The backend is configured to allow requests from:
- http://localhost:8000
- http://127.0.0.1:8000

If you're accessing from a different URL, you may need to update `backend/config/settings.py`.

### 5. Check Network Tab

1. Open browser DevTools (F12)
2. Go to the Network tab
3. Try signing up again
4. Look for the request to `/api/auth/register/`
5. Check the status code and response

### 6. Common Issues and Solutions

**Issue**: "Network Error" or "Failed to fetch"
- **Solution**: Backend server is not running. Start it with `python manage.py runserver`

**Issue**: 403 Forbidden
- **Solution**: CSRF token issue. The app is configured to handle this, but if it persists, check CORS settings.

**Issue**: 500 Internal Server Error
- **Solution**: Check backend terminal for error messages. Usually indicates a code issue.

**Issue**: 400 Bad Request with validation errors
- **Solution**: Check the error message - it will tell you what's wrong (e.g., "Password fields didn't match")

### 7. Verify Dependencies

Make sure all required packages are installed:

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

### 8. Clear Browser Cache

Sometimes cached files can cause issues. Try:
- Hard refresh: Ctrl+Shift+R (Linux/Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Try in incognito/private mode

### 9. Check File Updates

If you made changes to `frontend/app.js`, make sure to copy it to the backend:

```bash
cp frontend/app.js backend/static/app.js
python manage.py collectstatic --noinput
```

### 10. Restart the Server

After making configuration changes, restart the Django server:

1. Stop the server (Ctrl+C)
2. Start it again: `python manage.py runserver`

## Still Having Issues?

1. Check the Django server terminal for error messages
2. Check browser console for JavaScript errors
3. Verify the API endpoint URL in `frontend/app.js` matches your server URL
4. Make sure port 8000 is not being used by another application





