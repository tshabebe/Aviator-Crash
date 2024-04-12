import React, { useEffect } from "react";
import Context, { callCashOut, callCancelBet } from "../../context";
import toaster from "../Toast";
import toast from "react-hot-toast";

interface BetProps {
  index: "f" | "s";
  add: boolean;
  setAdd: any;
}
type FieldNameType = "betAmount" | "decrease" | "increase" | "singleAmount";
type BetOptType = "" | "20.00" | "50.00" | "100.00" | "1000.00";
type GameType = "manual" | "auto";

const Bet = ({ index, add, setAdd }: BetProps) => {
  const context = React.useContext(Context);
  const {
    state,
    fbetted,
    sbetted,
    fbetState,
    sbetState,
    GameState,
    secure,
    currentSecondNum,
    minBet,
    maxBet,
    currentTarget,
    fLoading,
    setFLoading,
    sLoading,
    setSLoading,
    update,
    updateUserBetState,
  } = context;
  const [cashOut, setCashOut] = React.useState(2);

  const auto = index === "f" ? state.userInfo.f.auto : state.userInfo.s.auto;
  const betted = index === "f" ? fbetted : sbetted;
  const betState = index === "f" ? fbetState : sbetState;
  const betAmount =
    index === "f" ? state.userInfo.f.betAmount : state.userInfo.s.betAmount;
  const autoCashoutState =
    index === "f" ? state.fautoCashoutState : state.sautoCashoutState;

  const [gameType, setGameType] = React.useState<GameType>("manual");
  const [betOpt, setBetOpt] = React.useState<BetOptType>("20.00");
  const [myBetAmount, setMyBetAmount] = React.useState<number | string>(20);
  const [targetAmount, setTargetAmount] = React.useState<number | string>(0);

  const minus = (type: FieldNameType) => {
    let value = state;
    if (type === "betAmount") {
      if (betAmount - 0.1 < minBet) {
        value.userInfo[index][type] = minBet;
      } else {
        value.userInfo[index][type] = Number(
          (Number(betAmount) - 1).toFixed(2)
        );
      }
    } else {
      if (value[`${index + type}`] - 0.1 < 0.1) {
        value[`${index + type}`] = 0.1;
      } else {
        value[`${index + type}`] = Number(
          (Number(value[`${index + type}`]) - 0.1).toFixed(2)
        );
      }
    }
    setMyBetAmount(value.userInfo[`${index}`].betAmount);
    update(value);
  };

  const plus = (type: FieldNameType) => {
    let value = state;
    if (type === "betAmount") {
      if (value.userInfo[index][type] + 1 > state.userInfo.balance) {
        value.userInfo[index][type] =
          Math.round(state.userInfo.balance * 100) / 100;
      } else {
        if (value.userInfo[index][type] + 1 > maxBet) {
          value.userInfo[index][type] = maxBet;
        } else {
          value.userInfo[index][type] = Number(
            (Number(betAmount) + 1).toFixed(2)
          );
        }
      }
    } else {
      if (value[`${index + type}`] + 1 > state.userInfo.balance) {
        value[`${index + type}`] =
          Math.round(state.userInfo.balance * 100) / 100;
      } else {
        value[`${index + type}`] = Number(
          (Number(value[`${index + type}`]) + 1).toFixed(2)
        );
      }
    }
    setMyBetAmount(value.userInfo[`${index}`].betAmount);
    update(value);
  };

  const manualPlus = (amount: number, btnNum: BetOptType) => {
    let value = state;
    if (betOpt === btnNum) {
      if (Number(betAmount + amount) > maxBet) {
        value.userInfo[index].betAmount = maxBet;
      } else {
        value.userInfo[index].betAmount = Number(
          (betAmount + amount).toFixed(2)
        );
      }
    } else {
      value.userInfo[index].betAmount = Number(Number(amount).toFixed(2));
      setBetOpt(btnNum);
    }
    setMyBetAmount(value.userInfo[index].betAmount)
    update(value);
  };

  const changeBetType = (e: GameType) => {
    updateUserBetState({ [`${index}betState`]: false });
    setGameType(e);
    if (e === "manual") {
      update({
        [`${index}autoCashoutState`]: false,
      });
    }
  };

  const onChangeInput = (e) => {
    let betAmount: string = e.target.value;
    if (parseFloat(betAmount) >= minBet && parseFloat(betAmount) <= maxBet && /^\d*\.?\d{0,2}$/.test(betAmount)) {
      setMyBetAmount(betAmount)
      update({
        ...state,
        userInfo: {
          ...state.userInfo,
          [`${index}`]: {
            ...state.userInfo[`${index}`],
            betAmount
          },
        },
      })
    }
  }

  const onChangeBlur = (
    e: number,
    type: "cashOutAt" | "decrease" | "increase" | "singleAmount"
  ) => {
    let value = state;
    if (type === "cashOutAt") {
      if (e < 1.01) {
        value.userInfo[index]["target"] = 1.01;
        setCashOut(1.01);
      } else {
        value.userInfo[index]["target"] = Math.round(e * 100) / 100;
        setCashOut(Math.round(e * 100) / 100);
      }
    } else {
      if (e < 0.1) {
        value[`${index + type}`] = 0.1;
      } else {
        value[`${index + type}`] = Math.round(e * 100) / 100;
      }
    }
    update(value);
  };

  const onBetClick = (s: boolean) => {
    if (state.userInfo[index].betAmount > state.userInfo.balance) {
      toast.error("Your balance is not enough");
    } else {
      if (secure) {
        updateUserBetState({ [`${index}betState`]: s });
      } else {
        toast.error("Please wait while getting your info. Or you can't run the duplicate game.");
      }
    }
  };

  const onAutoBetClick = (_betState: boolean) => {
    let attrs = state;
    attrs.userInfo[index].auto = _betState;
    update(attrs);

    updateUserBetState({ [`${index}betState`]: _betState });

  };

  useEffect(() => {
    if (index === "f" && GameState === "PLAYING" && betted && autoCashoutState && cashOut < currentSecondNum) {
      updateUserBetState({ [`${index}betted`]: false });
      setFLoading(true);
      callCashOut(state.userInfo, state.userInfo.userId, cashOut, index);
    }
    // eslint-disable-next-line
  }, [
    GameState,
    currentSecondNum,
    fbetted,
    autoCashoutState,
    state.userInfo.f.target,
    fLoading
  ]);

  useEffect(() => {
    if (index === "s" && GameState === "PLAYING" && betted && autoCashoutState && cashOut + 0.01 < currentSecondNum) {
      updateUserBetState({ [`${index}betted`]: false });
      setSLoading(true);
      callCashOut(state.userInfo, state.userInfo.userId, cashOut, index);
    }
    // eslint-disable-next-line
  }, [
    GameState,
    currentSecondNum,
    sbetted,
    autoCashoutState,
    state.userInfo.s.target,
    sLoading,
  ]);

  useEffect(() => {
    setMyBetAmount(betAmount);
  }, [betAmount]);

  React.useEffect(() => {
    if (GameState === "BET") {
      setTargetAmount(0)
      if (auto === true) {
        updateUserBetState({ [`${index}betted`]: true });
      }
    }
    // eslint-disable-next-line
  }, [GameState])

  return (
    <div className="bet-control">
      <div className={`controls ${(index === 'f' ? fLoading : sLoading) ? 'disabled' : ''} ${betted && (GameState === "PLAYING") ? 'border-orange' : ''} ${((!betted && auto) || betState || (betted && ((GameState === "BET") || GameState === "READY"))) ? 'border-red' : ''}`}>
        {index === "f"
          ? !add && (
            <div
              className="sec-hand-btn add"
              onClick={() => setAdd(true)}
            ></div>
          )
          : add && (
            <div
              className="sec-hand-btn minus"
              onClick={() => {
                if (betState || betted) {
                  toaster("error", "you can't remove after you bet.");
                } else {
                  setAdd(false)
                }
              }}
            ></div>
          )}
        <div className="navigation">
          <div className="navigation-switcher">
            <button
              className={gameType === "manual" ? "active" : "inactive"}
              onClick={() => {
                if (!betState && !betted) changeBetType("manual")
              }}
            >
              Bet
            </button>
            <button
              className={gameType === "auto" ? "active" : "inactive"}
              onClick={() => {
                if (!betted && !betted) changeBetType("auto")
              }}
            >
              Auto
            </button>
          </div>
        </div>
        <div className="first-row">
          <div className="bet-block">
            <div className="bet-spinner">
              <div
                className={`spinner ${betState || betted ? "disabled" : ""}`}
              >
                <div className="buttons">
                  <button
                    className="minus"
                    onClick={() =>
                      betState || betted ? "" : minus("betAmount")
                    }
                  ></button>
                </div>
                <div className="input">
                  {betState || betted ? (
                    <input
                      type="number"
                      value={myBetAmount === "" ? "" : Number(myBetAmount).toFixed(2)}
                      readOnly
                    ></input>
                  ) : (
                    <input
                      type="number"
                      value={myBetAmount}
                      onChange={(e) => {
                        onChangeInput(e)
                      }}
                    />
                  )}
                </div>
                <div className="buttons">
                  <button
                    className="plus"
                    onClick={() =>
                      betState || betted ? "" : plus("betAmount")
                    }
                  ></button>
                </div>
              </div>
            </div>
            {betState || betted ? (
              <div className="bet-opt-list">
                <button className="bet-opt disabled">
                  <span>20</span>
                </button>
                <button className="bet-opt disabled">
                  <span>50</span>
                </button>
                <button className="bet-opt disabled">
                  <span>100</span>
                </button>
                <button className="bet-opt disabled">
                  <span>1000</span>
                </button>
              </div>
            ) : (
              <div className="bet-opt-list">
                <button
                  onClick={() => manualPlus(20, "20.00")}
                  className="bet-opt"
                >
                  <span>20</span>
                </button>
                <button
                  onClick={() => manualPlus(50, "50.00")}
                  className="bet-opt"
                >
                  <span>50</span>
                </button>
                <button
                  onClick={() => manualPlus(100, "100.00")}
                  className="bet-opt"
                >
                  <span>100</span>
                </button>
                <button
                  onClick={() => manualPlus(1000, "1000.00")}
                  className="bet-opt"
                >
                  <span>1000</span>
                </button>
              </div>
            )}
          </div>
          <div className="buttons-block">
            {betted ? (
              GameState === "PLAYING" ? (
                <button
                  className="btn-waiting"
                  onClick={() => {
                    if (index === 'f') {
                      setFLoading(true);
                    } else {
                      setSLoading(true);
                    }
                    setTargetAmount(Number(betAmount * Number(currentTarget.toFixed(2))).toFixed(2))
                    callCashOut(state.userInfo, state.userInfo.userId, Number(currentTarget.toFixed(2)), index);
                  }}
                >
                  <span>
                    <label>CASHOUT</label>
                    <label className="amount">
                      <span>
                        {targetAmount ? targetAmount : Number(betAmount * Number(currentTarget.toFixed(2))).toFixed(2)}
                      </span>
                      <span className="currency">{`${state?.userInfo?.currency
                        ? state?.userInfo?.currency
                        : "INR"
                        }`}</span>
                    </label>
                  </span>
                </button>
              ) : (
                <>
                  <div className="btn-tooltip">Waiting for next round</div>
                  <button
                    className="btn-danger h-[70%]"
                    onClick={() => {
                      onBetClick(false);
                      let userInfo = { ...state.userInfo }
                      if (index === 'f') {
                        setFLoading(true);
                      } else {
                        setSLoading(true);
                      }
                      callCancelBet(userInfo.userId, userInfo[index].betid, userInfo[index].betAmount, userInfo.currency, userInfo.Session_Token, index);
                      update({
                        ...state,
                        [`${index}autoCound`]: 0,
                        userInfo: {
                          ...userInfo,
                          [index]: { ...userInfo[index], auto: false },
                        },
                      });
                    }}
                  >
                    <label>CANCEL</label>
                  </button>
                </>
                // <button className="btn-danger">WAITING</button>
              )
            ) : betState ? (
              <>
                <div className="btn-tooltip">Waiting for next round</div>
                <button
                  className="btn-danger h-[70%]"
                  onClick={() => {
                    onBetClick(false);
                    update({
                      ...state,
                      [`${index}autoCound`]: 0,
                      userInfo: {
                        ...state.userInfo,
                        [index]: { ...state.userInfo[index], auto: false },
                      },
                    });
                  }}
                >
                  <label>CANCEL</label>
                </button>
              </>
            ) : (
              <button onClick={() => onBetClick(true)} className="btn-success">
                <span>
                  <label>BET</label>
                  <label className="amount">
                    <span>{Number(betAmount).toFixed(2)}&nbsp;</span>
                    <span className="currency">{`${state?.userInfo?.currency
                      ? state?.userInfo?.currency
                      : "INR"
                      }`}</span>
                  </label>
                </span>
              </button>
            )}
          </div>
        </div>
        {/* Auto */}
        {gameType === "auto" && (
          <>
            <div className="border-line"></div>
            <div className="second-row">
              <div className="auto-bet-wrapper">
                <div className="auto-bet">
                  <div className="cashout-block">
                    <div className="cashout-switcher">
                      <label className="label">Auto Bet</label>
                      <div
                        onClick={() => {
                          onAutoBetClick(!auto);
                        }}
                        className={`input-switch ${auto ? "" : "off"}`}
                      >
                        <span className="oval"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cashout-block">
                <div className="cashout-switcher">
                  <label className="label">Auto Cash Out</label>
                  {/* {betted || betState ? ( */}
                  {betted ? (
                    <div
                      className={`input-switch ${autoCashoutState ? "" : "off"
                        }`}
                    >
                      <span className="oval"></span>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        update({
                          [`${index}autoCashoutState`]: !autoCashoutState,
                        });
                      }}
                      className={`input-switch ${autoCashoutState ? "" : "off"}`}
                    >
                      <span className="oval"></span>
                    </div>
                  )}
                </div>
                <div className="cashout-snipper-wrapper">
                  <div className="cashout-snipper">
                    <div
                      className={`snipper small ${autoCashoutState ? "" : "disabled"}`}
                    >
                      <div className="input">
                        {autoCashoutState ? (
                          <input
                            type="number"
                            onChange={(e) => {
                              update({
                                ...state,
                                userInfo: {
                                  ...state.userInfo,
                                  [`${index}`]: {
                                    ...state.userInfo[index],
                                    target: Number(e.target.value),
                                  },
                                },
                              });
                              setCashOut(Number(e.target.value));
                            }}
                            value={cashOut}
                            onBlur={(e) =>
                              onChangeBlur(
                                Number(e.target.value) || 0,
                                "cashOutAt"
                              )
                            }
                          />
                        ) : (
                          <input
                            type="number"
                            value={cashOut.toFixed(2)}
                            readOnly
                          />
                        )}
                      </div>
                      <span className="text" onClick={() => autoCashoutState && setCashOut(1)}>×</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div >
  );
};

export default Bet;
