"""
Django Admin configurations for FreshCart store.
"""

from django.contrib import admin
from .models import Category, Product, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'display_order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'slug']
    ordering = ['display_order', 'name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'category',
        'price',
        'original_price',
        'unit',
        'stock_quantity',
        'freshness_tag',
        'is_organic',
        'rating',
        'is_featured',
    ]
    list_filter = ['category', 'is_organic', 'is_featured', 'freshness_tag']
    search_fields = ['name', 'tagline', 'description']
    list_editable = ['price', 'original_price', 'stock_quantity', 'is_featured']
    ordering = ['-is_featured', 'name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_unit', 'price', 'quantity', 'item_total']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'customer_name',
        'customer_phone',
        'delivery_slot',
        'subtotal',
        'delivery_fee',
        'total_amount',
        'payment_method',
        'status',
        'created_at',
    ]
    list_filter = ['status', 'payment_method', 'delivery_slot', 'created_at']
    search_fields = ['order_number', 'customer_name', 'customer_phone', 'delivery_address']
    readonly_fields = ['order_number', 'subtotal', 'delivery_fee', 'total_amount', 'created_at']
    inlines = [OrderItemInline]
    ordering = ['-created_at']
