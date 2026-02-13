from django.contrib import admin
from .models import Invoice, PaymentLink

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "customer", "total_amount", "status", "created_at")
    search_fields = ("company__name", "customer__full_name", "status")
    list_filter = ("status", "company")

@admin.register(PaymentLink)
class PaymentLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice", "token", "expires_at", "is_used")
    search_fields = ("invoice__id", "token")
    list_filter = ("is_used", "expires_at")
