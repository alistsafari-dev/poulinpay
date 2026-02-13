from django.db import models
from companies.models import Company
from core.models import TimeStampedModel

class Customer(TimeStampedModel):
    """
    مشتریان هر شرکت
    """
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="customers"
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return f"{self.full_name} ({self.company.name})"
