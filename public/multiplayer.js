document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector('.grid-user')
    const computerGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = document.querySelectorAll('.ship')
    const destroyer = document.querySelector('.destroyer-container')
    const submarine = document.querySelector('.submarine-container')
    const cruiser = document.querySelector('.cruiser-container')
    const battleship = document.querySelector('.battleship-container')
    const carrier = document.querySelector('.carrier-container')
    const startButton = document.querySelector('#start')
    const rotateButton = document.querySelector('#rotate')
    const turnDisplay = document.querySelector('#whose-go')
    const infoDisplay = document.querySelector('#info')
    const setupButtons = document.getElementById('setup-buttons')
    const userSquares = []
    const computerSquares = []
    let isHorizontal = true
    let isGameOver = false
    let currentPlayer = 'user'
    let playerNum = 0;
    let ready = false
    let enemyReady = false
    let allShipsPlaced = false
    let shotFired = -1
    const width = 10 



    const shipArray = [
        {
            name : 'destroyer',
            directions : [[0, 1], [0, width]]
        },
        {
            name : 'submarine',
            directions : [[0, 1 , 2], [0, width, 2*width]]
        },
        {
            name : 'cruiser',
            directions : [[0, 1 , 2], [0, width, 2*width]]
        },
        {
            name : 'battleship',
            directions : [[0, 1 , 2, 3], [0, width, 2*width, 3*width]]
        },
        {
            name : 'carrier',
            directions : [[0, 1 , 2, 3, 4], [0, width, 2*width, 3*width, 4*width]]
        },

    ]


    createBoard(userGrid, userSquares)
    createBoard(computerGrid, computerSquares)
    startMultiPlayer()



    function startMultiPlayer(){
        const socket = io();
        // Get your player Number
        socket.on('player-number', num => {
            if (num === -1){
                infoDisplay.innerHTML = "Sorry the server is full try again later"
            } else {
                playerNum = parseInt(num)
            }
            if (playerNum === 1) currentPlayer = "enemy"

            // Get other players status
            socket.emit('check-players')
        })
        socket.on("lost-game", num => {
            if (num !== playerNum){
                infoDisplay.innerHTML = 'YOU LOSE :('
                gameOver()
            }
            })

        socket.on("player-connection", num => {
            console.log(`Player ${num} connected`)
            playerConnectedOrDisconnect(num)
        })

        socket.on('enemy-ready', num =>  {
            enemyReady = true
            playerReady(num)
            if (ready) playGameMulti(socket)
        })

        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected) playerConnectedOrDisconnect(i)
                if(p.ready){
                    playerReady(i)
                    if (i !== playerNum){
                        enemyReady = true
                    }
                }
            })
        })

        socket.on('timeout', () => {
            infoDisplay.innerHTML = "You have reached the 10 minute limit and been disconnected"
        })
        // Event Listener for firing 
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                console.log("here", enemyReady, ready, currentPlayer)
                if(currentPlayer === 'user' && ready && enemyReady){
                    console.log("should be emitting fire")
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                } 
            })
        })

        socket.on('fire', id=> {
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })

        socket.on('fire-reply', classList => {
            revealSquare(classList, socket)
            playGameMulti(socket)
        })

        startButton.addEventListener("click", () => {
            if (allShipsPlaced) {
                playGameMulti(socket)
            }
            else {
                infoDisplay.innerHTML = "Please place all ships"
            }
        })

        function playerConnectedOrDisconnect(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected`).classList.toggle('active')
            console.log(document.querySelector(`${player} .connected`).classList)
            if (parseInt(num) === playerNum){
                document.querySelector(player).style.fontWeight = 'bold'
            }
        }

    }


    // Create Boards
    function createBoard(grid, squares){
        for (let i = 0; i < width*width  ; i ++){   
            const square = document.createElement('div')
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }

    }

    function rotate(){
        if (isHorizontal){
            destroyer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = false
            return
        }
        if (!isHorizontal){
            destroyer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = true
            return
        }
    }

    rotateButton.addEventListener('click', rotate)

    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex 
    let draggedShip 

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.classList[0]
        console.log(e.target.classList)
    }))

    function dragStart (){
        draggedShip = this
    }

    function dragOver (e){
        e.preventDefault()
        
    }
    function dragEnter (e){
        e.preventDefault()
        
    }
    function dragLeave (){
        
    }
    function dragDrop (){
        let shipLength = draggedShip.children.length
        let shipNameWithLastID = draggedShip.children[shipLength- 1]
        let shipClass = shipNameWithLastID.classList[0].slice(0,-2)
        let shipIndex = parseInt(shipNameWithLastID.classList[0].substr(-1))
        let shipLastId = shipIndex + parseInt(this.dataset.id)
        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))
        shipLastId = shipLastId - selectedShipIndex
        console.log(shipLastId, width, shipLength)
        console.log(parseInt(this.dataset.id))
        const allowedHorizontal = shipLastId%width + 1 >= shipLength
        const allowedVertical = parseInt(this.dataset.id) - selectedShipIndex*width + (shipLength-1)*width < 99
        if (isHorizontal && allowedHorizontal && squaresAreEmpty(this.dataset.id, selectedShipIndex, shipLength, 1)){
            for (let i = 0; i < shipLength; i++){
                let directionClass
                if (i === 0) directionClass = 'start'
                if (i === shipLength - 1) directionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken','horizontal', shipClass, directionClass)
            }
            displayGrid.removeChild(draggedShip)
        } 
        else if (!isHorizontal && allowedVertical && squaresAreEmpty(this.dataset.id, selectedShipIndex, shipLength, width)){
            for (let i = 0; i < shipLength; i++){
                let directionClass
                if (i === 0) directionClass = 'start'
                if (i === shipLength - 1) directionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex*width + i*width].classList.add('taken', 'vertical', shipClass, directionClass)
            }
            displayGrid.removeChild(draggedShip)
        } 
        else{
            return
        }
        if (!displayGrid.querySelector(".ship")) {
            allShipsPlaced = true
        }
        console.log(allShipsPlaced)

    }
    function dragEnd (){
    }

    function squaresAreEmpty(id, selectedShipIndex, shipLength, multiplier){
        for (let i = 0; i < shipLength; i++){
            if (userSquares[parseInt(id) - selectedShipIndex*multiplier + i*multiplier].classList.contains('taken')){
                return false
            }
        }
        return true
    }
    //Game Logic for multiplayer
    function playGameMulti(socket){
        setupButtons.style.display = 'none'
        if (isGameOver) return
        if (!ready){
            socket.emit("player-ready")
            ready = true
            playerReady(playerNum)
        }
        if (enemyReady){
            if (currentPlayer === 'user'){
                turnDisplay.innerHTML = 'Your Go'
            }
            if (currentPlayer === 'enemy'){
                turnDisplay.innerHTML = 'Their Go'
            }
        }
        
    }

    function playerReady(num){
        console.log(`.p${parseInt(num) + 1}`)
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready`).classList.toggle('active')
    }
    
    let destroyerCount = 0 
    let submarineCount = 0
    let cruiserCount = 0
    let battleshipCount = 0
    let carrierCount = 0

    function revealSquare(classList, socket) {
        console.log("In Reveal Square")
        const enemySquare = computerGrid.querySelector(`div[data-id = '${shotFired}']`)
        const obj = Object.values(classList)
        if (!enemySquare.classList.contains('boom') && !enemySquare.classList.contains('miss')
            && !isGameOver && currentPlayer === 'user'){
            if (obj.includes('destroyer')) destroyerCount ++ 
            if (obj.includes('submarine')) submarineCount ++ 
            if (obj.includes('cruiser')) cruiserCount ++ 
            if (obj.includes('battleship')) battleshipCount ++ 
            if (obj.includes('carrier')) carrierCount ++           
            if (obj.includes('taken')){
                enemySquare.classList.add('boom')
            } else {
                enemySquare.classList.add('miss')
            }
            currentPlayer = 'enemy'
            checkForWins(socket)
        }
    }


    function enemyGo(squareID){
        console.log("wehere")
        square = userSquares[squareID]
        if (!square.classList.contains('boom') && !square.classList.contains('miss')){
            if (square.classList.contains('taken')){
                square.classList.add('boom')
            } else {
                square.classList.add('miss')
            }
            currentPlayer = 'user'
        } else {
            enemyGo()
        }
    }


    function checkForWins(socket){
        infoDisplay.innerHTML = "SUNKEN SHIPS :"
        if (destroyerCount === 2){ 
            infoDisplay.innerHTML += ' DESTROYER(2)'
        }
        if (submarineCount === 3){
            infoDisplay.innerHTML += " SUBMARINE(3)"
        }
        if (cruiserCount === 3){
            infoDisplay.innerHTML += ' CRUISER(3)'
        }
        if (battleshipCount === 4){
            infoDisplay.innerHTML += ' BATTLESHIP(4)'
        }
        if (carrierCount === 5){
            infoDisplay.innerHTML += ' CARRIER(5)'
        }
        if (destroyerCount + cruiserCount + submarineCount + carrierCount + battleshipCount === 17){
            infoDisplay.innerHTML = 'YOU WIN :)'
            socket.emit("lost-game", playerNum)
            console.log(playerNum)
            gameOver()
        }
    }

    function gameOver(){
        isGameOver = true
    }

})