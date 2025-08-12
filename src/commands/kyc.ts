import { Command } from '@sapphire/framework';
import { ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, ModalSubmitInteraction, type CacheType, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ComponentType, type Interaction, ButtonInteraction } from 'discord.js';
import { db } from '../utils/drizzle';
import { clientsTable } from '../db/schema';
import { criticalErrorEmbed, errorEmbed, infoEmbed, successEmbed } from '../utils/embeds';

export class SlashCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      cooldownDelay: 5000,
      preconditions: ["KYCNotVerified"],
      description: 'Register to the banking system thru Know-your-customer.'
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
    ,{
      idHints: ["1387127664133017622", "1401924410029375601"],
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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

    const tosEmbed = infoEmbed({
      title: "By doing this, you agree to our terms",
      description: "By signing up to our platform, you agree to the following documents below.",
      fields: [
        { name: "Terms and Conditions", value: "https://docs.google.com/document/d/1F5LDyvVYYjnc5gNjj3fSpJ8YnAGDF-uq6I1vFv8OPbo/edit?usp=sharing" }
      ]
    })

    const yesButton = new ButtonBuilder()
    .setLabel('Yes')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Success)
    .setCustomId('tos-yes')
    
    const noButton = new ButtonBuilder()
    .setLabel('No')
    .setEmoji('❌')
    .setStyle(ButtonStyle.Secondary)
    .setCustomId('tos-no')

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(yesButton, noButton)

    const reply = await interaction.reply({
      embeds: [tosEmbed],
      components: [actionRow],
      flags: ["Ephemeral"]
    })

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      max: 1,
      time: 60_000
    })

    collector.on('collect', async (int) => {
      switch (int.customId) {
        case "tos-yes":
          await this.registerUser(interaction, ign)
          const embed = successEmbed({
            author: { name: "Account Creation" },
            title: "Welcome to TRUSS Bank",
            description: "Congratulations! You have been registered to our system. To get started, do `/account create` to create your very first account."
          })
          interaction.deleteReply()
          return int.reply({
            embeds: [embed],
            flags: ["Ephemeral"]
          })
        case "tos-no":
          interaction.deleteReply()
          const cancelEmbed = errorEmbed({ title: "KYC Cancelled", description: "You have cancelled this command." })
          return int.reply({ embeds: [cancelEmbed], flags: ['Ephemeral'] })
      }
    })

    collector.on('end', () => {
      yesButton.setDisabled(true),
      noButton.setDisabled(true)
    })
  }

  private async registerUser(interaction: ModalSubmitInteraction<CacheType>, ign: string) {
    const data = await db.query.clientsTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.minecraftIGN, ign)
        },
    })
    const alreadyTakenEmbed = errorEmbed({
      title: "IGN Already Registered!",
      description: "The Minecraft IGN you're trying to register with is already associated with another user. Please enter your correct IGN and try again."
    })
    if (data) return interaction.reply({ embeds: [alreadyTakenEmbed], flags: 'Ephemeral' })
    const user = await db.insert(clientsTable).values({
      discordId: interaction.user.id,
      minecraftIGN: ign
    }).returning({
      insertedId: clientsTable.id
    }).catch(err => {
      const errorEmbed = criticalErrorEmbed({
        title: "A critical error occured",
        description: "An error occured while registering your account. Try registering again in a few moments, if the error persists, contact support.",
        fields: [
          { name: "Error", value: err.cause.detail }
        ]
      })
      return interaction.reply({ embeds: [errorEmbed], flags: 'Ephemeral' })
    })
    return user
  }
}