from rest_framework import viewsets, permissions, filters
from .models import Customer
from .serializers import CustomerSerializer, CustomerCreateSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customers.
    Users can only access customers of their own companies.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'phone']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        return CustomerSerializer

    def get_queryset(self):
        """Filter customers to only show those belonging to user's companies"""
        user_companies = self.request.user.owned_companies.all()
        return Customer.objects.filter(company__in=user_companies)
