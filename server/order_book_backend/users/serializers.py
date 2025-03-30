from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.validators import EmailValidator
from rest_framework.validators import UniqueValidator
import re
from .models import CustomUser

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        try:
            token = super().get_token(user)
            token['name'] = user.username
            token['email'] = user.email
            token['balance'] = user.balance  
            return token
        except Exception as e:
            raise serializers.ValidationError(f"Error generating token: {str(e)}")

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        if not attrs.get('refresh'):
            raise serializers.ValidationError({
                "refresh": "No refresh token provided."
            })

        try:
            data = super().validate(attrs)
            refresh = RefreshToken(attrs['refresh'])
            user_id = refresh.get('user_id')

            if not user_id:
                raise serializers.ValidationError({
                    "token": "Invalid token format - missing user ID."
                })

            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({
                    "user": "User no longer exists in the system."
                })
            
            access_token = refresh.access_token
            access_token['name'] = user.username
            access_token['email'] = user.email
            access_token['balance'] = user.balance
            
            data['access'] = str(access_token)
            return data

        except Exception as e:
            raise serializers.ValidationError({
                "token": f"Error refreshing token: {str(e)}"
            })
    
class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            EmailValidator(),
            UniqueValidator(
                queryset=CustomUser.objects.all(),
                message="A user with this email already exists."
            )
        ]
    )
    balance = serializers.IntegerField(min_value=0, required=False)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'balance']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True},
            'balance': {'read_only': True}  
        }

    def create(self, validated_data):
        try:
            user = CustomUser.objects.create_user(**validated_data)
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Error creating user: {str(e)}")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return data