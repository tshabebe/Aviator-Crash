import React from "react";
import Header from "./components/header";
import BetsUsers from "./components/bet-users";
import Main from "./components/Main";
import Chat from "./components/Chat";
// import { useCrashContext } from "./components/Main/context";
import propeller from "./assets/images/propeller.png";
import mainAudio from "./assets/audio/main.wav";
import takeOffAudio from "./assets/audio/take_off.mp3";
import flewAwayAudio from "./assets/audio/flew_away.mp3";

import Context from "./context";
import { useLocation } from "react-router-dom";
// import "./App.scss";

function App() {
  const { unityLoading, currentProgress, rechargeState } =
    React.useContext(Context);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  // Store token in localStorage if it exists in URL but not in localStorage
  React.useEffect(() => {
    if (token && !localStorage.getItem('token')) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  // Removed login flow; app always renders

  return (
    <div className="main-container">
      {/* Audio elements */}
      <audio id="mainAudio" loop>
        <source src={mainAudio} type="audio/wav" />
      </audio>
      <audio id="takeOffAudio">
        <source src={takeOffAudio} type="audio/mpeg" />
      </audio>
      <audio id="flewAwayAudio">
        <source src={flewAwayAudio} type="audio/mpeg" />
      </audio>

      {!unityLoading && (
        <div className="myloading">
          <div className="loading-container">
            <div className="rotation">
              <img alt="propeller" src={propeller}></img>
            </div>
            <div className="waiting">
              <div
                style={{ width: `${currentProgress * 1.111 + 0.01}%` }}
              ></div>
            </div>
            <p>{Number(currentProgress * 1.111 + 0.01).toFixed(2)}%</p>
          </div>
        </div>
      )}
      {rechargeState && (
        <div className="recharge">
          <div className="recharge-body">
            <div className="recharge-body-font">
              Insufficient balance amount
            </div>
            <a href="https://induswin.com/#/pages/recharge/recharge">
              Induswin.com
            </a>
          </div>
        </div>
      )}
      <Header />
      <div className="game-container">
        <BetsUsers />
        <Main />
        <Chat />
      </div>
    </div>
  );
}

export default App;
