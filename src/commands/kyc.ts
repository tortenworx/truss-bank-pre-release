import { Command } from '@sapphire/framework';
import { ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, ModalSubmitInteraction, type CacheType, EmbedBuilder, Colors } from 'discord.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';
const db = drizzle({ schema });

export class SlashCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
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
    const doesUserExist = db.query.clientsTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.discordId, interaction.user.id)
      },
    })

    console.log(doesUserExist)
    return interaction.reply(ign)
    // if (error) {
    //   const embed = new EmbedBuilder({
    //     title: "An error occured",
    //     description: "An unexpected error occured while performing this task.",
    //     color: Colors.Red,
    //     fields: [
    //       { name: "Error Message", value: `\`\`\`${error.message}\`\`\`` }
    //     ]
    //   })
    //   return interaction.reply({ embeds: [embed], flags: ["Ephemeral"] })
    // }
    // const success = new EmbedBuilder({
    //   title: "Welcome to TRUSS Bank!",
    //   description: "Thank you for registering! You can now create an account using `/account create`! ",
    //   footer: {
    //     text: "The bank you can trust.",
    //     iconURL: "https://files.catbox.moe/1los0i.png"
    //   }
    // })
    // interaction.reply({ embeds: [success], flags: ['Ephemeral'] })
  }

}