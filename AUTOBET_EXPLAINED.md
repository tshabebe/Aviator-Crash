# 🤖 AutoBet System - How It Works

## Simple Explanation

**AutoBet = Automatic betting for multiple rounds without clicking BET each time**

You set it up once, and the game automatically:
1. Places your bet at the start of each round
2. Cashes out at your target multiplier
3. Stops when your conditions are met

---

## 🎯 AutoBet Features

### 1. **Number of Rounds** (`fautoCound` / `sautoCound`)
- How many rounds to auto-bet
- Example: Set to `10` → Auto-bets for 10 rounds then stops

**How it works:**
```
Round 1: Bet 100 ETB → autoCound = 9 remaining
Round 2: Bet 100 ETB → autoCound = 8 remaining
...
Round 10: Bet 100 ETB → autoCound = 0 → STOP
```

### 2. **Stop on Total Win** (`fincrease` / `sincrease`)
- Stop when your TOTAL winnings reach a target
- Example: Stop after winning 500 ETB total

**How it works:**
```
Round 1: Win 50 ETB  → Total: 50 ETB  → Continue
Round 2: Win 100 ETB → Total: 150 ETB → Continue
Round 3: Win 200 ETB → Total: 350 ETB → Continue
Round 4: Win 180 ETB → Total: 530 ETB → STOP (reached 500)
```

### 3. **Stop on Single Win** (`fsingleAmount` / `ssingleAmount`)
- Stop when you win MORE than X amount in ONE round
- Example: Stop if single win exceeds 250 ETB

**How it works:**
```
Round 1: Win 50 ETB  → Continue (< 250)
Round 2: Win 100 ETB → Continue (< 250)
Round 3: Win 300 ETB → STOP (> 250)
```

### 4. **Stop on Total Loss** (`fdecrease` / `sdecrease`)
- Stop when your TOTAL losses reach a limit
- Example: Stop after losing 300 ETB total

**How it works:**
```
Round 1: Lose 100 ETB → Total: 100 ETB → Continue
Round 2: Lose 100 ETB → Total: 200 ETB → Continue
Round 3: Lose 100 ETB → Total: 300 ETB → STOP (reached 300)
```

### 5. **Auto-Cashout** (`fautoCashoutState` / `target`)
- Automatically cash out at specific multiplier
- Example: Always cashout at 2.0x

**How it works:**
```
Multiplier: 1.0x → 1.5x → 2.0x → AUTO CASHOUT!
You don't need to click anything
```

---

## 📊 How AutoBet Logic Works (Code Flow)

### Step 1: User Enables AutoBet
```typescript
userInfo.f.auto = true  // Enable autobet for first slot
fautoCound = 10         // Play 10 rounds
fincrease = 500         // Stop after winning 500 ETB
```

### Step 2: Game Starts (BET Phase)
```typescript
// Lines 621-648 in context.tsx
if (gameState.GameState === "BET" && betStatus.fbetState) {
  // Countdown rounds
  if (fautoCound > 0) {
    fautoCound -= 1  // 10 → 9 → 8 → ...
  } else {
    // Stop autobet (no rounds left)
    userInfo.f.auto = false
  }
  
  // Place bet automatically
  socket.emit("playBet", {
    betAmount: 100,
    target: 2.0,
    type: "f",
    auto: true
  })
}
```

### Step 3: Round Ends (finishGame Event)
```typescript
// Lines 471-559 in context.tsx
socket.on("finishGame", (user) => {
  if (userInfo.f.auto) {  // If autobet is on
    
    // Check if user WON (cashed out)
    if (user.f.cashouted) {
      fIncreaseAmount += user.f.cashAmount  // Track total wins
      
      // Stop on total win?
      if (finState && fincrease <= fIncreaseAmount) {
        userInfo.f.auto = false  // STOP
      }
      // Stop on single win?
      else if (fsingle && fsingleAmount <= user.f.cashAmount) {
        userInfo.f.auto = false  // STOP
      }
      // Continue autobet
      else {
        fbetState = true  // Bet again next round
      }
    }
    
    // Check if user LOST (didn't cash out)
    else {
      fDecreaseAmount += user.f.betAmount  // Track total losses
      
      // Stop on total loss?
      if (fdeState && fdecrease <= fDecreaseAmount) {
        userInfo.f.auto = false  // STOP
      }
      // Continue autobet
      else {
        fbetState = true  // Bet again next round
      }
    }
  }
})
```

---

## 🎮 Example Scenarios

### Scenario 1: Simple 5 Rounds AutoBet
```
Setup:
- Bet: 100 ETB
- Target: 2.0x (auto-cashout)
- Rounds: 5

Round 1: 100 ETB → 2.0x → Win 200 ETB (4 rounds left)
Round 2: 100 ETB → 2.0x → Win 200 ETB (3 rounds left)
Round 3: 100 ETB → Crash at 1.5x → Lose 100 ETB (2 rounds left)
Round 4: 100 ETB → 2.0x → Win 200 ETB (1 round left)
Round 5: 100 ETB → 2.0x → Win 200 ETB (0 rounds left)

Result: STOP (completed 5 rounds)
Total: +600 ETB profit
```

### Scenario 2: Stop on Total Win (500 ETB)
```
Setup:
- Bet: 100 ETB
- Target: 3.0x
- Stop when total wins = 500 ETB

Round 1: 100 ETB → 3.0x → Win 300 ETB (total: 300 ETB)
Round 2: 100 ETB → 3.0x → Win 300 ETB (total: 600 ETB)

Result: STOP (reached 500 ETB in wins)
Played only 2 rounds
```

### Scenario 3: Stop on Single Big Win (250 ETB)
```
Setup:
- Bet: 50 ETB
- Target: 5.0x
- Stop if single win > 250 ETB

Round 1: 50 ETB → 2.0x → Win 100 ETB (< 250, continue)
Round 2: 50 ETB → 3.0x → Win 150 ETB (< 250, continue)
Round 3: 50 ETB → 6.0x → Win 300 ETB (> 250, STOP!)

Result: STOP (hit big win)
```

### Scenario 4: Stop on Loss Limit (200 ETB)
```
Setup:
- Bet: 100 ETB
- Target: 5.0x (risky)
- Stop after losing 200 ETB total

Round 1: 100 ETB → Crash at 2.0x → Lose 100 ETB (total loss: 100)
Round 2: 100 ETB → Crash at 1.5x → Lose 100 ETB (total loss: 200)

Result: STOP (hit loss limit)
Protects you from losing more!
```

### Scenario 5: Combined Conditions
```
Setup:
- Bet: 100 ETB
- Target: 2.5x
- Rounds: 20
- Stop on win: 1000 ETB
- Stop on loss: 500 ETB

The autobet will STOP when ANY condition is met:
✓ Completed 20 rounds, OR
✓ Won 1000 ETB total, OR
✓ Lost 500 ETB total

Whichever comes first!
```

---

## 🔧 AutoBet States Explained

| State Variable | Purpose | Example |
|---------------|---------|---------|
| `userInfo.f.auto` | AutoBet ON/OFF | `true` = autobet active |
| `fautoCound` | Rounds remaining | `5` = 5 rounds left |
| `finState` | Track total wins? | `true` = enabled |
| `fincrease` | Win limit amount | `500` = stop at 500 ETB won |
| `fdeState` | Track total losses? | `true` = enabled |
| `fdecrease` | Loss limit amount | `300` = stop at 300 ETB lost |
| `fsingle` | Track single win? | `true` = enabled |
| `fsingleAmount` | Single win limit | `250` = stop if win > 250 |
| `fautoCashoutState` | Auto-cashout ON/OFF | `true` = auto-cashout |
| `target` | Cashout multiplier | `2.5` = cashout at 2.5x |

---

## 🎯 How to Use AutoBet (User Perspective)

### Step 1: Enable AutoBet
Click "AUTO PLAY" button

### Step 2: Set Number of Rounds
Example: 10 rounds

### Step 3: Set Auto-Cashout Target
Example: 2.0x (automatically cashout at 2.0x)

### Step 4: (Optional) Set Stop Conditions

**Option A: Stop on Total Win**
- Enable "Stop on Win"
- Set amount: 500 ETB
- Stops after winning 500 ETB total

**Option B: Stop on Single Win**
- Enable "Single Win"
- Set amount: 250 ETB
- Stops if any round wins more than 250 ETB

**Option C: Stop on Total Loss**
- Enable "Stop on Loss"
- Set amount: 300 ETB
- Stops after losing 300 ETB total

### Step 5: Start AutoBet
- AutoBet activates next round
- Automatically bets and cashes out
- Stops when conditions are met

---

## 💡 Tips for Using AutoBet

### Conservative Strategy
```
Bet: 50 ETB
Target: 1.5x (easy to hit)
Rounds: 20
Stop on loss: 200 ETB
```
**Goal:** Consistent small wins, limit losses

### Balanced Strategy
```
Bet: 100 ETB
Target: 2.5x (medium risk)
Rounds: 10
Stop on win: 500 ETB
Stop on loss: 300 ETB
```
**Goal:** Good profit potential, controlled risk

### Aggressive Strategy
```
Bet: 200 ETB
Target: 5.0x (high risk)
Single win stop: 1000 ETB
Stop on loss: 500 ETB
```
**Goal:** Chase big win, stop quickly on loss

---

## ❓ FAQ

**Q: Does autobet work for both bet slots?**
A: Yes! You can set different autobet settings for slot F and slot S

**Q: Can I cancel autobet mid-way?**
A: Yes, click the "CANCEL" button during the waiting phase

**Q: What if I run out of balance during autobet?**
A: Autobet stops automatically and shows "Insufficient balance"

**Q: Does autobet remember my settings?**
A: Settings stay for current session but reset on page refresh

**Q: Can autobet work without auto-cashout?**
A: No, you must set an auto-cashout target for autobet to work

---

## 🔍 Summary

AutoBet is designed to:
✅ Save you from clicking BET every round
✅ Automatically cashout at your target
✅ Stop when you reach win goals (take profit)
✅ Stop when you reach loss limits (protect capital)
✅ Let you play strategically without manual clicking

It's a "set and forget" feature that follows YOUR rules!

