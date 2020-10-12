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


    

})