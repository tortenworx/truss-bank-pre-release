import { Colors, EmbedBuilder, type Embed, type EmbedData } from "discord.js";


export const defaultEmbed = (embedData?: EmbedData) => {
    return new EmbedBuilder({
        ...embedData,
        color: Colors.Gold,
        footer: {
            text: "TRUSS Bank - The bank you can trust.",
            icon_url: "https://files.catbox.moe/1los0i.png"  
        },
        timestamp: Date.now()
    })
}

export const successEmbed = (embedData?: EmbedData) => {
    return new EmbedBuilder({
        ...embedData,
        color: Colors.Green,
        footer: {
            text: "TRUSS Bank - The bank you can trust.",
            icon_url: "https://files.catbox.moe/1los0i.png"  
        },
        timestamp: Date.now()
    })
}


export const errorEmbed = (embedData?: EmbedData) => {
    return new EmbedBuilder({
        ...embedData,
        color: Colors.Red,
        footer: {
            text: "TRUSS Bank - The bank you can trust.",
            icon_url: "https://files.catbox.moe/1los0i.png"  
        },
        timestamp: Date.now()
    })
}


export const criticalErrorEmbed = (embedData?: EmbedData) => {
    return new EmbedBuilder({
        ...embedData,
        color: Colors.DarkRed,
        footer: {
            text: "TRUSS Bank - The bank you can trust.",
            icon_url: "https://files.catbox.moe/1los0i.png"  
        },
        timestamp: Date.now()
    })
}