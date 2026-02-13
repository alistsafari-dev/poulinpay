from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, PaymentLink
from .serializers import (
    InvoiceSerializer, 
    InvoiceCreateSerializer,
    PaymentLinkSerializer,
    PaymentLinkCreateSerializer
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    Users can only access invoices of their own companies.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__full_name', 'customer__email']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'company', 'customer']

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def get_queryset(self):
        """Filter invoices to only show those belonging to user's companies"""
        user_companies = self.request.user.owned_companies.all()
        return Invoice.objects.filter(company__in=user_companies)

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        self.perform_create(create_serializer)
        invoice = create_serializer.instance
        response_serializer = InvoiceSerializer(invoice, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def create_payment_link(self, request, pk=None):
        """Create a payment link for this invoice"""
        invoice = self.get_object()
        serializer = PaymentLinkCreateSerializer(
            data={
                'invoice': invoice.id,
                'expires_in_days': request.data.get('expires_in_days', 30)
            },
            context={'request': request}
        )
        
        if serializer.is_valid():
            payment_link = serializer.save()
            return Response(
                PaymentLinkSerializer(payment_link).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentLinkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment links.
    Users can only access payment links of their own invoices.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentLinkCreateSerializer
        return PaymentLinkSerializer

    def get_queryset(self):
        """Filter payment links to only show those belonging to user's invoices"""
        user_companies = self.request.user.owned_companies.all()
        return PaymentLink.objects.filter(invoice__company__in=user_companies)

    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """Verify if a payment link is valid"""
        payment_link = self.get_object()
        from datetime import datetime
        
        is_valid = (
            not payment_link.is_used and
            payment_link.expires_at > datetime.now(payment_link.expires_at.tzinfo)
        )
        
        return Response({
            'valid': is_valid,
            'is_used': payment_link.is_used,
            'expires_at': payment_link.expires_at,
            'invoice': InvoiceSerializer(payment_link.invoice).data
        })
