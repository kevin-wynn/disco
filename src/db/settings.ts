import { db } from "./index";
import { settings } from "./schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = 1;

export const getSettings = async () => {
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.id, SETTINGS_ID));
  return result[0] || null;
};

export const getDiscogsApiToken = async (): Promise<string | null> => {
  const result = await getSettings();
  return result?.discogsApiToken || null;
};

export const setDiscogsApiToken = async (token: string) => {
  const existing = await getSettings();

  if (existing) {
    await db
      .update(settings)
      .set({ discogsApiToken: token })
      .where(eq(settings.id, SETTINGS_ID));
  } else {
    await db.insert(settings).values({
      id: SETTINGS_ID,
      discogsApiToken: token,
    });
  }
};
