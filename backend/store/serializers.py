"""
DRF Serializers for FreshCart models.
"""

from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Category, Product, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'display_order', 'products_count']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    discount_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'category_slug',
            'name',
            'tagline',
            'description',
            'price',
            'original_price',
            'discount_percentage',
            'unit',
            'stock_quantity',
            'freshness_tag',
            'is_organic',
            'image_url',
            'rating',
            'review_count',
            'is_featured',
            'created_at',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_unit',
            'price',
            'quantity',
            'item_total',
        ]
        read_only_fields = ['id', 'item_total']


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = OrderItemInputSerializer(many=True, write_only=True, required=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'customer_name',
            'customer_phone',
            'customer_email',
            'delivery_address',
            'delivery_slot',
            'subtotal',
            'delivery_fee',
            'total_amount',
            'payment_method',
            'status',
            'notes',
            'created_at',
            'items',
            'order_items',
        ]
        read_only_fields = [
            'id',
            'order_number',
            'subtotal',
            'delivery_fee',
            'total_amount',
            'status',
            'created_at',
            'items',
        ]

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')

        if not order_items_data:
            raise serializers.ValidationError({"order_items": "Order must contain at least one item."})

        with transaction.atomic():
            subtotal = Decimal('0.00')
            items_to_create = []

            for item_data in order_items_data:
                product_id = item_data['product_id']
                quantity = item_data['quantity']

                try:
                    product = Product.objects.select_for_update().get(id=product_id)
                except Product.DoesNotExist:
                    raise serializers.ValidationError(
                        {"order_items": f"Product with id {product_id} does not exist."}
                    )

                if product.stock_quantity < quantity:
                    raise serializers.ValidationError(
                        {"order_items": f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {quantity}."}
                    )

                line_price = product.price
                line_total = line_price * quantity
                subtotal += line_total

                # Deduct inventory
                product.stock_quantity -= quantity
                product.save(update_fields=['stock_quantity'])

                items_to_create.append({
                    'product': product,
                    'product_name': product.name,
                    'product_unit': product.unit,
                    'price': line_price,
                    'quantity': quantity,
                    'item_total': line_total,
                })

            # Free delivery threshold: Free above ₹299, otherwise ₹40 delivery fee
            free_delivery_threshold = Decimal('299.00')
            delivery_fee = Decimal('0.00') if subtotal >= free_delivery_threshold else Decimal('40.00')
            total_amount = subtotal + delivery_fee

            order = Order.objects.create(
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total_amount=total_amount,
                **validated_data
            )

            for item in items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=item['product'],
                    product_name=item['product_name'],
                    product_unit=item['product_unit'],
                    price=item['price'],
                    quantity=item['quantity'],
                    item_total=item['item_total'],
                )

            return order
