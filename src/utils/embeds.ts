import { Colors, ContainerBuilder, EmbedBuilder, TextDisplayBuilder, type Embed, type EmbedData } from "discord.js";


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


export const infoEmbed = (embedData?: EmbedData) => {
    return new EmbedBuilder({
        ...embedData,
        color: Colors.Blurple,
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

export function criticalErrorComponent (message: string, cause?: string) {
    if (cause) {
        return new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "# ❌ An error occured. "
                ),
                new TextDisplayBuilder().setContent(
                    "An unexpected error occured while performing an action. See further details below."
                )
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "### Error Message"
                ),
                new TextDisplayBuilder().setContent(
                    message
                ),
                new TextDisplayBuilder().setContent(
                    "### Cause"
                ),
                new TextDisplayBuilder().setContent(
                    `\`\`\`${cause}\`\`\``
                )
            )
    } else {
        return new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "# ❌ An error occured. "
                ),
                new TextDisplayBuilder().setContent(
                    "An unexpected error occured while performing an action. See further details below."
                )
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "### Error Message"
                ),
                new TextDisplayBuilder().setContent(
                    message
                ),
            )
    }
}