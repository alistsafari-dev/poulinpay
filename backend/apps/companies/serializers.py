from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for nested display"""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name']
        read_only_fields = fields

class CompanySerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source='owner', read_only=True)
    customer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = ["id", "name", "owner", "owner_detail", "customer_count", "created_at", "updated_at"]
        read_only_fields = ["owner", "created_at", "updated_at"]

    def get_customer_count(self, obj):
        return obj.customers.count()


class CompanyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["name"]
        
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
