import { Args, Command } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, Message, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuOptionBuilder } from 'discord.js';
import { defaultEmbed } from '../utils/embeds';
import { db } from '../utils/drizzle';


export class AccountsCommand extends Subcommand {
  public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
        ...options,
        name: "accounts",
        preconditions: ["KYCVerified"],
        cooldownDelay: 5000,
        subcommands: [
            {
                name: "list",
                chatInputRun: 'accountsList',
            },
            {
                name: "create",
                chatInputRun: 'accountsCreate'
            },
            {
                name: "info",
                chatInputRun: 'accountsInfo',
                default: true
            },
            {
                name: "transactions",
                chatInputRun: 'accountsTransactions'
            },
        ],
        
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("accounts")
        .setDescription("Get information and actions for your deposit accounts")
        .addSubcommand((command) => command.setName("list").setDescription("List all accounts that you have been authorized to use"))
        .addSubcommand((command) => 
            command
                .setName("create")
                .setDescription("Create a new deposit account")
        ).addSubcommand((command) => 
            command
                .setName("info")
                .setDescription("Get information about your account")
                .addStringOption((option) => 
                    option
                        .setName("accounts")
                        .setDescription("The list of your current active accounts")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ).addSubcommand((command) => 
            command
                .setName("transactions")
                .setDescription("Get the latest transaction of your account")
                .addStringOption((option) => 
                    option
                        .setName("accounts")
                        .setDescription("The list of your current active accounts")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
        {
            idHints: ["1385698687077974179"]
        }
    );
  }

  public async accountsList(message: Message, args: Args) {}

  public async accountsCreate(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {
    const productsList = await db.query.productsTable.findMany({
        columns: {
            id: true,
            name: true,
            type: true,
            description: true,
            emoji: true
        }
    })
    console.log(productsList)
    const productsEmbed = defaultEmbed({
        title: "Select a product",
        description: "Pick one that fits your lifestyle needs!",
        fields: productsList.map((item) => {
            return {
                name: `**${item.emoji} ${item.name}**`,
                value: `Type: ${item.type}\n${item.description}`
            }
        })
    })
    const select = new StringSelectMenuBuilder()
			.setCustomId(interaction.id)
			.setPlaceholder('Select a product')
			.addOptions(productsList.map((item) => 
                new StringSelectMenuOptionBuilder()
                .setLabel(item.name)
                .setDescription(item.description ?? "No description")
                .setValue(item.name)
                .setEmoji(item.emoji)
            )
        );

	const row = new ActionRowBuilder()
			.addComponents(select);

    return interaction.reply({ 
        embeds: [productsEmbed], 
        components: [row]
    })
  }

  public async accountsInfo(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {}

  public async accountsTransactions(message: Message, args: Args) {}
}