import React  from 'react';
import ReactDOM from 'react-dom';
import './index.css';
  
class Board extends React.Component {

    renderSquare(i) {
        return (
            <button className="square" id={"s" + i} key={"s" + i} onClick={() => this.props.onClick(i)}>
                {this.props.squares[i]}
            </button>
        );
    }

    // returns something like
    //      <div board-row>
    //          <button ...>
    //              X / O 
    //          </button>
    //      </div>
    renderRowOfSquares(rowIndex){
        let squareIndices = [3 * rowIndex, 3 * rowIndex + 1, 3 * rowIndex + 2];

        const squares = [];
        squareIndices.forEach(k => {
            squares.push(this.renderSquare(k));
        })

        return <div key={"r" + rowIndex} className="board-row"> {squares} </div>
    }

    // returns something like
    // <div>
    //      <div board-row>
    //          <button ...>
    //              X / O 
    //          </button>
    //      </div>
    //      <div board-row>
    //          <button ...>
    //              X / O 
    //          </button>
    //      </div>
    //      <div board-row>
    //          <button ...>
    //              X / O 
    //          </button>
    //      </div>
    // </div>
    render() {        
        const rows = [];
        [0,1,2].forEach(i => {
            rows.push(this.renderRowOfSquares(i));
        })

        return <div>{rows}</div>;
    }
}
  
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(9).fill(null),
                coordinate: '',
            }],
            moveOrder: 'ascending',
            stepNumber: 0,
            xIsNext: true,
        };
    }

    render() {
        const history = this.state.history;
    
        // templated components
        let board = this.buildBoard(history);
        let toggler = this.buildMoveToggler();

        // templated properties
        let status = this.getStatus(history);
        const moves = this.buildMoves(history);
        this.applyStyling(history);

        // build and return the template
        return (
            <div className="game">
                <div className="game-board">{board}</div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{toggler}</ol>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    }

    handleClick(i){
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const fetchWinner = calculateWinner(current.squares);
        const winner = fetchWinner.winner;
        if( winner || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';

        let coordinate = this.convertPositionToCoordinate(i);
        
        this.setState({
            history: history.concat([{
                squares: squares,
                coordinate: coordinate
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext : (step % 2) === 0,
        });
    }

    cleanupBackgrounds(winner, fetchWinner){
        let line = winner ? fetchWinner.line : null;
        let allPositions = [0,1,2,3,4,5,6,7,8];
        let haveNoWinner = ['null','undefined'].indexOf('' + line ) >= 0 || ((line).hasOwnProperty("length") && line.length === 0);

        allPositions.forEach(position => {
            let square = document.getElementById("s" + position);
            if (square){
                let squareStyle;
                if ( haveNoWinner) {
                    squareStyle = "square";
                } else {
                    let foundWinningSquare = line.indexOf(position) >= 0;
                    squareStyle = !foundWinningSquare ? "square" : "encolored";
                    }
                square.setAttribute("class", squareStyle);
            }
        });
    }

    convertPositionToCoordinate(i){
        let column = i % 3;
        let row = (i - column) / 3;
        let coordinate = ` (${ row },${ column }) `;
        return coordinate;
    }

    convertCoordinateToPosition(coordinate){
        let i = -1;
        const split0 = coordinate.split("(");
        if ( split0.length > 1 ) {
            const split1 = split0[1].split(",");
            if ( split1.length > 1 ) {
                const split2 = split1[1].split(")");
                if ( split2.length > 1 ) {
                    let row = parseInt(split1[0], 10);
                    let column = parseInt(split2[0], 10);
                    if ( ('' + row) !== "NaN" && ('' + column) !== "NaN"){
                        i = 3 * row + column;
                    }
                }
            }
        }
        return i;
    }

    emboldenSingleSquare(index){
        [0,1,2,3,4,5,6,7,8].forEach(position => {
            let square = document.getElementById("s" + position);
            if (square){
                let squareStyle = (position === index) ? "boldSquare" : "square";
                square.setAttribute("class", squareStyle);
            }
        });
    }

    descending(a,b){
        return b < a
            ? -1
            : b > a
                ? 1
                : 0;
    }

    buildMoves(history){
        const sortAscending = ('' + this.state.moveOrder).toLowerCase() === 'ascending';
        const keys = sortAscending ? Object.keys(history) : Object.keys(history).sort(this.descending);
        const moves = [];
        keys.forEach((key, move) => {
            let referentMove = sortAscending ? move : keys.length - move - 1;
            let coordinate = history[key].coordinate;
            let desc = referentMove ?
                'Go to move #' + referentMove + coordinate :
                'Go to game start';
            moves.push(
                <li key={referentMove}>
                    <button onClick={() => this.jumpTo(referentMove)}>{desc}</button>
                </li>
            );
        })
        return moves;
    }

    getStatus(history){
        const current = history[this.state.stepNumber];
        const fetchWinner = calculateWinner(current.squares);
        const winner = fetchWinner.winner;
        const isTie = this.state.history.length > 9;

        let status;
        if (winner) {
            status = 'Winner: ' + winner;
        } else if (isTie) {
            status = 'Draw: No Winner!';
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }
        return status;
    }

    applyStyling(history){
        const current = history[this.state.stepNumber];
        const fetchWinner = calculateWinner(current.squares);
        const winner = fetchWinner.winner;
        this.cleanupBackgrounds(winner, fetchWinner);

        if (!winner){
            let coordinate = current.coordinate;
            let i = this.convertCoordinateToPosition(coordinate);
            this.emboldenSingleSquare(i);
        }
    }

    toggleMoves(){

        const updatedMoveOrder = this.state.moveOrder === "ascending" ? "descending" : "ascending";
        
        this.setState({
            moveOrder: updatedMoveOrder
        });
    }

    buildBoard(history){
        const current = history[this.state.stepNumber];
        return (
            <Board
                squares={current.squares}
                onClick={(i) => this.handleClick(i)}
            />
        )
    }

    buildMoveToggler(){
        return (
            <button onClick={() => this.toggleMoves()}>
                Invert Move Sequence
            </button>
        )
    }
}
  
// ========================================
  
ReactDOM.render(
<Game />,
document.getElementById('root')
);

function calculateWinner(squares){
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++){
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return {
                winner: squares[a],
                line: lines[i]
            }
        }
    }
    return {
        winner: null,
        line: []
    };
}
  