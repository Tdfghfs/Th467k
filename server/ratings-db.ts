import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ratings, Rating, InsertRating } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Add or update a rating for a message
 */
export async function rateMessage(
  messageId: number,
  userId: number,
  rating: "like" | "dislike"
): Promise<Rating> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if rating already exists
  const existing = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.messageId, messageId), eq(ratings.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing rating
    await db
      .update(ratings)
      .set({ rating })
      .where(and(eq(ratings.messageId, messageId), eq(ratings.userId, userId)));
    
    const updated = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.messageId, messageId), eq(ratings.userId, userId)))
      .limit(1);
    
    return updated[0];
  } else {
    // Insert new rating
    const result = await db.insert(ratings).values({
      messageId,
      userId,
      rating,
    });

    const created = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, result[0].insertId))
      .limit(1);

    return created[0];
  }
}

/**
 * Get rating for a specific message by user
 */
export async function getUserMessageRating(
  messageId: number,
  userId: number
): Promise<Rating | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.messageId, messageId), eq(ratings.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get rating statistics for a message
 */
export async function getMessageRatingStats(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allRatings = await db
    .select()
    .from(ratings)
    .where(eq(ratings.messageId, messageId));

  const likes = allRatings.filter((r) => r.rating === "like").length;
  const dislikes = allRatings.filter((r) => r.rating === "dislike").length;

  return {
    likes,
    dislikes,
    total: allRatings.length,
  };
}

/**
 * Remove a rating
 */
export async function removeRating(messageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(ratings)
    .where(and(eq(ratings.messageId, messageId), eq(ratings.userId, userId)));
}
