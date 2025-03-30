# Order Book Application

A real-time order book application for a single token (eg. RELIANCE), featuring bidding and asking orders with a clean, responsive UI. The application allows users to view the order book, place orders, and see trade history.

**The client and server setup guide is available in this readme.md**

## Features

- **Real-time Order Book**: View current bids and asks sorted by timestamp
- **Trade History**: Track completed trades with filtering options
- **Order Placement**: Submit bid or ask orders with price and quantity
- **JWT Authentication**: Secure login system with token refresh
- **Responsive Design**: Works on both desktop and mobile devices
- **Order Book Management**: Place bid/ask orders with price-time priority matching
- **Trade Execution**: Automatic order matching and trade execution

## Frontend Application

### Frontend Setup

1. Clone this repository:
   ```
   git clone <order-book-repo-url>
   cd <client>
   ```

2. Install dependencies:
   to install bun, you can simply run
   ```
   npm install -g bun
   ```
   then run
   ```
   bun install
   ```

   if you want to use npm -> 
   Note: Some dependencies may have not yet been upadated to support React 19. If you get any errors about depencency compatability, run the following:

   ```
   npm install --legacy-peer-deps
   ```

3. Configure environment variables in client directory:
   - Create a `.env.local` file in the **client directory** with the following setup
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/users
   NEXT_PUBLIC_TRADING_API_BASE_URL=http://localhost:8000/api/trading
   ```
   or set it to the actual backend base url in production.

## Running the Application

1. Start the development server:
   ```
   bun run dev
   ```
   or
   ```
   npm run dev
   ```

2. The application will be available at `http://localhost:3000`

## Architecture

The application follows a modern React application architecture:

- **React Context API**: Global state management for orders and trades
- **Shadcn UI Components**: Consistent and accessible UI components
- **OrderContext**: Central state manager for order book and trade history data
- **OrderBook Component**: Displays current bids and asks with pagination
- **TradeHistory Component**: Shows completed trades with time filtering

## Assumptions and Limitations

- **Single Token**: The application is designed for a single token (RELIANCE) and would need modification to support multiple tokens
- **Infinite Balance**: All users have unlimited balance to place orders, simplifying the order placement process
- **Page Refreshes**: Data is refreshed manually via the refresh button, rather than using WebSockets for real-time updates
- **Limited Validation**: Basic validation is implemented but could be enhanced for production use

### Code Organization

The codebase is organized following best practices:

- **Type Safety**: TypeScript used throughout for type checking
- **Utility Functions**: Common functions are abstracted into utilities
- **API Layer**: API calls are centralized in dedicated functions 

## Backend Application

## Technology Stack

- **Backend**: Django + Django REST Framework
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: SQLite (default, configurable)

## Setup Instructions

## Database Configuration

By default, this project uses SQLite for simplicity. To change to a different database system:

1. **Update the DATABASES setting in `order_book_backend/order_book_backend/settings.py`**:

```python
# For PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database_name',
        'USER': 'your_database_user',
        'PASSWORD': 'your_database_password',
        'HOST': 'localhost',  # or your database host
        'PORT': '5432',       # default PostgreSQL port
    }
}
```

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Backend Setup

1. **Clone the repository & reach the server directory**

```bash
cd server
```

2. **Create and activate a virtual environment**

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Setup environment variables(in server directory)**

```bash
# Create a .env file in the server directory with the following settings:

# Django settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=300  # 5 hours
JWT_REFRESH_TOKEN_LIFETIME_DAYS=5      # 5 days

# CORS Settings
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

4. **Install dependencies**

```bash
pip install -r requirements.txt
```

5. **Reach the order_book_backend directory inside server directory for the further setup**

```bash
cd /order_book_backend
```

6. **Run migrations**

```bash
cd order_book_backend
python manage.py migrate
```

7. **Create a superuser (admin)**

```bash
python manage.py createsuperuser
```

8. **Run the development server**

```bash
python manage.py runserver
```

The API will be available at http://localhost:8000/

## API Endpoints

### Authentication

- `POST /api/users/signup/`: Register a new user
- `POST /api/users/login/`: Log in and get tokens
- `POST /api/users/token/`: given credentials, gets JWT tokens
- `POST /api/users/token/refresh/`: Refresh JWT token

### Trading

- `POST /api/trading/orders/`: Place a new order
- `GET /api/trading/orderbook/`: Get current order book
- `GET /api/trading/trades/`: Get recent trades (last 24 hours)

## API Usage Examples

### Register a User

```bash
curl -X POST http://localhost:8000/api/users/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "trader1",
    "email": "trader1@example.com",
    "password": "SecureP@ss123"
  }'
```

### Place an Order

```bash
curl -X POST http://localhost:8000/api/trading/orders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "order_type": "BID",
    "price": "100.00",
    "quantity": 10
  }'
```

### Get Order Book

```bash
curl -X GET http://localhost:8000/api/trading/orderbook/ \
  -H "Authorization: Bearer <your-access-token>"
```

## Assumptions and Limitations

1. **User Balances**:
   - No pre-trade validation of user balances is performed
   - Trades execute regardless of user balance

2. **Performance**:
   - The system is optimized for a moderate trading volume
   - Current design uses database transactions for safety over raw speed

3. **Data Persistence**:
   - Using SQLite for simplicity (can be replaced with PostgreSQL for production)

4. **Security**:
   - Basic JWT authentication implemented


## Design Approach

### Order Matching Logic

The order matching system was implemented using a price-time priority model with price improvement:
1. BID orders match with ASK orders at or below the bid price
2. ASK orders match with BID orders at or above the ask price
3. For orders at the same price level, matching is based on time priority (FIFO)
4. Price improvement: BID orders will match with the lowest available ASK price
5. Price improvement: ASK orders will match with the highest available BID price
6. Each match results in a trade executed at the maker's price (the pre-existing order)

### Database Design

- **Order Model**: Stores all buy/sell orders with price, quantity, and status
- **Trade Model**: Records executed trades with references to matched orders
- **User Model**: Custom user model with balance information

### Performance Considerations

1. **Indexing Strategy**:
   - Orders are indexed by order_type, price, and timestamp for efficient matching
   - Trades are indexed by timestamp for quick retrieval of recent trades

2. **Transaction Safety**:
   - Order matching is wrapped in database transactions for atomic operations
   - Prevents race conditions in high-concurrency scenarios

### Validation and Error Handling

1. **Input Validation**:
   - Price must be positive decimal with up to 2 decimal places
   - Quantity must be positive integer
   - Order type must be either BID or ASK

2. **Error Handling**:
   - Comprehensive validation and error messages
   - Structured error responses for API endpoints