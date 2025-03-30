from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP
from .models import Order, Trade

class OrderSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    quantity = serializers.IntegerField(min_value=1)
    order_type = serializers.ChoiceField(choices=['BID', 'ASK'])
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'price', 'quantity', 'order_type', 'timestamp', 'is_active']
        read_only_fields = ['id', 'user', 'timestamp', 'is_active']
        extra_kwargs = {
            'timestamp': {'format': '%Y-%m-%dT%H:%M:%S.%fZ'}
        }

    def validate(self, data):
        """
        Additional validation for the order
        """
        if 'price' in data and 'quantity' in data:
            # Check if total order value is not too large
            total_value = data['price'] * data['quantity']
            max_value = Decimal('1000000000')
            if total_value > max_value:
                raise serializers.ValidationError(
                    f"Total order value ({total_value}) exceeds maximum allowed ({max_value})"
                )
                     
        return data

class TradeSerializer(serializers.ModelSerializer):
    bid_user = serializers.StringRelatedField()
    ask_user = serializers.StringRelatedField()
    taker_side = serializers.ChoiceField(choices=['BID', 'ASK'])
    
    class Meta:
        model = Trade
        fields = ['id', 'bid_user', 'ask_user', 'price', 'quantity', 'timestamp', 'taker_side']
        read_only_fields = ['timestamp']
        extra_kwargs = {
            'timestamp': {'format': '%Y-%m-%dT%H:%M:%S.%fZ'}
        }

class OrderBookSerializer(serializers.Serializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_quantity = serializers.DecimalField(max_digits=10, decimal_places=2) 