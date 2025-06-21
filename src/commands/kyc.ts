import { Command } from '@sapphire/framework';
import { ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, ModalSubmitInteraction, type CacheType, EmbedBuilder, Colors } from 'discord.js';
import { db } from '../utils/drizzle';
import { clientsTable } from '../db/schema';
import { successEmbed } from '../utils/embeds';

export class SlashCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      preconditions: ["KYCNotVerified"],
      description: 'Register to the banking system thru Know-your-customer.'
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    console.log("command recieved")
    const modal = new ModalBuilder({
      customId: `customerKyc-${interaction.user.id}-${interaction.createdAt}`,
      title: 'Customer KYC'
    })
    const ign = new TextInputBuilder({
      customId: 'ign',
      label: 'Your Minecraft Username',
      maxLength: 16,
      minLength: 3,
      style: TextInputStyle.Short,
    })
    
    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ign);

    modal.addComponents(firstRow);
    await interaction.showModal(modal);

    interaction.awaitModalSubmit({
      filter: (f) => f.customId === `customerKyc-${interaction.user.id}-${interaction.createdAt}`,
      time: 60000,
    }).then(async (submittedInteraction) => {
      await this.submitModal(submittedInteraction)
    }).catch((error) => {
      console.error('Error handling modal submission:', error);
    });
  }

  private async submitModal(interaction: ModalSubmitInteraction<CacheType>) {
    const ign = interaction.fields.getTextInputValue('ign')
    await this.registerUser(interaction.user.id, ign)
    const embed = successEmbed({
      author: { name: "Account Creation" },
      title: "Welcome to TRUSS Bank",
      description: "Congratulations! You have been registered to our system. To get started, do `/account create` to create your very first account."
    })
    return interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"]
    })
  }

  private async registerUser(userId: string, ign: string) {
    return await db.insert(clientsTable).values({
      discordId: userId,
      minecraftIGN: ign
    }).returning({
      insertedId: clientsTable.id
    })
  }
}