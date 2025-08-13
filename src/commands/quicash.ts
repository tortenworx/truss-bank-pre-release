import { ApplicationCommandRegistry, Command, type Awaitable, type ContextMenuCommand } from "@sapphire/framework";
import { ActionRowBuilder, ApplicationCommandType, Colors, ComponentBuilder, ComponentType, ContainerBuilder, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, SelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuComponent, TextDisplayBuilder } from "discord.js";
import { db } from "../utils/drizzle";
import { tx_init } from "../utils/functions";
import { quickDeps } from "../db/schema";
import { criticalErrorEmbed } from "../utils/embeds";

export class QuikDep extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerContextMenuCommand((builder) => {
            builder
                .setName("QuiCash")
                .setType(ApplicationCommandType.Message)
        })
    }

    public async contextMenuRun(interaction: ContextMenuCommandInteraction, context: ContextMenuCommand.RunContext): Promise<unknown> {
        const invalid = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "# :x: This message is not valid."
                ),
                new TextDisplayBuilder().setContent(
                    "The message you're submitting as deposit proof is not a valid PostmanPat confirmation message."
                )
            )

            new ContainerBuilder({
                accent_color: Colors.Red
            })
        if (interaction.isMessageContextMenuCommand()) {
            const message = interaction.targetMessage
            await interaction.deferReply({ flags: "Ephemeral" });
            const quickdep_search = await db.query.quickDeps.findFirst({
                where(fields, operators) {
                    return operators.eq(fields.messageId, message.id)
                },
            })
            const user_exist = await db.query.clientsTable.findFirst({
                where(fields, operators) {
                    return operators.eq(fields.discordId, interaction.user.id)
                },
            })

            if (!user_exist) return interaction.editReply({ embeds: [criticalErrorEmbed({ title: "No account registered", description: "You have not registed your account with TRUSS Bank, do `/kyc` to get started!" })] })
            // A but ton of checks to prevent fraud
            if (!message.interactionMetadata) return interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (quickdep_search) return interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] })
            if (message.interactionMetadata.user.id !== interaction.user.id) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (message.createdTimestamp)
            if (message.author.id !== process.env.SERVER_BOT_ID) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (!message.embeds[0]) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (!message.embeds[0].footer) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (!message.embeds[0].title) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (!message.embeds[0].description) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (message.embeds[0].footer.text !== "Powered by PostmanPat") return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (message.embeds[0].color !== 65280) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] });
            if (Date.now() - message.createdAt.getDate() > 3600000) return await interaction.editReply({ components: [invalid.addTextDisplayComponents(new TextDisplayBuilder().setContent("PostmanPat transactions that are three hours old are not accepted. Please do /deposit instead."))], flags: ["IsComponentsV2"] });
            const embedTitle = message.embeds[0].title
            const embedDescription = message.embeds[0].description
            const splicedTitle = embedTitle?.split(" ")
            const splicedDescription = embedDescription?.split(" ")
            const titleFirm = splicedTitle[2]
            const titleIGN = splicedTitle[0]
            const amount = splicedDescription[3]
            const descriptionFirm = splicedDescription[5]
            const sanitizedAmount = amount?.substring(1)

            if (titleFirm !== descriptionFirm || titleFirm !== process.env.FIRM_NAME || descriptionFirm !== process.env.FIRM_NAME) {
                return await interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(Colors.Red)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    "# :x: Please send your deposits to `TRUSS`"
                                ),
                                new TextDisplayBuilder().setContent(
                                    "The recipient of your transaction is either not a firm or not to `TRUSS`. Please check your deposit, then try again."
                                )
                            )
                            .addSeparatorComponents(sep => sep.setDivider(false))
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    "-# <:trusslogo:1385531441726885999> Build the future, with us."
                                )
                            )
                    ],
                    flags: ["IsComponentsV2"]
                })
            }

            const findUser = await db.query.clientsTable.findFirst({
                where(fields, operators) {
                    return operators.eq(fields.discordId, interaction.user.id)
                },
            })
            if (findUser?.minecraftIGN !== titleIGN) return await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] })
            if (findUser) {
                const accounts = await db.query.accountTable.findMany({
                    where(fields, operators) {
                        return operators.eq(fields.primaryOwner, findUser.id)
                    },
                    with: {
                        product: true
                    }
                })

                const account_select = new ActionRowBuilder<any>().addComponents(
                                    new StringSelectMenuBuilder({
                                        customId: `quickdep-${interaction.user.id}`,
                                        maxValues: 1,
                                        minValues: 1,
                                        options: accounts.map((account) => {
                                            return { label: account.accountNickname, value: account.id.toString(), description: `A ${account.product.name} account` }
                                        })
                                    })
                                )

                const reply = await interaction.editReply({
                    components: [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    "# Select an account"
                                ),
                                new TextDisplayBuilder().setContent(
                                    `Select where you would like your ${amount} be deposited into.`
                                )
                            ).addActionRowComponents(
                                account_select
                            )
                    ],
                    flags: ["IsComponentsV2"]
                })
                const collector = reply.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: (i) => i.customId === `quickdep-${interaction.user.id}`,
                    max: 1,
                    time: 120000
                })

                collector.on('collect', async (intr) => {
                    const account = intr.values[0]
                    await db.insert(quickDeps).values({
                        account: Number(account),
                        messageId: message.id
                    })
                    await tx_init("CREDIT", "QUICDEP TRANSACTION",Number(amount?.substring(1)), Number(account), interaction.user)
                    await interaction.editReply({
                        components: [
                            new ContainerBuilder({
                                accent_color: Colors.Gold,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Transaction Completed!"
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "This transaction has been deposted to your account, a confirmation reciept should be sent to your DM's shortly."
                                    },
                                    {
                                        type: ComponentType.Separator,
                                        spacing: 2,
                                        divider: false
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                                    }
                                ],
                                type: ComponentType.Container
                            })
                        ],
                        flags: ["IsComponentsV2"]
                    })
                })

                collector.on('end', (_, reason) => {
                    console.log(reason)
                    if (reason == "time") {
                        interaction.deleteReply()
                    }
                })
            } else { 
                await interaction.editReply({ components: [invalid], flags: ["IsComponentsV2"] })
            }
        }
    }
}

