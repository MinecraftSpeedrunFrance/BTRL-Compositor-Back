class Cache {
    constructor() {
        this.data = new Map()
    }

    get(key, initializer) {
        let entry = this.data.get(key)
        if (!entry) {
            if (initializer) {
                try {
                    entry = { value: initializer(), timestamp: Date.now() }
                    this.data.set(key, entry)
                    return entry.value
                } catch (error) {
                    console.error(`Failed to initialize cache entry for key ${key}: `, error)
                }
            }
            return null
        }
        if (Date.now() - entry.timestamp > entry.lifespan) {
            this.data.delete(key)
            return null
        }
        return entry.value
    }
    has(key) {
        if (this.data.has(key)) {
            let entry = this.data.get(key)
            if (Date.now() - entry.timestamp > entry.lifespan) {
                this.data.delete(key)
                return false
            }
            return true
        }
        return false
    }
    set(key, value, lifespan = 1000 * 60 * 5) {
        this.data.set(key, {value, timestamp: Date.now(), lifespan})
    }
}

/**
 * The application cache
 * @type {Cache}
 */
const appCache = new Cache()

// Mock BTRL for testing purposes
// appCache.set('events', [
//     { _id: 'event1', name: 'Event 1', whitelist: [
//         '90340a7b-ecbc-4902-9799-8b472efdb76d', '438198de-5143-485c-92b7-25df4c9e0b02', '96f8bc34-0057-465d-bca9-b8b668dc5f95', '4bf064c6-42dc-4937-a5b0-d9b6327a7119', '7321b32b-2707-4153-a4e9-68ba0be8cb73', 'bbe960bb-8c5a-4ae5-929b-ebafa908273c', '950e0297-1d76-431c-b4f3-4e4bba8cce76', '9fd3c3f3-d684-49eb-9f5e-9d598129fc46',
//         '02833f8a-73ca-4be0-a54a-aa48c3fac9a7', 'fa48d763-ba4c-452f-b85d-fca945b39c61', 'aaa6da76-06ae-41ed-9326-cb200560a489', '7096b050-a76c-4421-8e1f-f2ca51b7f735',
//         '91ae361c-fa7d-480d-9031-baaaa3fa684f', '8bed8d00-3ed2-43cb-a725-f6573e442497', '97d59e1d-aaa7-4e40-94ff-f1c47cd091c2', 'c747756a-1cf8-4fca-a609-ce92de5876aa',
//         'f2800b7d-d2ab-410a-a614-5340afcac8ab', '963772dc-cc2d-44fb-b2d8-c74565e949dd', 'cc900b46-aba8-4ed6-aa85-641143e0c62e', '4961563f-d6e0-4f9c-8459-3d5660c2294f',
//         '6470d403-ef98-40a7-b797-b708b7dc40a1'
//     ]},
// ], 1000 * 60 * 60 * 24) // Cache events for 24 hour

module.exports = { Cache, appCache }
