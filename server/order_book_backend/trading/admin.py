from django.contrib import admin
from .models import Order, Trade

# Register models with basic admin interface
admin.site.register(Order)
admin.site.register(Trade)
