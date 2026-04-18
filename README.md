# Dhan Kill Switch - Proof of Concept

A minimal Python proof of concept that monitors a Dhan trading account and detects when user-defined risk limits are breached.

## What this does

1. Authenticates with Dhan API
2. Fetches current positions (with realized/unrealized P&L)
3. Fetches today's trades
4. Evaluates simple rules (max loss, max profit, max trades)
5. Prints `TRIGGERED` when a limit is hit

## Setup

### Prerequisites
- Python 3.8+
- Dhan trading account
- Dhan API credentials

### Installation

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Dhan credentials:
   - `DHAN_CLIENT_ID`: Your Dhan client ID
   - `DHAN_ACCESS_TOKEN`: Your Dhan access token

### Getting Dhan credentials

1. Log into Dhan: https://dhanhq.co
2. Go to API section
3. Generate access token (valid for 24 hours)
4. Note your client ID

## Usage

```powershell
# Activate virtual environment if not already active
.\venv\Scripts\Activate.ps1

# Run the proof of concept
python poc.py
```

## What happens

The script will:
- Connect to Dhan
- Fetch your current positions
- Calculate total P&L (realized + unrealized)
- Fetch today's trades
- Check against sample rules:
  - Max loss: -5000
  - Max profit: +3000
  - Max trades: 10
- Print `TRIGGERED` if any limit is breached

## Next steps

After this POC works:
1. Add token refresh logic
2. Add continuous monitoring (polling loop)
3. Add real-time order updates (Postback/WebSocket)
4. Implement actual kill workflow (cancel orders → exit positions → kill switch)
5. Add database for state and audit logs
6. Build FastAPI backend
