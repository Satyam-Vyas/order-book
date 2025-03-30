from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import authenticate, get_user_model  # Use get_user_model to dynamically get the custom user model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer

# Get the custom user model
User = get_user_model()

@api_view(['POST'])
def signup(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        access_token = CustomTokenObtainPairSerializer.get_token(user).access_token
        return Response({
            'refresh': str(refresh),
            'access': str(access_token),
        })
    return Response({"error": serializer.errors}, status=400)

@api_view(['POST'])
def login(request):
    email = request.data.get('email')  
    password = request.data.get('password')
    try:
        # Find the user by email
        user = User.objects.get(email=email) 
        user = authenticate(username=user.username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            access_token = CustomTokenObtainPairSerializer.get_token(user).access_token
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
            })
    except User.DoesNotExist:
        pass  

    return Response({"error": "Invalid credentials"}, status=401)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer