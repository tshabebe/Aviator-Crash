/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
// import { useCrashContext } from "../Main/context";
import "./crash.scss";
import Unity from "react-unity-webgl";
import propeller from "../../assets/images/propeller.png"
import Context from "../../context";

let currentFlag = 0;
let lastGameState = "";

export default function WebGLStarter() {
	const { GameState, currentNum, time, unityState, myUnityContext, setCurrentTarget, userInfo } = React.useContext(Context)
	
	// Debug logging
	React.useEffect(() => {
	}, [GameState, currentNum]);
	
	const [target, setTarget] = React.useState(1);
	
	// Debug target changes
	React.useEffect(() => {
	}, [target]);
	const [waiting, setWaiting] = React.useState(0);
	const [flag, setFlag] = React.useState(1);

	React.useEffect(() => {
		let myInterval;
		if (GameState === "PLAYING") {
			setFlag(2);
			
			// Play takeoff sound ONCE when transitioning to PLAYING
			if (userInfo?.isSoundEnable && lastGameState !== "PLAYING") {
				const takeOffAudio = document.getElementById("takeOffAudio") as HTMLAudioElement;
				if (takeOffAudio) {
					takeOffAudio.currentTime = 0;
					takeOffAudio.play().catch(err => console.log("Audio play prevented:", err));
				}
			}
			
			// Use backend's currentNum instead of local calculation
			const backendMultiplier = parseFloat(currentNum.toString());
			
			if (!isNaN(backendMultiplier) && backendMultiplier >= 1.0 && backendMultiplier <= 1000.0) {
				setTarget(backendMultiplier);
				setCurrentTarget(backendMultiplier);
				
				// Update flag based on multiplier
				if (backendMultiplier > 2 && currentFlag === 2) {
					setFlag(3);
				} else if (backendMultiplier > 10 && currentFlag === 3) {
					setFlag(4);
				}
			} else {
				console.error("Invalid backend multiplier:", currentNum);
				setTarget(1.0);
				setCurrentTarget(1.0);
			}
		} else if (GameState === "GAMEEND") {
			setFlag(5);
			
			// Play flew away sound ONCE when transitioning to GAMEEND
			if (userInfo?.isSoundEnable && lastGameState !== "GAMEEND") {
				const flewAwayAudio = document.getElementById("flewAwayAudio") as HTMLAudioElement;
				if (flewAwayAudio) {
					flewAwayAudio.currentTime = 0;
					flewAwayAudio.play().catch(err => console.log("Audio play prevented:", err));
				}
			}
			
			// Parse and validate the currentNum from backend
			let formattedNum = 1.0;
			try {
				const parsed = parseFloat(currentNum.toString());
				// Ensure it's a reasonable multiplier (1.0 to 1000.0)
				if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 1000.0) {
					formattedNum = parsed;
				}
			} catch (error) {
				console.error('Error parsing currentNum:', currentNum, error);
			}
			setCurrentTarget(formattedNum);
			setTarget(formattedNum);
		} else if (GameState === "BET") {
			setFlag(1);
			let startWaiting = Date.now() - time;
			setTarget(1);
			setCurrentTarget(1);

			myInterval = setInterval(() => {
				setWaiting(Date.now() - startWaiting);
			}, 20);
		}
		
		// Update last game state
		lastGameState = GameState;
		
		return () => clearInterval(myInterval);
	}, [GameState, unityState, currentNum]) // Added currentNum to dependencies

	React.useEffect(() => {
		if (myUnityContext && unityState) {
			try {
				myUnityContext.send("GameManager", "RequestToken", JSON.stringify({
					gameState: flag
				}));
				currentFlag = flag;
			} catch (error) {
				console.error("Error sending Unity message:", error);
			}
		}
	}, [flag, myUnityContext, unityState]);

	return (
		<div className="crash-container">
			<div className="canvas">
				{myUnityContext && (
					<Unity unityContext={myUnityContext} matchWebGLToCanvasSize={true} />
				)}
			</div>
			<div className="crash-text-container">
				{GameState === "BET" ? (
					<div className={`crashtext wait font-9`} >
						<div className="rotate">
							<img width={100} height={100} src={propeller} alt="propellar"></img>
						</div>
						<div className="waiting-font">WAITING FOR NEXT ROUND</div>
						<div className="waiting">
							<div style={{ width: `${(5000 - waiting) * 100 / 5000}%` }}></div>
						</div>
					</div>
				) : (
					<div className={`crashtext ${GameState === "GAMEEND" && "red"}`}>
						{GameState === "GAMEEND" && <div className="flew-away">FLEW AWAY!</div>}
						<div>
							{(() => {
								try {
									const displayValue = target - 0.01;
									// Validate and clamp the display value
									if (isNaN(displayValue) || displayValue < 1 || displayValue > 1000) {
										console.error("Invalid target value:", target, "displayValue:", displayValue);
										return "1.00";
									}
									return Number(displayValue).toFixed(2);
								} catch (error) {
									console.error("Error formatting target:", target, error);
									return "1.00";
								}
							})()} <span className="font-[900]">x</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

