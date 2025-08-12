import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { db } from '../utils/drizzle';
import { eq } from 'drizzle-orm';
import { format_account_numbers, format_account_type } from '../utils/functions';

export class AutocompleteHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    // Get the focussed (current) option
    const focusedOption = interaction.options.getFocused(true);

    // Ensure that the option name is one that can be autocompleted, or return none if not.
    switch (focusedOption.name) {
      case 'account':
        const userId = await interaction.user.id
        // Search your API or similar. This is example code!
        const userAccount = await db.query.clientsTable.findFirst({
            where(fields, operators) {
              return operators.eq(fields.discordId, userId)
            },
        })

        if (!userAccount) return this.none();
        const searchResult = await db.query.accountTable.findMany({
          where(fields, operators) {
            return operators.and(operators.eq(fields.primaryOwner, userAccount?.id), operators.eq(fields.frozen, false))
          },
          with: {
            product: true
          }
        })

        if (searchResult.length <= 0) return this.none()

        // Map the search results to the structure required for Autocomplete
        return this.some(searchResult.map((match) => ({ name: `${format_account_type(match.product.type)} - ${match.accountNickname}`, value: match.id.toString() })));
      case 'from_account':
        const uid = await interaction.user.id
        // Search your API or similar. This is example code!
        const uacc = await db.query.clientsTable.findFirst({
            where(fields, operators) {
              return operators.eq(fields.discordId, uid)
            },
        })

        if (!uacc) return this.none();
        const res = await db.query.accountTable.findMany({
          where(fields, operators) {
            return operators.and(operators.eq(fields.primaryOwner, uacc?.id), operators.eq(fields.frozen, false))
          },
          with: {
            product: true
          }
        })

        if (res.length <= 0) return this.none()

        // Map the search results to the structure required for Autocomplete
        return this.some(res.map((match) => ({ name: `${format_account_type(match.product.type)} - ${match.accountNickname}`, value: match.id.toString() })));
      case 'to_account':
        const userid = await interaction.user.id
        if (interaction.options.getSubcommand() == "self") {
          const selected_acc = await interaction.options.getString("from_account")
          // Search your API or similar. This is example code!
          const uac = await db.query.clientsTable.findFirst({
              where(fields, operators) {
                return operators.eq(fields.discordId, userid)
              },
          })

          if (!uac) return this.none();
          const result = await db.query.accountTable.findMany({
            where(fields, operators) {
              return operators.and(operators.eq(fields.primaryOwner, uac?.id), operators.eq(fields.frozen, false))
            },
            with: {
              product: true
            }
          })

          if (result.length <= 0) return this.none()
          const filteredResults = result.filter(acc => acc.id.toString() !== selected_acc);

          // Map the search results to the structure required for Autocomplete
          return this.some(filteredResults.map((match) => ({ name: `${format_account_type(match.product.type)} - ${match.accountNickname}`, value: match.id.toString() })));
        } else if (interaction.options.getSubcommand() == "others") {
          // Search your API or similar. This is example code!
          const uac = await db.query.clientsTable.findFirst({
              where(fields, operators) {
                return operators.eq(fields.discordId, userid)
              },
          })

          if (!uac) return this.none();
          const sender_account = await db.query.accountTable.findMany({
            where(fields, operators) {
              return operators.and(operators.eq(fields.primaryOwner, uac?.id), operators.eq(fields.frozen, false))
            },
            with: {
              product: true
            }
          })
          const result = await db.query.accountTable.findMany({
            where(fields, operators) {
              return operators.eq(fields.frozen, false)
            },
            with: {
              product: true
            }
          })

          if (result.length <= 0) return this.none()
          const excludedIds = new Set(sender_account.map(acc => acc.id.toString()));
          const filteredResults = result.filter(
            acc => !excludedIds.has(acc.id.toString())
          );

          // Map the search results to the structure required for Autocomplete
          return this.some(filteredResults.map((match) => ({ name: `${format_account_type(match.product.type)} - ${format_account_numbers(match.id)}`, value: match.id.toString() })));
        }
        break;
      default:
        return this.none();
    }
  }
}