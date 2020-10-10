// Load everything from html

document.addEventListener ('DOMContentLoaded', () => {

    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ship = document.querySelector('.ship');
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
    function createBoard (grid, squares) {    // we will pass 3 parameters , the grid, squares and the width
        for ( let i = 0; i < width*width; i++){
            const square = document.createElement('div');  // we store in square each div element created 
            square.dataset.id = i;  // each time it loops we will set one unique id ( we gonna get 99 divs) 
            grid.appendChild(square); //we append div to our userGrid
            squares.push(square);     // each time we crate one div, we add it to this array to keep tracking
        }
    }

    createBoard(userGrid, userSquares);
    createBoard(computerGrid, computerSquares);

    //Ships
    //We go create one array of objects, in this case, ships

    const shipsArray = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],     //horizontally
                [0, width]  //vertically 
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, width, width*2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, width, width*2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, width, width*2, width *3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, width, width*2, width *3, width*4]
            ]
        },
    ]

    //draw the ships in random locations for the computer

    function generate(ship){

        let randomDirection = Math.floor(Math.random() * ship.directions.length); //we generate a number between each ship length
        let current = ship.directions[randomDirection] ;    // we grab the ship direction , vertical or horizontal 
        
        if (randomDirection === 0){
            directions = 1;  // we will render our ship horizontally
        } 
        if (randomDirection === 1) {
            directions = 10;   // we will render our ship downwards 
        } 
        
        let randomStart = Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length) * directions);  // we want a point to start, we know that length is 100 and we need to sub the length of 1 grid ( if we get 100 the ship will start offscreen)
    

        //make sure that we dont get a taken square
        const isTaken = current.some(index => computerSquares [randomStart + index].classList.contains('taken')); //if true we already have some other ship , or div in there
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1); // if true, we are at the right edge of the board
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);// if true, we are at the left edge of the board


        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {

            current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name));

        }else{
            generate(ship);
        } 
    }
    generate(shipsArray[0]);
})