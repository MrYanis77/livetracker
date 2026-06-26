import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI manquant dans le fichier .env");
  process.exit(1);
}

// Collections to seed from the JSON (keys that map to MongoDB collections)
const COLLECTIONS_TO_SEED = [
  "teams",
  "players",
  "matches",
  "stadiums",
  "supporters",
  "fanVotes",
  "matchEvents",
  "voteEvents",
];

async function seed() {
  console.log("🔌 Connexion à MongoDB...");
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connecté à MongoDB");

    const db = client.db(); // uses the DB name from the URI (livematch)
    console.log(`📦 Base de données : ${db.databaseName}`);

    // Load JSON data
    const dataPath = join(__dirname, "..", "data", "worldcup_data.json");
    const rawData = readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    for (const collectionName of COLLECTIONS_TO_SEED) {
      const documents = data[collectionName];

      if (!documents || !Array.isArray(documents)) {
        console.log(`⚠️  Collection "${collectionName}" absente ou vide dans le JSON, ignorée.`);
        continue;
      }

      // Drop existing collection to avoid duplicates on re-run
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length > 0) {
        await db.collection(collectionName).drop();
        console.log(`🗑️  Collection "${collectionName}" supprimée (reset)`);
      }

      // Insert documents
      const result = await db.collection(collectionName).insertMany(documents);
      console.log(`✅ "${collectionName}" → ${result.insertedCount} documents insérés`);
    }

    console.log("\n🎉 Seed terminé avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du seed :", err);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

seed();
