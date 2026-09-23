"""
URL routing for store API endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, OrderViewSet, upload_image_view
from . import auth_views

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    # Image upload endpoint
    path('upload/', upload_image_view, name='upload-image'),

    # Authentication endpoints
    path('auth/register/', auth_views.register_view, name='auth-register'),
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/me/', auth_views.me_view, name='auth-me'),

    # REST resources
    path('', include(router.urls)),
]
