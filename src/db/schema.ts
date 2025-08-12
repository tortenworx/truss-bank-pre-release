import { relations, sql } from "drizzle-orm";
import { boolean, primaryKey, text, date, integer, pgTable, varchar, pgEnum, json, numeric, uuid, timestamp } from "drizzle-orm/pg-core";

export const ProductTypeEnum = pgEnum("productType", ["SA", "CA", "CD", "HL", "BL", "PL"])
export const TXTypeEnum = pgEnum("txType", ["CREDIT", "DEBIT"])
export const ReqType = pgEnum("reqType", ["DEPOSIT", "WITHDRAW"])

export const clientsTable = pgTable("clients", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  discordId: text().notNull().unique(),
  minecraftIGN: varchar({ length: 16 }).notNull().unique(),
  date_created: timestamp().default(sql`now()`)
})

export const accountTable = pgTable("accounts", {
  id: integer().primaryKey(),
  accountNickname: varchar({ length: 64 }).notNull(),
  balance: numeric({ mode: 'number', precision: 10, scale: 2 }).default(0).notNull(),
  product: integer("product_id").notNull().references(() => productsTable.id),
  primaryOwner: integer("mainOwnerId").references(() => clientsTable.id),
  date_created: timestamp().default(sql`now()`),
  frozen: boolean().default(false).notNull()
})

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  emoji: varchar({ length: 1 }).default("💵").notNull(),
  name: text().notNull().unique(),
  description: varchar({ length: 256 }),
  type: ProductTypeEnum().default("CA").notNull(),
  chargesMatrix: json().notNull()
})

export const accountsRelations = relations(accountTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [accountTable.product],
    references: [productsTable.id],
  }),
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  accounts: many(accountTable),
}));


export const transaction = pgTable("transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  description: varchar({ length: 64 }),
  type: TXTypeEnum().default("DEBIT"),
  amount: numeric({ mode: 'number', precision: 10, scale: 2 }).notNull(),
  account: integer("accountId").references(() => accountTable.id),
  date_created: timestamp().default(sql`now()`)
})

export const request = pgTable("request", {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  type: ReqType().default("DEPOSIT").notNull(),
  amount: numeric({ mode: 'number', precision: 10, scale: 2 }).default(0).notNull(),
  attachment: text(),
  account: integer("accountId").references(() => accountTable.id),
  date_created: timestamp().default(sql`now()`)
})

export const quickDeps = pgTable("quick_deposits", {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  messageId: text(),
  account: integer("accountId").references(() => accountTable.id),
  date_created: timestamp().default(sql`now()`)
})