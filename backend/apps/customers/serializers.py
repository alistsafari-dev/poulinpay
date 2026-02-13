from rest_framework import serializers
from .models import Customer
from companies.serializers import CompanySerializer

class CustomerSerializer(serializers.ModelSerializer):
    company_detail = CompanySerializer(source='company', read_only=True)
    invoice_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ["id", "company", "company_detail", "full_name", "phone", "email", "invoice_count", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def get_invoice_count(self, obj):
        return obj.invoices.count()


class CustomerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["company", "full_name", "phone", "email"]
        
    def validate_company(self, value):
        """Ensure the company belongs to the current user"""
        request = self.context.get('request')
        if request and value.owner != request.user:
            raise serializers.ValidationError("You can only add customers to your own companies.")
        return value
