import { useEffect, useState } from "react"
import crypto from 'crypto';

export const SeedModal = ({ setModal, seedDetails }: any) => {

    const [date, setDate] = useState('');
    const [sha512Hash, setSha512Hash] = useState('');

    useEffect(() => {
        const newDate = new Date(seedDetails.createdAt);
        const localTime = newDate.toLocaleTimeString([], { hour12: false });
        setDate(localTime);

        let combined_seed = seedDetails.serverSeed;
        for (let i = 0; i < seedDetails.seedOfUsers.length; i++) {
            combined_seed += seedDetails.seedOfUsers[i].seed
        }
        const hash_object = crypto.createHash('sha512').update(`${combined_seed}`).digest('hex');
        setSha512Hash(hash_object);
    }, [seedDetails])
    return (
        <div className="modal">
            <div className="back" onClick={() => setModal(false)}></div>
            {/* <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <span className="modal-title">ROUND </span>
                        <div className="header__info">
                            <div className={`bubble-multiplier ${Number(seedDetails.target) < 2 ? "blue" : Number(seedDetails.target) < 10 ? "purple" : "big"}`}>{Number(seedDetails.target).toFixed(2)}x</div>

                            <div style={{ paddingLeft: '5px' }}>{date}</div>
                        </div>
                        <button className="close" onClick={() => setModal(false)}>
                            <span>x</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="content-wrapper">
                            <div className="content">
                                <div className="content-part">
                                    <div className="title">
                                        <div className="icon-server"></div>
                                        <div className="text">
                                            <span>Server Seed:</span>
                                            <div className="tip">Generated on our side</div>
                                        </div>
                                    </div>
                                    <div className="value">
                                        <input readOnly type="text" className="value-input" value={seedDetails.serverSeed} />
                                    </div>
                                </div>
                                <div className="content-part pt-3">
                                    <div className="title">
                                        <div className="icon-client"></div>
                                        <div className="text">
                                            <span>Client Seed:</span>
                                            <div className="tip">Generated on players side</div>
                                        </div>
                                    </div>
                                    {seedDetails.seedOfUsers?.map((user: any, key: number) => (
                                        <div className="client" key={key}>
                                            <div className="value">
                                                <div className="player">
                                                    <span>Player N1:</span>
                                                    <div className="user">
                                                        <img className="avatar" src={user.avatar} /> {user.userName.slice(0, 1) + '***' + user.userName.slice(-1)}
                                                    </div>
                                                </div>
                                                <div className="seed">
                                                    <span>Seed:</span>
                                                    <div className="seed-value">{user.seed}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="content-part pt-3">
                                    <div className="title">
                                        <div className="icon-hash"></div>
                                        <div className="text">
                                            <span>Combined SHA512 Hash:</span>
                                            <div className="tip">Above seeds combined and converted to SHA512 Hash. This is your game result</div>
                                        </div>
                                    </div>
                                    <div className="value">
                                        <input readOnly type="text" className="value-input" value={sha512Hash} />
                                    </div>
                                </div>
                                <div className="content-part pt-3 result">
                                    <div className="title">
                                        <span>Hex:</span>
                                        <span>Decimal:</span>
                                        <span>Result:</span>
                                    </div>
                                    <div className="value">
                                        <span className="white">{sha512Hash.slice(0, 13)}</span>
                                        <span className="white">{parseInt(sha512Hash.slice(0, 13), 16)}</span>
                                        <span className="white">{seedDetails.target.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    )
}