import React, { useContext, useEffect, useRef, useState } from "react";
import { HiOutlineFaceSmile, HiOutlineGif } from "react-icons/hi2";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import GifPicker, { Theme } from "gif-picker-react";
import axios from "axios";

import Context from "../../context";
import "./chat.scss";
import { config } from "../../config";
import { displayName } from "../utils";

export default function PerfectLiveChat() {
  const {
    userInfo,
    socket,
    msgTab,
    msgReceived,
    setMsgReceived,
    msgData,
    setMsgData,
    toggleMsgTab,
  } = useContext(Context);
  const [msgContent, setMsgContent] = useState<string>("");
  const [emojiPicker, setEmojiPicker] = useState<boolean>(false);
  const [gifPicker, setGifPicker] = useState<boolean>(false);
  const tenorApiKey = "AIzaSyAgrtott_iV2sRi-9cH_BKAdLKxpzbsIJY";

  const msgContentRef = useRef(null);

  const scrollToLastFruit = () => {
    let msgRef: any = msgContentRef.current;
    const lastChildElement = msgRef?.lastElementChild;
    lastChildElement?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToLastFruit();
  }, [msgTab, msgReceived]);

  // Note: Real-time chat listeners are handled in context.tsx
  // No need to duplicate them here

  const handleSendMsg = () => {
    if (msgContent.trim() !== '') {
      socket.emit("sendMsg", { msgType: "normal", msgContent, userInfo: userInfo });
      setMsgContent("");
    } else {
    }
    setEmojiPicker(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line in the textarea
      handleSendMsg();
    }
  };

  const handleChooseGif = (item) => {
    let gif: any = { ...item };
    if (item) {
      socket.emit("sendMsg", { msgType: "gif", msgContent: gif.url, userInfo: userInfo });
      setMsgContent("");
    } else {
    }
    setGifPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    setMsgContent(`${msgContent}${emoji.native}`);
  };

  const getAllChats = async (flag: boolean) => {
    try {
      const token = localStorage.getItem("token");
      let response: any = await axios.get(
        `${config.api}/chat/recent?limit=50`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      setMsgData(response?.data?.data || []);
      if (flag === false) {
        setMsgReceived(!msgReceived);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const handleLikeChat = async (chatItem: any, action: 'like' | 'dislike' = 'like') => {
    try {
      const token = localStorage.getItem("token");
      let response = await axios.post(
        `${config.api}/chat/like`,
        {
          chatID: chatItem._id,
          action: action,
        },
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (response?.data?.success) {
        getAllChats(true);
      }
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  useEffect(() => {
    // Load chat history when component mounts
    getAllChats(false);
    
    // Also request chat history via socket for real-time updates
    if (socket && msgTab) {
      socket.emit('getChatHistory', { limit: 50 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgTab]);

  // Don't render if msgTab is false
  if (!msgTab) {
    return null;
  }

  return (
    <div className="chat-info-board">
      <div className="chat-block">
        <div className="wrapper">
          <div className="header">
            <div className="online-wrapper position-absolute d-flex align-items-center">
              <div className="green-circle"></div>
              <span>1</span>
            </div>
            <div className="buttons">
              <button
                type="button"
                aria-label="Close"
                className="close"
                onClick={() => toggleMsgTab()}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <div className="cdk-virtual-scroll-viewport">
            <div
              className="cdk-virtual-scroll-content-wrapper"
              ref={msgContentRef}
            >
              {msgData?.map((item, index) => {
                let active = item?.likesIDs?.filter(
                  (item) => item === userInfo.userId
                ).length;
                let userName = displayName(item.userName);
                return (
                  <div key={index} className="message-wrapper ng-star-inserted">
                    <div className="avatar-block">
                      <img
                        className="avatar"
                        src={item.avatar || "./avatars/av-5.png"}
                        alt={item.avatar || "./avatars/av-5.png"}
                      />
                    </div>
                    <div className="msg-block">
                      <div className="msg-data">
                        <span className="text canSelect">
                          <span
                            className="name-wrapper"
                            onClick={() =>
                              setMsgContent(`${msgContent}@${userName} `)
                            }
                          >
                            <span className="name canSelect">{userName}</span>
                          </span>
                          {item.img !== "" ? (
                            <div>
                              <img
                                src={item.message}
                                className="gif-preview"
                                alt="Selected GIF"
                              />
                            </div>
                          ) : (
                            <span className="ng-star-inserted">{item.message}</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="likes-block">
                      <div
                        className="btn-block"
                        onClick={() => handleLikeChat(item, 'like')}
                      >
                        {item?.likesIDs?.length > 0 && (
                          <div className="font-weight-bold likes-number ng-star-inserted">
                            {` ${item.likesIDs.length} `}
                          </div>
                        )}
                        <div className={`btn-like ${active && "active"}`}></div>
                      </div>
                      <div
                        className="btn-block"
                        onClick={() => handleLikeChat(item, 'dislike')}
                      >
                        {item?.disLikesIDs?.length > 0 && (
                          <div className="font-weight-bold dislikes-number ng-star-inserted">
                            {` ${item.disLikesIDs.length} `}
                          </div>
                        )}
                        <div className={`btn-dislike ${active && "active"}`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {emojiPicker && (
            <div className="emoji-picker">
              <div className="modal-header">
                <div className="modal-title text-uppercase">Emoji</div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEmojiPicker(false)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <Picker
                set={"emojione"}
                theme={"dark"}
                emojiSize={20}
                perLine={8}
                data={data}
                onEmojiSelect={(emoji) => handleEmojiSelect(emoji)}
              />
            </div>
          )}
          {gifPicker && (
            <div className="gif-picker">
              <div className="modal-header">
                <div className="modal-title text-uppercase">Gif</div>
                <button
                  type="button"
                  className="close"
                  onClick={() => setGifPicker(false)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <GifPicker
                width={270}
                height={320}
                theme={Theme.DARK}
                tenorApiKey={tenorApiKey}
                onGifClick={(item) => handleChooseGif(item)}
              />
            </div>
          )}
          <div className="input-message">
            <textarea
              minLength={1}
              className="scroll-y"
              placeholder="Reply"
              maxLength={160}
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              onKeyDown={handleKeyDown}
            ></textarea>
            <div className="tools">
              <div
                className="smiles"
                onClick={() => {
                  setGifPicker(false);
                  setEmojiPicker(!emojiPicker);
                }}
              >
                <HiOutlineFaceSmile cursor={"pointer"} size={14} />
              </div>
              <div
                className="gif"
                onClick={() => {
                  setEmojiPicker(false);
                  setGifPicker(!gifPicker);
                }}
              >
                <HiOutlineGif cursor={"pointer"} size={14} />
              </div>
              <div className="left-length">{160 - msgContent.length}</div>
            </div>
            <button className="enter" onClick={() => handleSendMsg()}></button>
          </div>
        </div>
      </div>
    </div>
  );
}
