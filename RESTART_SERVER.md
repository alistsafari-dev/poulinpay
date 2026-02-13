# راهنمای رفع مشکل نمایش فارسی

اگر تغییرات فارسی در مرورگر نمایش داده نمی‌شود:

## مرحله 1: توقف و راه‌اندازی مجدد سرور

```bash
# توقف سرور (اگر در حال اجراست)
Ctrl + C

# راه‌اندازی مجدد
cd backend
source ../venv/bin/activate
python manage.py runserver
```

## مرحله 2: پاک کردن کش مرورگر

### روش 1: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` یا `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### روش 2: پاک کردن کامل کش
1. باز کردن Developer Tools (F12)
2. کلیک راست روی دکمه Refresh
3. انتخاب "Empty Cache and Hard Reload"

### روش 3: حالت ناشناس/خصوصی
- باز کردن مرورگر در حالت Incognito/Private
- آدرس: http://localhost:8000

## مرحله 3: بررسی کنسول مرورگر

1. باز کردن Developer Tools (F12)
2. رفتن به تب Console
3. بررسی خطاها
4. رفتن به تب Network
5. Refresh صفحه
6. بررسی اینکه `/static/app.js` با کد 200 لود می‌شود

## اگر هنوز کار نکرد:

```bash
# حذف فایل‌های استاتیک و ایجاد مجدد
cd backend
rm -rf staticfiles
python manage.py collectstatic --noinput
python manage.py runserver
```


