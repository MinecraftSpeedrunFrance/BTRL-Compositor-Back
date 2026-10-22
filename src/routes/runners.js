const { appCache } = require('../utils/cache')
const { checkChannelStatus } = require('../utils/twitch')
const { getEvents } = require('./events')

async function get(req, res) {
    // Get the list of events from the cache or fetch it if not present
    console.time('route')
    let events
    if (appCache.has('events')) {
        events = appCache.get('events')
    } else {
        events = await getEvents()
        appCache.set('events', events)
    }
    console.timeLog('route', 'Fetched events')

    const eventId = req.query.event
    let event
    for (const x of events) {
        if (x._id === eventId) {
            event = x
            break
        }
    }

    if (!event && eventId !== 'none') {
        return res.status(404).json({ message: 'Event not found' })
    }

    // Get the live runs from the paceman API and filter them based on the event's whitelist
    const whitelist = event?.whitelist ?? []
    const runsFilter = run => {
        return (eventId == 'none' || whitelist.includes(run.user.uuid)) && !run.isCheated
    }

    const runs = (await (await fetch('https://paceman.gg/api/ars/liveruns?gameVersion=1.16.1&liveOnly=true')).json()).filter(runsFilter)
    console.timeLog('route', 'Fetched live runs')

    // get twitch accounts of every PaceMan user
    let twitchAccounts
    if (appCache.has(`${eventId}_twitchAccounts`)) {
        twitchAccounts = appCache.get(`${eventId}_twitchAccounts`)
    } else {
        twitchAccounts = (await (await fetch('https://paceman.gg/stats/api/getAllUsers')).json())
            .filter(user => whitelist.includes(user.id))
            .map(user => ({ uuid: user.id, twitches: user.twitches, nickname: user.nick }))
        console.timeLog('route', `Fetched ${twitchAccounts.length} twitch accounts`)
        appCache.set(`${eventId}_twitchAccounts`, twitchAccounts, 1000 * 60 * 60 * 12) // Cache for 12 hours
    }

    const results = []
    let promises = []

    for (const account of twitchAccounts) {
        let liveRun = runs.find(run => run.user.uuid === account.uuid)
        if (liveRun) {
            const entry = { uuid: account.uuid }
            entry.live = true
            entry.twitch = liveRun.user.liveAccount
            entry.nickname = liveRun.nickname
            entry.split = liveRun.eventList[liveRun.eventList.length - 1]
            entry.items = liveRun?.itemData?.estimatedCounts
            results.push(entry)
        } else {
            promises.push(checkTwitch(account).then(entry => {
                results.push(entry)
            }))
        }
    }

    await Promise.all(promises)
    console.timeEnd('route')
    return res.json(results)
}

async function checkTwitch(account) { // TODO cache for 30 seconds
    try {
        const twitchStatuses = account.twitches.length > 0 ? await checkChannelStatus(account.twitches) : []
        const entry = {
            uuid: account.uuid,
            live: twitchStatuses.some(status => status.live),
            nickname: account.nickname
        }
        if (entry.live) {
            entry.twitch = twitchStatuses.find(status => status.live).twitch
        } else { // todo remoeve?
            entry.twitch = account.twitches?.[0] ?? null // Return the first Twitch account if available
        }
        return entry
    } catch (error) {
        console.error(`Error checking Twitch status for user ${account.uuid}:`, error)
        return { uuid: account.uuid, live: false, nickname: account.nickname }
    }
}

module.exports = { get }
