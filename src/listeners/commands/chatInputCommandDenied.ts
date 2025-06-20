import { Events, Listener, type ChatInputCommandDeniedPayload, type UserError } from '@sapphire/framework';
import { Colors, EmbedBuilder, MessageFlags } from 'discord.js';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    const errorEmbed = new EmbedBuilder({
        author: {
            name: "An user error occured."
        },
        title: error.identifier,
        description: error.message,
        color: Colors.Red,
        footer: {
            text: "TRUSS Bank - The bank you can trust.",
            icon_url: "https://files.catbox.moe/1los0i.png"  
        },
        timestamp: Date.now()
    })

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        embeds: [errorEmbed]
      });
    }

    return interaction.reply({
      embeds: [errorEmbed],
      flags: MessageFlags.Ephemeral
    });
  }
}