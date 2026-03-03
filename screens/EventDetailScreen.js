// screens/EventDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../services/api';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;

  const [evenement, setEvenement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participerLoading, setParticiperLoading] = useState(false);

  useEffect(() => {
    chargerDetail();
  }, []);

  // ─── Charger le détail depuis l'API ───────────────────────────────────────
  const chargerDetail = async () => {
    try {
      setError('');
      const response = await fetch(`${BASE_URL}/api/evenements/getById/${eventId}`);
      if (!response.ok) throw new Error('Événement non trouvé');
      const data = await response.json();
      console.log('Événement chargé :', data.titreEvent);
      setEvenement(data);
      navigation.setOptions({ title: data.titreEvent });
    } catch (err) {
      console.error('Erreur :', err.message);
      setError("Impossible de charger l'événement.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Lire le token et le userId depuis AsyncStorage ───────────────────────
  const getAuthData = async () => {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');
    console.log('Token présent :', token ? 'OUI' : 'NON');
    console.log('UserId :', userId);
    return { token, userId };
  };

  // ─── Bouton Participer : envoyer la réservation au backend ────────────────
  const handleParticiper = async () => {
    setParticiperLoading(true);

    try {
      // 1) Récupérer les données d'authentification
      const { token, userId } = await getAuthData();

      // 2) Vérifier que l'utilisateur est connecté
      if (!token || !userId) {
        Alert.alert(
          'Non connecté',
          'Vous devez être connecté pour participer.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => navigation.replace('Login') },
          ]
        );
        return;
      }

      // 3) Construire le body : date du jour au format "YYYY-MM-DD"
      const today = new Date().toISOString().split('T')[0];

      const reservationBody = {
        dateReservation: today,
        nbrPersonnes: 1,
        user: { idUser: parseInt(userId) },
        evenement: { idEvent: eventId },
      };

      console.log('Envoi réservation :', JSON.stringify(reservationBody));

      // 4) Envoyer la requête POST avec le token JWT dans le header Authorization
      const response = await fetch(`${BASE_URL}/api/reservations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,   // Format standard JWT
        },
        body: JSON.stringify(reservationBody),
      });

      // 5) Gérer les réponses selon le code HTTP retourné
      if (response.status === 200 || response.status === 201) {
        // ✅ SUCCÈS
        Alert.alert(
          'Inscription confirmée !',
          `Vous êtes inscrit(e) à "${evenement.titreEvent}"`,
          [
            { text: 'Retour à la liste', onPress: () => navigation.goBack() },
            { text: 'OK' },
          ]
        );
      } else if (response.status === 401) {
        // ❌ TOKEN INVALIDE OU EXPIRÉ
        const errorData = await response.text();
        console.error('401 :', errorData);
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.',
          [{
            text: 'Se reconnecter',
            onPress: async () => {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userId');
              navigation.replace('Login');
            },
          }]
        );
      } else if (response.status === 403) {
        // ❌ RÔLE INSUFFISANT (pas ADMIN)
        Alert.alert(
          'Accès refusé',
          "Vous n'avez pas les droits nécessaires pour cette action."
        );
      } else if (response.status === 400) {
        // ❌ ERREUR MÉTIER (déjà inscrit, places épuisées, etc.)
        let message = "Erreur lors de l'inscription.";
        try {
          const errorData = await response.text();
          if (errorData) message = errorData;
        } catch (e) {}
        Alert.alert('Erreur', message);
      } else {
        // ❌ AUTRE ERREUR INATTENDUE
        Alert.alert('Erreur', `Erreur inattendue (code ${response.status})`);
      }

    } catch (error) {
      // ❌ ERREUR RÉSEAU (backend éteint, mauvaise IP...)
      console.error('Erreur réseau :', error.message);
      Alert.alert(
        'Erreur réseau',
        'Impossible de contacter le serveur.\nVérifiez votre connexion.'
      );
    } finally {
      setParticiperLoading(false);
    }
  };

  // ─── Formater une date en français ───────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ─── Formater une heure en français ──────────────────────────────────────
  const formatHeure = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Affichage : chargement ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // ─── Affichage : erreur ───────────────────────────────────────────────────
  if (error || !evenement) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Événement non trouvé'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={chargerDetail}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Affichage principal ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Titre */}
        <Text style={styles.title}>{evenement.titreEvent}</Text>

        {/* Badge type d'événement */}
        {evenement.typeEvent && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{evenement.typeEvent.nomType}</Text>
          </View>
        )}

        {/* Section Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <Text style={styles.info}>
            Début : {formatDate(evenement.dateDebut)} à {formatHeure(evenement.dateDebut)}
          </Text>
          <Text style={styles.info}>
            Fin : {formatDate(evenement.dateFin)} à {formatHeure(evenement.dateFin)}
          </Text>
        </View>

        {/* Section Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {evenement.description || 'Aucune description disponible.'}
          </Text>
        </View>

        {/* Section Lieu */}
        {evenement.adresse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lieu</Text>
            <Text style={styles.info}>{evenement.adresse.rue}</Text>
            <Text style={styles.info}>
              {evenement.adresse.codePostal} {evenement.adresse.ville}
            </Text>
          </View>
        )}

        {/* Section Tarif */}
        {evenement.tarif && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarif</Text>
            <Text style={styles.prix}>
              {evenement.tarif.prix === 0 ? 'Gratuit' : `${evenement.tarif.prix} €`}
            </Text>
            {evenement.tarif.isPromotion && (
              <View style={styles.promoBadge}>
                <Text style={styles.promoText}>EN PROMOTION</Text>
              </View>
            )}
          </View>
        )}

        {/* Section Places */}
        {evenement.nbPlace != null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Places disponibles</Text>
            <Text style={styles.info}>{evenement.nbPlace} places</Text>
          </View>
        )}

        {/* Section Organisateur */}
        {evenement.organisateur && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            <Text style={styles.info}>
              {evenement.organisateur.prenom} {evenement.organisateur.nom}
            </Text>
            <Text style={styles.infoSmall}>{evenement.organisateur.email}</Text>
          </View>
        )}

        {/* Espace pour le bouton fixe en bas */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bouton Participer fixé en bas de l'écran */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.participerBtn, participerLoading && styles.participerBtnDisabled]}
          onPress={handleParticiper}
          disabled={participerLoading}
        >
          {participerLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.participerText}>Participer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  badge: {
    backgroundColor: '#E8DEF8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  badgeText: { color: '#6200EE', fontSize: 14, fontWeight: '600' },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#6200EE', marginBottom: 8 },
  info: { fontSize: 15, color: '#333', marginBottom: 4 },
  infoSmall: { fontSize: 13, color: '#888', marginTop: 2 },
  description: { fontSize: 15, color: '#555', lineHeight: 22 },
  prix: { fontSize: 22, fontWeight: 'bold', color: '#6200EE' },
  promoBadge: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  promoText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  participerBtn: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  participerBtnDisabled: {
    backgroundColor: '#B39DDB',
  },
  participerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#6200EE', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});