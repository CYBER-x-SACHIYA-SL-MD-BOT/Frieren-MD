import { MongoClient } from 'mongodb'

// Shared connection instance
export const mongoDB = {
    db: null,
    botData: {
        get: async (collection) => {
            if (!mongoDB.db) return null
            return await mongoDB.db.collection(collection).find({}).toArray().then(arr => {
                // Convert array of objects back to single object based on IDs/Keys if needed
                // For simplicity, assuming simple key-value store structure like lowdb
                // This adapter might need adjustment based on exact lowdb structure
                if (arr.length === 0) return null
                return arr[0].data // Assuming we store { data: ... }
            })
        },
        set: async (collection, data) => {
            if (!mongoDB.db) return
            // Upsert mechanism
            await mongoDB.db.collection(collection).updateOne(
                { _id: 'main_storage' }, // Single doc per collection approach
                { $set: { data: data } },
                { upsert: true }
            )
        }
    }
}

const connectToMongo = async () => {
    // Gunakan global.mongoUri dari config.js
    const uri = global.mongoUri || process.env.MONGO_URI
    
    if (!uri) {
        console.log('ℹ️ MongoDB URI not set. Running in Local Mode (LowDB).')
        return
    }

    try {
        const client = new MongoClient(uri)
        await client.connect()
        mongoDB.db = client.db('FrierenBotDB') // Database Name
        console.log('✅ Connected to MongoDB')
    } catch (e) {
        console.error('❌ MongoDB Connection Error:', e.message)
    }
}

export default connectToMongo