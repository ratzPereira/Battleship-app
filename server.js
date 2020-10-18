//  -> nodemon is running on dev


// require modules
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');


const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);



// Set static folder -> folder that our server is going to serve to the client (where our game files are)
app.use(express.static(path.join(__dirname, "public")))


//Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))


//Handle a socket connection request from web client
const connections = [null, null] // we gonna track the first 2 connections, the others , ignore for now

io.on('connection', socket => {  //io is listening for a connection, the socket is the actual client connecting 

    //console.log('New web socket connection')

    //Find an available player number
    let playerIndex = -1; // we start with -1 , so when the first connect will be the 0 and the second one the 1 (in the array)
    for(const i in connections) {
        if(connections[i] === null){
            playerIndex = i
            break // if we find one we want to exit the loop
        }
    }


    //Tell the connecting client what player number they are
    socket.emit('player-number', playerIndex) //socket.emit will tell the socket what player number they are
    //            /\ title           /\ body

    
    console.log(`Player ${playerIndex} has connected`)


    //Ignore player 3 or more
    if(playerIndex === -1) {
        return
    }

    connections[playerIndex] = false; // here we already know that the connections array is not null

    //Tell everyone what player number just connected
    socket.broadcast.emit('player-connection', playerIndex)
    //                        /\ title           /\ body (data)


    //handle disconnect 
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected!`)
        connections[playerIndex] = null

        //tell everyone what player number number just disconnected
        socket.broadcast.emit('player-connection', playerIndex)

    })

    //On ready
    //player has announced that he's ready and we're listening for that on the server
    //the server hears player ready ('player-ready')
    //and the server will broadcast to the other players that an enemy is ready and witch player index he is
    //then we're going to set up our local connections that we're keeping track of to true (it was false before, because the player was not ready) 
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })


    //Check player connections
    socket.on('check-players', () => {

        const players = []

        //we're looping through our connections, if some is null, we push in our players array (const players = []) that connected is false and ready is false
        //if its not null, it means theres a connection, so the connected is true and the ready status is from the actual connection
        //then we emit that back to socket that asked for it
        for (const i in connections) {

            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }

        socket.emit('check-players', players)
    })

    //On fire received
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id)

        //emit the move to the other player
        socket.broadcast.emit('fire', id)

    })

    //On fire Reply
    socket.on('fire-reply', square => {
        console.log(square)

        //Sending the reply to the other player
        socket.broadcast.emit('fire-reply', square)

    })


    //Timeout connection
    setTimeout(() => {
        connections[playerIndex] = null
        socket.emit('timeout')
        socket.disconnect()
    }, 600000) // 10 minute limit per person
})