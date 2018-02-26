import React from 'react';
import PropTypes from 'prop-types';

class DraggableBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      draggable: false,
      downX: 0,
      downY: 0,
      resizing: false,
      cursor: 'default',
      mouseX: 0,
      mouseY: 0,
    };
  }

  componentDidMount(props, state) {
    // We have to add document listeners so it will update pos even when
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.mouseUp);
  }

  getBoxStyle = () => {
    const boxStyle = {
      backgroundColor: this.props.color,
      left: `${this.props.x}px`,
      top: `${this.props.y}px`,
      width: `${this.props.w - (2 * this.props.padding)}px`,
      height: `${this.props.h - (2 * this.props.padding)}px`,
      cursor: this.getCursor(),
      padding: `${this.props.padding}px`,
    };
    return boxStyle;
  };

  // Gets the new width and height of the box based on the min width and height
  getResize = (mouseVal, elemVal, min) => {
    const newSize = mouseVal - elemVal;
    if (newSize >= min) {
      return newSize;
    }

    return min;
  };

  getCursor = () => {
    if (this.state.draggable) {
      return 'move';
    } else if (this.state.resizing || this.cursorInDraggingPosition()) {
      return 'se-resize';
    }

    return 'default';
  };

  mouseMove = (e) => {
    // Fix this, the box should be less state-y
    this.setState({
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
    const id = this.props.uid; // Get the UUID of the current board
    if (this.state.resizing) {
      this.props.callback(id, {
        x: this.props.x,
        y: this.props.y,
        w: this.getResize(e.clientX, this.props.x, this.props.minX),
        h: this.getResize(e.clientY, this.props.y, this.props.minY),
        color: this.props.color,
      });
    } else if (this.state.draggable) {
      // console.log(e.screenX)
      this.props.callback(id, {
        x: e.screenX + this.state.downX,
        y: e.screenY + this.state.downY,
        w: this.props.w,
        h: this.props.h,
        color: this.props.color,
      });

      // this.setState({elemX: e.screenX + this.state.downX, elemY: e.screenY + this.state.downY});
    }
  };


  mouseDown = (e) => {
    if (e.button === 0) { // Check to make sure it's left mouse click
      // Update the down mouse X position
      this.setState({
        downX: this.props.x - e.screenX,
        downY: this.props.y - e.screenY,
      });
      if (this.cursorInDraggingPosition(e)) { // If we're resizing the box
        this.setState({ resizing: true });
      } else {
        this.setState({ draggable: true });
      }
    }
  };

  mouseUp = (e) => {
    this.setState({ draggable: false, resizing: false });
  };


  cursorInDraggingPosition = () => {
    const cornerX = (this.state.mouseX - this.props.x - this.props.w) ** 2;
    const cornerY = (this.state.mouseY - this.props.y - this.props.h) ** 2;
    const dist = Math.sqrt(cornerX + cornerY);
    return (dist < 20);
  };

  updateStyle = (style) => {
    this.setState(style);
  };

  render() {
    return (
      <div onMouseDown={this.mouseDown} className="Box" style={this.getBoxStyle()}>
        {this.props.children}
      </div>
    );
  }
}

DraggableBox.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  padding: PropTypes.number,
  minX: PropTypes.number,
  minY: PropTypes.number,
  // eslint-disable-next-line react/no-unused-prop-types
  defaultWidth: PropTypes.number,
  // eslint-disable-next-line react/no-unused-prop-types
  defaultHeight: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
  w: PropTypes.number,
  h: PropTypes.number,
  color: PropTypes.string,
  callback: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired,
};

DraggableBox.defaultProps = {
  padding: 20,
  minX: 200,
  minY: 200,
  defaultWidth: 200,
  defaultHeight: 200,
  x: 0,
  y: 0,
  w: 200,
  h: 200,
  color: '#ff0000',
};