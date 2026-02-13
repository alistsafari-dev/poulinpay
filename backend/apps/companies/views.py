from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Company
from .serializers import CompanySerializer, CompanyCreateSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing companies.
    Users can only access their own companies.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return CompanyCreateSerializer
        return CompanySerializer

    def get_queryset(self):
        """Filter companies to only show those owned by the current user"""
        return Company.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        self.perform_create(create_serializer)
        company = create_serializer.instance
        response_serializer = CompanySerializer(company, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Automatically set the owner to the current user"""
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for a company"""
        company = self.get_object()
        stats = {
            'total_customers': company.customers.count(),
            'total_invoices': company.invoices.count(),
            'pending_invoices': company.invoices.filter(status='pending').count(),
            'paid_invoices': company.invoices.filter(status='paid').count(),
            'total_revenue': sum(inv.total_amount for inv in company.invoices.filter(status='paid')),
        }
        return Response(stats)
