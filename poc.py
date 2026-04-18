#!/usr/bin/env python3
"""
Dhan Kill Switch - Proof of Concept

This script demonstrates the core logic:
1. Authenticate with Dhan
2. Fetch positions (realized + unrealized P&L)
3. Fetch today's trades
4. Evaluate risk rules
5. Print TRIGGERED when limits are breached
"""

import os
from dotenv import load_dotenv
from dhanhq import dhanhq

# Load environment variables
load_dotenv()

# Configuration
DHAN_CLIENT_ID = os.getenv('DHAN_CLIENT_ID')
DHAN_ACCESS_TOKEN = os.getenv('DHAN_ACCESS_TOKEN')

# Risk rules (loaded from env or defaults)
MAX_DAILY_LOSS = float(os.getenv('MAX_DAILY_LOSS', -5000))
MAX_DAILY_PROFIT = float(os.getenv('MAX_DAILY_PROFIT', 3000))
MAX_TRADES = int(os.getenv('MAX_TRADES', 10))


def authenticate():
    """Authenticate with Dhan API"""
    print("=" * 60)
    print("STEP 1: Authenticating with Dhan...")
    print("=" * 60)
    
    if not DHAN_CLIENT_ID or not DHAN_ACCESS_TOKEN:
        raise ValueError(
            "Missing credentials. Please set DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN "
            "in .env file"
        )
    
    dhan = dhanhq(DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN)
    print(f"✓ Connected with client ID: {DHAN_CLIENT_ID[:10]}...")
    print()
    return dhan


def fetch_positions(dhan):
    """Fetch current positions and calculate total P&L"""
    print("=" * 60)
    print("STEP 2: Fetching positions...")
    print("=" * 60)
    
    try:
        response = dhan.get_positions()
        
        # Handle both list response and dict response with status
        if isinstance(response, dict):
            if response.get('status') == 'failure':
                print(f"✗ API returned failure: {response.get('remarks', 'Unknown error')}")
                return None, None, None
            positions = response.get('data', [])
        elif isinstance(response, list):
            # Direct list response (newer API format)
            positions = response
        else:
            print(f"✗ Unexpected response format: {type(response)}")
            return None, None, None
        
        if not positions:
            print("No open positions found.")
            print()
            return 0.0, 0.0, 0.0
        
        # Calculate totals
        total_realized = 0.0
        total_unrealized = 0.0
        
        print(f"\nFound {len(positions)} position(s):\n")
        
        for pos in positions:
            trading_symbol = pos.get('tradingSymbol', 'N/A')
            security_id = pos.get('securityId', 'N/A')
            product_type = pos.get('productType', 'N/A')
            exchange = pos.get('exchangeSegment', 'N/A')
            position_type = pos.get('positionType', 'N/A')
            
            realized = float(pos.get('realizedProfit', 0))
            unrealized = float(pos.get('unrealizedProfit', 0))
            net_qty = pos.get('netQty', 0)
            buy_avg = pos.get('buyAvg', 0)
            sell_avg = pos.get('sellAvg', 0)
            
            total_realized += realized
            total_unrealized += unrealized
            
            print(f"  {trading_symbol} ({security_id})")
            print(f"    Exchange: {exchange} | Product: {product_type}")
            print(f"    Position: {position_type} | Net Qty: {net_qty}")
            print(f"    Buy Avg: ₹{buy_avg:.2f} | Sell Avg: ₹{sell_avg:.2f}")
            print(f"    Realized P&L: ₹{realized:.2f}")
            print(f"    Unrealized P&L: ₹{unrealized:.2f}")
            print()
        
        total_pnl = total_realized + total_unrealized
        
        print("-" * 60)
        print(f"TOTAL Realized P&L:   ₹{total_realized:.2f}")
        print(f"TOTAL Unrealized P&L: ₹{total_unrealized:.2f}")
        print(f"TOTAL Live P&L:       ₹{total_pnl:.2f}")
        print("-" * 60)
        print()
        
        return total_realized, total_unrealized, total_pnl
        
    except Exception as e:
        print(f"✗ Error fetching positions: {e}")
        import traceback
        print(f"Details: {traceback.format_exc()}")
        print()
        return None, None, None


def fetch_trades(dhan):
    """Fetch today's trades and count them"""
    print("=" * 60)
    print("STEP 3: Fetching today's trades...")
    print("=" * 60)
    
    try:
        response = dhan.get_trade_book()
        
        # Handle both list response and dict response with status
        if isinstance(response, dict):
            if response.get('status') == 'failure':
                print(f"✗ API returned failure: {response.get('remarks', 'Unknown error')}")
                return None
            trades = response.get('data', [])
        elif isinstance(response, list):
            # Direct list response (newer API format)
            trades = response
        else:
            print(f"✗ Unexpected response format: {type(response)}")
            return None
        
        trade_count = len(trades)
        
        if trade_count == 0:
            print("No trades executed today.")
            print()
            return 0
        
        print(f"\nFound {trade_count} trade(s) today:\n")
        
        for idx, trade in enumerate(trades, 1):
            trading_symbol = trade.get('tradingSymbol', 'N/A')
            security_id = trade.get('securityId', 'N/A')
            trade_type = trade.get('transactionType', 'N/A')
            qty = trade.get('tradedQuantity', trade.get('quantity', 0))
            price = trade.get('tradedPrice', trade.get('price', 0))
            exchange = trade.get('exchangeSegment', 'N/A')
            product = trade.get('productType', 'N/A')
            
            print(f"  Trade #{idx}: {trading_symbol}")
            print(f"    Type: {trade_type} | Exchange: {exchange}")
            print(f"    Product: {product}")
            print(f"    Qty: {qty} @ ₹{price}")
            print()
        
        print("-" * 60)
        print(f"TOTAL TRADES TODAY: {trade_count}")
        print("-" * 60)
        print()
        
        return trade_count
        
    except Exception as e:
        print(f"✗ Error fetching trades: {e}")
        import traceback
        print(f"Details: {traceback.format_exc()}")
        print()
        return None


def evaluate_rules(total_pnl, trade_count):
    """Evaluate risk rules and determine if kill switch should trigger"""
    print("=" * 60)
    print("STEP 4: Evaluating risk rules...")
    print("=" * 60)
    
    print(f"\nConfigured Rules:")
    print(f"  Max Daily Loss:   ₹{MAX_DAILY_LOSS:.2f}")
    print(f"  Max Daily Profit: ₹{MAX_DAILY_PROFIT:.2f}")
    print(f"  Max Trades:       {MAX_TRADES}")
    print()
    
    print(f"Current State:")
    print(f"  Live P&L:    ₹{total_pnl:.2f}")
    print(f"  Trade Count: {trade_count}")
    print()
    
    triggered = False
    trigger_reason = []
    
    # Check max loss rule
    if total_pnl <= MAX_DAILY_LOSS:
        triggered = True
        trigger_reason.append(
            f"MAX LOSS BREACHED: ₹{total_pnl:.2f} <= ₹{MAX_DAILY_LOSS:.2f}"
        )
    
    # Check max profit rule
    if total_pnl >= MAX_DAILY_PROFIT:
        triggered = True
        trigger_reason.append(
            f"MAX PROFIT REACHED: ₹{total_pnl:.2f} >= ₹{MAX_DAILY_PROFIT:.2f}"
        )
    
    # Check max trades rule
    if trade_count >= MAX_TRADES:
        triggered = True
        trigger_reason.append(
            f"MAX TRADES REACHED: {trade_count} >= {MAX_TRADES}"
        )
    
    print("-" * 60)
    
    if triggered:
        print("\n🚨 TRIGGERED 🚨\n")
        print("Reason(s):")
        for reason in trigger_reason:
            print(f"  • {reason}")
        print()
        print("In production, this would:")
        print("  1. Cancel all pending orders")
        print("  2. Exit all open positions")
        print("  3. Activate Dhan kill switch")
        print("  4. Block trading for the day")
    else:
        print("\n✓ All rules within limits - No action needed")
    
    print("-" * 60)
    print()
    
    return triggered, trigger_reason


def main():
    """Main execution flow"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  Dhan Kill Switch - Proof of Concept".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    try:
        # Step 1: Authenticate
        dhan = authenticate()
        
        # Step 2: Fetch positions and calculate P&L
        total_realized, total_unrealized, total_pnl = fetch_positions(dhan)
        
        if total_pnl is None:
            print("Failed to fetch positions. Exiting.")
            return
        
        # Step 3: Fetch trades
        trade_count = fetch_trades(dhan)
        
        if trade_count is None:
            print("Failed to fetch trades. Exiting.")
            return
        
        # Step 4: Evaluate rules
        triggered, reasons = evaluate_rules(total_pnl, trade_count)
        
        # Summary
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Status: {'🚨 TRIGGERED' if triggered else '✓ SAFE'}")
        print(f"Live P&L: ₹{total_pnl:.2f}")
        print(f"Trades: {trade_count}")
        print("=" * 60)
        print()
        
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        print()


if __name__ == "__main__":
    main()
