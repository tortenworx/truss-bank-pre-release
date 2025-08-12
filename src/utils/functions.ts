import { Colors, ComponentType, ContainerBuilder, TextDisplayBuilder, type User } from "discord.js"
import numbro from "numbro"
import { db } from "./drizzle"
import { accountTable, transaction } from "../db/schema"
import { eq, sql } from "drizzle-orm"
import { SeparatorSpacingSize } from "discord.js"

export function generate_random_characters(length: number): string {
    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    let result = ''
    for (let i=0; i < length; i++) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return result
}

export const format_account_numbers = (acct?: number) => acct ? acct.toString().trim().replace(/(\d{4})(\d{4})/, "$1-$2") : "N/A"
export const format_amounts = (amount: number) => numbro(amount).formatCurrency({ currencySymbol: '£', currencyPosition: 'prefix', thousandSeparated: true })
export const get_catbox_file = (url: string) => url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[1]

export async function tx_init(type: "CREDIT" | "DEBIT", description: string, amount: number, account: number, user?: User) {
    switch (type) {
        case "CREDIT":
            await db.transaction(async (tx) => {
                await tx.update(accountTable).set({ balance: sql`${accountTable.balance} + ${amount}` }).where(eq(accountTable.id, account))
                const transaction_record = await tx.insert(transaction).values({
                    amount: amount,
                    description: description,
                    type: 'CREDIT',
                    account: account,
                }).returning()
                const tx_info = transaction_record[0]
                if (!tx_info) {
                    tx.rollback()
                    throw new Error("An error occured while recording the transaction!")
                }
                if (user) {
                    user.send({
                        components: [
                            new ContainerBuilder({
                                accent_color: Colors.Gold,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Transaction Receipt"
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `Your recent transaction with the id of \`${transaction_record[0]?.id}\` has been completed successfully. Here are the details below.`
                                    },
                                    {
                                        type: ComponentType.Separator,
                                        divider: true,
                                        spacing: SeparatorSpacingSize.Small
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `**Transaction Type**: ${tx_info.type}\n**Account**: ${tx_info.account?format_account_numbers(tx_info.account):"N/A"}\n**Amount**: ${format_amounts(tx_info.amount)}\n**Transaction Date**: <t:${Math.floor(tx_info.date_created?.getTime()/1000)}>`
                                    },
                                    {
                                        type: ComponentType.Separator,
                                        divider: false,
                                        spacing: SeparatorSpacingSize.Large
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                                    },
                                ],
                                type: ComponentType.Container
                            })
                        ],
                        flags: ["IsComponentsV2"]
                    })
                }
            })
            break;
        case "DEBIT":
            await db.transaction(async (tx) => {
                await tx.update(accountTable).set({ balance: sql`${accountTable.balance} - ${amount}` }).where(eq(accountTable.id, account))
                const transaction_record = await tx.insert(transaction).values({
                    amount: amount,
                    description: description,
                    type: 'DEBIT',
                    account: account,
                }).returning()
                const tx_info = transaction_record[0]
                if (!tx_info) {
                    tx.rollback()
                    throw new Error("An error occured while recording the transaction!")
                }
                if (user) {
                    user.send({
                        components: [
                            new ContainerBuilder({
                                accent_color: Colors.Gold,
                                components: [
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "# Transaction Receipt"
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `Your recent transaction with the id of \`${transaction_record[0]?.id}\` has been completed successfully. Here are the details below.`
                                    },
                                    {
                                        type: ComponentType.Separator,
                                        divider: true,
                                        spacing: SeparatorSpacingSize.Small
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: `**Transaction Type**: ${tx_info.type}\n**Account**: ${tx_info.account?format_account_numbers(tx_info.account):"N/A"}\n**Amount**: ${format_amounts(tx_info.amount)}\n**Transaction Date**: <t:${Math.floor(tx_info.date_created?.getTime()/1000)}>`
                                    },
                                    {
                                        type: ComponentType.Separator,
                                        divider: false,
                                        spacing: SeparatorSpacingSize.Large
                                    },
                                    {
                                        type: ComponentType.TextDisplay,
                                        content: "-# <:trusslogo:1385531441726885999> TRUSS Bank - The bank you can trust."
                                    },
                                ],
                                type: ComponentType.Container
                            })
                        ],
                        flags: ["IsComponentsV2"]
                    })
                }
            })
            break;
    }
}

export function format_account_type(type: string) {
    switch (type) {
        case "CA":
            return "Checking"
        case "SA":
            return "Savings"
        case "CD":
            return "Deposit Certificate"
        case "HL":
            return "Mortgage"
        case "PL":
            return "Personal Loan"
        case "BL":
            return "Business Loan"
        default:
            return null;
    }
}