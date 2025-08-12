import type { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Colors, ComponentType, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { format_account_numbers, tx_init } from "../utils/functions";
import { db } from "../utils/drizzle";

export class AccountsCommand extends Subcommand {
  public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
        ...options,
        name: "transfer",
        preconditions: ["KYCVerified"],
        cooldownDelay: 5000,
        subcommands: [
            {
                name: "others",
                chatInputRun: 'transferOthers',
            },
            {
                name: "self",
                chatInputRun: 'transferPersonal',
                default: true
            },
            {
                name: "interbank",
                chatInputRun: 'transferInterbank',
            },
        ],
        
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("transfer")
        .setDescription("Transfer money from your accounts.")
        .addSubcommand((command) => 
            command
                .setName("self")
                .setDescription("Transfer money between your accounts.")
                .addStringOption((option) => 
                    option
                        .setName("from_account")
                        .setDescription("Where your money you will send the money from")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption((option) => 
                    option
                        .setName("to_account")
                        .setDescription("Where your money you will send the money to")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addNumberOption((option) => 
                    option
                        .setName('amount')
                        .setDescription("The amount for this transfer")
                        .setRequired(true)
                )
        ).addSubcommand((command) => 
            command
                .setName("others")
                .setDescription("Transfer money to accounts by other people.")
                .addStringOption((option) => 
                    option
                        .setName("from_account")
                        .setDescription("Where your money you will send the money from")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption((option) => 
                    option
                        .setName("to_account")
                        .setDescription("Where your money you will send the money to")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addNumberOption((option) => 
                    option
                        .setName('amount')
                        .setDescription("The amount for this transfer")
                        .setRequired(true)
                )
        ).addSubcommand((command) => 
            command
                .setName("interbank")
                .setDescription("Transfer money from your account to a account on another bank.")
        ),
    );
  }

  public async transferPersonal(interaction: Subcommand.ChatInputCommandInteraction) {
    const get_from = interaction.options.getString("from_account")
    const get_to = interaction.options.getString("to_account")
    const get_amount = interaction.options.getNumber("amount")

    const err_container = new ContainerBuilder({
        accent_color: Colors.Red,
        components: [
            { type: ComponentType.TextDisplay, content: "# :x: An unexpected error occured." },
            { type: ComponentType.TextDisplay, content: "An error has occured while running this command, this error is unexpected. If error persists, do /support." },
        ]
    })

    if (!get_amount) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_from) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_to) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });

    const get_from_account = await db.query.accountTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, Number(get_from))
        },
    })
    const get_to_account = await db.query.accountTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, Number(get_to))
        },
    })
    if (!get_from_account) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_to_account) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });

    if (get_from_account?.balance < get_amount) return interaction.reply({
        components: [
            new ContainerBuilder({ accent_color: Colors.Red }).addTextDisplayComponents(
                new TextDisplayBuilder().setContent("# :x: Balance too low!"),
                new TextDisplayBuilder().setContent("You do not have enough balance to do this transaction. Do `/deposit` or use QuiCash to top up your account!"),
            )
        ],
        flags: ["Ephemeral", "IsComponentsV2"]
    })

    await tx_init("DEBIT", `FUND TRANSFER TO ACCOUNT - ${format_account_numbers(Number(get_to))}`, get_amount, Number(get_from), interaction.user)
    await tx_init("CREDIT", `FUND TRANSFER FROM ACCOUNT - ${format_account_numbers(Number(get_from))}`, get_amount, Number(get_to), interaction.user)

    return await interaction.reply({
        components: [
            {
                type: ComponentType.Container,
                accent_color: Colors.Green,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "# :white_check_mark: Transaction completed!"
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: `Your account transfer to ${format_account_numbers(Number(get_to))} has been completed successfuly. Transaction reciepts should be sent to your Direct Messages shortly.`
                    },
                    {
                        type: ComponentType.Separator,
                        divider: false
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                    }
                ]
            }
        ],
        flags: ["Ephemeral", "IsComponentsV2"]
    })

  }

  public async transferOthers(interaction: Subcommand.ChatInputCommandInteraction) {
    const get_from = interaction.options.getString("from_account")
    const get_to = interaction.options.getString("to_account")
    const get_amount = interaction.options.getNumber("amount")

    const err_container = new ContainerBuilder({
        accent_color: Colors.Red,
        components: [
            { type: ComponentType.TextDisplay, content: "# :x: An unexpected error occured." },
            { type: ComponentType.TextDisplay, content: "An error has occured while running this command, this error is unexpected. If error persists, do /support." },
        ]
    })

    if (!get_amount) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_from) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_to) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });

    const get_from_account = await db.query.accountTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, Number(get_from))
        },
    })
    const get_to_account = await db.query.accountTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, Number(get_to))
        },
    })
    if (!get_from_account) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    if (!get_to_account) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });
    const get_to_client = await db.query.clientsTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, get_to_account?.primaryOwner)
        },
    })
    if (!get_to_client || get_to_account.primaryOwner !== get_to_client.id) return interaction.reply({ components: [err_container], flags: ["Ephemeral", "IsComponentsV2"] });

    const get_to_user = await interaction.client.users.fetch(get_to_client?.discordId)

    if (get_from_account?.balance < get_amount) return interaction.reply({
        components: [
            new ContainerBuilder({ accent_color: Colors.Red }).addTextDisplayComponents(
                new TextDisplayBuilder().setContent("# :x: Balance too low!"),
                new TextDisplayBuilder().setContent("You do not have enough balance to do this transaction. Do `/deposit` or use QuiCash to top up your account!"),
            )
        ],
        flags: ["Ephemeral", "IsComponentsV2"]
    })

    await tx_init("DEBIT", `FUND TRANSFER TO ACCOUNT - ${format_account_numbers(Number(get_to))}`, get_amount, Number(get_from), interaction.user)
    await tx_init("CREDIT", `FUND TRANSFER FROM ACCOUNT - ${format_account_numbers(Number(get_from))}`, get_amount, Number(get_to), get_to_user)

    return await interaction.reply({
        components: [
            {
                type: ComponentType.Container,
                accent_color: Colors.Green,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "# :white_check_mark: Transaction completed!"
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: `Your account transfer to ${format_account_numbers(Number(get_to))} has been completed successfuly. Transaction reciepts should be sent to your Direct Messages shortly.`
                    },
                    {
                        type: ComponentType.Separator,
                        divider: false
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                    }
                ]
            }
        ],
        flags: ["Ephemeral", "IsComponentsV2"]
    })
  }

  public async transferInterbank(interaction: Subcommand.ChatInputCommandInteraction) {
    return await interaction.reply({
        components: [
            {
                type: ComponentType.Container,
                accent_color: Colors.DarkGold,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "# This command is not available yet."
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: "Due to obvious reasons (there is no other Discord based banks except for us), interbank fund transfers are currently unavailable. We will update you if we are implementing this feature on a later date."
                    },
                    {
                        type: ComponentType.Separator,
                        divider: false
                    },
                    {
                        type: ComponentType.TextDisplay,
                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                    },
                ]
            }
        ],
        flags: ["Ephemeral", "IsComponentsV2"]
    })
  }
}