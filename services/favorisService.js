// services/favorisService.js
// 🗄️ Gestion des favoris en SQLite local (expo-sqlite)
// Installation : npx expo install expo-sqlite

import * as SQLite from 'expo-sqlite';

// ── Ouvrir / créer la base de données ─────────────────────────────────────────
const db = SQLite.openDatabaseSync('evenix_favoris.db');

// ── Créer la table si elle n'existe pas ───────────────────────────────────────
export const initFavorisDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS favoris (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      idEvent     INTEGER NOT NULL UNIQUE,
      titreEvent  TEXT,
      typeEvent   TEXT,
      dateDebut   TEXT,
      villeEvent  TEXT,
      prix        TEXT,
      addedAt     TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Table favoris initialisée');
};

// ── Ajouter un favori ─────────────────────────────────────────────────────────
export const addFavori = (event) => {
  try {
    // Extraire le nomType si typeEvent est un objet
    const typeNom = typeof event.typeEvent === 'object'
      ? (event.typeEvent?.nomType || '')
      : (event.typeEvent || '');

    // Extraire le prix
    const prix = event.tarif?.prixNormal ?? event.tarif?.prix ?? null;
    const prixStr = prix === 0 ? 'Gratuit' : prix !== null ? `${prix} €` : '';

    db.runSync(
      `INSERT OR IGNORE INTO favoris (idEvent, titreEvent, typeEvent, dateDebut, villeEvent, prix)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.idEvent,
        event.titreEvent || '',
        typeNom,
        event.dateDebut || '',
        event.villeEvent || event.adresse?.ville || '',
        prixStr,
      ]
    );
    console.log('❤️ Favori ajouté :', event.titreEvent);
    return true;
  } catch (e) {
    console.error('Erreur addFavori:', e);
    return false;
  }
};

// ── Supprimer un favori ───────────────────────────────────────────────────────
export const removeFavori = (idEvent) => {
  try {
    db.runSync('DELETE FROM favoris WHERE idEvent = ?', [idEvent]);
    console.log('💔 Favori supprimé :', idEvent);
    return true;
  } catch (e) {
    console.error('Erreur removeFavori:', e);
    return false;
  }
};

// ── Vérifier si un événement est en favori ────────────────────────────────────
export const isFavori = (idEvent) => {
  try {
    const result = db.getFirstSync(
      'SELECT id FROM favoris WHERE idEvent = ?',
      [idEvent]
    );
    return result !== null && result !== undefined;
  } catch (e) {
    console.error('Erreur isFavori:', e);
    return false;
  }
};

// ── Récupérer tous les favoris ────────────────────────────────────────────────
export const getAllFavoris = () => {
  try {
    const rows = db.getAllSync(
      'SELECT * FROM favoris ORDER BY addedAt DESC'
    );
    return rows || [];
  } catch (e) {
    console.error('Erreur getAllFavoris:', e);
    return [];
  }
};

// ── Basculer favori (toggle) ──────────────────────────────────────────────────
export const toggleFavori = (event) => {
  if (isFavori(event.idEvent)) {
    removeFavori(event.idEvent);
    return false; // n'est plus favori
  } else {
    addFavori(event);
    return true;  // est maintenant favori
  }
};

// ── Compter les favoris ───────────────────────────────────────────────────────
export const countFavoris = () => {
  try {
    const result = db.getFirstSync('SELECT COUNT(*) as total FROM favoris');
    return result?.total || 0;
  } catch (e) {
    return 0;
  }
};