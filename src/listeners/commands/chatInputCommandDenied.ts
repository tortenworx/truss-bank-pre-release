import { Events, Listener, type ChatInputCommandDeniedPayload, type UserError } from '@sapphire/framework';
import { Colors, ContainerBuilder, EmbedBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    const error_component = new ContainerBuilder({
      accent_color: Colors.DarkRed,
    }).addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# :x: An error occured."
      ),
      new TextDisplayBuilder().setContent(
        "An error occured while performing the command. See error details below."
      ),
    ).addSeparatorComponents(sep => sep)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Error:\n${error.identifier}`
      ),
      new TextDisplayBuilder().setContent(
        `### Message:\n${error.message}`
      ),
    ).addSeparatorComponents(sep => sep.setDivider(false))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
      )
    )

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        components: [error_component],
        flags: ["IsComponentsV2"]
      });
    }

    return interaction.reply({
      components: [error_component],
      flags: ["IsComponentsV2", "Ephemeral"]
    });
  }
} 