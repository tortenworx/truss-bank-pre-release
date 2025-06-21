import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import 'dotenv/config'

const client = new SapphireClient({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
    enableLoaderTraceLoggings: true
});

client.login(process.env.TOKEN);