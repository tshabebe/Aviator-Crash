/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { UnityContext } from "react-unity-webgl";
import { useLocation } from "react-router";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { config } from "./config";

export interface BettedUserType {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
}

export interface UserType {
  balance: number;
  userType: boolean;
  img: string;
  userName: string;
  userId: string;
  avatar: string;
  currency: string;
  token: string;
  Session_Token: string;
  ipAddress: string;
  platform: string;
  isSoundEnable: boolean;
  isMusicEnable: boolean;
  msgVisible: boolean;
  f: {
    auto: boolean;
    autocashout: boolean;
    betid: string;
    betted: boolean;
    cashouted: boolean;
    betAmount: number;
    cashAmount: number;
    target: number;
  };
  s: {
    auto: boolean;
    autocashout: boolean;
    betid: string;
    betted: boolean;
    cashouted: boolean;
    betAmount: number;
    cashAmount: number;
    target: number;
  };
}

export interface PlayerType {
  auto: boolean;
  betted: boolean;
  cashouted: boolean;
  betAmount: number;
  cashAmount: number;
  target: number;
}

interface GameStatusType {
  currentNum: string; // Backend sends as string with .toFixed(2)
  currentSecondNum: number;
  GameState: string;
  time: number;
}

interface GameBetLimit {
  maxBet: number;
  minBet: number;
}

declare interface GameHistory {
  _id: number;
  name: string;
  betAmount: number;
  cashoutAt: number;
  cashouted: boolean;
  date: number;
  createdAt: string;
  flyAway: number;
  flyDetailID: number;
}

interface UserStatusType {
  fbetState: boolean;
  fbetted: boolean;
  sbetState: boolean;
  sbetted: boolean;
}

export interface MsgUserType {
  _id?: string;
  userId: string;
  userName: string;
  avatar: string;
  message: string;
  img: string;
  likes: number;
  likesIDs: string[];
  disLikes: number;
  disLikesIDs: string[];
}

interface ContextDataType {
  myBets: GameHistory[];
  width: number;
  userInfo: UserType;
  seed: string;
  fautoCashoutState: boolean;
  fautoCound: number;
  finState: boolean;
  fdeState: boolean;
  fsingle: boolean;
  fincrease: number;
  fdecrease: number;
  fsingleAmount: number;
  fdefaultBetAmount: number;
  sautoCashoutState: boolean;
  sautoCound: number;
  sincrease: number;
  sdecrease: number;
  ssingleAmount: number;
  sinState: boolean;
  sdeState: boolean;
  ssingle: boolean;
  sdefaultBetAmount: number;
  myUnityContext: UnityContext;
}

interface ContextType extends GameBetLimit, UserStatusType, GameStatusType {
  state: ContextDataType;
  userInfo: UserType;
  socket: any;
  unityState: boolean;
  unityLoading: boolean;
  currentProgress: number;
  bettedUsers: BettedUserType[];
  previousHand: UserType[];
  history: number[];
  msgData: MsgUserType[];
  msgTab: boolean;
  msgReceived: boolean;
  platformLoading: boolean;
  errorBackend: boolean;
  secure: boolean;
  globalUserInfo: UserType;
  userSeedText: string;
  fLoading: boolean;
  sLoading: boolean;
  rechargeState: boolean;
  myUnityContext: UnityContext;
  currentTarget: number;
  setCurrentTarget(attrs: Partial<number>);
  setFLoading(attrs: boolean);
  setSLoading(attrs: boolean);
  setMsgReceived(attrs: Partial<boolean>);
  setMsgData(attrs: MsgUserType[]);
  update(attrs: Partial<ContextDataType>);
  updateUserInfo(attrs: Partial<UserType>);
  getMyBets();
  updateUserBetState(attrs: Partial<UserStatusType>);
  handleGetSeed();
  handleGetSeedOfRound(roundId: Number);
  handleChangeUserSeed(seed: Partial<string>);
  handlePlaceBet();
  toggleMsgTab();
}

const unityContext = new UnityContext({
  loaderUrl: "unity/AirCrash.loader.js",
  dataUrl: "unity/AirCrash.data.unityweb",
  frameworkUrl: "unity/AirCrash.framework.js.unityweb",
  codeUrl: "unity/AirCrash.wasm.unityweb",
});

const init_state = {
  myBets: [],
  width: 1500,
  seed: "",
  userInfo: {
    balance: 0,
    userType: false,
    img: "",
    userName: "",
    userId: "",
    avatar: "",
    currency: "ETB",
    token: "",
    Session_Token: "",
    ipAddress: "",
    platform: "desktop",
    isSoundEnable: false,
    isMusicEnable: false,
    msgVisible: false,
    f: {
      auto: false,
      autocashout: false,
      betid: "0",
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 20,
      target: 2,
    },
    s: {
      auto: false,
      autocashout: false,
      betid: "0",
      betted: false,
      cashouted: false,
      cashAmount: 0,
      betAmount: 20,
      target: 2,
    },
  },
  fautoCashoutState: false,
  fautoCound: 0,
  finState: false,
  fdeState: false,
  fsingle: false,
  fincrease: 0,
  fdecrease: 0,
  fsingleAmount: 0,
  fdefaultBetAmount: 20,
  sautoCashoutState: false,
  sautoCound: 0,
  sincrease: 0,
  sdecrease: 0,
  ssingleAmount: 0,
  sinState: false,
  sdeState: false,
  ssingle: false,
  sdefaultBetAmount: 20,
  myUnityContext: unityContext,
} as ContextDataType;

const init_userInfo: UserType = {
  balance: 0,
  userType: false,
  img: "/avatars/avatar1.png",
  userName: "",
  userId: "",
  avatar: "/avatars/avatar1.png",
  currency: "ETB",
  token: "",
  Session_Token: "",
  ipAddress: "",
  platform: "desktop",
  isSoundEnable: false,
  isMusicEnable: false,
  msgVisible: false,
  f: {
    auto: false,
    autocashout: false,
    betid: "0",
    betted: false,
    cashouted: false,
    cashAmount: 0,
    betAmount: 20,
    target: 2,
  },
  s: {
    auto: false,
    autocashout: false,
    betid: "0",
    betted: false,
    cashouted: false,
    cashAmount: 0,
    betAmount: 20,
    target: 2,
  },
};

const Context = React.createContext<ContextType>(null!);

const socket = io(config.wss, {
  autoConnect: false, // Don't connect until we have a token
});

export const callCashOut = (at: number, index: "f" | "s") => {
  let data = { type: index, endTarget: at };
  socket.emit("cashOut", data);
};

let fIncreaseAmount = 0;
let fDecreaseAmount = 0;
let sIncreaseAmount = 0;
let sDecreaseAmount = 0;

let newState;
let newBetState;

export const Provider = ({ children }: any) => {
  const token = new URLSearchParams(useLocation().search).get("cert");
  const [state, setState] = React.useState<ContextDataType>(init_state);

  newState = state;
  const [unity, setUnity] = React.useState({
    unityState: false,
    unityLoading: false,
    currentProgress: 0,
  });
  const [gameState, setGameState] = React.useState({
    currentNum: "1.00", // Initialize as string to match backend format
    currentSecondNum: 0,
    GameState: "",
    time: 0,
  });

  const [userInfo, setUserInfo] = React.useState<UserType>(init_userInfo);
  const [bettedUsers, setBettedUsers] = React.useState<BettedUserType[]>([]);
  const update = (attrs: Partial<ContextDataType>) => {
    setState({ ...state, ...attrs });
  };
  const updateUserInfo = (attrs: Partial<UserType>) => {
    setUserInfo({ ...userInfo, ...attrs });
  };
  const [previousHand, setPreviousHand] = React.useState<UserType[]>([]);
  const [history, setHistory] = React.useState<number[]>([]);
  const [userBetState, setUserBetState] = React.useState<UserStatusType>({
    fbetState: false,
    fbetted: false,
    sbetState: false,
    sbetted: false,
  });
  newBetState = userBetState;
  const [rechargeState, setRechargeState] = React.useState(false);
  const [currentTarget, setCurrentTarget] = React.useState(0);
  const updateUserBetState = (attrs: Partial<UserStatusType>) => {
    setUserBetState({ ...userBetState, ...attrs });
  };

  const [betLimit, setBetLimit] = React.useState<GameBetLimit>({
    maxBet: 1000,
    minBet: 1,
  });
  
  // Additional state for compatibility
  const [msgData, setMsgData] = React.useState<MsgUserType[]>([]);
  const [msgTab, setMsgTab] = React.useState(false);
  const [msgReceived, setMsgReceived] = React.useState(false);
  const [fLoading, setFLoading] = React.useState(false);
  const [sLoading, setSLoading] = React.useState(false);
  const [platformLoading, setPlatformLoading] = React.useState(false);
  const [errorBackend, setErrorBackend] = React.useState(false);
  const [secure, setSecure] = React.useState(false);
  const [userSeedText, setUserSeedText] = React.useState("");
  
  // Stub functions for compatibility
  const handleGetSeed = () => {
    console.log("handleGetSeed called");
  };
  
  const handleGetSeedOfRound = (roundId: Number) => {
    console.log("handleGetSeedOfRound called with:", roundId);
  };
  
  const handleChangeUserSeed = (seed: Partial<string>) => {
    console.log("handleChangeUserSeed called with:", seed);
  };
  
  const handlePlaceBet = () => {
    console.log("handlePlaceBet called");
  };
  
  const toggleMsgTab = () => {
    setMsgTab(!msgTab);
  };
  React.useEffect(function () {
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
        setUnity({ currentProgress, unityLoading: false, unityState: false });
      }
    });
    return () => unityContext.removeAllEventListeners();
  }, []);

  React.useEffect(() => {
    // Only connect if we have a token
    if (token) {
      console.log("Connecting to backend with token...");
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("✅ Socket connected, joining room...");
      socket.emit("enterRoom", { token });
    });

    socket.on("bettedUserInfo", (bettedUsers: BettedUserType[]) => {
      setBettedUsers(bettedUsers);
    });

    socket.on("myBetState", (user: UserType) => {
      const attrs = userBetState;
      attrs.fbetState = false;
      attrs.fbetted = user.f?.betted || false;
      attrs.sbetState = false;
      attrs.sbetted = user.s?.betted || false;
      setUserBetState(attrs);
    });

    socket.on("myInfo", (user: any) => {
      // Update userInfo state with data from backend
      setUserInfo({
        ...userInfo,
        balance: user.balance,
        userType: user.userType,
        userName: user.userName,
        userId: user.userId || "",
        avatar: user.avatar || "/avatars/avatar1.png",
        currency: user.currency || "ETB",
        token: user.token || token || "",
        Session_Token: user.Session_Token || "",
        ipAddress: user.ipAddress || "",
        platform: user.platform || "desktop",
        isSoundEnable: user.isSoundEnable || false,
        isMusicEnable: user.isMusicEnable || false,
        msgVisible: user.msgVisible || false,
        f: user.f || userInfo.f,
        s: user.s || userInfo.s,
        img: user.avatar || "/avatars/avatar1.png",
      });
    });

    socket.on("history", (history: any) => {
      setHistory(history);
    });

    socket.on("gameState", (gameState: GameStatusType) => {
      setGameState(gameState);
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
      
      // Merge user data while preserving local state
      attrs.userInfo = {
        ...user,
        f: {
          ...user.f,
          betAmount: fbetAmount,
          auto: fauto,
        },
        s: {
          ...user.s,
          betAmount: sbetAmount,
          auto: sauto,
        },
      };
      if (!user.f?.betted) {
        betStatus.fbetted = false;
        if (attrs.userInfo.f.auto) {
          if (user.f?.cashouted) {
            fIncreaseAmount += user.f?.cashAmount || 0;
            if (attrs.finState && attrs.fincrease - fIncreaseAmount <= 0) {
              attrs.userInfo.f.auto = false;
              betStatus.fbetState = false;
              fIncreaseAmount = 0;
            } else if (
              attrs.fsingle &&
              attrs.fsingleAmount <= (user.f?.cashAmount || 0)
            ) {
              attrs.userInfo.f.auto = false;
              betStatus.fbetState = false;
            } else {
              attrs.userInfo.f.auto = true;
              betStatus.fbetState = true;
            }
          } else {
            fDecreaseAmount += user.f?.betAmount || 0;
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
      if (!user.s?.betted) {
        betStatus.sbetted = false;
        if (user.s?.auto) {
          if (user.s?.cashouted) {
            sIncreaseAmount += user.s?.cashAmount || 0;
            if (attrs.sinState && attrs.sincrease - sIncreaseAmount <= 0) {
              attrs.userInfo.s.auto = false;
              betStatus.sbetState = false;
              sIncreaseAmount = 0;
            } else if (
              attrs.ssingle &&
              attrs.ssingleAmount <= (user.s?.cashAmount || 0)
            ) {
              attrs.userInfo.s.auto = false;
              betStatus.sbetState = false;
            } else {
              attrs.userInfo.s.auto = true;
              betStatus.sbetState = true;
            }
          } else {
            sDecreaseAmount += user.s?.betAmount || 0;
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
      update(attrs);
      setUserBetState(betStatus);
    });

    socket.on("getBetLimits", (betAmounts: { max: number; min: number }) => {
      setBetLimit({ maxBet: betAmounts.max, minBet: betAmounts.min });
    });

    socket.on("recharge", () => {
      setRechargeState(true);
    });

    socket.on("error", (data) => {
      setUserBetState({
        ...userBetState,
        [`${data.index}betted`]: false,
      });
      toast.error(data.message);
    });

    socket.on("success", (data) => {
      toast.success(data);
    });

    // Chat event listeners
    socket.on("chatHistory", (messages: any[]) => {
      setMsgData(messages);
    });

    socket.on("newMessage", (message: any) => {
      setMsgData((prev) => [...prev, message]);
      setMsgReceived(true);
    });

    socket.on("updateMessage", (updatedMessage: any) => {
      setMsgData((prev) =>
        prev.map((msg: any) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("myBetState");
      socket.off("myInfo");
      socket.off("history");
      socket.off("gameState");
      socket.off("previousHand");
      socket.off("finishGame");
      socket.off("getBetLimits");
      socket.off("recharge");
      socket.off("error");
      socket.off("success");
      socket.off("chatHistory");
      socket.off("newMessage");
      socket.off("updateMessage");
    };
  }, [token]); // Reconnect when token changes

  React.useEffect(() => {
    let attrs = state;
    let betStatus = userBetState;
    if (gameState.GameState === "BET") {
      if (betStatus.fbetState) {
        if (state.userInfo.f?.auto) {
          if (state.fautoCound > 0) attrs.fautoCound -= 1;
          else {
            attrs.userInfo.f.auto = false;
            betStatus.fbetState = false;
            return;
          }
        }
        let data = {
          betAmount: state.userInfo.f?.betAmount || 20,
          target: state.userInfo.f?.target || 2,
          type: "f",
          auto: state.userInfo.f?.auto || false,
        };
        if (attrs.userInfo.balance - (state.userInfo.f?.betAmount || 0) < 0) {
          toast.error("Your balance is not enough");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          return;
        }
        attrs.userInfo.balance -= (state.userInfo.f?.betAmount || 0);
        socket.emit("playBet", data);
        betStatus.fbetState = false;
        betStatus.fbetted = true;
        // update(attrs);
        setUserBetState(betStatus);
      }
      if (betStatus.sbetState) {
        if (state.userInfo.s?.auto) {
          if (state.sautoCound > 0) attrs.sautoCound -= 1;
          else {
            attrs.userInfo.s.auto = false;
            betStatus.sbetState = false;
            return;
          }
        }
        let data = {
          betAmount: state.userInfo.s?.betAmount || 20,
          target: state.userInfo.s?.target || 2,
          type: "s",
          auto: state.userInfo.s?.auto || false,
        };
        if (attrs.userInfo.balance - (state.userInfo.s?.betAmount || 0) < 0) {
          toast.error("Your balance is not enough");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          return;
        }
        attrs.userInfo.balance -= (state.userInfo.s?.betAmount || 0);
        socket.emit("playBet", data);
        betStatus.sbetState = false;
        betStatus.sbetted = true;
        // update(attrs);
        setUserBetState(betStatus);
      }
    }
  }, [gameState.GameState, userBetState.fbetState, userBetState.sbetState]);

  const getMyBets = async () => {
    try {
      const response = await fetch(`${config.api}/my-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: state.userInfo.userName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          update({ myBets: data.data as GameHistory[] });
        }
      } else {
        console.error("Error:", response.statusText);
      }
    } catch (error) {
      console.log("getMyBets", error);
    }
  };

  useEffect(() => {
    if (gameState.GameState === "BET") getMyBets();
  }, [gameState.GameState]);

  return (
    <Context.Provider
      value={{
        state: state,
        userInfo: userInfo,
        socket: socket,
        ...betLimit,
        ...userBetState,
        ...unity,
        ...gameState,
        currentTarget,
        rechargeState,
        myUnityContext: unityContext,
        bettedUsers: [...bettedUsers],
        previousHand: [...previousHand],
        history: [...history],
        msgData: msgData,
        msgTab: msgTab,
        msgReceived: msgReceived,
        platformLoading: platformLoading,
        errorBackend: errorBackend,
        secure: secure,
        globalUserInfo: userInfo,
        userSeedText: userSeedText,
        fLoading: fLoading,
        sLoading: sLoading,
        setCurrentTarget,
        setFLoading,
        setSLoading,
        setMsgReceived,
        setMsgData,
        update,
        updateUserInfo,
        getMyBets,
        updateUserBetState,
        handleGetSeed,
        handleGetSeedOfRound,
        handleChangeUserSeed,
        handlePlaceBet,
        toggleMsgTab,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Context;
