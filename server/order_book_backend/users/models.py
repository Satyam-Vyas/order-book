from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator

class CustomUser(AbstractUser):
    balance = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(0)]
    )