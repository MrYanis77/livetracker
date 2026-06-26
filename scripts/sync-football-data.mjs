import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { connectDB, closeDB } from "../server/config/db.mjs";
import { syncFootballData } from "../server/services/footballDataSync.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

async function main() {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    console.error("❌ FOOTBALL_DATA_API_KEY manquant dans .env");
    console.error("   Inscrivez-vous sur https://www.football-data.org/client/register");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI manquant dans .env");
    process.exit(1);
  }

  console.log("⚽ Sync football-data.org → MongoDB\n");

  try {
    await connectDB();
    const stats = await syncFootballData({
      fetchMatchDetails: true,
      matchDetailLimit: 10,
    });

    console.log("\n🎉 Sync terminée !");
    console.log(JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error("❌ Erreur sync:", err.message);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

main();
