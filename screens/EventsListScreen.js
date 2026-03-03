// screens/EventsListScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BASE_URL from '../services/api';

export default function EventsListScreen({ navigation }) {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chargement automatique au démarrage
  useEffect(() => {
    chargerEvenements();
  }, []);

  // Fonction qui appelle l'API
  const chargerEvenements = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${BASE_URL}/api/evenements/all`);

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      const data = await response.json();

      console.log(`${data.length} événements récupérés`);

      setEvenements(data);

    } catch (err) {
      console.error('Erreur :', err.message);
      setError('Impossible de charger les événements.\nVérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Affichage chargement
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Affichage erreur
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={chargerEvenements}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Affichage principal
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {evenements.length} événement{evenements.length > 1 ? 's' : ''}
      </Text>

      <FlatList
        data={evenements}
        keyExtractor={(item) => item.idEvent.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('EventDetail', { eventId: item.idEvent })
            }
          >
            <Text style={styles.cardTitle}>{item.titreEvent}</Text>

            {item.typeEvent && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.typeEvent.nomType}
                </Text>
              </View>
            )}

            <Text style={styles.cardInfo}>
              {formatDate(item.dateDebut)}
            </Text>

            {item.adresse && (
              <Text style={styles.cardInfo}>
                {item.adresse.ville}
              </Text>
            )}

            <View style={styles.cardFooter}>
              {item.tarif && (
                <Text style={styles.cardPrice}>
                  {item.tarif.prix === 0
                    ? 'Gratuit'
                    : `${item.tarif.prix} €`}
                </Text>
              )}

              {item.nbPlace != null && (
                <Text style={styles.cardPlaces}>
                  {item.nbPlace} places
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Aucun événement disponible
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 16, color: '#666', paddingHorizontal: 16, paddingVertical: 12 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E8DEF8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#6200EE',
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfo: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  cardPlaces: {
    fontSize: 14,
    color: '#999',
  },

  loadingText: { marginTop: 10, fontSize: 16 },
  errorText: { fontSize: 16, color: 'red', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999' },
});