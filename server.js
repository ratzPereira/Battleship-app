// require modules
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const app = require('express');


const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);

