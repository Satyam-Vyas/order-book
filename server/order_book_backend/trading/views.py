from django.shortcuts import render
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Order, Trade
from .serializers import OrderSerializer, TradeSerializer, OrderBookSerializer

class PlaceOrderView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = OrderSerializer(data=request.data)
            if serializer.is_valid():
                order = serializer.save(user=request.user)
                self._try_match_order(order)
                
                return Response({
                    'message': 'Order placed successfully',
                    'order_id': order.id,
                    'order_book': self._get_order_book()
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_order_book(self):
        bids = Order.objects.filter(
            order_type='BID',
            is_active=True
        ).order_by('-price', 'timestamp')

        asks = Order.objects.filter(
            order_type='ASK',
            is_active=True
        ).order_by('price', 'timestamp')

        return {
            'bids': OrderSerializer(bids, many=True).data,
            'asks': OrderSerializer(asks, many=True).data
        }

    @transaction.atomic
    def _try_match_order(self, order):
        """
        matching the new order with existing orders.
        For BID: Matching with ASK orders at or below the bid price
        For ASK: Matching with BID orders at or above the ask price
        Within same price level, FIFO (First In, First Out)
        """
        try:
            if order.order_type == 'BID':
                matching_orders = Order.objects.select_for_update().filter(
                    order_type='ASK',
                    price__lte=order.price,  
                    is_active=True
                ).exclude(user=order.user).order_by('price', 'timestamp')  # Price-time priority: lowest price first, then oldest
            else:
                
                matching_orders = Order.objects.select_for_update().filter(
                    order_type='BID',
                    price__gte=order.price,  
                    is_active=True
                ).exclude(user=order.user).order_by('-price', 'timestamp')  # Price-time priority: highest price first, then oldest

            remaining_quantity = order.quantity  
            for matching_order in matching_orders:
                if remaining_quantity <= 0:
                    break

                match_quantity = min(remaining_quantity, matching_order.quantity)
                
                execution_price = matching_order.price
                
                if order.order_type == 'BID':
                    Trade.objects.create(
                        bid_user=order.user,
                        ask_user=matching_order.user,
                        bid_order=order,
                        ask_order=matching_order,
                        price=execution_price,
                        quantity=match_quantity,
                        taker_side='BID'
                    )
                else:
                    Trade.objects.create(
                        bid_user=matching_order.user,
                        ask_user=order.user,
                        bid_order=matching_order,
                        ask_order=order,
                        price=execution_price,
                        quantity=match_quantity,
                        taker_side='ASK'
                    )

                # Update matching order
                matching_order.quantity -= match_quantity
                if matching_order.quantity <= 0:
                    matching_order.is_active = False
                matching_order.save()

                # Update remaining quantity for new order
                remaining_quantity -= match_quantity

            order.quantity = remaining_quantity
            if remaining_quantity <= 0:
                order.is_active = False
            order.save()

            # If no matches were found or order partially filled, keep it active
            if remaining_quantity > 0:
                order.is_active = True
                order.save()

        except Exception as e:
            print(f"Error in order matching: {str(e)}")
            raise

class OrderBookView(views.APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']  # Only allow GET requests

    def get(self, request):
        """Get the current order book state."""
        try:
            bids = Order.objects.filter(
                order_type='BID',
                is_active=True
            ).order_by('-price', 'timestamp')

            asks = Order.objects.filter(
                order_type='ASK',
                is_active=True
            ).order_by('price', 'timestamp')

            return Response({
                'bids': OrderSerializer(bids, many=True).data,
                'asks': OrderSerializer(asks, many=True).data
            })
        except Exception as e:
            return Response(
                {"error": f"Error retrieving order book: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TradesView(views.APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']  # Only allow GET requests

    def get(self, request):
        """Gets all trades from the last 24 hours."""
        try:
            last_24_hours = timezone.now() - timedelta(days=1)
            trades = Trade.objects.filter(
                timestamp__gte=last_24_hours
            ).order_by('-timestamp')
            
            return Response(TradeSerializer(trades, many=True).data)
        except Exception as e:
            return Response(
                {"error": f"Error retrieving trades: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
