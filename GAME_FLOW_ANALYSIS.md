# Aviator Crash Game - Game Flow Analysis

## Overview
This document analyzes the complete game flow, focusing on balance deduction, cashout mechanisms, and potential issues.

---

## 🎮 Complete Game Flow

### 1. **User Places a Bet**

#### Frontend Flow (context.tsx):
```
User clicks BET button → updateUserBetState({fbetState: true}) → 
GameState changes to "BET" → useEffect triggers (lines 617-678)
```

**Lines 620-648 (First Bet - 'f'):**
1. Check if `fbetState` is true
2. Check balance sufficiency (line 636-641)
3. **Deduct balance locally** (line 642): `attrs.userInfo.balance -= betAmount`
4. Emit `playBet` event to server (line 643)
5. Update bet state (line 644-647)

**Lines 649-676 (Second Bet - 's'):**
- Same process for second bet slot

#### Backend Flow (bet.service.ts):
**Lines 56-124:**
1. Validate bet amount and target (line 74)
2. Check for existing bet in same slot (lines 83-91)
3. **Deduct balance atomically** (line 94): `BalanceService.deductBalance(userId, betAmount)`
4. Create bet record in DB (lines 100-112)
5. Return success

---

### 2. **Balance Deduction Analysis**

#### ⚠️ **ISSUE #1: Double Balance Deduction**

**Problem:** Balance is deducted TWICE:

1. **Frontend Deduction** (context.tsx:642):
```typescript
attrs.userInfo.balance -= (state.userInfo.f?.betAmount || 0);
```

2. **Backend Deduction** (balance.service.ts:14-23):
```typescript
await User.updateOne(
  { userId, balance: { $gte: amount } },
  { $inc: { balance: -amount } }
);
```

**Impact:**
- If user bets 100 ETB, their balance decreases by 200 ETB total
- Frontend shows incorrect balance until `finishGame` event syncs it

**Why it happens:**
- Frontend optimistically deducts for instant UI feedback
- Backend also deducts (correctly) from database
- Balance only re-syncs when `finishGame` event arrives (lines 466-554)

---

### 3. **Cashout Flow**

#### Frontend Flow:
**Lines 284-287 (context.tsx):**
```typescript
export const callCashOut = (at: number, index: "f" | "s") => {
  let data = { type: index, endTarget: at };
  socket.emit("cashOut", data);
};
```

**Line 276-284 (bet.tsx):**
User clicks CASHOUT button → calls `callCashOut(currentTarget, index)`

#### Backend Flow:
**bet.service.ts (lines 129-183):**
1. Find active bet (lines 141-151)
2. Calculate winnings: `cashAmount = betAmount * currentMultiplier` (line 154)
3. Update bet as cashed out (lines 157-160)
4. **Add winnings to balance** (line 163): `BalanceService.addBalance(userId, cashAmount)`
5. Rollback if balance update fails (lines 164-170)

**balance.service.ts (lines 35-54):**
```typescript
static async addBalance(userId: string, amount: number) {
  await User.updateOne(
    { userId },
    { $inc: { balance: amount } }
  );
}
```

---

### 4. **Balance Synchronization**

#### Backend Sends Updated Balance:
**Socket Event: "finishGame"** (context.tsx:466-554)
- Sent at the end of each round
- Contains complete user object with updated balance
- Frontend merges this with local state (lines 474-487)

#### ⚠️ **ISSUE #2: Temporary Balance Inconsistency**

**Timeline:**
1. User bets 100 ETB (balance: 1000 ETB)
2. Frontend deducts: balance shows 900 ETB
3. Backend deducts: actual balance is 900 ETB
4. User sees 900 ETB but actual is 900 ETB ✓
5. Next round starts, no sync happens
6. **Discrepancy continues until finishGame event**

---

### 5. **Auto-Cashout Mechanism**

#### Frontend (context.tsx:466-554):
When `finishGame` event arrives:
- Checks if user had auto-cashout enabled
- If cashed out successfully:
  - Increments `fIncreaseAmount` (line 492)
  - Checks win condition (lines 493-506)
- If lost (didn't cashout):
  - Increments `fDecreaseAmount` (line 508)
  - Checks loss condition (lines 509-516)

#### Backend (game.service.ts:239-253):
**Auto-cashout processing during PLAYING state:**
```typescript
private async processAutoCashouts(currentMultiplier: number) {
  // Finds bets where target <= currentMultiplier
  // Automatically cashes them out
}
```

---

## 🔍 Issues Found

### **Issue #1: Double Balance Deduction** ⚠️ CRITICAL

**Location:** 
- Frontend: `context.tsx:642` and `context.tsx:670`
- Backend: `bet.service.ts:94`

**Severity:** High

**Description:**
Balance is deducted twice - once optimistically on frontend and once on backend.

**Expected Behavior:**
- Frontend should NOT deduct balance
- Only backend should handle balance deduction
- Frontend should wait for server confirmation

**Recommendation:**
```typescript
// REMOVE these lines:
// Line 642: attrs.userInfo.balance -= (state.userInfo.f?.betAmount || 0);
// Line 670: attrs.userInfo.balance -= (state.userInfo.s?.betAmount || 0);

// Keep only balance validation:
if (userInfo.balance < betAmount) {
  toast.error("Your balance is not enough");
  return;
}
```

---

### **Issue #2: Balance Not Updated After Cashout** ⚠️ MEDIUM

**Location:** `context.tsx:284-287`

**Description:**
After cashing out, balance is updated on backend but frontend doesn't receive immediate update. User must wait for `finishGame` event.

**Expected Behavior:**
Backend should send updated balance immediately after cashout via `myBetState` or separate event.

**Current Flow:**
```
User cashes out → Backend adds winnings → myBetState sent (no balance) → 
Wait for round to end → finishGame event → Balance updates ❌
```

**Recommendation:**
Update `myBetState` event to include current balance:
```typescript
socket.emit(SOCKET_EVENTS.MY_BET_STATE, {
  ...userBetState,
  balance: user.balance  // Add this
});
```

---

### **Issue #3: Balance Check is Race Condition Prone** ⚠️ LOW

**Location:** `context.tsx:636-641`

**Description:**
Balance check happens on frontend before emitting bet, but another bet could be placed before server processes this one.

**Current Code:**
```typescript
if (attrs.userInfo.balance - (state.userInfo.f?.betAmount || 0) < 0) {
  toast.error("Your balance is not enough");
  return;
}
```

**Status:** This is actually OK because backend also validates (bet.service.ts:74)

---

## ✅ What Works Correctly

### 1. **Backend Balance Operations**
- ✅ Atomic operations using MongoDB's `$inc` operator
- ✅ Balance check before deduction: `balance: { $gte: amount }`
- ✅ Rollback mechanism if cashout balance update fails
- ✅ Proper validation before placing bet

### 2. **Cashout Calculation**
- ✅ Correct formula: `cashAmount = betAmount * currentMultiplier`
- ✅ Proper state management (betted, cashouted flags)
- ✅ Auto-cashout at target multiplier

### 3. **Auto-Bet Logic**
- ✅ Auto-count decrements correctly
- ✅ Win/loss conditions checked properly
- ✅ Auto-bet stops when conditions met

### 4. **Game State Management**
- ✅ Proper state transitions (BET → PLAYING → CRASHED)
- ✅ Bets only accepted during BET state
- ✅ Cashouts only accepted during PLAYING state

---

## 🔧 Recommended Fixes

### Priority 1: Remove Frontend Balance Deduction

**File:** `context.tsx`

**Change lines 636-646:**
```typescript
// BEFORE:
if (attrs.userInfo.balance - (state.userInfo.f?.betAmount || 0) < 0) {
  toast.error("Your balance is not enough");
  betStatus.fbetState = false;
  betStatus.fbetted = false;
  return;
}
attrs.userInfo.balance -= (state.userInfo.f?.betAmount || 0); // ❌ REMOVE THIS
socket.emit("playBet", data);

// AFTER:
if (userInfo.balance < (state.userInfo.f?.betAmount || 0)) {
  toast.error("Your balance is not enough");
  betStatus.fbetState = false;
  betStatus.fbetted = false;
  return;
}
// Don't deduct locally - let backend handle it
socket.emit("playBet", data);
```

**Repeat for second bet (lines 664-674)**

---

### Priority 2: Update Balance After Cashout

**File:** `bet.handler.ts` (Backend)

**Add to handleCashOut function (after line 82):**
```typescript
// Get updated user info with balance
const userInfo = await gameService.getUserInfo(userId);

// Send updated balance to user
socket.emit(SOCKET_EVENTS.MY_INFO, userInfo);
```

---

### Priority 3: Handle myBetState Event Properly

**File:** `context.tsx`

**Update lines 422-429:**
```typescript
socket.on("myBetState", (data: any) => {
  const attrs = userBetState;
  attrs.fbetState = false;
  attrs.fbetted = data.f?.betted || false;
  attrs.sbetState = false;
  attrs.sbetted = data.s?.betted || false;
  setUserBetState(attrs);
  
  // Update balance if provided
  if (data.balance !== undefined) {
    setUserInfo(prev => ({ ...prev, balance: data.balance }));
  }
});
```

---

## 📊 Game Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     GAME CYCLE                              │
└─────────────────────────────────────────────────────────────┘

1. BET PHASE (5 seconds)
   ├─ User clicks BET button
   ├─ Frontend: validates balance
   ├─ Frontend: emits "playBet" event
   ├─ Backend: validates bet
   ├─ Backend: deducts balance (atomic)
   ├─ Backend: creates bet record
   ├─ Backend: emits "myBetState"
   └─ Frontend: updates UI (betted = true)

2. PLAYING PHASE (random duration)
   ├─ Multiplier increases: 1.00x → 1.05x → 1.10x → ...
   ├─ User can click CASHOUT
   ├─ Frontend: emits "cashOut" event
   ├─ Backend: validates cashout
   ├─ Backend: calculates winnings
   ├─ Backend: adds to balance (atomic)
   ├─ Backend: updates bet record (cashouted = true)
   ├─ Backend: emits "myBetState"
   └─ Frontend: shows CASHED OUT

3. CRASHED PHASE (3 seconds)
   ├─ Plane crashes at random multiplier
   ├─ Backend: processes all uncashed bets (lost)
   ├─ Backend: emits "finishGame" with full user data
   ├─ Frontend: syncs balance from server
   ├─ Frontend: checks auto-bet conditions
   └─ Return to BET PHASE

┌─────────────────────────────────────────────────────────────┐
│                 BALANCE UPDATES                             │
└─────────────────────────────────────────────────────────────┘

Initial:  1000 ETB
↓
Bet placed: 1000 - 100 = 900 ETB (backend)
↓
Cashed out: 900 + (100 × 2.5) = 1150 ETB (backend)
↓
finishGame event: Frontend syncs to 1150 ETB
```

---

## 🎯 Conclusion

### Balance Calculation: ⚠️ INCORRECT (on frontend)
- Frontend deducts balance unnecessarily
- Creates temporary inconsistency
- Should rely solely on backend

### Balance Deduction: ✅ CORRECT (on backend)
- Backend properly deducts balance atomically
- Validation works correctly
- Rollback mechanisms in place

### Cashout: ✅ CORRECT
- Calculation is accurate
- Balance updated properly on backend
- State management works well

### Main Issues:
1. **Remove frontend balance deduction** (lines 642, 670)
2. **Add immediate balance sync after cashout**
3. **Consider optimistic UI updates with server reconciliation**

The backend implementation is solid and secure. The frontend just needs to trust the backend more and not try to manage balance locally.

