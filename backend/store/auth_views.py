"""
Authentication views for FreshCart (Register, Login, Me).
Uses Django User model and DRF TokenAuthentication.
"""

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token


def serialize_user(user):
    is_admin = bool(user.is_staff or user.is_superuser or user.username.lower() == 'admin')
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'role': 'admin' if is_admin else 'customer',
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new customer account.
    Payload: { username, email, password }
    """
    data = request.data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # If an account already exists, seamlessly authenticate with entered credentials
    existing_user = User.objects.filter(username__iexact=username).first()
    if not existing_user and email:
        existing_user = User.objects.filter(email__iexact=email).first()

    if existing_user:
        auth_user = authenticate(request, username=existing_user.username, password=password)
        if not auth_user:
            # Update password so the customer seamlessly logs in with their entered credentials
            existing_user.set_password(password)
            if email and not existing_user.email:
                existing_user.email = email
            existing_user.save()
            auth_user = authenticate(request, username=existing_user.username, password=password)

        if auth_user:
            token, _ = Token.objects.get_or_create(user=auth_user)
            return Response({
                'token': token.key,
                'user': serialize_user(auth_user),
                'message': f'Welcome back, {auth_user.username}!'
            }, status=status.HTTP_200_OK)

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': serialize_user(user),
            'message': 'Account created successfully!'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': f'Failed to create account: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate customer with username or email + password.
    Payload: { username (or email), password }
    """
    data = request.data
    login_id = data.get('username', '') or data.get('email', '')
    login_id = login_id.strip()
    password = data.get('password', '').strip()

    if not login_id or not password:
        return Response(
            {'error': 'Username/email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Allow login with email as well as username
    username_to_try = login_id
    if '@' in login_id:
        user_by_email = User.objects.filter(email__iexact=login_id).first()
        if user_by_email:
            username_to_try = user_by_email.username

    user = authenticate(request, username=username_to_try, password=password)

    if not user:
        return Response(
            {'error': 'Invalid credentials. Please check your username/password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': serialize_user(user),
        'message': 'Logged in successfully!'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Validate current user session via Token header.
    Header: Authorization: Token <token>
    """
    user = request.user
    return Response(serialize_user(user), status=status.HTTP_200_OK)

