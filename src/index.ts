import { SapphireClient } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits } from 'discord.js';
import 'dotenv/config'

const client = new SapphireClient({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
    ],
    enableLoaderTraceLoggings: true,
    loadApplicationCommandRegistriesStatusListeners: true,
    loadMessageCommandListeners: true,
    presence: {
        activities: [
            { name: "your money grow", type: ActivityType.Watching },
            { name: "to new requests", type: ActivityType.Listening },
            { name: "with other banks", type: ActivityType.Competing }
        ]
    }
});

client.login(process.env.TOKEN);