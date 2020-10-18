// Load everything from html

document.addEventListener ('DOMContentLoaded', () => {

    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const startButton = document.querySelector('#start');  //   # for looking for Id
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    const singlePlayerButton = document.querySelector("#singlePlayerButton");
    const multiPlayerButton = document.querySelector("#multiPlayerButton");
    const userSquares = [];
    const computerSquares = [];
    let isHorizontal = true; // we hard coded the  ships to be horizontal

    //for game logic
    let isGameOver = false;
    let currentPlayer = 'user';

    const width = 10;
    
    //new const for the multiplayer mode
    let gameMode = "";
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;


    //Select play mode
    singlePlayerButton.addEventListener('click', startSinglePlayer);
    multiPlayerButton.addEventListener('click', startMultiPlayer);




    //Single Player
    function startSinglePlayer() {

        gameMode = "singlePlayer"

        generate(shipsArray[0]);
        generate(shipsArray[1]);
        generate(shipsArray[2]);
        generate(shipsArray[3]);
        generate(shipsArray[4]);

        startButton.addEventListener('click', playGameSingle);
    }


    //Multiplayer
    function startMultiPlayer() {

        gameMode = 'multiPlayer'

        const socket = io();

        //Get your player number
        socket.on('player-number', num => {        // we are listening for a transmission that is titled "player-number"

        if (num === -1){ // if the argument num that we received is -1, it means that the server is full

            infoDisplay.innerHTML = 'Sorry the server is full at this moment, try again later!'
        } else {
            playerNum = parseInt(num) //socket.io pass us one string, we need to parseInt here
            if(playerNum === 1){
                currentPlayer = "Enemy"   // we are the 0, enemy is the 1
                }
            console.log(playerNum)

            //Get other player status, we're asking the server to check to see if theres any other players and what their status is on the server
            socket.emit('check-players')

            }
        })


        //Another player has connected or disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        //On enemy ready
        //we receive the message that the enemy is ready and we  set our local variable to true, so we can track that
        //then we pass that players num through our playerReady
        //if ready, that gameMulti will play and we pass the socket
        socket.on('enemy-ready', num => {

            enemyReady = true
            playerReady(num)
            if(ready) {
                playGameMulti(socket)
            }
        })

        //check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected) {
                    playerConnectedOrDisconnected(i)
                }

                if(p.ready){
                    playerReady(i)
                    if(i !== playerNum) {
                        enemyReady = true
                    }
                }
            })
        })

        //On timeout
        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have been disconnected '
        })


        // Ready button click
        startButton.addEventListener('click', () => {
            if(allShipsPlaced){
                playGameMulti(socket)
            } else {
                infoDisplay.innerHTML = "Please place all ships first!"
            }
        })

        //Setup event listeners for firing
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                if(currentPlayer === 'user' && ready && enemyReady) {
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                }
            })
        })


        //On fire received
        //we have sent our fire to the server, then sending it back to the other client
        //we get the square and we wanna know if it was hit or miss, so we gonna replay with the classList of our userSquares ( if theres was a ship it will have the type and 'taken')
        socket.on('fire', id => {
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })


        //on fire reply received
        socket.on('fire-reply', classList => {
            revealSquare(classList)
            playGameMulti(socket)

        })



        function playerConnectedOrDisconnected (num) {
            
            let player = `.p${parseInt(num) + 1}`  // we have the p1 and p2 call on our html. we get 0 or 1 from num, so  we add +1 to get 1 or 2.

            //here we are passing in a player, and .connected span (div class in our html file) will toggle the Connected to green
            document.querySelector(`${player} .connected span`).classList.toggle('green')

            if(parseInt(num) === playerNum){  // if the player connecting is actually us, we change the font to bold
                document.querySelector(player).style.fontWeight = 'bold'
            }
        }
    }



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
        
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length) * directions));  // we want a point to start, we know that length is 100 and we need to sub the length of 1 grid ( if we get 100 the ship will start offscreen)
    

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
    


    //rotate the ships
    function rotate() {
        if(isHorizontal){
            destroyer.classList.toggle('destroyer-container-vertical') //on click, the destroyer-container-vertical is our CSS will be called
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')

            isHorizontal = false 
            return
        }

        if(!isHorizontal){
            destroyer.classList.toggle('destroyer-container-vertical') //on click, the destroyer-container-vertical is our CSS will be called
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')

            isHorizontal = true 
            return
        }
    }

    //adding the event to the button
    rotateButton.addEventListener('click', rotate);


    //move around user ships
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragover', dragOver));
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach(square => square.addEventListener('drop', dragDrop));
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd));



    let selectedShipNameWithIndex //so we know what we're working with at all times
    let draggedShip //so we know what we're working with at all times
    let draggedShipLength //so we know what we're working with at all times

    //console.log(draggedShip)

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id   // whatever id we pick we then assign it to the selectedShipNameWithIndex 
        console.log(selectedShipNameWithIndex)
        
    }))


    function dragStart (e){

        //console.log(e.target)
        //console.log(this)

        draggedShip = this
        draggedShipLength = this.childNodes.length // draggedShipLength will be equals to the number of ship child nodes that we selected with our mouse
        console.log('quero saber a lenght' + draggedShipLength)
        //console.log(draggedShipLength)
        //console.log(draggedShip)
    }

    function dragOver (e){

        e.preventDefault() // tells that if the event does not get explicitly handled, its default action should not be taken as it normally would be. 
    }

    function dragEnter (e){

        e.preventDefault()
    }

    function dragLeave (){

        console.log('Drag Leave here')
    }

    function dragDrop (){

        let shipNameWithLastId = draggedShip.lastChild.id
        let shipClass = shipNameWithLastId.slice(0,-2) // slice because we get for ex: battleship instead battleship-2

        //console.log('ship classs ' + shipClass)
        
        //we want the know the last index that our ship will takes
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1)) //for example battleship-2 -> this will take the 2 number 
        //console.log('last ship id  ' + lastShipIndex)

        let shipLastId = lastShipIndex + parseInt(this.dataset.id)
        console.log('ship last id is: ' + shipLastId)


        //not letting ships to "pass" the grid
        const notAllowedHorizontal = [100,101,102,103,104,105,106,107,108,109,0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,12,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
        const notAllowedVertical = [100,101,102,103,104,105,106,107,108,109,99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]

        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * (lastShipIndex + 1))
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * (lastShipIndex + 1))  
        console.log('Last ship index is  ' + lastShipIndex)
        //console.log('Not allowed Horizontal : ' + newNotAllowedHorizontal + ' Not allowed Vertical : ' + newNotAllowedVertical)


        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1)) // this will tell us the div id that we selected with our mouse
        //console.log('Selected ship index = ' + selectedShipIndex)


        shipLastId = shipLastId - selectedShipIndex
        console.log('ship last id after selected is: ' + shipLastId)


        //we can use this for w/e ship is selected (because of the shipClass)
        if(isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)){
            for (let i = 0; i < draggedShipLength; i++){
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass)
            }
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                userSquares[parseInt(this.dataset.id) - selectedShipIndex  + width * i].classList.add('taken', shipClass)
            }
        } else return

        
        displayGrid.removeChild(draggedShip)  // we remove from the display grid the selected ship

            //if our display grid doesnt have any ships, its because all of them are placed and we set our bool to true
        if (!displayGrid.querySelector('.ship')) {

            allShipsPlaced = true
        }

    }

    function dragEnd (){

        console.log('dragend')
    }

    //   >> GAME LOGIC for multiplayer!! <<

    function playGameMulti (socket) {
        if(isGameOver) {
            return
        }

        if(!ready){
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }


        if (enemyReady) {
            if(currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Your turn.'
            }

            if (currentPlayer === 'enemy') {
                turnDisplay.innerHTML = "Enemy's turn."
            }
        }
    }

    function playerReady(num){

        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready span`).classList.toggle('green')  //change player ready checkbox green
    }    



    //      >>       GAME LOGIC   FOR SINGLE PLAYER    <<

    function playGameSingle(){

        if(isGameOver) {
            return
        }

        if (currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Your turn'

            computerSquares.forEach(square => square.addEventListener('click', function(e){
                revealSquare(square.classList)
            }))
        }

        if (currentPlayer === 'enemy') {
            turnDisplay.innerHTML = 'Enemy turn'

            setTimeout(enemyGo, 1000)   // the timeout is for smoother experience 
        }
    }


    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;


    // function revealSquare(classList){
        
    //     const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    //     const obj = Object.values(classList)

    //     if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){   //prevents double clicks in squares already taken

    //         if(obj.includes('destroyer')){
    //             destroyerCount++
    //         }

    //         if(obj.includes('submarine')){
    //             submarineCount++
    //         }

    //         if(obj.includes('cruiser')){
    //             cruiserCount++
    //         }

    //         if(obj.includes('battleship')){
    //             battleshipCount++
    //         }

    //         if(obj.includes('carrier')){
    //             carrierCount++
    //         }
    //     }

    //     if(obj.includes('taken')) {
    //         enemySquare.classList.add('boom')
    //     } else {
    //         enemySquare.classList.add('missed')
    //     }

    //     checkForWins();
    //     currentPlayer = 'enemy';  // change the turn for the computer 

    //     if(gameMode ==='singlePlayer') {
    //         playGameSingle();
    //     }
        
    // }

    function revealSquare(classList) {
        
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        
        if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
          if (obj.includes('destroyer')) destroyerCount++
          if (obj.includes('submarine')) submarineCount++
          if (obj.includes('cruiser')) cruiserCount++
          if (obj.includes('battleship')) battleshipCount++
          if (obj.includes('carrier')) carrierCount++
        }
        if (obj.includes('taken')) {
          enemySquare.classList.add('boom')
        } else {
          enemySquare.classList.add('miss')
        }
        checkForWins()
        currentPlayer = 'enemy'
        if(gameMode === 'singlePlayer') playGameSingle()
      }


    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;


    //enemy or computer turn
    function enemyGo (square) {

        if(gameMode === 'singlePlayer') {

            square = Math.floor(Math.random() * userSquares.length) 
        }
        

        if(!userSquares[square].classList.contains('boom')) {
            
            userSquares[square].classList.add('boom')

            if(userSquares[square].classList.contains('destroyer')){
                cpuDestroyerCount++
            }

            if(userSquares[square].classList.contains('submarine')){
                cpuSubmarineCount++
            }

            if(userSquares[square].classList.contains('cruiser')){
                cpuCruiserCount++
            }

            if(userSquares[square].classList.contains('battleship')){
                cpuBattleshipCount++
            }

            if(userSquares[square].classList.contains('carrier')){
                cpuCarrierCount++
            }
            checkForWins()
        } else if (gameMode === 'singlePlayer') {
            enemyGo()
        }
            
        

        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Player Turn'
        
    }


    function checkForWins() {

        let enemy = 'computer'
        if(gameMode === 'multiPlayer') {
            enemy = 'enemy'
        }
        //player kills
        if(destroyerCount === 2) {
            infoDisplay.innerHTML = `You killed the ${enemy}'s destroyer`
            destroyerCount = 10
        }

        if(submarineCount === 3) {
            infoDisplay.innerHTML = `You killed the ${enemy}'s submarine`
            submarineCount = 10
        }

        if(cruiserCount === 3) {
            infoDisplay.innerHTML = `You killed the ${enemy}'s cruiser`
            cruiserCount = 10
        }

        if(battleshipCount === 4) {
            infoDisplay.innerHTML = `You killed the ${enemy}'s battleship`
            battleshipCount = 10
        }

        if(carrierCount === 5) {
            infoDisplay.innerHTML = `You killed the ${enemy}'s carrier`
            carrierCount = 10
        }


        //computer kills
        if(cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = 'Your destroyer died'
            cpuDestroyerCount = 10
        }

        if(cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = 'Your submarine died'
            cpuSubmarineCount = 10
        }

        if(cpuCruiserCount === 3) {
            infoDisplay.innerHTML = 'Your cruiser died'
            cpuCruiserCount = 10
        }

        if(cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = 'Your battleship died'
            cpuBattleshipCount = 10
        }

        if(cpuCarrierCount === 5) {
            infoDisplay.innerHTML = 'Your carrier died'
            cpuCarrierCount = 10
        }

        //checks if you win
        if((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            
            infoDisplay.innerHTML = 'You Win'
            gameOver()
        }

        //checks if computer win
        if((cpuDestroyerCount + cpuSubmarineCount + cpuBattleshipCount + cpuCarrierCount + cpuCruiserCount) === 50) {

            infoDisplay.innerHTML = 'You Lost'
            gameOver()
        }
    }

    function gameOver() {

        isGameOver = true;
        startButton.removeEventListener('click', playGameSingle)
    }

})