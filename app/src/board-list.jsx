import React from 'react';
import ServerComm from "./server-comm";

export default class BoardList extends React.Component {

    constructor(props) {
        super(props);

        this.serverComm = new ServerComm('ws://localhost:1234');
    }

    render() {
        let boards = [];
        this.props.boards.forEach((board) => {
            boards.push(<div className="board-li" key={board.id}>{board.name}</div>);
        });
        return (
            <div className="board-list">
                {boards}
            </div>
        )
    }

}

BoardList.defaultProps = {
    boards: [
        { id: 1, elements: [], name: 'Test 1' },
        { id: 2, elements: [], name: 'Test 2' },
        { id: 3, elements: [], name: 'Test 3' },
    ]
};