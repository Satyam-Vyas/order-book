from django.urls import path
from .views import PlaceOrderView, OrderBookView, TradesView

urlpatterns = [
    path('orders/', PlaceOrderView.as_view(), name='place-order'),
    path('orderbook/', OrderBookView.as_view(), name='orderbook'),
    path('trades/', TradesView.as_view(), name='trades'),
] 