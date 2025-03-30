from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()

class Order(models.Model):
    ORDER_TYPES = [
        ('BID', 'Buy Order'),
        ('ASK', 'Sell Order'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    order_type = models.CharField(max_length=3, choices=ORDER_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['order_type', 'is_active', 'price', 'timestamp'], 
                        name='idx_ask_matching'),
            models.Index(fields=['order_type', 'is_active', '-price', 'timestamp'],
                        name='idx_bid_matching'),
        ]

    def __str__(self):
        return f"{self.get_order_type_display()} - {self.quantity} @ {self.price} by {self.user.username}"


class Trade(models.Model):
    TAKER_SIDES = [
        ('BID', 'Bid was taker'),
        ('ASK', 'Ask was taker'),
    ]

    bid_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bid_trades')
    ask_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ask_trades')
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    timestamp = models.DateTimeField(auto_now_add=True)
    bid_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='bid_trades')
    ask_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='ask_trades')
    taker_side = models.CharField(max_length=3, choices=TAKER_SIDES, default='BID')

    class Meta:
        indexes = [
            models.Index(fields=['-timestamp'], name='idx_trade_time'),
        ]

    def __str__(self):
        return f"Trade: {self.quantity} @ {self.price} between {self.bid_user.username} and {self.ask_user.username}"
