# Technical Notes - Dhan API Structure

## Positions API Structure

### Endpoint
```
GET https://api.dhan.co/v2/positions
Headers:
  - Content-Type: application/json
  - access-token: JWT
```

### Response Format
The API returns a **list of position objects** (not wrapped in a status/data structure).

### Position Object Structure

```json
{
  "dhanClientId": "1000000009",
  "tradingSymbol": "TCS",
  "securityId": "11536",
  "positionType": "LONG",
  "exchangeSegment": "NSE_EQ",
  "productType": "CNC",
  "buyAvg": 3345.8,
  "buyQty": 40,
  "costPrice": 3215.0,
  "sellAvg": 0.0,
  "sellQty": 0,
  "netQty": 40,
  "realizedProfit": 0.0,
  "unrealizedProfit": 6122.0,
  "rbiReferenceRate": 1.0,
  "multiplier": 1,
  "carryForwardBuyQty": 0,
  "carryForwardSellQty": 0,
  "carryForwardBuyValue": 0.0,
  "carryForwardSellValue": 0.0,
  "dayBuyQty": 40,
  "daySellQty": 0,
  "dayBuyValue": 133832.0,
  "daySellValue": 0.0,
  "drvExpiryDate": "0001-01-01",
  "drvOptionType": null,
  "drvStrikePrice": 0.0,
  "crossCurrency": false
}
```

### Key Fields for Our Use Case

#### Identity Fields
- `tradingSymbol` - Stock/instrument symbol (e.g., "TCS")
- `securityId` - Unique security identifier
- `exchangeSegment` - Exchange (e.g., "NSE_EQ", "BSE_EQ", "NSE_FNO")
- `productType` - Product type:
  - `CNC` - Cash and Carry (delivery)
  - `INTRADAY` - Intraday
  - `MARGIN` - Margin
  - `MTF` - Margin Trading Facility

#### Position Fields
- `positionType` - "LONG" or "SHORT"
- `netQty` - Net position quantity (positive for long, negative for short)
- `buyQty` - Total buy quantity
- `sellQty` - Total sell quantity
- `buyAvg` - Average buy price
- `sellAvg` - Average sell price
- `costPrice` - Cost price for the position

#### **Critical P&L Fields** ⭐
- `realizedProfit` - **Booked profit/loss** (already closed/squared off)
- `unrealizedProfit` - **Floating profit/loss** (still open positions)

#### Intraday vs Carry Forward
- `dayBuyQty` - Today's buy quantity
- `daySellQty` - Today's sell quantity
- `dayBuyValue` - Today's buy value
- `daySellValue` - Today's sell value
- `carryForwardBuyQty` - Carried forward buy quantity
- `carryForwardSellQty` - Carried forward sell quantity
- `carryForwardBuyValue` - Carried forward buy value
- `carryForwardSellValue` - Carried forward sell value

#### Derivative Fields (for F&O)
- `drvExpiryDate` - Expiry date for derivatives
- `drvOptionType` - Option type (CALL/PUT) if applicable
- `drvStrikePrice` - Strike price for options

## Business Logic for Kill Switch

### Total P&L Calculation

```python
# For each position:
realized_pnl = position['realizedProfit']
unrealized_pnl = position['unrealizedProfit']

# Total live P&L for the position
position_total_pnl = realized_pnl + unrealized_pnl

# Across all positions:
total_realized = sum(pos['realizedProfit'] for pos in positions)
total_unrealized = sum(pos['unrealizedProfit'] for pos in positions)
total_live_pnl = total_realized + total_unrealized
```

### Why We Use `realizedProfit + unrealizedProfit`

**Scenario 1: Pure realized loss**
- User bought 100 shares at ₹100
- Sold all 100 at ₹95
- `realizedProfit` = -500 (loss booked)
- `unrealizedProfit` = 0 (no open position)
- **Total P&L = -500**

**Scenario 2: Pure unrealized loss**
- User bought 100 shares at ₹100
- Current market price = ₹95
- User hasn't sold yet
- `realizedProfit` = 0 (nothing booked)
- `unrealizedProfit` = -500 (floating loss)
- **Total P&L = -500**

**Scenario 3: Mixed (most common)**
- User bought 200 shares at ₹100
- Sold 100 at ₹95 (booked loss)
- Still holding 100 shares, market now at ₹93
- `realizedProfit` = -500 (from the 100 sold)
- `unrealizedProfit` = -700 (from the 100 still open)
- **Total P&L = -1200**

### Product Type Filtering

For an **intraday-only** kill switch product:

```python
intraday_positions = [
    pos for pos in positions 
    if pos['productType'] == 'INTRADAY'
]
```

For **full account** protection (including delivery):

```python
# Include all product types
all_positions = positions
```

### Trade Count Logic

**Important distinction:**
- Don't count **orders** (orders can be rejected/cancelled)
- Count **trades** (actual executions)

From the trades API:
```python
trade_count = len(trades)  # Each trade = one execution
```

## Rule Evaluation Logic

### Max Loss Rule
```python
if total_live_pnl <= MAX_DAILY_LOSS:
    # Trigger kill switch
    # Example: -5200 <= -5000 → TRIGGER
```

### Max Profit Rule
```python
if total_live_pnl >= MAX_DAILY_PROFIT:
    # Trigger kill switch
    # Example: 3100 >= 3000 → TRIGGER
```

### Max Trades Rule
```python
if trade_count >= MAX_TRADES:
    # Trigger kill switch
    # Example: 11 >= 10 → TRIGGER
```

## Data Flow in Our System

```
┌─────────────────────────────────────────────────┐
│ Dhan Account (Live Trading)                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Dhan API (GET /v2/positions)                    │
│ Returns: List of positions with P&L             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Our Monitoring Script                            │
│ - Polls positions every 3-5 seconds             │
│ - Calculates: total_pnl = Σ(realized + unrealized) │
│ - Evaluates rules                                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Rule Breach Detection                            │
│ If total_pnl violates limits → TRIGGER          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼ (Future Phase)
┌─────────────────────────────────────────────────┐
│ Kill Workflow                                    │
│ 1. Cancel pending orders                        │
│ 2. Exit all positions                           │
│ 3. Activate kill switch                         │
└─────────────────────────────────────────────────┘
```

## Error Handling

### API Response Variations

The dhanhq Python library may return:
1. **Dict with status**: `{'status': 'success', 'data': [...]}`
2. **Dict with error**: `{'status': 'failure', 'remarks': 'Error message'}`
3. **Direct list**: `[{position1}, {position2}, ...]`

Our code handles all three cases:
```python
if isinstance(response, dict):
    if response.get('status') == 'failure':
        # Handle error
        return None
    positions = response.get('data', [])
elif isinstance(response, list):
    # Direct list response
    positions = response
else:
    # Unexpected format
    return None
```

## Important Implementation Notes

### 1. Intraday vs Carry Forward Distinction
If building intraday-only protection, filter by:
- `productType == 'INTRADAY'`
- Or check `dayBuyQty > 0` or `daySellQty > 0`

### 2. Derivative Positions
F&O positions have:
- `exchangeSegment` = "NSE_FNO" or "BSE_FNO"
- Non-null `drvExpiryDate`
- Possibly `drvOptionType` = "CALL" or "PUT"
- `multiplier` (lot size) applied to P&L

### 3. Cross Currency
If `crossCurrency = true`:
- `rbiReferenceRate` is used for conversion
- Consider FX rate impact on P&L

### 4. Zero Net Qty with P&L
Possible to have:
- `netQty = 0` (position squared off)
- `realizedProfit != 0` (booked P&L still shows)

This is **correct** - the position is closed but the profit/loss is recorded.

## Testing Strategy

### Test Case 1: No Positions
```
positions = []
Expected: total_pnl = 0, no trigger
```

### Test Case 2: Pure Profit
```
positions = [
  {realizedProfit: 500, unrealizedProfit: 2600}
]
total_pnl = 3100
If MAX_PROFIT = 3000 → TRIGGER
```

### Test Case 3: Pure Loss
```
positions = [
  {realizedProfit: -3000, unrealizedProfit: -2500}
]
total_pnl = -5500
If MAX_LOSS = -5000 → TRIGGER
```

### Test Case 4: Mixed Positions
```
positions = [
  {realizedProfit: 1000, unrealizedProfit: 500},   # +1500
  {realizedProfit: -2000, unrealizedProfit: -1000} # -3000
]
total_pnl = -1500
```

### Test Case 5: Trade Count
```
trades = [trade1, trade2, ..., trade11]
trade_count = 11
If MAX_TRADES = 10 → TRIGGER
```

## Next Phase Implementation Notes

When moving to continuous monitoring (Phase 2):
- Poll `/v2/positions` every 3-5 seconds
- Use Postback/WebSocket for immediate order updates
- Maintain session state in Redis:
  ```python
  {
    "session_id": "2026-03-08",
    "total_realized": -500.0,
    "total_unrealized": -4600.0,
    "total_pnl": -5100.0,
    "trade_count": 8,
    "last_updated": "2026-03-08T14:30:15Z",
    "status": "ARMED" | "TRIGGERED" | "KILLED"
  }
  ```

When implementing kill workflow (Phase 3):
1. Set status = "TRIGGERED"
2. Fetch all pending orders via `/v2/orders`
3. Cancel each using `DELETE /v2/orders/{orderId}`
4. Verify all cancelled
5. Exit all positions using `DELETE /v2/positions`
6. Verify all flat (netQty = 0 for all)
7. Call kill switch API
8. Set status = "KILLED"
9. Store complete audit trail
