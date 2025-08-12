import { Args, Command } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import accountCreationFunction from '../handlers/account/create';
import accountsListFunction from '../handlers/account/list';
import accountInfoFunction from '../handlers/account/info';
import accountsTransactionsFunction from '../handlers/account/transactions';


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
                        .setName("account")
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
                        .setName("account")
                        .setDescription("The list of your current active accounts")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    );
  }

  public async accountsList(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {
    return await accountsListFunction(interaction)
  }

  public async accountsCreate(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {
    return await accountCreationFunction(interaction)
  }


  public async accountsInfo(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {
    return await accountInfoFunction(interaction)
  }

  public async accountsTransactions(interaction: Subcommand.ChatInputCommandInteraction, args: Args) {
    return await accountsTransactionsFunction(interaction)
  }

}