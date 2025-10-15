# 🎮 Complete Game Flow - Aviator Crash Game

## Game Cycle Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     GAME LOOP                                │
│                                                              │
│  BET (5s) → PLAYING (random) → CRASHED (3s) → BET (5s) ...  │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: BET PHASE (5 seconds)

### What Happens
- Users can place bets
- Users can enable auto-bet
- Users can set auto-cashout targets
- Countdown timer shows time remaining

### User Actions

#### 1.1 Manual Bet
```
User enters bet amount (e.g., 100 ETB)
    ↓
User clicks "BET" button
    ↓
Frontend validates: balance >= betAmount?
    ↓
✓ YES: Emit "playBet" event to backend
✗ NO:  Show "Insufficient balance" error
```

#### 1.2 Auto Bet
```
User clicks "AUTO PLAY" button
    ↓
User sets number of rounds (e.g., 10)
    ↓
User optionally sets:
  - Auto-cashout target (e.g., 2.5x)
  - Stop on win (e.g., win 500 ETB)
  - Stop on loss (e.g., lose 200 ETB)
    ↓
Auto-bet activates for next round
```

### Backend Processing

```
Receive "playBet" event
    ↓
Validate bet data
  - betAmount within limits (min: 1, max: 1000)
  - target is valid (>= 1.01x)
  - type is 'f' or 's'
    ↓
Check user hasn't already bet in this slot
    ↓
Check balance >= betAmount
    ↓
✓ ALL CHECKS PASS:
    ├─ Deduct balance (atomic DB operation)
    ├─ Create bet record in database
    ├─ Emit "myBetState" to user (with updated balance)
    └─ Broadcast "bettedUserInfo" to all players
    
✗ ANY CHECK FAILS:
    └─ Emit "error" event to user
```

### Database Operations

**Balance Deduction:**
```typescript
User.updateOne(
  { userId, balance: { $gte: betAmount } },  // Only if sufficient balance
  { $inc: { balance: -betAmount } }          // Atomic decrement
)
```

**Bet Record:**
```typescript
Bet.create({
  userId: "user123",
  userName: "Player1",
  roundId: "round456",
  betAmount: 100,
  target: 2.5,
  betType: "f",
  auto: false,
  betted: true,
  cashouted: false,
  cashoutAt: 0,
  cashAmount: 0
})
```

### Frontend Updates

```
Receive "myBetState" event
    ↓
Update bet state:
  - fbetted = true (bet is active)
  - fbetState = false (can't bet again)
    ↓
Update balance from server
    ↓
Show "WAITING" button (bet placed)
```

---

## Phase 2: PLAYING PHASE (Random Duration)

### What Happens
- Plane starts flying
- Multiplier increases: 1.00x → 1.05x → 1.10x → ... → CRASH!
- Users can cash out their bets
- Auto-cashouts are processed automatically
- Plane crashes at random multiplier (algorithm determines)

### Multiplier Progression

```
Time:        0.0s   0.1s   0.2s   0.3s   0.5s   1.0s   2.0s   ...
Multiplier:  1.00x  1.05x  1.10x  1.15x  1.25x  1.50x  2.00x  ...
                                                                CRASH!
```

### User Actions

#### 2.1 Manual Cashout
```
User sees multiplier at 2.5x
    ↓
User clicks "CASHOUT" button
    ↓
Frontend emits "cashOut" event
    ↓
Backend processes (see below)
```

#### 2.2 Auto-Cashout
```
User set target: 2.5x
    ↓
Multiplier reaches 2.5x
    ↓
Backend automatically cashes out
    ↓
No user action needed!
```

### Backend Processing

```
Receive "cashOut" event OR detect auto-cashout
    ↓
Validate:
  - Game state is "PLAYING"
  - User has active bet
  - Bet not already cashed out
    ↓
Calculate winnings:
  cashAmount = betAmount × currentMultiplier
  Example: 100 ETB × 2.5 = 250 ETB
    ↓
Update bet record:
  - cashouted = true
  - cashoutAt = 2.5
  - cashAmount = 250
    ↓
Add winnings to user balance (atomic DB operation)
    ↓
✓ SUCCESS:
    ├─ Emit "myBetState" to user (with updated balance)
    ├─ Broadcast "bettedUserInfo" to all players
    └─ Emit "success" message to user
    
✗ FAILURE:
    ├─ Rollback bet record
    └─ Emit "error" event to user
```

### Database Operations

**Update Bet:**
```typescript
Bet.findOneAndUpdate(
  { userId, roundId, betType: "f", betted: true, cashouted: false },
  {
    cashouted: true,
    cashoutAt: 2.5,
    cashAmount: 250
  }
)
```

**Add Winnings:**
```typescript
User.updateOne(
  { userId },
  { $inc: { balance: 250 } }  // Atomic increment
)
```

### Frontend Updates

```
Receive "myBetState" event
    ↓
Update bet state:
  - fcashouted = true (bet cashed out)
  - fcashAmount = 250 (winnings)
    ↓
Update balance from server
    ↓
Show "CASHED OUT" message with winnings
    ↓
Play success animation
```

### Auto-Cashout Backend Logic

```typescript
Every 100ms during PLAYING phase:
    ↓
Find all bets where:
  - betted = true
  - cashouted = false
  - target <= currentMultiplier
    ↓
For each bet:
    ├─ Calculate winnings
    ├─ Update bet record
    ├─ Add to user balance
    └─ Emit updates
```

---

## Phase 3: CRASHED PHASE (3 seconds)

### What Happens
- Plane crashes at final multiplier (e.g., 2.47x)
- All uncashed bets are lost
- Results are calculated
- History is updated
- Balance updates are sent

### Backend Processing

```
Plane crashes at multiplier X
    ↓
Stop accepting cashouts
    ↓
Find all active bets for this round
    ↓
For each bet:
    ├─ If cashouted = true:
    │   └─ User won: (betAmount × cashoutAt)
    │
    └─ If cashouted = false:
        └─ User lost: 0 ETB (already deducted)
    ↓
Update round record:
  - finalMultiplier = X
  - state = "CRASHED"
    ↓
Send "finishGame" event to all users
    ↓
Prepare next round
```

### finishGame Event

Contains complete user data:
```typescript
{
  userId: "user123",
  userName: "Player1",
  balance: 1250,  // Updated balance
  f: {
    betted: false,    // Reset for next round
    cashouted: false,
    betAmount: 100,
    cashAmount: 0,
    target: 2.5,
    auto: false
  },
  s: { ... }
}
```

### Frontend Updates

```
Receive "finishGame" event
    ↓
Sync balance from server (authoritative)
    ↓
Reset bet states:
  - fbetted = false
  - fcashouted = false
  - fcashAmount = 0
    ↓
Check auto-bet conditions:
  - Should continue auto-betting?
  - Reached win/loss limits?
  - Reached number of rounds?
    ↓
If auto-bet continues:
  └─ Set fbetState = true (will bet on next round)
    ↓
Update history display
    ↓
Show results animation
```

### Auto-Bet Logic

```typescript
If user had auto-bet enabled:
    ↓
If user WON (cashed out):
    ├─ Increment fIncreaseAmount += cashAmount
    ├─ Check stop-on-win condition:
    │   If fIncreaseAmount >= stopOnWinAmount:
    │       └─ Stop auto-bet
    ├─ Check single-win condition:
    │   If cashAmount >= singleWinAmount:
    │       └─ Stop auto-bet
    └─ Otherwise: Continue auto-bet
    
If user LOST (didn't cash out):
    ├─ Increment fDecreaseAmount += betAmount
    ├─ Check stop-on-loss condition:
    │   If fDecreaseAmount >= stopOnLossAmount:
    │       └─ Stop auto-bet
    └─ Otherwise: Continue auto-bet
    
Decrement auto-bet counter:
    ├─ autoCound -= 1
    └─ If autoCound <= 0:
        └─ Stop auto-bet
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME FLOW                              │
└─────────────────────────────────────────────────────────────┘

USER ACTIONS          FRONTEND              BACKEND              DATABASE
════════════          ════════              ═══════              ════════

[BET PHASE]
   │
   │ Click BET
   │ (100 ETB)
   ├──────────▶ Validate       
   │            balance         
   │                │           
   │                │ emit("playBet")
   │                ├───────────▶ Validate bet
   │                │             │
   │                │             ▼
   │                │             Check balance ─────▶ balance: 1000
   │                │             │                    │
   │                │             ▼                    ▼
   │                │             Deduct ─────────▶ UPDATE
   │                │             Create bet ─────▶ INSERT
   │                │             │                    │
   │                │             ▼                    │
   │                │             balance: 900 ◀───────┘
   │                │             │
   │                ◀───────────┤ emit("myBetState", {balance: 900})
   │                │
   │                ▼
   │            Update UI
   │            Balance: 900
   │
   │
[PLAYING PHASE]
   │
   │ Multiplier: 1.00x → 1.50x → 2.00x → 2.50x
   │                                        │
   │ Click CASHOUT                         │
   │ at 2.50x                              │
   ├──────────▶ emit("cashOut")           │
   │                │                       │
   │                ├───────────▶ Validate │
   │                │             │         │
   │                │             ▼         │
   │                │             Calculate:│
   │                │             100×2.5 = 250
   │                │             │
   │                │             ▼
   │                │             Add winnings ───▶ UPDATE
   │                │             │                  balance: 900+250
   │                │             │                  = 1150
   │                │             ▼                  │
   │                │             balance: 1150 ◀───┘
   │                │             │
   │                ◀───────────┤ emit("myBetState", {balance: 1150})
   │                │
   │                ▼
   │            Update UI
   │            Balance: 1150 ✓
   │            Show winnings!
   │
   │
[CRASHED PHASE]
   │
   │ Plane crashes at 3.75x
   │                │
   │                ├───────────▶ Calculate results
   │                │             │
   │                │             ▼
   │                │             Fetch user data ──▶ SELECT
   │                │             │                    balance: 1150
   │                │             ▼                    │
   │                │             balance: 1150 ◀──────┘
   │                │             │
   │                ◀───────────┤ emit("finishGame", {balance: 1150})
   │                │
   │                ▼
   │            Sync balance
   │            Check auto-bet
   │            Update history
   │
   │            [Return to BET PHASE]
   │                    │
   └────────────────────┘
```

---

## Balance Flow Summary

```
┌──────────────────────────────────────────────────────────┐
│                  BALANCE OPERATIONS                      │
└──────────────────────────────────────────────────────────┘

Operation          Location    Method         Balance Change
────────────────────────────────────────────────────────────
Initial            Database    -              1000 ETB
                                              
Place Bet          Backend     $inc: -100     900 ETB
                   (atomic)                   
Cashout            Backend     $inc: +250     1150 ETB
                   (atomic)                   
                                              
Sync to Frontend   Socket      finishGame     1150 ETB

✅ All operations are atomic
✅ No race conditions
✅ Balance always accurate in database
```

---

## Error Handling

### Insufficient Balance
```
User tries to bet 100 ETB
Balance: 50 ETB
    ↓
Backend check fails: 50 < 100
    ↓
Emit "error" event
    ↓
Frontend shows: "Insufficient balance"
    ↓
Emit "recharge" event
    ↓
Frontend shows recharge popup
```

### Bet Already Placed
```
User tries to bet in slot 'f'
Already has active bet in slot 'f'
    ↓
Backend check fails
    ↓
Emit "error" event
    ↓
Frontend shows: "Already placed bet in this slot"
```

### Cashout Too Late
```
User clicks cashout
Plane already crashed
    ↓
Backend check fails: state != "PLAYING"
    ↓
Emit "error" event
    ↓
Frontend shows: "Cannot cash out now"
```

### Network Error
```
Frontend sends "playBet"
    ↓
Network timeout / disconnection
    ↓
No response from backend
    ↓
Frontend shows loading state
    ↓
On reconnect: Backend sends current state
    ↓
Frontend syncs with backend
```

---

## Key Features

### Two Bet Slots
Users can place **two simultaneous bets** with different parameters:
- Slot F (first): Independent bet amount and target
- Slot S (second): Independent bet amount and target

```
Slot F: 100 ETB at 2.0x target
Slot S: 50 ETB at 5.0x target
    ↓
User can cashout F at 2.0x (gets 200 ETB)
User can let S ride to 5.0x (gets 250 ETB if reaches)
    ↓
Total potential: 450 ETB (invested 150 ETB)
```

### Auto-Bet Strategies

#### Strategy 1: Fixed Cashout
```
Bet: 100 ETB
Target: 2.0x
Rounds: 10
    ↓
Every round: Auto-bet 100 ETB, cashout at 2.0x
Result: Win 100 ETB per successful round
```

#### Strategy 2: Stop on Win
```
Bet: 100 ETB
Target: 2.0x
Stop when profit reaches: 500 ETB
    ↓
Plays until total winnings = 500 ETB, then stops
```

#### Strategy 3: Stop on Loss
```
Bet: 100 ETB
Target: 5.0x (risky)
Stop when losses reach: 500 ETB
    ↓
Plays until total losses = 500 ETB, then stops
```

---

## Summary

### Balance is managed by:
- ✅ Backend database (single source of truth)
- ✅ Atomic operations ($inc)
- ✅ Validation before every operation
- ✅ Sync to frontend via socket events

### Game flow is:
- ✅ BET → PLAYING → CRASHED (repeat)
- ✅ 5 second bet window
- ✅ Random crash multiplier
- ✅ 3 second result display

### User experience:
- ✅ Real-time multiplier updates
- ✅ Instant cashout feedback
- ✅ Auto-bet automation
- ✅ Two independent bet slots
- ✅ Clear error messages

### Security:
- ✅ All critical operations on backend
- ✅ Balance never modified on frontend
- ✅ Atomic database transactions
- ✅ Validation at every step

