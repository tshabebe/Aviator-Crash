# Balance Flow Diagram - Aviator Crash Game

## 🔴 Current Flow (WITH ISSUES)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER BETS 100 ETB                            │
│                      (Starting Balance: 1000 ETB)                    │
└──────────────────────────────────────────────────────────────────────┘

FRONTEND (context.tsx)                    BACKEND (bet.service.ts)
═════════════════════                     ════════════════════════

User Balance: 1000 ETB                    User Balance: 1000 ETB
       │                                          │
       │ User clicks BET                          │
       │                                          │
       ▼                                          │
Check: 1000 - 100 >= 0? ✓                        │
       │                                          │
       ▼                                          │
⚠️  DEDUCT: 1000 - 100 = 900 ETB ⚠️              │
       │                                          │
       │                                          │
Display Balance: 900 ETB                          │
       │                                          │
       │ emit("playBet", {betAmount: 100})        │
       │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶│
       │                                          │
       │                                          ▼
       │                                  Validate bet ✓
       │                                          │
       │                                          ▼
       │                                  Check balance: 1000 >= 100? ✓
       │                                          │
       │                                          ▼
       │                              ⚠️  DEDUCT: 1000 - 100 = 900 ETB ⚠️
       │                                          │
       │                                  Create bet record
       │                                          │
       │                                  ACTUAL Balance: 900 ETB
       │                                          │
       │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
       │        emit("myBetState", {betted: true})
       │
       │
Display: 900 ETB                          Actual: 900 ETB
       │
       │                               ⚠️  PROBLEM: Balance deducted TWICE
       │                                  but frontend only shows one deduction
       │                                  by coincidence!
       │
       │                               If multiple bets are placed quickly,
       │                               the balance will be completely wrong!
       │
       ▼

Wait for finishGame event to sync...

═══════════════════════════════════════════════════════════════════════

                         WHEN CRASH HAPPENS

FRONTEND                                  BACKEND
═════════                                 ═══════

Display: 900 ETB                          Actual: 900 ETB
       │                                          │
       │                                          │
       │                                  Round ends
       │                                          │
       │                                          ▼
       │                                  Calculate results
       │                                          │
       │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
       │     emit("finishGame", {balance: 900})   │
       │                                          │
       ▼                                          │
Sync: Set balance = 900 ETB                      │
       │                                          │
Display: 900 ETB                          Actual: 900 ETB

✓ Now synced correctly (but was wrong the whole time!)
```

---

## 🔴 Scenario: User Places TWO QUICK BETS

```
Starting Balance: 1000 ETB

FRONTEND                                  BACKEND
════════                                  ═══════

Balance: 1000 ETB                         Balance: 1000 ETB
    │                                          │
    │ First bet: 100 ETB                       │
    ▼                                          │
Deduct: 1000 - 100 = 900 ETB                  │
Display: 900 ETB                               │
    │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶ │
    │                                          │
    │ Second bet: 100 ETB (IMMEDIATELY)        │
    ▼                                          │
Deduct: 900 - 100 = 800 ETB ⚠️                │
Display: 800 ETB                               │
    │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶ │
    │                                          ▼
    │                                   Process first bet
    │                                   Deduct: 1000 - 100 = 900 ETB
    │                                          │
    │                                          ▼
    │                                   Process second bet
    │                                   Deduct: 900 - 100 = 800 ETB
    │                                          │
    │                              ACTUAL Balance: 800 ETB ✓
    │                                          │
    │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
    │             emit("myBetState")           │
    │

Display: 800 ETB                       Actual: 800 ETB

⚠️  THIS WORKS BY ACCIDENT!
    But if the order of operations changes, or network delays occur,
    the balance will be completely wrong!
```

---

## 🔴 Scenario: User CASHOUTS for 250 ETB

```
FRONTEND                                  BACKEND
════════                                  ═══════

Display: 800 ETB                          Actual: 800 ETB
    │                                          │
    │ User clicks CASHOUT at 2.5x             │
    │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶ │
    │   emit("cashOut", {type: "f"})          │
    │                                          ▼
    │                                   Calculate: 100 × 2.5 = 250 ETB
    │                                          │
    │                                          ▼
    │                                   Add: 800 + 250 = 1050 ETB ✓
    │                                          │
    │                                   Update bet record
    │                                          │
    │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
    │       emit("myBetState", {cashouted: true})
    │                                          │
    │                                  ACTUAL: 1050 ETB
    ▼
Display: 800 ETB ⚠️  WRONG!

    │
    │ Wait for finishGame...
    │
    │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
    │    emit("finishGame", {balance: 1050})  │
    │
    ▼
Sync: 1050 ETB ✓ CORRECT NOW

Display: 1050 ETB                         Actual: 1050 ETB

⚠️  ISSUE: User sees old balance (800) until round ends!
    Should immediately show 1050 ETB after cashout.
```

---

## ✅ CORRECT FLOW (RECOMMENDED)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER BETS 100 ETB                            │
│                      (Starting Balance: 1000 ETB)                    │
└──────────────────────────────────────────────────────────────────────┘

FRONTEND (context.tsx)                    BACKEND (bet.service.ts)
═════════════════════                     ════════════════════════

User Balance: 1000 ETB                    User Balance: 1000 ETB
       │                                          │
       │ User clicks BET                          │
       │                                          │
       ▼                                          │
Check: 1000 >= 100? ✓                            │
       │                                          │
       │ (NO LOCAL DEDUCTION!)                   │
       │                                          │
Show loading state...                            │
       │                                          │
       │ emit("playBet", {betAmount: 100})        │
       │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶│
       │                                          │
       │                                          ▼
       │                                  Validate bet ✓
       │                                          │
       │                                          ▼
       │                                  Check balance: 1000 >= 100? ✓
       │                                          │
       │                                          ▼
       │                                  DEDUCT: 1000 - 100 = 900 ETB ✓
       │                                          │
       │                                  Create bet record
       │                                          │
       │                                  ACTUAL Balance: 900 ETB
       │                                          │
       │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
       │        emit("myBetState", {               │
       │           betted: true,                   │
       │           balance: 900  ✓ NEW!            │
       │        })                                 │
       │                                          │
       ▼                                          │
Update: balance = 900 ETB ✓                      │
Show bet placed!                                  │
       │                                          │
Display: 900 ETB ✓ CORRECT                Actual: 900 ETB ✓

═══════════════════════════════════════════════════════════════════════

                            USER CASHOUTS

FRONTEND                                  BACKEND
════════                                  ═══════

Display: 900 ETB                          Actual: 900 ETB
    │                                          │
    │ User clicks CASHOUT at 2.5x             │
    │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶ │
    │   emit("cashOut", {type: "f"})          │
    │                                          ▼
Show loading...                          Calculate: 100 × 2.5 = 250 ETB
    │                                          │
    │                                          ▼
    │                                   Add: 900 + 250 = 1150 ETB ✓
    │                                          │
    │                                   Update bet record
    │                                          │
    │◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
    │       emit("myBetState", {               │
    │          cashouted: true,                │
    │          balance: 1150  ✓ NEW!           │
    │       })                                 │
    │                                          │
    ▼                                          │
Update: balance = 1150 ETB ✓                   │
Show success message!                          │
    │                                          │
Display: 1150 ETB ✓ CORRECT              Actual: 1150 ETB ✓

✓ Balance is ALWAYS in sync with backend!
✓ No "optimistic updates" that can go wrong!
✓ User sees correct balance immediately!
```

---

## 📊 Comparison Table

| Scenario | Current Frontend Display | Actual Backend Balance | Issue? |
|----------|-------------------------|------------------------|--------|
| Initial | 1000 ETB | 1000 ETB | ✅ OK |
| After placing bet | 900 ETB | 900 ETB | ✅ OK (by accident) |
| After quick 2 bets | 800 ETB | 800 ETB | ⚠️ Risky |
| After cashout | 800 ETB | 1050 ETB | ❌ WRONG |
| After finishGame | 1050 ETB | 1050 ETB | ✅ OK (finally synced) |

---

## 🔧 Code Changes Required

### 1. Remove Frontend Balance Deduction

**File:** `context.tsx` lines 636-646

```typescript
// ❌ REMOVE THIS:
if (attrs.userInfo.balance - (state.userInfo.f?.betAmount || 0) < 0) {
  toast.error("Your balance is not enough");
  betStatus.fbetState = false;
  betStatus.fbetted = false;
  return;
}
attrs.userInfo.balance -= (state.userInfo.f?.betAmount || 0); // DELETE THIS LINE!
socket.emit("playBet", data);

// ✅ REPLACE WITH:
if (userInfo.balance < (state.userInfo.f?.betAmount || 0)) {
  toast.error("Your balance is not enough");
  betStatus.fbetState = false;
  betStatus.fbetted = false;
  return;
}
// Don't modify balance locally - let backend handle it!
socket.emit("playBet", data);
```

### 2. Update myBetState to Include Balance

**File:** `bet.handler.ts` (Backend) after line 30

```typescript
// Get updated user bet state
const userBetState = await gameService.getUserBetState(userId);

// ✅ ADD THIS: Get current balance
const user = await User.findOne({ userId }, 'balance');

// Send bet state to user WITH balance
socket.emit(SOCKET_EVENTS.MY_BET_STATE, {
  ...userBetState,
  balance: user?.balance || 0  // ✅ ADD THIS
});
```

### 3. Update Frontend to Accept Balance in myBetState

**File:** `context.tsx` lines 422-429

```typescript
socket.on("myBetState", (user: any) => {  // Changed parameter name
  const attrs = userBetState;
  attrs.fbetState = false;
  attrs.fbetted = user.f?.betted || false;
  attrs.sbetState = false;
  attrs.sbetted = user.s?.betted || false;
  setUserBetState(attrs);
  
  // ✅ ADD THIS: Update balance if provided
  if (user.balance !== undefined) {
    setUserInfo(prev => ({ ...prev, balance: user.balance }));
  }
});
```

---

## ✅ After Fixes

```
┌─────────────────────────────────────────────────────┐
│  Balance is ALWAYS synced with backend             │
│  User sees correct balance at ALL times            │
│  No race conditions or timing issues               │
│  Cashout immediately shows updated balance         │
└─────────────────────────────────────────────────────┘
```

