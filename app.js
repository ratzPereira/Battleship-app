// Load everything from html

document.addEventListener ('DOMContentLoaded', () => {

    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ships = document.querySelector('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const startButton = document.querySelector('#start');  //   # for looking for Id
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    const userSquares = [];
    const computerSquares = [];

    const width = 10; 

    //create board
    function createBoard (grid, squares, width) {    // we will pass 3 parameters , the grid, squares and the width
        for ( let i = 0; i < width*width; i++){
            const square = document.createElement('div');  // we store in square each div element created 
            square.dataset.id = i;  // each time it loops we will set one unique id ( we gonna get 99 divs) 
            grid.appendChild(square); //we append div to our userGrid
            squares.push(square);     // each time we crate one div, we add it to this array to keep tracking
        }
    }

    createBoard(userGrid, userSquares, width);
    createBoard(computerGrid, computerSquares, width);
})