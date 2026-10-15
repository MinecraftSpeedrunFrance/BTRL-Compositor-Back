let accessToken = null

async function getAccessToken() {
    const url = 'https://id.twitch.tv/oauth2/token'
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
    });

    const response = await fetch(`${url}`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    })
    
    if (!response.ok) {
        throw new Error(`Impossible de générer le token: ${response.statusText}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    return accessToken
}

async function checkChannelStatus(usernames) {
    if (!accessToken) await getAccessToken()

    const url = `https://api.twitch.tv/helix/streams?${usernames.map(x => `user_login=${x}`).join('&')}`

    let response = await fetch(url, {
        method: 'GET',
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`
        }
    })

    // Token expired, generate a new token and retry
    if (response.status === 401) {
        await getAccessToken()
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        })
    }

    if (!response.ok) {
        throw new Error(`Erreur de l'API Twitch: ${response.statusText}`)
    }

    const result = await response.json()

    // Parse status for each channel
    const status = []
    for (const user of usernames) {
        const stat = result.data.find(x => x.user_login === user)
        if (stat) {
            status.push({ live: true, twitch: user })
        } else {
            status.push({ live: false, twitch: user })
        }
    }
    return status
}

module.exports = { checkChannelStatus }
