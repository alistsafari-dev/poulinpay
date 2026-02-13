from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "company", "phone", "email", "created_at")
    search_fields = ("full_name", "phone", "email", "company__name")
    list_filter = ("company",)
