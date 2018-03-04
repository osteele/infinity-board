import React from 'react';
import randomColor from 'randomcolor';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';
import '../App.css';
import ServerComm from '.././server-comm';
import TextBox from './text-box';
import ImageBox from './image-box';
import FileDragger from './file-dragger';


class Board extends React.Component {
  constructor(props) {
    super(props);
    this.io = new ServerComm(window.SERVER_URI);
    this.io.setReceivedUpdateMessageHandler(this.onUpdate);
    this.io.connect();
    this.state = {
      windowX: 0,
      windowY: 0,
      prevX: 0,
      prevY: 0,
      zIndex: 1,
      boxes: {},
    };
    // this.onUpdateDup = this.onUpdateDup.bind(this);
  }

  /*
  Update the state for a given board based on a message from the websocket.
  @param msg - the websocket message containing updated state data for the board.
  */
  onUpdate = (msg) => {
    const updatedState = Object.assign({}, this.state.boxes, {
      [msg.uuid]: Object.assign({}, this.state.boxes[msg.uuid], {
        state: msg.state,
        type: msg.type,
      }),
    }); // TODO: Seems redundant from updateBoardState, should change
    this.setState({
      boxes: updatedState,
    });
  };

  /*
  Handles when a file is selected from the file selection dialog.
  */
  onFileSelect = (e) => {
    e.preventDefault();
    this.generateBox('image');
  };

  /*
  Update the state for a given board based on a mouse event.
  @param {string} uuidVal - the UUID of the board.
  @param newState: The state object containing the updated state elements of the given box.
  */
  updateBoardState = (uuidVal, newState) => {
    const origState = Object.assign({}, this.state.boxes);
    const updatedState = Object.assign( // Update just the state elements we care about
      {},
      origState[uuidVal].state,
      newState,
    ); // Doing this is necessary to index by UUID
    origState[uuidVal].state = updatedState;
    this.setState({
      boxes: origState,
    });
    // Push the update out over WebSockets
    this.io.sendUpdateMessage({
      boardId: this.props.data._id,
      uuid: uuidVal,
      state: updatedState,
      type: origState[uuidVal].type,
    });
  };

  /*
  Increments the highest z-index for the board.
  @return zIndex, the current board z-index
  */
  updateZ = () => {
    this.setState({
      zIndex: this.state.zIndex + 1,
    });
    return this.state.zIndex;
  };

  /*
  Updates the text value for a given text box.
  @param uuid - the UUID of the text box to be updated.
  @param textVal - the text to put in the text box.
  */
  updateText = (uuid, textVal) => {
    this.updateBoardState(uuid, { text: textVal });
  };

  /*
  Handles the clicking of the box generation buttons.
  */
  handleButtonClick = (e) => {
    const boxType = e.target.dataset.type; // Get the type of box we're making
    if (boxType === 'image') {
      this.fileInput.click();
    } else {
      this.generateBox(boxType);
    }
  };

  /*
  Handles the movement of the board view window.
  */
  dragWindow = (e) => {
    if (this.state.dragging) {
      const curX = this.state.windowX;
      const curY = this.state.windowY;
      this.setState({
        windowX: curX + (e.clientX - this.state.prevX),
        windowY: curY + (e.clientY - this.state.prevY),
      });
      this.setState({
        prevX: e.clientX,
        prevY: e.clientY,
      });
    }
  };

  /*
  Updates the board state to allow window movement on mouse press.
  */
  mouseDown = (e) => {
    this.setState({
      dragging: true,
      prevX: e.clientX,
      prevY: e.clientY,
      cursor: 'move',
    });
  };

  /*
  Stops movement of the board window.
  */
  mouseUp = () => {
    this.setState({ dragging: false, cursor: 'default' });
  };


  /*
  Generates a box based on a button click event.
  @params boxType: the type of box to generate.
  */
  generateBox = (boxType) => {
    const uuid = uuidv4(); // Gen unique UUID
    const initState = this.state.boxes;
    const stateObject = {
      x: 50 - this.state.windowX,
      y: 50 - this.state.windowY,
      w: 200,
      h: 200,
      z: this.state.zIndex,
      color: randomColor(),
      text: '',
    };
    initState[uuid] = {
      type: boxType,
      state: stateObject,
    };
    this.setState({ boxes: initState });
    this.updateBoardState(uuid, stateObject); // TODO Refactor so that this isn't necessary
  };


  /*
  Called on ImageBox load to resize image correctly
  @params uuid: the UUID of the box
  @params w: the new width of the box
  @params h: the new height of the box
  */
  updateImage = (uuid, w, h, newW, newH) => {
    const initState = this.state.boxes;
    initState[uuid].aspect = w / h; // Store the aspect ratio
    if (newW / newH === initState[uuid].aspect) {
      // Check to see if the image has already been resized
      initState[uuid].state.w = newW;
      initState[uuid].state.h = newH;
    } else {
      initState[uuid].state.w = w;
      initState[uuid].state.h = h;
    }

    this.setState({ boxes: initState });
  };

  render() {
    const allKeys = Object.keys(this.state.boxes);
    const boxes = [];
    for (let i = 0; i < allKeys.length; i++) {
      const curKey = allKeys[i];
      const propsIn = {
        key: curKey,
        clickCallback: this.updateZ,
        uid: curKey,
        renderX: this.state.boxes[curKey].state.x + this.state.windowX,
        renderY: this.state.boxes[curKey].state.y + this.state.windowY,
        callback: this.updateBoardState,
      };
      const stateProps = Object.assign(
        {},
        propsIn,
        this.state.boxes[curKey].state,
      ); // Add in state props


      if (typeof this.state.boxes[curKey].aspect !== 'undefined') {
        stateProps.aspect = this.state.boxes[curKey].aspect;
      }


      if (this.state.boxes[curKey].type === 'text') {
        boxes.push(<TextBox editCallback={this.updateText} {...stateProps} />);
      } else if (this.state.boxes[curKey].type === 'image') {
        boxes.push(<ImageBox
          src="http://cdn.akc.org/content/hero/puppy-boundaries_header.jpg"
          imgCallback={this.updateImage}
          {...stateProps}
        />);
      }
    }
    const buttonStyle = { zIndex: this.state.zIndex + 1 };

    const bgStyle = {
      // eslint-disable-next-line
      backgroundPosition: String(this.state.windowX % 50) + 'px ' +  String(this.state.windowY % 50) + 'px',
    };

    return (
      // eslint-disable-next-line
      <div className="View"
        onMouseDown={this.mouseDown}
        onMouseMove={this.dragWindow}
        onMouseUp={this.mouseUp}
        style={{ cursor: this.state.cursor }}
      >
        {boxes}
        <div className="View" style={bgStyle} id="bg" />
        <FileDragger generateBox={this.generateBox} />
        <div className="Button-wrapper" style={buttonStyle}>
          <div className="Box-button">
            <button className="Box-button home" onClick={() => { this.setState({ windowX: 0, windowY: 0 }); }} />
          </div>
          <div className="Box-button">
            <button className="Box-button text" data-type="text" onClick={this.handleButtonClick} />
          </div>
          <div className="Box-button" style={buttonStyle}>
            <button className="Box-button image" data-type="image" onClick={this.handleButtonClick} />
            <input type="file" ref={(input) => { this.fileInput = input; }} onChange={this.onFileSelect} style={{ display: 'none' }} />
          </div>
        </div>
      </div>
    );
  }
}

Board.propTypes = {
  data: PropTypes.object.isRequired,
};

export default Board;
