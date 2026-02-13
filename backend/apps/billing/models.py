from django.db import models
from core.models import TimeStampedModel
from companies.models import Company
from customers.models import Customer

class Invoice(TimeStampedModel):
    """
    فاکتور
    """
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    total_amount = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10,
        choices=[("pending","pending"),("paid","paid"),("expired","expired")],
        default="pending"
    )

    def __str__(self):
        return f"Invoice {self.id} - {self.company.name} - {self.status}"


import uuid
from django.db import models

class PaymentLink(TimeStampedModel):
    """
    لینک پرداخت مرتبط با Invoice
    """
    invoice = models.OneToOneField(
        Invoice,
        on_delete=models.CASCADE,
        related_name="payment_link"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"PaymentLink {self.token} - {self.invoice.id}"
