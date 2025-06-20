import { Precondition, type ChatInputCommand } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
const db = drizzle({ schema });


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
        return data ? this.ok() : this.error({ message: "You dont have not registed your account, do `/kyc` to get started!" })
    }
}