"""
Database models for FreshCart e-commerce platform.
"""

from django.db import models
from django.utils.text import slugify
import uuid


class Category(models.Model):
    """
    Produce Category (e.g., Fresh Fruits, Leafy Greens, Daily Veggies, Exotic).
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='leaf', help_text="Emoji or icon identifier")
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.icon} {self.name}"


class Product(models.Model):
    """
    Farm-fresh produce item with localized Indian pricing (₹ INR),
    unit metrics (kg, 500g, bunch, box), and organic certification metadata.
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=255, blank=True, help_text="Short hook, e.g. 'Crisp, sweet, directly from Shimla orchards'")
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Current price in ₹ INR")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Original price for strikethrough discount")
    unit = models.CharField(max_length=50, default='1 kg', help_text="Unit metric e.g., '1 kg', '500g', 'bunch', 'box'")
    stock_quantity = models.PositiveIntegerField(default=50)
    freshness_tag = models.CharField(max_length=100, default='Fresh Harvest', help_text="e.g. 'Just Harvested', 'GI Tagged', 'Pesticide Free'")
    is_organic = models.BooleanField(default=True)
    image_url = models.CharField(max_length=2000, blank=True, default='/fruits/apples.jpg', help_text="High-resolution image URL or uploaded image path")
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8)
    review_count = models.PositiveIntegerField(default=128)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-is_featured', 'name']

    @property
    def discount_percentage(self):
        if self.original_price and self.original_price > self.price:
            diff = self.original_price - self.price
            return int(round((diff / self.original_price) * 100))
        return 0

    def __str__(self):
        return f"{self.name} ({self.unit}) - ₹{self.price}"


class Order(models.Model):
    """
    Customer order with address, delivery slot, and live payment methods (UPI, CARD, COD).
    """
    STATUS_CHOICES = [
        ('CONFIRMED', 'Order Confirmed'),
        ('PACKING', 'Packing at Farm Hub'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('UPI', 'UPI (Google Pay, PhonePe, Paytm)'),
        ('CARD', 'Credit / Debit Card'),
        ('COD', 'Cash on Delivery (COD)'),
    ]

    order_number = models.CharField(max_length=32, unique=True, editable=False)
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)
    delivery_address = models.TextField()
    delivery_slot = models.CharField(
        max_length=120,
        default='Express Delivery: Within 2 Hours',
        help_text="Selected delivery slot window"
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, default='UPI')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='CONFIRMED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate human-friendly order reference like FC-2026-A8F29B
            random_suffix = uuid.uuid4().hex[:6].upper()
            self.order_number = f"FC-2026-{random_suffix}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} - {self.customer_name} (₹{self.total_amount})"


class OrderItem(models.Model):
    """
    Snapshot of product line item within an order.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    product_unit = models.CharField(max_length=50, default='1 kg')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    item_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def save(self, *args, **kwargs):
        self.item_total = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} x {self.quantity} (₹{self.item_total})"
