import React from "react";
import Header from "./components/header";
import BetsUsers from "./components/bet-users";
import Main from "./components/Main";
import Chat from "./components/Chat";
// import { useCrashContext } from "./components/Main/context";
import propeller from "./assets/images/propeller.png";

import Context from "./context";
import Login from "./components/Login";
import { useLocation, useNavigate } from "react-router-dom";
// import "./App.scss";

function App() {
  const { unityLoading, currentProgress, rechargeState } =
    React.useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("cert");

  // Store token in localStorage if it exists in URL but not in localStorage
  React.useEffect(() => {
    if (token && !localStorage.getItem('token')) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    // Store token in localStorage for API calls
    localStorage.setItem('token', newToken);
    navigate(`/?cert=${newToken}`);
  };

  // Show login if no token
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="main-container">
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
