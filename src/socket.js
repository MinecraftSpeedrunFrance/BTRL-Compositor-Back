let io = null
const state = { currentComposition: [] }

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

async function updateStats(runners) {
    if (!io) return

    const changes = []
    for (const pov of state.currentComposition) {
        const runner = runners[pov.uuid]
        const change = {
            uuid: pov.uuid,
        }
        let dirty = false
        if (runner?.split?.eventId === 'rsg.credits' && runner?.items) {
            runner.items = {}
            change.items = 'clear' // empty object properties are trimmed by the websocket
            dirty = true
        }
        if (runner?.btrl !== pov?.btrl) {
            change.btrl = runner.btrl
            pov.btrl = runner.btrl
            dirty = true
        }
        if (JSON.stringify(runner?.items ?? {}) != JSON.stringify(pov?.items ?? {})) {
            change.items = Object.keys(runner?.items ?? {}).length === 0 ? 'clear' : runner.items
            pov.items = runner.items
            dirty = true
        }
        // if (runner.split !== pov.split) {
        //     change.split = runner.split
        //     pov.split = runner.split
        // }
        if (dirty) {
            changes.push(change)
        }
    }
    if (changes.length > 0) {
        io.emit('statsChanged', changes)
    }
}

module.exports = { init, sendCompositionChange, updateStats, state }
