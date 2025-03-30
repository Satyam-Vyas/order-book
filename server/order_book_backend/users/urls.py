from django.urls import path
from .views import signup, login
from .views import CustomTokenObtainPairView, CustomTokenRefreshView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
]
