let io = null

function init(newIo) {
    io = newIo

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id)

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id)
        })
    })
}

function sendCompositionChange(changes) {
    if (!io) return
    io.emit('compositionChanged', changes)
}

module.exports = { init, sendCompositionChange }
