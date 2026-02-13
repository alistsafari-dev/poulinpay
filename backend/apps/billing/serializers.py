from rest_framework import serializers
from .models import Invoice, PaymentLink
from companies.models import Company
from customers.models import Customer
from companies.serializers import CompanySerializer
from customers.serializers import CustomerSerializer
from datetime import timedelta
from django.utils import timezone

class InvoiceSerializer(serializers.ModelSerializer):
    company_detail = CompanySerializer(source='company', read_only=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    payment_link = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = ["id", "company", "company_detail", "customer", "customer_detail", "total_amount", "status", "payment_link", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def get_payment_link(self, obj):
        """Get payment link if exists"""
        try:
            link = obj.payment_link
            return {
                "id": link.id,
                "token": str(link.token),
                "expires_at": link.expires_at,
                "is_used": link.is_used,
                "url": f"/payment/{link.token}" if not link.is_used else None,
            }
        except PaymentLink.DoesNotExist:
            return None


class InvoiceCreateSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        pk_field=serializers.IntegerField(),
    )
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        pk_field=serializers.IntegerField(),
    )

    class Meta:
        model = Invoice
        fields = ["company", "customer", "total_amount"]
        
    def validate_company(self, value):
        """Ensure the company belongs to the current user"""
        request = self.context.get('request')
        if request and value.owner != request.user:
            raise serializers.ValidationError("You can only create invoices for your own companies.")
        return value

    def validate_customer(self, value):
        """Ensure the customer belongs to the company"""
        company = self.initial_data.get('company')
        if company is None:
            return value
        try:
            company_id = int(company)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Invalid company selected.")
        if value.company_id != company_id:
            raise serializers.ValidationError("Customer must belong to the selected company.")
        return value


class PaymentLinkSerializer(serializers.ModelSerializer):
    invoice_detail = InvoiceSerializer(source='invoice', read_only=True)
    payment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentLink
        fields = ["id", "invoice", "invoice_detail", "token", "expires_at", "is_used", "payment_url", "created_at", "updated_at"]
        read_only_fields = ["token", "created_at", "updated_at"]

    def get_payment_url(self, obj):
        if not obj.is_used:
            return f"/payment/{obj.token}"
        return None


class PaymentLinkCreateSerializer(serializers.Serializer):
    invoice = serializers.PrimaryKeyRelatedField(queryset=Invoice.objects.all())
    expires_in_days = serializers.IntegerField(default=30, min_value=1, max_value=365)

    def validate_invoice(self, value):
        """Ensure the invoice belongs to the user's company"""
        request = self.context.get('request')
        if request and value.company.owner != request.user:
            raise serializers.ValidationError("You can only create payment links for your own invoices.")
        if value.status == 'paid':
            raise serializers.ValidationError("Cannot create payment link for already paid invoice.")
        return value

    def create(self, validated_data):
        invoice = validated_data['invoice']
        expires_in_days = validated_data.get('expires_in_days', 30)
        expires_at = timezone.now() + timedelta(days=expires_in_days)
        
        # Check if payment link already exists
        payment_link, created = PaymentLink.objects.get_or_create(
            invoice=invoice,
            defaults={
                'expires_at': expires_at,
                'is_used': False
            }
        )
        
        if not created:
            # Update existing link
            payment_link.expires_at = expires_at
            payment_link.is_used = False
            payment_link.save()
        
        return payment_link
