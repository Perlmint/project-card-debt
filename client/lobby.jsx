const { useEffect } = require('react');
const React = require('react');

function UserInfo({data, username}) {
    console.log(data);
    return <div>
        <div>
            {data?.user_name} {data?.user_name === username ? '(YOU)' : ''}
        </div>
    </div>
}

function Lobby() {
    const [createNewGame, setCreateNewGame] = React.useState(true);
    const [nickname, setNickname] = React.useState('');
    const [gamename, setGamename] = React.useState('aaa');
    const [connectionState, setConnectionState] = React.useState(0);
    const [lobby_ws, setWs] = React.useState(null);
    const [lobby_state, setLobbyState] = React.useState();
    
    useEffect(() => {
        if (connectionState == 1) {
            let query = `?user_name=${nickname}`;
            if (!createNewGame) {
                query += `&game_id=${gamename}`;
            }
            const ws = new WebSocket(`ws://${location.host}/lobby${query}`);
            ws.addEventListener('open', () => setConnectionState(2));
            ws.addEventListener('message', (e) => {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case 'game_id':
                        setGamename(data.game_id);
                        break;
                    case 'update':
                        console.log(data.data);
                        setLobbyState(data.data);
                        break;
                }
            });
            ws.addEventListener('close', (e) => {
                if (e.code < 4100) {
                    alert(e.reason);
                    setConnectionState(0);
                } else {
                    location.href = `/?user_name=${nickname}&game_id=${e.reason}`;
                }
                
                setWs(null);
            });
            setWs(ws);
        }
    }, [connectionState]);

    switch (connectionState) {
        case 0:
            return <div className="pure-g">
                <div className="pure-u-1-1" style={{ textAlign: "center", paddingBottom: '2em' }}>
                    <h1>이만 총총.. =3=3</h1>
                </div>

                <div className="pure-u-1-5"></div>
                <div className="pure-u-1-5">
                    <div className="pure-form pure-form-stacked">
                        <label htmlFor="new_game">
                            <input id="new_game" type="checkbox" checked={createNewGame ? 1 : 0} onChange={(v) => setCreateNewGame(v.currentTarget.value)} />
                            새 게임
                        </label>
                        <label htmlFor="join_game">
                            <input id="join_game" type="checkbox" checked={createNewGame ? 0 : 1} onChange={(v) => setCreateNewGame(!v.currentTarget.value)} />
                            게임 참가
                        </label>
                    </div>
                </div>
                <div className="pure-u-1-5"></div>
                <div className="pure-u-1-5">
                    <label htmlFor="nickname">
                        닉네임
                        <input id="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.currentTarget.value.trim())} />
                        </label>
                    {
                        createNewGame ? <></> : 
                            <label htmlFor="gamename">
                                게임 이름
                                <input id="gamename" defaultValue={gamename} onChange={(e) => setGamename(e.currentTarget.value.trim())} />
                            </label>
                    }
                </div>
                <div className="pure-u-1-5"></div>
                <div className="pure-u-1-1" style={{ textAlign: "center", paddingTop: '2em' }}>
                    <button className="pure-button pure-button-primary" onClick={() => {
                        if (nickname === '') {
                            alert('Name is empty');
                            return;
                        }
                        if (!createNewGame && gamename === '') {
                            alert('Game name required!');
                            return;
                        }
                        setConnectionState(1);
                    }}>시작하기</button>
                </div>
                <div className="pure-u-1-1" style={{ textAlign: "center", paddingTop: '2em' }}>
                    Resource License
                    <ul>
                        <li><a href='https://kr.freepik.com/vectors/city'>City 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href='https://kr.freepik.com/vectors/travel'>Travel 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href="https://kr.freepik.com/vectors/business">Business 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href="https://kr.freepik.com/vectors/school">School 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href="https://kr.freepik.com/vectors/car">Car 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href='https://kr.freepik.com/vectors/black'>Black 벡터는 macrovector - kr.freepik.com가 제작함</a></li>
                        <li><a href="https://www.freepik.com/vectors/abstract">Abstract vector created by macrovector - www.freepik.com</a></li>
                        <li><a href="https://www.freepik.com/vectors/water">Water vector created by macrovector - www.freepik.com</a></li>
                        <li><a href="https://www.freepik.com/vectors/building">Building vector created by macrovector - www.freepik.com</a></li>
                    </ul>
                </div>
            </div>;
        case 1:
            return <div className="lds-ripple"><div></div><div></div></div>;
        case 2: {
            let found_user = null, lost_user = null;
            if (lobby_state?.[0].role === 'found') {
                found_user = lobby_state?.[0];
                lost_user = lobby_state?.[1];
            } else {
                found_user = lobby_state?.[1];
                lost_user = lobby_state?.[0];
            }
            console.log(found_user, lost_user);
            return <div className="pure-g">
                <div className="pure-u-1-1" style={{ textAlign: "center", paddingBottom: '2em' }}>
                    <h1>역할 선택</h1>
                </div>
                <div className="pure-u-1-5"></div>
                <div className="pure-u-1-5">
                    <font color="blue">Lost man - 총 잃어버린 사람</font> <br/> <br/>
                    당신이 잃어버린 총을 누군가가 사용하고 있습니다! <br/>
                    <font color="blue">범죄현장에 남겨진 정보를 쫓아, 잃어버린 총을 되찾으세요.</font> <br/><br/>
                    <UserInfo data={lost_user} username={nickname} />
                </div>
                <div className="pure-u-1-5"></div>
                <div className="pure-u-1-5">
                    <font color="blue">Found man - 총 주운 사람</font> <br/><br/>
                    당신은 총을 습득했지만, 여전히 할 일은 많고 시간은 촉박하군요! <br/>
                    <font color="blue">추적을 피하며, 총을 사용해 목표 리스트를 모두 달성하세요.</font> <br/><br/>
                    <UserInfo data={found_user} username={nickname} />
                </div>
                <div className="pure-u-1-5"></div>
                {
                    createNewGame ? <>
                        <div className="pure-u-1-1" style={{ textAlign: "center", paddingTop: '1em' }}>
                            <button className="pure-button pure-button-primary" onClick={() => {
                                lobby_ws.send(JSON.stringify({
                                    type: 'swap_role',
                                }));
                            }}>역할 변경</button>
                        </div>
                        <div className="pure-u-1-1" style={{ textAlign: "center", paddingTop: '2em' }}>
                            <button className="pure-button pure-button-primary" onClick={() => {
                                lobby_ws.send(JSON.stringify({
                                    type: 'start',
                                }));
                            }}>게임 시작</button>
                        </div>
                        <div className="pure-u-1-1" style={{ textAlign: "right", paddingTop: '2em' }}>
                            게임 이름: {gamename}
                        </div>
                    </>
                    :<>
                        <div className="pure-u-1-5"></div> 
                        <div className="pure-u-1-5"></div> 
                        <div className="pure-u-1-5"> 
                            방장이 게임을 시작하기를 기다리는 중.. 
                        </div>
                    </>
                    
                }
            </div>;
        }
    }
}

require('react-dom').render(<Lobby />, document.getElementById('app'));