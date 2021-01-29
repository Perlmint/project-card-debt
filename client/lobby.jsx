const React = require('react');

function Lobby() {
    const [createNewGame, setCreateNewGame] = React.useState(true);
    const nickname_form = React.useRef();
    const gamename_form = React.useRef();

    return <div className="pure-g">
        <div className="pure-u-1-1">
            <h1>car de beat</h1>
        </div>

        <div className="pure-u-1-5"></div>
        <div className="pure-u-1-5">
            <input type="checkbox" value={createNewGame ? 1 : 0} onClick={() => setCreateNewGame(true)}>새 게임</input>
            <input type="checkbox" value={createNewGame ? 0 : 1} onClick={() => setCreateNewGame(true)}>게임 참여</input>
        </div>
        <div className="pure-u-1-5"></div>
        <div className="pure-u-1-5">
            <label for="nickname" ref={nickname_form}>닉네임</label>
            <input id="nickname"></input>
            {
                createNewGame ? <></> : <>
                    <label for="gamename" ref={gamename_form}>게임 이름</label>
                    <input id="gamename"></input>
                </>
            }
        </div>
        <div className="pure-u-1-5"></div>
        <div className="pure-u-1-1">
            <button className="pure-button pure-button-primary" onClick={() => {

            }}>시작하기</button>
        </div>
    </div>;
}

require('react-dom').render(<Lobby />, document.getElementById('app'));