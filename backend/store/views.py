"""
API ViewSets for FreshCart.
"""

import os
import uuid
from django.conf import settings
from rest_framework import viewsets, filters, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from .models import Category, Product, Order
from .serializers import CategorySerializer, ProductSerializer, OrderSerializer


class StandardProducePagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 200


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows categories to be viewed.
    """
    queryset = Category.objects.all().prefetch_related('products')
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for browsing and managing organic farm produce.
    Supports full CRUD operations (List, Retrieve, Create, Update, Delete).
    """
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    pagination_class = StandardProducePagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_organic', 'is_featured', 'category__slug']
    search_fields = ['name', 'tagline', 'description', 'freshness_tag', 'category__name']
    ordering_fields = ['price', 'rating', 'created_at', 'name']
    ordering = ['-is_featured', '-rating']

    def get_queryset(self):
        queryset = super().get_queryset()
        include_out_of_stock = self.request.query_params.get('include_out_of_stock', 'false').lower() == 'true'
        if not include_out_of_stock and self.action == 'list':
            queryset = queryset.filter(stock_quantity__gt=0)

        # Direct query param shorthand: ?category=fruits
        category_param = self.request.query_params.get('category', None)
        if category_param:
            if category_param.isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(category__slug=category_param)
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for placing orders and querying order confirmation.
    """
    queryset = Order.objects.prefetch_related('items__product').all()
    serializer_class = OrderSerializer
    lookup_field = 'order_number'
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='track/(?P<order_number>[^/.]+)')
    def track_order(self, request, order_number=None):
        """
        Lookup order tracking details by order number (e.g. FC-2026-AB12CD).
        """
        try:
            order = Order.objects.prefetch_related('items').get(order_number=order_number)
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {"error": f"Order with reference '{order_number}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_image_view(request):
    """
    API endpoint to upload produce images.
    Saves file into MEDIA_ROOT/products/ and returns absolute & relative URLs.
    """
    upload_file = request.FILES.get('image') or request.FILES.get('file')
    if not upload_file:
        return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(upload_file.name)[1].lower()
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
    if ext not in allowed_extensions:
        return Response(
            {'error': f'Invalid file format ({ext}). Supported formats: JPG, PNG, WEBP, GIF, SVG.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    products_media_dir = os.path.join(settings.MEDIA_ROOT, 'products')
    os.makedirs(products_media_dir, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(upload_file.name))[0]
    safe_base = "".join(c for c in base_name if c.isalnum() or c in ('-', '_')).rstrip()[:30] or 'produce'
    unique_name = f"{safe_base}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(products_media_dir, unique_name)

    with open(file_path, 'wb+') as destination:
        for chunk in upload_file.chunks():
            destination.write(chunk)

    relative_url = f"{settings.MEDIA_URL}products/{unique_name}"
    absolute_url = request.build_absolute_uri(relative_url)

    return Response({
        'url': absolute_url,
        'relative_url': relative_url,
        'filename': unique_name,
    }, status=status.HTTP_201_CREATED)

