const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { get, post } = require('./src/routes/composition')
const { get: getEvents } = require('./src/routes/events')
const { get: getRunners } = require('./src/routes/runners')
const { Server } = require('socket.io')
const { init } = require('./src/socket')

const app = express()
const port = process.env.PORT || 3000


app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    console.log('Received req for', req.path);
    next()
})

app.get('/composition', get)
app.post('/composition', post)
app.get('/events', getEvents)
app.get('/runners', getRunners)

let server = app.listen(port, (err) => {
    if (err) {
        console.error('Error starting the server:', err)
        return
    }
    console.log(`BTRL Compositor Backend listening on port ${port}`)
})

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
    },
    path: process.env.REVERSE_PROXY_PATH || '/socket.io'
})
init(io)
