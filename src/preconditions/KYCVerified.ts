import { Precondition, type ChatInputCommand } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { db } from '../utils/drizzle';


export class KYCVerified extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction, command: ChatInputCommand, context: Precondition.Context): Precondition.AsyncResult {
        return this.checkIfUserIsKYC(interaction.user.id)
    }

    private async checkIfUserIsKYC(userId: string): Precondition.AsyncResult {
        const data = await db.query.clientsTable.findFirst({
            where(fields, operators) {
                return operators.eq(fields.discordId, userId)
            },
        })
        return data ? this.ok() : this.error({ identifier: "No account registered", message: "You have not registed your account with TRUSS Bank, do `/kyc` to get started!" })
    }
}