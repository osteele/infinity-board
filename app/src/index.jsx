import ReactDOM from 'react-dom';
import React from 'react';
import Board from './board/board';
import './App.css';
import BoardList from './board-list';
import ServerComm from './server-comm';

/**
 * The main React container for the app. It holds the state and passes it down
 * as props to its child components.
 */
class App extends React.Component {
  constructor() {
    super();

    this.state = {
      boards: {},
      currentBoardData: null,
    };
  }

  componentDidMount() {
    this.serverComm = new ServerComm(window.SERVER_URI);
    this.serverComm.connect();
    this.serverComm.setReceivedBoardListMessageHandler(this.setBoardList);
    this.serverComm.setReceivedBoardDataMessageHandler(this.receivedBoardData);
    this.serverComm.getBoardList();
  }

  setBoardList = (boards) => {
    this.setState({ boards });
  };

  receivedBoardData = (board) => {
    this.setState({ currentBoardData: board });
  };

  render() {
    const boardObjects = Object.keys(this.state.boards).map(key => this.state.boards[key]);
    const content = this.state.currentBoardData
      ? <Board data={this.state.currentBoardData} />
      : (
        <BoardList
          boards={boardObjects}
          boardSelected={uuid => this.serverComm.getBoardData(uuid)}
        />
      );

      // Now show it
    return (
      <div className="app">
        {content}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
