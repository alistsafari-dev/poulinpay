# راهنمای کامل پروژه PayLinker - توضیحات به فارسی

## 📋 فهرست مطالب
1. [معرفی پروژه](#معرفی-پروژه)
2. [معماری کلی](#معماری-کلی)
3. [بک‌اند (Backend)](#بکاند-backend)
4. [فرانت‌اند (Frontend)](#فرانتاند-frontend)
5. [جریان کار (Flow)](#جریان-کار-flow)
6. [جزئیات فنی](#جزئیات-فنی)

---

## معرفی پروژه

**PayLinker** یک سیستم مدیریت لینک پرداخت و فاکتور است که به کاربران امکان می‌دهد:
- حساب کاربری ایجاد کنند
- شرکت خود را ثبت کنند
- مشتریان را مدیریت کنند
- فاکتور برای مشتریان ایجاد کنند
- لینک پرداخت برای فاکتورها تولید کنند

---

## معماری کلی

پروژه از دو بخش اصلی تشکیل شده:

```
PayLinker/
├── Backend (Django REST API)     # سرویس‌دهنده API
└── Frontend (React + Tailwind)   # رابط کاربری
```

### ارتباط بین بخش‌ها:
```
Frontend (مرورگر) 
    ↓ HTTP Request
    ↓ JSON Data
Backend (Django Server)
    ↓ SQL Query
Database (SQLite)
```

---

## بک‌اند (Backend)

### تکنولوژی‌های استفاده شده:
- **Django 5.2**: فریمورک اصلی
- **Django REST Framework**: برای ساخت API
- **JWT Authentication**: برای احراز هویت
- **SQLite**: پایگاه داده (قابل تغییر به PostgreSQL)

### ساختار پوشه‌ها:

```
backend/
├── apps/
│   ├── accounts/        # مدیریت کاربران
│   ├── companies/       # مدیریت شرکت‌ها
│   ├── customers/       # مدیریت مشتریان
│   ├── billing/         # مدیریت فاکتورها و لینک‌های پرداخت
│   ├── core/            # مدل‌های پایه (TimeStampedModel)
│   └── services/        # سرویس‌ها (آماده برای توسعه)
├── config/              # تنظیمات Django
├── templates/           # قالب‌های HTML
└── static/              # فایل‌های استاتیک (JavaScript)
```

### 1. اپلیکیشن Accounts (کاربران)

**موقعیت**: `backend/apps/accounts/`

#### مدل User:
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)  # ایمیل به عنوان نام کاربری
    USERNAME_FIELD = "email"  # ورود با ایمیل
```

**ویژگی‌ها**:
- کاربران با ایمیل ثبت‌نام می‌کنند
- پسورد با اعتبارسنجی‌های Django چک می‌شود
- از AbstractUser ارث‌بری می‌کند

#### Serializers:
- `UserRegistrationSerializer`: برای ثبت‌نام
  - چک می‌کند پسورد و تکرار پسورد یکسان باشند
  - اگر username داده نشده باشد، از ایمیل ساخته می‌شود
  
- `UserSerializer`: برای نمایش اطلاعات کاربر
- `UserProfileUpdateSerializer`: برای به‌روزرسانی پروفایل

#### Views:
- `UserRegistrationView`: POST `/api/auth/register/`
  - کاربر جدید می‌سازد
  - JWT Token تولید می‌کند
  - Token را برمی‌گرداند

- `UserProfileView`: GET `/api/auth/profile/`
  - اطلاعات کاربر لاگین شده را برمی‌گرداند

- `LogoutView`: POST `/api/auth/logout/`
  - کاربر را خارج می‌کند

### 2. اپلیکیشن Companies (شرکت‌ها)

**موقعیت**: `backend/apps/companies/`

#### مدل Company:
```python
class Company(TimeStampedModel):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
```

**ویژگی‌ها**:
- هر شرکت متعلق به یک کاربر است (owner)
- TimeStampedModel: created_at و updated_at را اضافه می‌کند

#### ViewSet:
- `CompanyViewSet`: CRUD کامل برای شرکت‌ها
  - `get_queryset()`: فقط شرکت‌های کاربر فعلی را برمی‌گرداند
  - `perform_create()`: owner را خودکار به کاربر فعلی تنظیم می‌کند
  - `stats()`: آمار شرکت (تعداد مشتری، فاکتور، درآمد)

### 3. اپلیکیشن Customers (مشتریان)

**موقعیت**: `backend/apps/customers/`

#### مدل Customer:
```python
class Customer(TimeStampedModel):
    company = models.ForeignKey(Company)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
```

**ویژگی‌ها**:
- هر مشتری متعلق به یک شرکت است
- کاربر فقط می‌تواند مشتریان شرکت‌های خودش را ببیند

#### ViewSet:
- `CustomerViewSet`: CRUD کامل
  - فیلتر کردن: فقط مشتریان شرکت‌های کاربر فعلی
  - جستجو: بر اساس نام، ایمیل، تلفن

### 4. اپلیکیشن Billing (صورتحساب)

**موقعیت**: `backend/apps/billing/`

#### مدل Invoice (فاکتور):
```python
class Invoice(TimeStampedModel):
    company = models.ForeignKey(Company)
    customer = models.ForeignKey(Customer)
    total_amount = models.PositiveIntegerField()  # مبلغ به ریال
    status = models.CharField(
        choices=[("pending","pending"),("paid","paid"),("expired","expired")]
    )
```

**ویژگی‌ها**:
- هر فاکتور متعلق به یک شرکت و یک مشتری است
- وضعیت: pending (در انتظار)، paid (پرداخت شده)، expired (منقضی)

#### مدل PaymentLink (لینک پرداخت):
```python
class PaymentLink(TimeStampedModel):
    invoice = models.OneToOneField(Invoice)  # هر فاکتور یک لینک دارد
    token = models.UUIDField(unique=True)    # شناسه یکتا
    expires_at = models.DateTimeField()      # تاریخ انقضا
    is_used = models.BooleanField(default=False)  # استفاده شده یا نه
```

**ویژگی‌ها**:
- رابطه یک به یک با Invoice
- Token یک UUID یکتا است
- قابل تنظیم تاریخ انقضا

#### ViewSet InvoiceViewSet:
- `create()`: ایجاد فاکتور جدید
- `create_payment_link()`: تولید لینک پرداخت برای یک فاکتور
  - POST `/api/invoices/{id}/create_payment_link/`

#### ViewSet PaymentLinkViewSet:
- `verify()`: بررسی معتبر بودن لینک پرداخت
- نمایش همه لینک‌های پرداخت کاربر

### 5. اپلیکیشن Core (پایه)

**موقعیت**: `backend/apps/core/`

#### مدل TimeStampedModel:
```python
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True  # این مدل جدول جداگانه نمی‌سازد
```

**استفاده**: تمام مدل‌ها از این کلاس ارث‌بری می‌کنند تا created_at و updated_at داشته باشند.

---

## فرانت‌اند (Frontend)

### تکنولوژی‌های استفاده شده:
- **React 18**: از طریق CDN (بدون نیاز به npm)
- **Tailwind CSS**: برای استایل
- **Font Awesome**: برای آیکون‌ها
- **Babel Standalone**: برای تبدیل JSX

### ساختار فایل‌ها:

```
frontend/
├── index.html          # صفحه اصلی HTML
└── app.js              # تمام کد React (فایل واحد)
```

### معماری Frontend:

```
App
├── AuthProvider        # مدیریت احراز هویت
│   ├── user state
│   ├── login()
│   ├── register()
│   └── logout()
└── Routes
    ├── LoginForm       # صفحه ورود
    ├── RegisterForm    # صفحه ثبت‌نام
    └── Dashboard       # پنل کاربری
        ├── OverviewTab
        ├── CustomersTab
        └── InvoicesTab
```

### 1. API Service

**موقعیت**: ابتدای `app.js`

```javascript
const API_BASE_URL = 'http://localhost:8000/api';

const apiService = {
    request(endpoint, options) {
        // درخواست HTTP با JWT Token
    },
    register(userData) {...},
    login(email, password) {...},
    getCompanies() {...},
    // و غیره...
}
```

**ویژگی‌ها**:
- مدیریت خودکار JWT Token
- مدیریت خطاها
- تبدیل JSON

### 2. Authentication Context

```javascript
<AuthProvider>
    {/* تمام اپلیکیشن */}
</AuthProvider>
```

**وظایف**:
- نگهداری وضعیت کاربر
- مدیریت Token در localStorage
- بارگذاری خودکار کاربر از Token

### 3. صفحات

#### صفحه LoginForm:
- ورودی: ایمیل و پسورد
- ارسال به: POST `/api/auth/login/`
- در صورت موفقیت: ذخیره Token و انتقال به Dashboard

#### صفحه RegisterForm:
- ورودی: ایمیل، پسورد، تکرار پسورد، نام و نام خانوادگی
- ارسال به: POST `/api/auth/register/`
- در صورت موفقیت: ثبت‌نام و ورود خودکار

#### صفحه Dashboard:
- تب Overview: آمار و اطلاعات کلی
- تب Customers: لیست و مدیریت مشتریان
- تب Invoices: لیست و مدیریت فاکتورها

---

## جریان کار (Flow)

### 1. ثبت‌نام کاربر جدید:

```
1. کاربر فرم ثبت‌نام را پر می‌کند
   ↓
2. Frontend: POST /api/auth/register/
   {
     email: "user@example.com",
     password: "pass123",
     password2: "pass123"
   }
   ↓
3. Backend: UserRegistrationView
   - اعتبارسنجی داده‌ها
   - ساخت User جدید
   - تولید JWT Token
   ↓
4. Response: {user, access, refresh}
   ↓
5. Frontend: ذخیره Token در localStorage
   - تنظیم user state
   - انتقال به Dashboard
```

### 2. ایجاد شرکت:

```
1. کاربر نام شرکت را وارد می‌کند
   ↓
2. Frontend: POST /api/companies/
   {
     name: "شرکت من"
   }
   Headers: Authorization: Bearer <token>
   ↓
3. Backend: CompanyViewSet.create()
   - دریافت کاربر از Token
   - تنظیم owner = request.user
   - ساخت Company
   ↓
4. Response: {id, name, owner, created_at}
   ↓
5. Frontend: نمایش Dashboard با اطلاعات شرکت
```

### 3. افزودن مشتری:

```
1. کاربر اطلاعات مشتری را وارد می‌کند
   {
     company: 1,
     full_name: "احمد محمدی",
     phone: "09123456789",
     email: "ahmad@example.com"
   }
   ↓
2. Frontend: POST /api/customers/
   ↓
3. Backend: CustomerViewSet.create()
   - بررسی: company متعلق به کاربر باشد
   - ساخت Customer
   ↓
4. Response: Customer جدید
   ↓
5. Frontend: افزودن به لیست مشتریان
```

### 4. ایجاد فاکتور و لینک پرداخت:

```
1. کاربر فاکتور جدید می‌سازد
   {
     company: 1,
     customer: 1,
     total_amount: 1000000
   }
   ↓
2. Frontend: POST /api/invoices/
   ↓
3. Backend: InvoiceViewSet.create()
   - بررسی: company و customer متعلق به کاربر باشد
   - ساخت Invoice با status="pending"
   ↓
4. Response: Invoice جدید
   ↓
5. Frontend: POST /api/invoices/{id}/create_payment_link/
   {
     expires_in_days: 30
   }
   ↓
6. Backend: ایجاد PaymentLink
   - تولید UUID Token
   - تنظیم expires_at = now + 30 days
   ↓
7. Response: PaymentLink با URL
   ↓
8. Frontend: نمایش لینک پرداخت به کاربر
```

---

## جزئیات فنی

### 1. احراز هویت JWT:

```python
# تولید Token
refresh = RefreshToken.for_user(user)
access_token = refresh.access_token

# در Header درخواست
Authorization: Bearer <access_token>
```

**ویژگی‌ها**:
- Access Token: 24 ساعت معتبر
- Refresh Token: 7 روز معتبر
- Stateless: نیازی به Session نیست

### 2. امنیت:

**Backend**:
- همه API ها (به جز register/login) نیاز به Authentication دارند
- کاربر فقط به داده‌های خودش دسترسی دارد (User Isolation)
- CORS تنظیم شده برای جلوگیری از درخواست‌های غیرمجاز

**Frontend**:
- Token در localStorage ذخیره می‌شود
- در هر درخواست Token ارسال می‌شود
- در صورت انقضای Token، کاربر باید دوباره وارد شود

### 3. مدیریت خطا:

```javascript
try {
    const response = await apiService.register(data);
} catch (error) {
    // نمایش پیام خطا به کاربر
    setError(error.message);
}
```

**انواع خطا**:
- خطاهای شبکه: "Unable to connect to server"
- خطاهای اعتبارسنجی: پیام‌های دقیق از Backend
- خطاهای احراز هویت: "Please login again"

### 4. پایگاه داده:

**روابط (Relationships)**:
```
User (1) ──→ (N) Company
Company (1) ──→ (N) Customer
Company (1) ──→ (N) Invoice
Customer (1) ──→ (N) Invoice
Invoice (1) ──→ (1) PaymentLink
```

**ایندکس‌ها**:
- User.email: unique
- PaymentLink.token: unique
- Foreign Keys: برای ارتباطات

### 5. URL Routing:

**Backend (Django)**:
```python
urlpatterns = [
    path('api/auth/register/', ...),
    path('api/auth/login/', ...),
    path('api/companies/', ...),
    path('api/customers/', ...),
    path('api/invoices/', ...),
    path('', TemplateView.as_view(...)),  # Frontend
]
```

**Frontend (React)**:
- Single Page Application (SPA)
- Routing با React State (نه React Router)
- همه صفحات در یک فایل app.js

---

## نحوه اجرا

### 1. راه‌اندازی Backend:

```bash
cd backend
source ../venv/bin/activate
python manage.py migrate        # ساخت جداول
python manage.py runserver      # اجرای سرور
```

### 2. دسترسی:

- Frontend: http://localhost:8000/
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

### 3. تست API:

```bash
# ثبت‌نام
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","password2":"test123"}'
```

---

## خلاصه

1. **Backend**: Django REST API با JWT Authentication
2. **Frontend**: React SPA با Tailwind CSS
3. **Database**: SQLite (قابل تغییر)
4. **Security**: JWT Tokens + User Isolation
5. **Features**: ثبت‌نام، ورود، مدیریت شرکت، مشتری، فاکتور، لینک پرداخت

پروژه به صورت ماژولار طراحی شده و قابلیت توسعه دارد.




