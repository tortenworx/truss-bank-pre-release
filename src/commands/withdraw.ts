import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorSpacingSize, ChannelType, MessageMentions, EmbedType, Colors } from 'discord.js';
import { db } from '../utils/drizzle';
import { request } from '../db/schema';
import { criticalErrorComponent, defaultEmbed } from '../utils/embeds';
import { format_account_numbers, format_amounts, get_catbox_file } from '../utils/functions';
import axios from "axios"

export class SlashCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      cooldownDelay: 5000,
      preconditions: ["KYCVerified"],
      description: 'Create a deposit request for your account.'
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addNumberOption((option) => 
          option
            .setName('amount')
            .setDescription("The amount that you want to deposit into.")
            .setRequired(true)
        )
        .addStringOption((option) => 
            option
                .setName("account")
                .setDescription("The list of your current active accounts")
                .setRequired(true)
                .setAutocomplete(true)
        )
    ,{
      idHints: ["1402604226928054443"],
      guildIds: ["1333791239597719685"]
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: 'Ephemeral' })
    const getAccountInformation = await db.query.accountTable.findFirst({
      where(fields, operators) {
       return operators.eq(fields.id, Number(interaction.options.getString("account")))
      }
    })
    const getClient = await db.query.clientsTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.discordId, interaction.user.id)
      },
    })
    if (getAccountInformation?.primaryOwner !== getClient?.id) {
      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# Insufficient Permissions`
              ),
              new TextDisplayBuilder().setContent(
                "The you do not have permission to create deposit requests or own the account."
              )
            )
        ],
        flags: ["IsComponentsV2"]
      })
    }
    if (!getAccountInformation) {
      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# No Account Found`
              ),
              new TextDisplayBuilder().setContent(
                "The account you have entered is invalid or have never existed."
              )
            )
        ],
        flags: ["IsComponentsV2"]
      })
    };
    const amount = interaction.options.getNumber("amount")
    if (!amount) {
      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# Unsuported Field Response`
              ),
              new TextDisplayBuilder().setContent(
                "Your `amount` field is either invalid or empty. Please only use up to two decimal places for a deposit transaction."
              )
            )
        ],
        flags: ["IsComponentsV2"]
      })
    }

    if (amount > 20000) {
      return interaction.editReply({
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `# Amount too high.`
              ),
              new TextDisplayBuilder().setContent(
                "You are making a deposit request exeeding £20,000. Either lower your deposit amount, or open a support ticket."
              )
            )
        ],
        flags: ["IsComponentsV2"]
      })
    }
    if (amount > getAccountInformation.balance) {
      return interaction.editReply({
        components: [
          {
            type: ComponentType.Container,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: "# Balance Too Low!"
              },
              {
                type: ComponentType.TextDisplay,
                content: `You don't have enough balance to do this transaction! Your current balance is \`${format_amounts(getAccountInformation.balance)}\``
              },
            ],
            accent_color: Colors.DarkRed
          }
        ],
        flags: ["IsComponentsV2"]
      })
    }

    const yesButton = new ButtonBuilder()
      .setEmoji("✅")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Success)
      .setCustomId("withdraw-yes")
    const noButton = new ButtonBuilder()
      .setEmoji("✖️")
      .setLabel("Retract")
      .setStyle(ButtonStyle.Danger)
      .setCustomId("withdraw-no")

    const confirmationMessage = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Confirm your transaction`
        ),
        new TextDisplayBuilder().setContent(
          "You are making a **withdrawal** transaction with the following details:"
        )
      )
      .addSeparatorComponents(seperator => seperator.setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Target Account**: ${getAccountInformation?.accountNickname} (${format_account_numbers(getAccountInformation?.id)})`
        ),
        new TextDisplayBuilder().setContent(
          `**Amount**: ${format_amounts(amount)}`
        ),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Are you sure the details are correct? Confirm or retract your request thru the buttons below.`
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          yesButton,
          noButton
        )
      )
    const replyMessage = await interaction.editReply({
      flags: ["IsComponentsV2"],
      components: [confirmationMessage]
    })

    const collector = replyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      max: 1,
      time: 60_000
    })
    collector.on('collect', async (button_interaction) => {
      switch (button_interaction.customId) {
        case "withdraw-yes":
          const request_record = await db.insert(request).values({
            type: "WITHDRAW",
            account: Number(interaction.options.getString("account")),
            amount: amount,
          }).returning({
            id: request.id,
            account: request.account,
            amount: request.amount,
          })
          if (!request_record[0]) {
            return interaction.editReply({
              components: [
                criticalErrorComponent(
                  "An error occured while inserting deposit request to the database",
                )
              ]
            })
          }
          console.log(request_record[0])
          const confirmation = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder()
                .setContent("# ✅ Request Created"),
              new TextDisplayBuilder()
                .setContent("Your deposit request has been submitted sucessfully.")
            )
            .addSeparatorComponents(sep => sep)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                "## Withdrawal Details"
              ),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `**Target Account**: ${getAccountInformation?.accountNickname} (${format_account_numbers(getAccountInformation?.id)})`
              ),
              new TextDisplayBuilder().setContent(
                `**Amount**: ${format_amounts(amount)}`
              ),
            )
            .addSeparatorComponents(sep => sep.setDivider(false))
            .addTextDisplayComponents(
              new TextDisplayBuilder()
                .setContent("-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust.")
            )
          if (interaction.channel?.type == ChannelType.DM) {
            interaction.editReply({
              components: [
                confirmation
              ]
            })
          } else {
            await interaction.editReply({
              components: [
                confirmation
              ]
            })
            await interaction.user.send({
              components: [
                confirmation
              ],
              flags: ["IsComponentsV2", "SuppressNotifications"]
            })
          }
          const tx_request_channel = await interaction.guild?.channels.fetch("1399831917095813180")
          if (tx_request_channel && tx_request_channel.isTextBased() && tx_request_channel.isSendable()) {
            const accept_button = new ButtonBuilder()
                .setCustomId(`approve-request`)
                .setEmoji("✅")
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success)
            const reject_button = new ButtonBuilder()
                .setCustomId(`reject-request`)
                .setEmoji("✖️")
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger)
            const button_row = new ActionRowBuilder<ButtonBuilder>().addComponents(accept_button, reject_button)
            await tx_request_channel.send({
              embeds: [
                defaultEmbed({
                  title: "New Withdrawal Request",
                  description: "A new **withdraw** request has been made",
                  fields: [
                    { name: "Transaction ID", value: request_record[0].id },
                    { 
                      name: "Account", 
                      value: `${getAccountInformation.accountNickname} (${request_record[0].account ? format_account_numbers(request_record[0].account) : "N/A"})`
                    },
                    { name: "Amout", value: format_amounts(request_record[0].amount) },
                  ],
                  type: EmbedType.Rich,
                  author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL() || 'https://placehold.co/512'
                  }
                })
              ],
              components: [button_row],
            })
          }
          break;
        case "withdraw-no":
          collector.stop()
          interaction.editReply({
            components: [
              new ContainerBuilder()
                .addTextDisplayComponents(
                  new TextDisplayBuilder()
                    .setContent("# ❌ Request Canceled."),
                  new TextDisplayBuilder()
                    .setContent("You have canceled your deposit request.")
                )
                .addSeparatorComponents(sep => sep.setDivider(false))
                .addTextDisplayComponents(
                  new TextDisplayBuilder()
                    .setContent("-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust.")
                )
            ]
          })
        break;
      }
    })
    collector.on('end', (_, reason) => {
      if (reason == "time") {
        interaction.deleteReply()
      }
      yesButton.setDisabled(true),
      noButton.setDisabled(true)
    })
  }
}