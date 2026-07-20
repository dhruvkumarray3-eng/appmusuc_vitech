import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, lastLogin: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  songId: text("song_id").notNull(),
  songTitle: text("song_title").notNull(),
  songThumbnail: text("song_thumbnail"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true, addedAt: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type History = typeof historyTable.$inferSelect;

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  songId: text("song_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({ id: true, addedAt: true });
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favoritesTable.$inferSelect;

export const playlistTable = pgTable("playlist", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  songId: text("song_id").notNull(),
  songTitle: text("song_title").notNull(),
  songThumbnail: text("song_thumbnail"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertPlaylistSchema = createInsertSchema(playlistTable).omit({ id: true, addedAt: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type PlaylistItem = typeof playlistTable.$inferSelect;
