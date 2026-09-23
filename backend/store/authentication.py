"""
Custom authentication classes for FreshCart.
Ensures DRF gracefully handles non-Django tokens (like Firebase ID tokens, SSO tokens)
without throwing 401 on AllowAny public endpoints.
"""

from rest_framework.authentication import TokenAuthentication
from rest_framework import exceptions


class SafeTokenAuthentication(TokenAuthentication):
    """
    Tolerant TokenAuthentication:
    If an Authorization: Token <key> is sent that is not in the Django authtoken database,
    it returns None (anonymous user) instead of raising AuthenticationFailed, so that
    views with permission_classes=[AllowAny] (e.g. Products, Categories, Orders)
    remain accessible to all clients.
    """

    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related('user').get(key=key)
        except Exception:
            # Token does not exist in Django DB (e.g. Firebase JWT or guest token).
            # Return None so DRF falls back to AnonymousUser without rejecting AllowAny requests.
            return None

        if not token.user.is_active:
            return None

        return (token.user, token)
