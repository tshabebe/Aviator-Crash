/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, createContext } from "react";
import { useLocation } from "react-router";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";
import { isMobile, isTablet, isDesktop } from 'react-device-detect';

import config from "./config.json";
import toaster from "./components/Toast";

import {
  BettedUserType,
  UserType,
  GameStatusType,
  GameBetLimit,
  GameHistory,
  UserStatusType,
  ContextDataType,
  ContextType,
  MsgUserType,
  unityContext,
  init_state,
} from "./utils/interfaces"

const Context = createContext<ContextType>(null!);

const socket = io(
  process.env.REACT_APP_DEVELOPMENT === "true"
    ? config.development_wss
    : config.production_wss
);

export const callCashOut = (userInfo: any, userId: string, at: number, index: "f" | "s") => {
  let endTarget: Number = Number(at.toFixed(2))
  let data = { userInfo, userId, type: index, endTarget };
  socket.emit("cashOut", data);
};

export const callCancelBet = (userId: string, betid: string, betAmount: any, currency: string, Session_Token: string, type: string) => {
  let data = { userId, betid, betAmount, currency, Session_Token, type };
  socket.emit("cancelBet", data);
};

let fIncreaseAmount = 0;
let fDecreaseAmount = 0;
let sIncreaseAmount = 0;
let sDecreaseAmount = 0;

let newState;
let newBetState;

export const Provider = ({ children }: any) => {
  const token = new URLSearchParams(useLocation().search).get("token");
  const UserID = new URLSearchParams(useLocation().search).get("UserID");
  const currency = new URLSearchParams(useLocation().search).get("currency");
  const returnurl = new URLSearchParams(useLocation().search).get("returnurl");

  const [msgData, setMsgData] = useState<MsgUserType[]>([]);

  const [secure, setSecure] = useState<boolean>(false);
  const [msgReceived, setMsgReceived] = useState<boolean>(false);
  const [errorBackend, setErrorBackend] = useState<boolean>(false);
  const [platformLoading, setPlatformLoading] = useState<boolean>(true);
  const [state, setState] = useState<ContextDataType>(init_state);
  const [msgTab, setMsgTab] = useState<boolean>(
    state.userInfo.msgVisible
  );

  const toggleMsgTab = () => {
    setMsgTab(!msgTab);
  };

  newState = state;
  const [unity, setUnity] = useState({
    unityState: false,
    unityLoading: false,
    currentProgress: 0,
  });
  const [gameState, setGameState] = useState({
    currentNum: 0,
    lastSecondNum: 0,
    currentSecondNum: 0,
    GameState: "",
    time: 0,
  });

  const [bettedUsers, setBettedUsers] = useState<BettedUserType[]>([]);
  const update = (attrs: Partial<ContextDataType>) => {
    setState({ ...state, ...attrs });
  };
  const [previousHand, setPreviousHand] = useState<UserType[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [userBetState, setUserBetState] = useState<UserStatusType>({
    fbetState: false,
    fbetted: false,
    sbetState: false,
    sbetted: false,
  });
  newBetState = userBetState;
  const [fLoading, setFLoading] = useState<Boolean>(false);
  const [sLoading, setSLoading] = useState<Boolean>(false);
  const [rechargeState, setRechargeState] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [ip, setIP] = useState<string>("");
  const updateUserBetState = (attrs: Partial<UserStatusType>) => {
    setUserBetState({ ...userBetState, ...attrs });
  };
  const handleServerSeed = (seed: string) => {
    setState({ ...state, seed });
  };

  const [betLimit, setBetLimit] = useState<GameBetLimit>({
    minBet: 10,
    maxBet: 100000,
  });

  const handleGetSeed = () => {
    socket.emit("getSeed");
  };

  const updateUserMsg = (
    _id: string,
    userId: string,
    userName: string,
    avatar: string,
    message: string,
    img: string,
    likes: number,
    likesIDs: string[],
    disLikes: number,
    disLikesIDs: string[],
  ) => {
    setMsgData([
      ...msgData,
      {
        _id,
        userId,
        userName,
        avatar,
        message,
        img,
        likes,
        likesIDs,
        disLikes,
        disLikesIDs
      },
    ]);
  };

  const handleSetDefaultLoading = () => {
    setFLoading(false)
    setSLoading(false)
  }

  useEffect(
    function () {
      setPlatformLoading(false);
      unityContext.on("GameController", function (message) {
        if (message === "Ready") {
          setUnity({
            currentProgress: 100,
            unityLoading: true,
            unityState: true,
          });
        }
      });
      unityContext.on("progress", (progression) => {
        const currentProgress = progression * 100;
        if (progression === 1) {
          setUnity({ currentProgress, unityLoading: true, unityState: true });
        } else {
          setUnity({
            currentProgress,
            unityLoading: false,
            unityState: false,
          });
        }
      });
      return () => unityContext.removeAllEventListeners();
      // if (secure) {
      // }
    },
    []
    // [secure]
  );

  useEffect(() => {
    socket.on("connect", () =>
      console.log(`Socket connection is ${socket.connected}`)
    );

    socket.on("gameState", (gameState: GameStatusType) => {
      setGameState(gameState);
    });

    if (secure) {

      socket.on("bettedUserInfo", (bettedUsers: BettedUserType[]) => {
        setBettedUsers(bettedUsers);
      });

      socket.on("myBetState", (userInfo: { user: UserType; type: string }) => {
        var { user, type } = userInfo;
        var attrs = { ...userBetState };
        attrs.fbetState = false;
        attrs.fbetted = user.f.betted;
        attrs.sbetState = false;
        attrs.sbetted = user.s.betted;
        setUserBetState(attrs);
        if (type === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
        getMyBets();
      });

      socket.on("history", (history: any) => {
        setHistory(history);
      });

      socket.on("serverSeed", (seed: string) => {
        handleServerSeed(seed);
      });

      socket.on("previousHand", (previousHand: UserType[]) => {
        setPreviousHand(previousHand);
      });

      socket.on("finishGame", (user: UserType) => {
        let attrs = newState;
        let fauto = attrs.userInfo.f.auto;
        let sauto = attrs.userInfo.s.auto;
        let fbetAmount = attrs.userInfo.f.betAmount;
        let sbetAmount = attrs.userInfo.s.betAmount;
        let betStatus = newBetState;
        attrs.userInfo = user;
        attrs.userInfo.f.betAmount = fbetAmount;
        attrs.userInfo.s.betAmount = sbetAmount;
        attrs.userInfo.f.auto = fauto;
        attrs.userInfo.s.auto = sauto;
        if (!user.f.betted) {
          betStatus.fbetted = false;
          if (attrs.userInfo.f.auto) {
            if (user.f.cashouted) {
              fIncreaseAmount += user.f.cashAmount;
              if (attrs.finState && attrs.fincrease - fIncreaseAmount <= 0) {
                attrs.userInfo.f.auto = false;
                betStatus.fbetState = false;
                fIncreaseAmount = 0;
              } else if (
                attrs.fsingle &&
                attrs.fsingleAmount <= user.f.cashAmount
              ) {
                attrs.userInfo.f.auto = false;
                betStatus.fbetState = false;
              } else {
                attrs.userInfo.f.auto = true;
                betStatus.fbetState = true;
              }
            } else {
              fDecreaseAmount += user.f.betAmount;
              if (attrs.fdeState && attrs.fdecrease - fDecreaseAmount <= 0) {
                attrs.userInfo.f.auto = false;
                betStatus.fbetState = false;
                fDecreaseAmount = 0;
              } else {
                attrs.userInfo.f.auto = true;
                betStatus.fbetState = true;
              }
            }
          }
        }
        if (!user.s.betted) {
          betStatus.sbetted = false;
          if (user.s.auto) {
            if (user.s.cashouted) {
              sIncreaseAmount += user.s.cashAmount;
              if (attrs.sinState && attrs.sincrease - sIncreaseAmount <= 0) {
                attrs.userInfo.s.auto = false;
                betStatus.sbetState = false;
                sIncreaseAmount = 0;
              } else if (
                attrs.ssingle &&
                attrs.ssingleAmount <= user.s.cashAmount
              ) {
                attrs.userInfo.s.auto = false;
                betStatus.sbetState = false;
              } else {
                attrs.userInfo.s.auto = true;
                betStatus.sbetState = true;
              }
            } else {
              sDecreaseAmount += user.s.betAmount;
              if (attrs.sdeState && attrs.sdecrease - sDecreaseAmount <= 0) {
                attrs.userInfo.s.auto = false;
                betStatus.sbetState = false;
                sDecreaseAmount = 0;
              } else {
                attrs.userInfo.s.auto = true;
                betStatus.sbetState = true;
              }
            }
          }
        }
        handleSetDefaultLoading()
        update(attrs);
        setUserBetState(betStatus);
      });

      socket.on("getBetLimits", (betAmounts: { max: number; min: number }) => {
        setBetLimit({ maxBet: betAmounts.max, minBet: betAmounts.min });
      });

      socket.on("recharge", () => {
        setRechargeState(true);
      });

      socket.on("cancelled", (data: { status: boolean, type: string }) => {
        const { type } = data;
        updateUserBetState({ [`${type}betState`]: false, [`${type}betted`]: false });
        if (type === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
      })

      socket.on("error", (data) => {
        setUserBetState({
          ...userBetState,
          [`${data.index}betted`]: false,
        });
        if (data.index === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
        toast.error(data.message);
      });

      socket.on("success", (data) => {
        if (data.index === 'f') {
          setFLoading(false)
        } else {
          setSLoading(false)
        }
        toaster(
          "success",
          data.msg,
          data.currency,
          data.point,
          data.cashoutAmount
        );
      });
    }
    return () => {
      socket.off("connect");
      socket.off("enterRoom");
      socket.off("disconnect");
      socket.off("myBetState");
      socket.off("sessionSecure");
      socket.off("history");
      socket.off("gameState");
      socket.off("previousHand");
      socket.off("finishGame");
      socket.off("getBetLimits");
      socket.off("recharge");
      socket.off("cancelled")
      socket.off("error");
      socket.off("success");
    };
    // eslint-disable-next-line
  }, [socket, secure, token, userBetState]);

  useEffect(() => {
    if (token && UserID && currency && returnurl) {
      socket.emit("sessionCheck", { token, UserID, currency, returnurl });
      socket.on("sessionSecure", (data) => {
        if (data.sessionStatus === true) {
          socket.emit("enterRoom", { token, UserID, currency });
        } else {
          toast.error(data.message);
          setErrorBackend(true);
        }
      });

      socket.on("myInfo", (user: UserType) => {
        localStorage.setItem("aviator-audio", "");
        let attrs = { ...state };
        attrs.userInfo.balance = user.balance;
        attrs.userInfo.userType = user.userType;
        attrs.userInfo.userId = user.userId;
        attrs.userInfo.userName = user.userName;
        attrs.userInfo.avatar = user.avatar;
        attrs.userInfo.currency = user.currency;
        attrs.userInfo.isSoundEnable = user.isSoundEnable;
        attrs.userInfo.isMusicEnable = user.isMusicEnable;
        attrs.userInfo.ipAddress = user.ipAddress;
        attrs.userInfo.Session_Token = user.Session_Token;
        update(attrs);
        setSecure(true);
      });

      return () => {
        socket.off("sessionSecure");
        socket.off("myInfo");
      }
    }
    // eslint-disable-next-line
  }, [socket])

  useEffect(() => {
    socket.on("newMsg", ({
      _id,
      userId,
      userName,
      avatar,
      message,
      img,
      likes,
      likesIDs,
      disLikes,
      disLikesIDs
    }) => {
      setMsgReceived(!msgReceived);
      updateUserMsg(
        _id,
        userId,
        userName,
        avatar,
        message,
        img,
        likes,
        likesIDs,
        disLikes,
        disLikesIDs
      );
    });
    return () => {
      socket.off("newMsg");
    };
  }, [socket, msgReceived, msgData]);

  const handlePlaceBet = async () => {
    if (secure) {
      let attrs = state;
      let betStatus = userBetState;
      let fBetFlag = betStatus.fbetState && !attrs.userInfo.f.betted;
      let sBetFlag = betStatus.sbetState && !attrs.userInfo.s.betted;
      let fBetBalance = attrs.userInfo.balance - state.userInfo.f.betAmount < 0;
      let sBetBalance = attrs.userInfo.balance - state.userInfo.s.betAmount < 0;
      if (fBetFlag) {
        sBetBalance = attrs.userInfo.balance - state.userInfo.f.betAmount - state.userInfo.s.betAmount < 0;
      }

      if (fBetFlag) {
        let fbetid = `Crash-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
        attrs.userInfo.f.betid = fbetid;
        attrs.userInfo.f.betted = true;
      }
      if (sBetFlag) {
        let sbetid = `Crash-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
        attrs.userInfo.s.betid = sbetid;
        attrs.userInfo.s.betted = true;
      }
      if (fBetFlag) {
        let data = {
          type: "f",
          userInfo: attrs.userInfo,
        };
        if (fBetBalance) {
          toast.error("Your balance is not enough");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          setFLoading(false);
        } else {
          attrs.userInfo.balance -= state.userInfo.f.betAmount;
          setFLoading(true);
          socket.emit("playBet", data);
          betStatus.fbetState = false;
          betStatus.fbetted = true;
          update(attrs);
          setUserBetState(betStatus);
        }
      }
      if (sBetFlag) {
        let data = {
          type: "s",
          userInfo: attrs.userInfo,
        };
        if (sBetBalance) {
          toast.error("Your balance is not enough");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          setSLoading(false);
        } else {
          attrs.userInfo.balance -= state.userInfo.s.betAmount;
          setSLoading(true);
          socket.emit("playBet", data);
          betStatus.sbetState = false;
          betStatus.sbetted = true;
          update(attrs);
          setUserBetState(betStatus);
        }
      }
    } else {
      toast.error("Please wait while getting your info.");
    }
  }

  useEffect(() => {
    if (gameState.GameState === "BET") handlePlaceBet();
  }, [state, gameState.GameState, userBetState.fbetState, userBetState.sbetState]);

  useEffect(() => {
    if (gameState.GameState === "READY") handleSetDefaultLoading()
  }, [gameState.GameState]);

  const getMyBets = async () => {
    try {
      let response = await axios.post(
        `${process.env.REACT_APP_DEVELOPMENT === "true"
          ? config.development_api
          : config.production_api
        }/my-info`,
        {
          userId: UserID,
        }
      );
      if (response?.data?.status) {
        console.log(response.data.data);
        update({ myBets: response.data.data as GameHistory[] });
      }
    } catch (error) {
      console.log("getMyBets", error);
    }
  };

  useEffect(() => {
    if (UserID) {
      getMyBets();
    }
    // eslint-disable-next-line
  }, [UserID, gameState.GameState]);

  const updateMyIpAddress = async () => {
    const res = await axios.get("https://api.ipify.org/?format=json");
    try {
      let platform: string = "desktop";
      if (isMobile) platform = "mobile"
      if (isTablet) platform = "tablet;"
      if (isDesktop) platform = "desktop"
      let response = await axios.post(
        `${process.env.REACT_APP_DEVELOPMENT === "true"
          ? config.development_api
          : config.production_api
        }/update-info`,
        {
          userId: UserID,
          updateData: {
            ipAddress: res.data.ip,
            platform
          },
        }
      );
      if (response?.data?.status) {
        update({
          userInfo: {
            ...state.userInfo,
            ipAddress: res.data.ip,
            platform
          }
        });
        setIP(res.data.ip)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (UserID) {
      if ((state.userInfo.ipAddress === "0.0.0.0" || state.userInfo.ipAddress === "") && ip === "") {
        updateMyIpAddress();
      }
    }
  }, [state.userInfo, UserID, ip]);

  return (
    <Context.Provider
      value={{
        state: state,
        ...betLimit,
        ...userBetState,
        ...unity,
        ...gameState,
        socket,
        msgData,
        msgReceived,
        platformLoading,
        msgTab,
        errorBackend,
        currentTarget,
        rechargeState,
        myUnityContext: unityContext,
        bettedUsers: [...bettedUsers],
        previousHand: [...previousHand],
        history: [...history],
        fLoading,
        setFLoading,
        sLoading,
        setSLoading,
        setMsgData,
        setCurrentTarget,
        setMsgReceived,
        update,
        getMyBets,
        updateUserBetState,
        handleGetSeed,
        handlePlaceBet,
        toggleMsgTab,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Context;
