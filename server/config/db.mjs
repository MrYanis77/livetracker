import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI manquant dans le fichier .env");
  process.exit(1);
}

let client;
let db;

/**
 * Connexion à MongoDB (singleton)
 * @returns {import("mongodb").Db}
 */
export async function connectDB() {
  if (db) return db;

  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(); // "livematch" depuis l'URI
  console.log(`✅ MongoDB connecté → base "${db.databaseName}"`);
  return db;
}

/**
 * Récupère la base de données (doit être connecté d'abord)
 * @returns {import("mongodb").Db}
 */
export function getDB() {
  if (!db) throw new Error("Base de données non connectée. Appelez connectDB() d'abord.");
  return db;
}

/**
 * Ferme la connexion MongoDB
 */
export async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log("🔌 Connexion MongoDB fermée");
  }
}
