import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { Colors, ComponentType, MessageFlags } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { db } from '../utils/drizzle';
import { tx_init } from '../utils/functions';

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'approve-request' && interaction.customId !== 'reject-request') return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.customId == 'approve-request') {
        const embed = interaction.message.embeds[0]
        const tx_id = embed?.fields[0]?.value
        if (!tx_id) return interaction.reply({ content: ":x: An error occured while doing this transaction. Transaction ID cannot be found.", flags: ["Ephemeral"] })
        const tx_lookup = await db.query.request.findFirst({
            where(fields, operators) {
                return operators.eq(fields.id, tx_id)
            },
        })
        if (!tx_lookup) return interaction.reply({ content: ":x: An error occured while doing this transaction. Transaction cannot be found.", flags: ["Ephemeral"] })
        switch (tx_lookup?.type) {
            case 'DEPOSIT':
                const lookup_account_deposit = await db.query.accountTable.findFirst({
                    where(fields, operators) {
                        return operators.eq(fields.id, tx_lookup.account)
                    },
                })
                if (!lookup_account_deposit || !lookup_account_deposit.primaryOwner) return interaction.reply({ content: ":x: An error occured while doing this transaction. Recieving account cannot be found.", flags: ["Ephemeral"] })
                const lookup_client_deposit = await db.query.clientsTable.findFirst({
                    where(fields, operators) {
                        return operators.eq(fields.id, lookup_account_deposit.primaryOwner ?? -1)
                    },
                })

                if (lookup_client_deposit) {
                    const user = await interaction.client.users.fetch(lookup_client_deposit.discordId)
                    if (!user)return interaction.reply({ content: ":x: An error occured while doing this transaction. Bot cannot fetch user to send transaction reciept!", flags: ["Ephemeral"] })
                    await tx_init('CREDIT', "MANUAL DEPOSIT - DISCORD", tx_lookup.amount, tx_lookup.account, user)
                    user.send({
                        components: [
                            {
                                type: ComponentType.Container,
                                accentColor: Colors.Green,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# :white_check_mark: Deposit Approved"
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "Your **deposit** request has been approved by a bank teller. A transaction reciept about the transaction should be sent alongside this message."
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
                                ]
                            }
                        ],
                        flags: ["IsComponentsV2"]
                    })
                }
                break;
            case 'WITHDRAW':
                const lookup_account_withdraw = await db.query.accountTable.findFirst({
                    where(fields, operators) {
                        return operators.eq(fields.id, tx_lookup.account)
                    },
                })
                if (!lookup_account_withdraw) return interaction.reply({ content: ":x: An error occured while doing this transaction. Recieving account cannot be found.", flags: ["Ephemeral"] })
                const lookup_client_withdraw = await db.query.clientsTable.findFirst({
                    where(fields, operators) {
                        return operators.eq(fields.id, lookup_account_withdraw.primaryOwner)
                    },
                })

                if (lookup_client_withdraw) {
                    const user = await interaction.client.users.fetch(lookup_client_withdraw.discordId)
                    if (!user)return interaction.reply({ content: ":x: An error occured while doing this transaction. Bot cannot fetch user to send transaction reciept!", flags: ["Ephemeral"] })
                    await tx_init('DEBIT', "MANUAL WITHDRAWAL - DISCORD", tx_lookup.amount, tx_lookup.account, user)
                    user.send({
                        components: [
                            {
                                type: ComponentType.Container,
                                accentColor: Colors.Green,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# :white_check_mark: Withdrawal Approved"
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "Your **withdraw** request has been approved by a bank teller. A transaction reciept about the transaction should be sent alongside this message."
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
                                ]
                            }
                        ],
                        flags: ["IsComponentsV2"]
                    })
                }
                break;
        }
        interaction.reply({ content: "✅ Transaction has been approved and user has been notified.", flags: ["Ephemeral"] })
        interaction.message.delete()
    } else if (interaction.customId == 'reject-request') {
        const embed = interaction.message.embeds[0]
        const tx_id = embed?.fields[0]?.value
        if (!tx_id) return interaction.reply({ content: ":x: An error occured while doing this transaction. Transaction ID cannot be found.", flags: ["Ephemeral"] })
        const tx_lookup = await db.query.request.findFirst({
            where(fields, operators) {
                return operators.eq(fields.id, tx_id)
            },
        })
        if (!tx_lookup) return interaction.reply({ content: ":x: An error occured while doing this transaction. Transaction cannot be found.", flags: ["Ephemeral"] })
        const reject_account = await db.query.accountTable.findFirst({
            where(fields, operators) {
                return operators.eq(fields.id, tx_lookup.account)
            },
        })
        if (!reject_account || !reject_account.primaryOwner) return interaction.reply({ content: ":x: An error occured while doing this transaction. Recieving account cannot be found.", flags: ["Ephemeral"] })
        const reject_client = await db.query.clientsTable.findFirst({
            where(fields, operators) {
                return operators.eq(fields.id, reject_account.primaryOwner)
            },
        })

        if (reject_account) {
            const user = await interaction.client.users.fetch(reject_client.discordId)
            user.send({
                components: [
                    {
                        type: ComponentType.Container,
                        accentColor: Colors.Red,
                        components: [
                            {
                                type: ComponentType.TextDisplay,
                                content: "# :white_check_mark: Transaction Rejected"
                            },
                            {
                                type: ComponentType.TextDisplay,
                                content: `Your **${tx_lookup.type.toLowerCase()}** request has been approved by a bank teller. A transaction reciept about the transaction should be sent alongside this message.`
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
                        ]
                    }
                ],
                flags: ["IsComponentsV2"]
            })
        }
    }
  }
}