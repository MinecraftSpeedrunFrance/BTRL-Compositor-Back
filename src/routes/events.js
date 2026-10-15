const { appCache } = require('../utils/cache')

/**
 * Get all events
 * @param {import('express').Request} _ - The request object
 * @param {import('express').Response} res - The response object
 * @returns {Promise<import('express').Response>} - The response object
 */
async function get(_, res) {
    try {
        let data
        if (appCache.has('events')) {
            data = appCache.get('events')
        } else {
            data = await getEvents()
            appCache.set('events', data, 1000 * 60 * 60 * 12) // Cache events for 12 hours
        }
        return res.json(data) // todo add cache headers
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function getEvents() {
    const json = await fetch('https://paceman.gg/api/get-events')
    return await json.json()
}

module.exports = { get, getEvents }
