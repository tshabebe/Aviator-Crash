/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { UnityContext } from "react-unity-webgl";
import { useLocation } from "react-router";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { config } from "./config";
import { useQueryClient } from '@tanstack/react-query';

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
  img: "/avatars/av-5.png",
  userName: "",
  userId: "",
  avatar: "/avatars/av-5.png",
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

let newState: ContextDataType;
let newBetState: UserStatusType;

export const Provider = ({ children }: any) => {
  const queryClient = useQueryClient();
  const tokenFromUrl = new URLSearchParams(useLocation().search).get("token");
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = tokenFromUrl || storedToken || undefined;
  const tenantFromUrl = new URLSearchParams(useLocation().search).get("tenantId");
  const storedTenant = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
  const tenantId = tenantFromUrl || storedTenant || undefined;
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
  };
  
  const handleGetSeedOfRound = (roundId: Number) => {
  };
  
  const handleChangeUserSeed = (seed: Partial<string>) => {
  };
  
  const handlePlaceBet = () => {
  };
  
  const toggleMsgTab = () => {
    setMsgTab(!msgTab);
  };
  React.useEffect(function () {
    // Add error handling for Unity context
    try {
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

      // Add error event listener
      unityContext.on("error", (error) => {
        console.error("Unity WebGL error:", error);
      });
    } catch (error) {
      console.error("Error setting up Unity event listeners:", error);
    }
    
    return () => {
      try {
        unityContext.removeAllEventListeners();
      } catch (error) {
        console.error("Error removing Unity event listeners:", error);
      }
    };
  }, []);

  React.useEffect(() => {
    // Only connect if we have a token
    if (token) {
      // Persist token and tenantId
      try {
        // Save token from URL or use existing localStorage token
        if (tokenFromUrl) localStorage.setItem('token', tokenFromUrl);
        if (tenantFromUrl) localStorage.setItem('tenantId', tenantFromUrl);
      } catch {}

      // Attach tenantId to socket auth and query
      if (tenantId) {
        (socket as any).auth = { ...(socket as any).auth, tenantId };
        try {
          (socket.io as any).opts = { ...(socket.io as any).opts, query: { ...(socket.io as any).opts?.query, tenantId } };
        } catch {}
      }
      socket.connect();
    }

    socket.on("connect", () => {
      socket.emit("enterRoom", { token, tenantId });
    });

    socket.on("bettedUserInfo", (bettedUsers: BettedUserType[]) => {
      setBettedUsers(bettedUsers);
    });

    socket.on("myBetState", (data: any) => {
      // When server confirms bet, transition from betState to betted
      setUserBetState(prev => ({
        ...prev,
        fbetState: data.f?.betted ? false : prev.fbetState,  // Clear if bet confirmed
        sbetState: data.s?.betted ? false : prev.sbetState,  // Clear if bet confirmed
        fbetted: data.f?.betted || false,
        sbetted: data.s?.betted || false,
      }));
      
      // Update user info with bet data (cashouted status, cashAmount, etc)
      if (data.f || data.s) {
        setUserInfo(prev => ({
          ...prev,
          f: data.f ? { ...prev.f, ...data.f } : prev.f,
          s: data.s ? { ...prev.s, ...data.s } : prev.s,
        }));
      }
      
      // Update balance if provided by backend
      if (data.balance !== undefined) {
        setUserInfo(prev => ({ ...prev, balance: data.balance }));
        try {
          queryClient.setQueryData(['balance'], { balance: data.balance, currency: userInfo.currency || 'ETB' });
          queryClient.invalidateQueries({ queryKey: ['balance'] });
        } catch {}
      }
    });

    socket.on("myInfo", (user: any) => {
      // Update userInfo state with data from backend
      try {
        console.log('🎮 Aviator join info:', { token: user.token, tenantId: user.tenantId });
      } catch {}
      setUserInfo({
        ...userInfo,
        balance: user.balance,
        userType: user.userType,
        userName: user.userName,
        userId: user.userId || "",
        avatar: user.avatar || "/avatars/av-5.png",
        currency: user.currency || "ETB",
        token: user.token || token || "",
        // Persist tenantId from server if provided
        ...(user.tenantId ? (() => { try { localStorage.setItem('tenantId', user.tenantId); } catch {} return {}; })() : {}),
        Session_Token: user.Session_Token || "",
        ipAddress: user.ipAddress || "",
        platform: user.platform || "desktop",
        isSoundEnable: user.isSoundEnable || false,
        isMusicEnable: user.isMusicEnable || false,
        msgVisible: user.msgVisible || false,
        f: user.f || userInfo.f,
        s: user.s || userInfo.s,
        img: user.avatar || "/avatars/av-5.png",
      });
      try {
        if (typeof user.balance === 'number') {
          queryClient.setQueryData(['balance'], { balance: user.balance, currency: user.currency || 'ETB' });
        }
      } catch {}
    });

    socket.on("history", (history: any) => {
      setHistory(history);
    });

    socket.on("gameState", (gameState: GameStatusType) => {
      setGameState(gameState);
      
      // Clear states when new BET round starts
      if (gameState.GameState === "BET") {
        setUserInfo(prev => ({
          ...prev,
          f: { ...prev.f, cashouted: false },
          s: { ...prev.s, cashouted: false },
        }));
        
        // If queued bet, set betted=true immediately to prevent flash
        // Otherwise clear betted from previous round
        setUserBetState(prev => ({
          ...prev,
          fbetted: prev.fbetState ? true : false,
          sbetted: prev.sbetState ? true : false,
        }));
      }
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
        // Don't clear fbetted here - let gameState BET event handle it
        // This prevents UI flash when round ends
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
        } else {
          // Don't clear fbetState - keep it if user queued bet for next round
          // betStatus.fbetState remains unchanged
        }
      }
      if (!user.s?.betted) {
        // Don't clear sbetted here - let gameState BET event handle it
        // This prevents UI flash when round ends
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
        } else {
          // Don't clear sbetState - keep it if user queued bet for next round
          // betStatus.sbetState remains unchanged
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

    socket.on("chatHistory", (messages: any[]) => {
      setMsgData(messages);
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

  useEffect(() => {
    // Optional: listen to iframe wallet messages and invalidate balance
    const onMessage = (e: MessageEvent) => {
      const payload = (e && (e as any).data) || null;
      if (payload && payload.type === 'wallet:balance:update') {
        try { queryClient.invalidateQueries({ queryKey: ['balance'] }); } catch {}
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('message', onMessage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('message', onMessage); };
  }, [queryClient]);

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
        if (userInfo.balance < (state.userInfo.f?.betAmount || 0)) {
          toast.error("Your balance is not enough");
          betStatus.fbetState = false;
          betStatus.fbetted = false;
          return;
        }
        // Balance will be deducted on backend and synced via myBetState event
        socket.emit("playBet", data);
        // Don't clear fbetState here - let myBetState event handle transition
        // This prevents button from flashing back to BET while waiting for server
        update(attrs);
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
        if (userInfo.balance < (state.userInfo.s?.betAmount || 0)) {
          toast.error("Your balance is not enough");
          betStatus.sbetState = false;
          betStatus.sbetted = false;
          return;
        }
        // Balance will be deducted on backend and synced via myBetState event
        socket.emit("playBet", data);
        // Don't clear sbetState here - let myBetState event handle transition
        // This prevents button from flashing back to BET while waiting for server
        update(attrs);
        setUserBetState(betStatus);
      }
    }
  }, [gameState.GameState, userBetState.fbetState, userBetState.sbetState]);

  const getMyBets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.api}/my-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(tenantId && { 'x-tenant-id': tenantId }),
        },
        body: JSON.stringify({}),
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
