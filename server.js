const express = require("express");
const path = require("path");
const http = require("http");
const PORT = process.env.PORT || 3001
const socketio = require("socket.io");
const { disconnect } = require("process");
const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Set Static Folder

app.use(express.static(path.join(__dirname, "public")))

//Start Server

server.listen(PORT, () => console.log(`server running on ${PORT}`))

//Handle socket Connection request from web client
const connections = [null, null]


io.on("connection", socket => {
    let playerIndex = -1
    for (const i in connections){
        if (connections[i] === null){
            playerIndex = i
            break
        }
    }
    socket.emit("player-number", playerIndex)
    console.log(`Player ${playerIndex} has connected`)
    if (playerIndex === -1) {
        return
    }
    connections[playerIndex] = false
    console.log("I AM ", playerIndex)
    socket.broadcast.emit("player-connection", playerIndex)
    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        socket.broadcast.emit("player-connection", playerIndex)
    })
    socket.on("player-ready", () => {
        socket.broadcast.emit("enemy-ready", playerIndex)
        connections[playerIndex] = true
    })
    socket.on("lost-game", playerNum => {
        socket.broadcast.emit('lost-game', playerNum)
    })
    socket.on('check-players', () => {
        const players = []
        for (const i in connections){
            connections[i] === null ? players.push({connected : false, ready : false}) :
                                    players.push({connected : true, ready : connections[i]})
        }
        socket.emit("check-players", players )
    })

    socket.on('fire', id => {
        socket.broadcast.emit('fire', id)
    })

    socket.on('fire-reply', square => {
        socket.broadcast.emit('fire-reply', square)
    })

    setTimeout (() => {
    connections[playerIndex] = null
    socket.emit("timeout")
    socket.disconnect()
    }, 600000) // 10 min limit per player
})