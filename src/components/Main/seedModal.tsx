export const SeedModal = ({ setModal }: any) => {
    return (
        <div className="modal">
            <div className="back" onClick={() => setModal(false)}></div>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <span className="modal-title">ROUND </span>
                        <button className="close">
                            <span>x</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}