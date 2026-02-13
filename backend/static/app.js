const { useState, useEffect, useContext, createContext } = React;

// API Configuration
const API_BASE_URL = `${window.location.origin}/api`;

// Helper function to format Persian date
const formatPersianDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
};

// Helper function to get Persian status
const getPersianStatus = (status) => {
    const statusMap = {
        'pending': 'در انتظار',
        'paid': 'پرداخت شده',
        'expired': 'منقضی شده'
    };
    return statusMap[status] || status;
};

const formatAmountWithCommas = (value) => {
    const digitsOnly = String(value || '').replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Auth Context
const AuthContext = createContext();

// API Service
const apiService = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Handle non-JSON responses
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.ok) {
                // Handle validation errors
                if (data.errors || typeof data === 'object') {
                    const errorMessages = [];
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            errorMessages.push(`${key}: ${data[key].join(', ')}`);
                        } else if (typeof data[key] === 'string') {
                            errorMessages.push(data[key]);
                        }
                    }
                    throw new Error(errorMessages.length > 0 ? errorMessages.join('; ') : (data.detail || data.message || 'خطایی رخ داد'));
                }
                throw new Error(data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            // Handle network errors
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                throw new Error('عدم اتصال به سرور. لطفاً مطمئن شوید که سرور در آدرس http://localhost:8000 در حال اجرا است');
            }
            throw error;
        }
    },

    async register(userData) {
        return this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async login(email, password) {
        return this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async resetPassword(email, newPassword, newPassword2) {
        return this.request('/auth/reset-password/', {
            method: 'POST',
            body: JSON.stringify({
                email,
                new_password: newPassword,
                new_password2: newPassword2,
            }),
        });
    },

    async getProfile() {
        return this.request('/auth/profile/');
    },

    async getCompanies() {
        return this.request('/companies/');
    },

    async createCompany(name) {
        return this.request('/companies/', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },

    async updateCompany(id, name) {
        return this.request(`/companies/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    },

    async getCustomers() {
        return this.request('/customers/');
    },

    async createCustomer(data) {
        return this.request('/customers/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getInvoices() {
        return this.request('/invoices/');
    },

    async createInvoice(data) {
        return this.request('/invoices/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async createPaymentLink(invoiceId, expiresInDays = 30) {
        return this.request(`/invoices/${invoiceId}/create_payment_link/`, {
            method: 'POST',
            body: JSON.stringify({ expires_in_days: expiresInDays }),
        });
    },

    async getPaymentLinks() {
        return this.request('/payment-links/');
    },
};

// Auth Provider
function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const userData = await apiService.getProfile();
            setUser(userData);
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await apiService.login(email, password);
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        await loadUser();
        return response;
    };

    const register = async (userData) => {
        const response = await apiService.register(userData);
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        setUser(response.user);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

const useAuth = () => useContext(AuthContext);

function BrandLogo({ size = 40, className = '' }) {
    return (
        <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 64 64" width={size} height={size} aria-label="Poulin Pay Logo" role="img">
                <defs>
                    <linearGradient id="ppBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1D4ED8" />
                        <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                </defs>
                <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ppBlue)" />
                <path d="M17 44V20H30.5C35.6 20 39 23.2 39 27.8C39 32.4 35.6 35.7 30.5 35.7H23.2V44H17ZM23.2 30.4H29.3C31.5 30.4 32.8 29.3 32.8 27.8C32.8 26.2 31.5 25.2 29.3 25.2H23.2V30.4Z" fill="white" />
                <path d="M36 44V20H49.5C54.6 20 58 23.2 58 27.8C58 32.4 54.6 35.7 49.5 35.7H42.2V44H36ZM42.2 30.4H48.3C50.5 30.4 51.8 29.3 51.8 27.8C51.8 26.2 50.5 25.2 48.3 25.2H42.2V30.4Z" fill="white" fillOpacity="0.9" />
            </svg>
        </div>
    );
}

function SiteFooter() {
    return (
        <footer className="mt-12 border-t border-slate-200 bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div>
                        <div className="flex items-center space-x-3 space-x-reverse mb-4">
                            <BrandLogo size={36} />
                            <h3 className="text-xl font-bold text-white">پولین پی</h3>
                        </div>
                        <h4 className="text-sm font-semibold tracking-wide text-blue-300 mb-3">درباره ما</h4>
                        <p className="text-sm leading-7 text-slate-300">
                            پولین پی یک پلتفرم ساده و حرفه‌ای برای مدیریت فاکتور و لینک پرداخت است؛
                            با تمرکز روی تجربه کاربری سریع، امن و قابل اعتماد.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold tracking-wide text-blue-300 mb-3">لینک‌های سریع</h4>
                        <ul className="space-y-2 text-sm">
                            <li><span className="text-slate-100">نمای کلی</span></li>
                            <li><span className="text-slate-100">مدیریت مشتریان</span></li>
                            <li><span className="text-slate-100">مدیریت فاکتورها</span></li>
                            <li><span className="text-slate-100">لینک‌های پرداخت</span></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold tracking-wide text-blue-300 mb-3">ارتباط با ما</h4>
                        <div className="space-y-3 text-sm">
                            <p className="flex items-center gap-2">
                                <i className="fas fa-envelope text-blue-300"></i>
                                <a href="mailto:support@poulinpay.com" className="hover:text-white transition">support@poulinpay.com</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <i className="fas fa-phone text-blue-300"></i>
                                <a href="tel:+982100000000" className="english-number hover:text-white transition">+98 21 0000 0000</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <i className="fas fa-map-marker-alt text-blue-300"></i>
                                تهران، ایران
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">© 2026 Poulin Pay. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <a href="#" aria-label="LinkedIn" className="hover:text-blue-300 transition"><i className="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="Instagram" className="hover:text-blue-300 transition"><i className="fab fa-instagram"></i></a>
                        <a href="#" aria-label="Telegram" className="hover:text-blue-300 transition"><i className="fab fa-telegram-plane"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// Components
function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return user ? <Dashboard /> : <AuthFlow />;
}

function AuthFlow() {
    const [isLogin, setIsLogin] = useState(true);
    return isLogin ? <LoginForm onSwitch={() => setIsLogin(false)} /> : <RegisterForm onSwitch={() => setIsLogin(true)} />;
}

function LoginForm({ onSwitch }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'ورود ناموفق. لطفاً اطلاعات خود را بررسی کنید.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');

        if (newPassword !== newPassword2) {
            setError('رمزهای عبور یکسان نیستند.');
            return;
        }

        setResetLoading(true);
        try {
            await apiService.resetPassword(resetEmail, newPassword, newPassword2);
            setResetMessage('رمز عبور با موفقیت تغییر کرد. حالا وارد شوید.');
            setShowReset(false);
            setEmail(resetEmail);
            setPassword('');
            setResetEmail('');
            setNewPassword('');
            setNewPassword2('');
        } catch (err) {
            setError(err.message || 'خطا در بازیابی رمز عبور.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <BrandLogo size={64} className="mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">پولین پی</h1>
                    <p className="text-gray-600 mt-2">خوش آمدید! لطفاً وارد حساب کاربری خود شوید.</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-right">
                        {error}
                    </div>
                )}
                {resetMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-right">
                        {resetMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            آدرس ایمیل
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="you@example.com"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowReset(!showReset)}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700"
                        type="button"
                    >
                        {showReset ? 'بستن بازیابی رمز' : 'فراموشی رمز عبور؟'}
                    </button>
                </div>

                {showReset && (
                    <form onSubmit={handleResetPassword} className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                        <h3 className="text-sm font-semibold text-gray-800 text-right">بازیابی رمز عبور</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                ایمیل ثبت‌شده
                            </label>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                                placeholder="you@example.com"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                رمز عبور جدید
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                تکرار رمز عبور جدید
                            </label>
                            <input
                                type="password"
                                value={newPassword2}
                                onChange={(e) => setNewPassword2(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={resetLoading}
                            className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resetLoading ? 'در حال ثبت...' : 'ثبت رمز جدید'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        حساب کاربری ندارید؟{' '}
                        <button onClick={onSwitch} className="text-blue-600 font-medium hover:text-blue-700">
                            ثبت نام
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function RegisterForm({ onSwitch }) {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password2) {
            setError('رمزهای عبور یکسان نیستند.');
            return;
        }

        setLoading(true);
        
        try {
            await register(formData);
        } catch (err) {
            setError(err.message || 'ثبت نام ناموفق. لطفاً دوباره تلاش کنید.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <BrandLogo size={64} className="mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">ایجاد حساب کاربری</h1>
                    <p className="text-gray-600 mt-2">به پولین پی خوش آمدید. ثبت نام کنید تا شروع کنیم.</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-right">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                نام خانوادگی
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                                placeholder="محمدی"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                نام
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                                placeholder="احمد"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            آدرس ایمیل *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="you@example.com"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            رمز عبور *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            تکرار رمز عبور *
                        </label>
                        <input
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'در حال ایجاد حساب...' : 'ثبت نام'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        قبلاً ثبت نام کرده‌اید؟{' '}
                        <button onClick={onSwitch} className="text-blue-600 font-medium hover:text-blue-700">
                            ورود
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [company, setCompany] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [companiesRes, customersRes, invoicesRes] = await Promise.all([
                apiService.getCompanies(),
                apiService.getCustomers(),
                apiService.getInvoices(),
            ]);
            
            if (companiesRes.results && companiesRes.results.length > 0) {
                setCompany(companiesRes.results[0]);
            }
            setCustomers(customersRes.results || customersRes);
            setInvoices(invoicesRes.results || invoicesRes);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (name) => {
        try {
            const newCompany = await apiService.createCompany(name);
            setCompany(newCompany);
            setActiveTab('overview');
        } catch (error) {
            alert('خطا در ایجاد شرکت: ' + error.message);
        }
    };

    const handleCreateCustomer = async (customerData) => {
        try {
            const newCustomer = await apiService.createCustomer(customerData);
            setCustomers([...customers, newCustomer]);
        } catch (error) {
            alert('خطا در ایجاد مشتری: ' + error.message);
        }
    };

    const handleCreateInvoice = async (invoiceData) => {
        try {
            const newInvoice = await apiService.createInvoice(invoiceData);
            setInvoices([...invoices, newInvoice]);
            return newInvoice;
        } catch (error) {
            alert('خطا در ایجاد فاکتور: ' + error.message);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری پنل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <BrandLogo size={40} />
                            <h1 className="text-2xl font-bold text-gray-900">پولین پی</h1>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <span className="text-gray-700">{user?.email}</span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                <i className="fas fa-sign-out-alt ml-2"></i>
                                خروج
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!company ? (
                    <CompanySetupForm onCreate={handleCreateCompany} />
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="bg-white rounded-lg shadow-sm mb-6">
                            <nav className="flex border-b border-gray-200">
                                {[
                                    { key: 'overview', label: 'نمای کلی' },
                                    { key: 'customers', label: 'مشتریان' },
                                    { key: 'invoices', label: 'فاکتورها' }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-6 py-4 font-medium text-sm border-b-2 transition ${
                                            activeTab === tab.key
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <OverviewTab company={company} customers={customers} invoices={invoices} />
                        )}
                        {activeTab === 'customers' && (
                            <CustomersTab
                                company={company}
                                customers={customers}
                                onCreateCustomer={handleCreateCustomer}
                                onLoad={loadData}
                            />
                        )}
                        {activeTab === 'invoices' && (
                            <InvoicesTab
                                company={company}
                                customers={customers}
                                invoices={invoices}
                                onCreateInvoice={handleCreateInvoice}
                                onLoad={loadData}
                            />
                        )}
                    </>
                )}
            </div>
            <SiteFooter />
        </div>
    );
}

function CompanySetupForm({ onCreate }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('نام شرکت الزامی است');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onCreate(name);
        } catch (err) {
            setError(err.message || 'خطا در ایجاد شرکت');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <i className="fas fa-building text-white text-2xl"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">تنظیم شرکت</h2>
                    <p className="text-gray-600">با افزودن اطلاعات شرکت خود شروع کنید</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-right">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                            نام شرکت *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-right"
                            placeholder="نام شرکت خود را وارد کنید"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                    >
                        {loading ? 'در حال ایجاد...' : 'ایجاد شرکت'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function OverviewTab({ company, customers, invoices }) {
    const statColorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    };

    const stats = [
        {
            title: 'کل مشتریان',
            value: customers.length,
            icon: 'users',
            color: 'blue',
        },
        {
            title: 'کل فاکتورها',
            value: invoices.length,
            icon: 'file-invoice',
            color: 'green',
        },
        {
            title: 'پرداخت‌های در انتظار',
            value: invoices.filter(inv => inv.status === 'pending').length,
            icon: 'clock',
            color: 'yellow',
        },
        {
            title: 'فاکتورهای پرداخت شده',
            value: invoices.filter(inv => inv.status === 'paid').length,
            icon: 'check-circle',
            color: 'purple',
        },
    ];

    const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">اطلاعات شرکت</h3>
                <div className="space-y-2 text-right">
                    <p><span className="font-medium">نام:</span> {company.name}</p>
                    <p><span className="font-medium">تاریخ ایجاد:</span> {formatPersianDate(company.created_at)}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2"><span className="english-number">{stat.value}</span></p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statColorClasses[stat.color].bg}`}>
                                <i className={`fas fa-${stat.icon} ${statColorClasses[stat.color].text}`}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-blue-100 mb-2 text-right">کل درآمد</p>
                <p className="text-4xl font-bold text-right">
                    <span className="english-number">{totalRevenue.toLocaleString()}</span>{' '}
                    <span className="text-2xl">ریال</span>
                </p>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">فاکتورهای اخیر</h3>
                {invoices.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">هنوز فاکتوری ایجاد نکرده‌اید. اولین فاکتور را ایجاد کنید!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">مشتری</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">مبلغ</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">وضعیت</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">تاریخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.slice(0, 5).map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">{invoice.customer_detail?.full_name || 'نامشخص'}</td>
                                        <td className="py-3 px-4">
                                            <span className="english-number">{invoice.total_amount?.toLocaleString()}</span> ریال
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {getPersianStatus(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{formatPersianDate(invoice.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function CustomersTab({ company, customers, onCreateCustomer, onLoad }) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        company: company.id,
        full_name: '',
        phone: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreateCustomer(formData);
            setFormData({ company: company.id, full_name: '', phone: '', email: '' });
            setShowForm(false);
        } catch (error) {
            alert('خطا: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">مشتریان</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <i className="fas fa-plus ml-2"></i>
                    افزودن مشتری
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 text-right">افزودن مشتری جدید</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">نام کامل *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                    placeholder="احمد محمدی"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">تلفن *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                    placeholder="09123456789"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">ایمیل</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                placeholder="you@example.com"
                                dir="ltr"
                            />
                        </div>
                        <div className="flex space-x-3 space-x-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'در حال ایجاد...' : 'ایجاد مشتری'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                انصراف
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {customers.length === 0 ? (
                    <div className="p-12 text-center">
                        <i className="fas fa-users text-gray-300 text-5xl mb-4"></i>
                        <p className="text-gray-500">هنوز مشتری اضافه نکرده‌اید. اولین مشتری را اضافه کنید!</p>
                    </div>
                ) : (
                    <table className="w-full text-right">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نام</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تلفن</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ایمیل</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تعداد فاکتورها</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">{customer.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="english-number">{customer.invoice_count || 0}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function InvoicesTab({ company, customers, invoices, onCreateInvoice, onLoad }) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        company: company.id,
        customer: '',
        total_amount: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountRaw = String(formData.total_amount || '').replace(/,/g, '');
        if (!formData.customer || !amountRaw) {
            alert('لطفاً همه فیلدهای الزامی را پر کنید');
            return;
        }
        setLoading(true);
        try {
            const invoice = await onCreateInvoice({
                company: Number(formData.company),
                customer: Number(formData.customer),
                total_amount: Number(amountRaw),
            });
            
            // Create payment link automatically
            try {
                const paymentLink = await apiService.createPaymentLink(invoice.id, 30);
                alert(`فاکتور ایجاد شد! لینک پرداخت: ${paymentLink.payment_url || paymentLink.token}`);
            } catch (linkError) {
                console.error('Error creating payment link:', linkError);
                alert('فاکتور ایجاد شد اما خطا در ایجاد لینک پرداخت. می‌توانید به صورت دستی ایجاد کنید.');
            }
            
            setFormData({ company: company.id, customer: '', total_amount: '' });
            setShowForm(false);
            onLoad();
        } catch (error) {
            alert('خطا: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">فاکتورها</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <i className="fas fa-plus ml-2"></i>
                    ایجاد فاکتور
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 text-right">ایجاد فاکتور جدید</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">مشتری *</label>
                            <select
                                required
                                value={formData.customer}
                                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
                            >
                                <option value="">یک مشتری انتخاب کنید</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">مبلغ (ریال) *</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={formData.total_amount}
                                onChange={(e) => setFormData({ ...formData, total_amount: formatAmountWithCommas(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                placeholder="1,000,000"
                                dir="ltr"
                            />
                        </div>
                        <div className="flex space-x-3 space-x-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'در حال ایجاد...' : 'ایجاد فاکتور و لینک پرداخت'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                انصراف
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {invoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <i className="fas fa-file-invoice text-gray-300 text-5xl mb-4"></i>
                        <p className="text-gray-500">هنوز فاکتوری ایجاد نکرده‌اید. اولین فاکتور را ایجاد کنید!</p>
                    </div>
                ) : (
                    <table className="w-full text-right">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مشتری</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مبلغ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">وضعیت</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">لینک پرداخت</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {invoice.customer_detail?.full_name || 'نامشخص'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="english-number">{invoice.total_amount?.toLocaleString()}</span> ریال
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {getPersianStatus(invoice.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.payment_link?.url ? (
                                            <a
                                                href={invoice.payment_link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                <i className="fas fa-external-link-alt ml-1"></i>
                                                مشاهده لینک
                                            </a>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const link = await apiService.createPaymentLink(invoice.id, 30);
                                                        alert(`لینک پرداخت ایجاد شد: ${link.payment_url || link.token}`);
                                                        onLoad();
                                                    } catch (error) {
                                                        alert('خطا در ایجاد لینک پرداخت: ' + error.message);
                                                    }
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                <i className="fas fa-link ml-1"></i>
                                                ایجاد لینک
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPersianDate(invoice.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
        <App />
    </AuthProvider>
);
