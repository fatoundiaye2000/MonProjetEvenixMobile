// screens/EventsListScreen.js
// ✅ Bouton ❤️ sur chaque carte — sauvegarde en SQLite via favorisService
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import BASE_URL from '../services/api';
import { initFavorisDB, isFavori, toggleFavori } from '../services/favorisService';

const { width, height } = Dimensions.get('window');
const ORANGE = '#F97316';
const BLUE   = '#2563EB';

// ─── Particule ────────────────────────────────────────────────────────────────
function Particle({ sx, sy, size, color, duration, delay }) {
  const px = useRef(new Animated.Value(sx)).current;
  const py = useRef(new Animated.Value(sy)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = () => {
      px.setValue(sx + (Math.random()-0.5)*30); py.setValue(sy); op.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 0.8, duration: 400, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(py, { toValue: sy - 100 - Math.random()*80, duration, useNativeDriver: true }),
          Animated.timing(px, { toValue: sx + (Math.random()-0.5)*80, duration, useNativeDriver: true }),
        ]),
        Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(loop);
    };
    loop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: 0, top: 0,
      width: size, height: size, borderRadius: size/2,
      backgroundColor: color, opacity: op,
      transform: [{ translateX: px }, { translateY: py }],
    }} />
  );
}

const PARTS = [
  { sx: width*0.05, sy: height*0.88, size: 8,  color: ORANGE,    duration: 3000, delay: 0    },
  { sx: width*0.20, sy: height*0.91, size: 5,  color: BLUE,      duration: 3800, delay: 350  },
  { sx: width*0.36, sy: height*0.85, size: 10, color: '#FB923C', duration: 3200, delay: 700  },
  { sx: width*0.52, sy: height*0.90, size: 6,  color: BLUE,      duration: 2900, delay: 150  },
  { sx: width*0.68, sy: height*0.87, size: 8,  color: ORANGE,    duration: 4000, delay: 550  },
  { sx: width*0.82, sy: height*0.91, size: 5,  color: '#93C5FD', duration: 3500, delay: 950  },
  { sx: width*0.94, sy: height*0.85, size: 7,  color: BLUE,      duration: 2600, delay: 300  },
];

const getTypeColor = (nomType) => {
  if (!nomType) return { stripe: ORANGE, badge: '#FFF7ED', dot: ORANGE, text: '#C2410C' };
  const n = nomType.toLowerCase();
  if (n.includes('concert') || n.includes('musique'))
    return { stripe: ORANGE,    badge: '#FFF7ED', dot: ORANGE,    text: '#C2410C' };
  if (n.includes('conf') || n.includes('séminaire'))
    return { stripe: BLUE,      badge: '#EFF6FF', dot: BLUE,      text: '#1D4ED8' };
  if (n.includes('sport'))
    return { stripe: '#16A34A', badge: '#F0FDF4', dot: '#16A34A', text: '#15803D' };
  if (n.includes('festival') || n.includes('fête'))
    return { stripe: '#D97706', badge: '#FFFBEB', dot: '#D97706', text: '#B45309' };
  if (n.includes('expo') || n.includes('art'))
    return { stripe: '#9333EA', badge: '#FDF4FF', dot: '#9333EA', text: '#7E22CE' };
  return { stripe: ORANGE, badge: '#FFF7ED', dot: ORANGE, text: '#C2410C' };
};

// ─── Carte événement ──────────────────────────────────────────────────────────
function EventCard({ item, index, onPress }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const sc      = useRef(new Animated.Value(1)).current;
  const heartSc = useRef(new Animated.Value(1)).current;

  // État favori en temps réel
  const [fav, setFav] = useState(() => isFavori(item.idEvent));

  const nomType = typeof item.typeEvent === 'object'
    ? (item.typeEvent?.nomType || '')
    : (item.typeEvent || '');
  const tc = getTypeColor(nomType);

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 360, delay: index * 65, useNativeDriver: true }).start();
  }, []);

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const ville = item.villeEvent || item.adresse?.ville || '';
  const prix  = item.tarif?.prixNormal ?? item.tarif?.prix ?? null;

  // Basculer favori avec animation cœur
  const handleToggleFav = () => {
    Animated.sequence([
      Animated.spring(heartSc, { toValue: 1.35, friction: 4, useNativeDriver: true }),
      Animated.spring(heartSc, { toValue: 1,    friction: 4, useNativeDriver: true }),
    ]).start();
    const isNowFav = toggleFavori(item);
    setFav(isNowFav);
  };

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange:[0,1], outputRange:[22,0] }) },
        { scale: sc },
      ],
    }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        activeOpacity={1}
        style={s.card}
      >
        <View style={[s.stripe, { backgroundColor: tc.stripe }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            {/* Badge type */}
            <View style={[s.badge, { backgroundColor: tc.badge }]}>
              <View style={[s.dot, { backgroundColor: tc.dot }]} />
              <Text style={[s.badgeTxt, { color: tc.text }]}>
                {nomType || 'Événement'}
              </Text>
            </View>

            {/* Bouton ❤️ favori */}
            <Animated.View style={{ transform: [{ scale: heartSc }] }}>
              <TouchableOpacity onPress={handleToggleFav} style={s.heartBtn} activeOpacity={0.8}>
                <Text style={s.heartIco}>{fav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={s.title} numberOfLines={2}>{item.titreEvent || 'Sans titre'}</Text>

          <View style={s.meta}>
            <Text style={s.metaIco}>📅</Text>
            <Text style={s.metaTxt}>{fmt(item.dateDebut)}</Text>
            {ville ? (
              <>
                <View style={s.metaSep} />
                <Text style={s.metaIco}>📍</Text>
                <Text style={s.metaTxt}>{ville}</Text>
              </>
            ) : null}
          </View>

          <View style={s.footer}>
            <Text style={s.price}>
              {prix === 0 ? 'Gratuit' : prix != null ? `${prix} €` : 'Voir détails'}
            </Text>
            <View style={[s.arrow, { backgroundColor: tc.stripe }]}>
              <Text style={s.arrowTxt}>›</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function EventsListScreen({ navigation }) {
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ✅ Initialiser la BDD SQLite au démarrage
    initFavorisDB();
    load();
    Animated.timing(headerAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  }, []);

  const load = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/evenements/all`);
      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Impossible de charger les événements.\n${e.message}`);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const Header = () => (
    <Animated.View style={[s.header, {
      opacity: headerAnim,
      transform: [{ translateY: headerAnim.interpolate({ inputRange:[0,1], outputRange:[-16,0] }) }],
    }]}>
      <Text style={s.hGreet}>Bonne journée 👋</Text>
      <Text style={s.hTitle}>Événements</Text>
      <View style={s.headerRow}>
        {events.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{events.length} disponible{events.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        {/* Bouton vers Mes Favoris */}
        <TouchableOpacity
          style={s.favBtn}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Text style={s.favBtnTxt}>❤️  Mes favoris</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <View style={s.topBg} />
      {PARTS.map((p, i) => <Particle key={i} {...p} />)}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={s.loadTxt}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontSize: 42, marginBottom: 12 }}>😕</Text>
          <Text style={s.errTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryTxt}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => String(item.idEvent)}
          renderItem={({ item, index }) => (
            <EventCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.idEvent })}
            />
          )}
          ListHeaderComponent={<Header />}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 42, marginBottom: 12 }}>📭</Text>
              <Text style={s.errTxt}>Aucun événement disponible</Text>
            </View>
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)}
              tintColor={ORANGE} colors={[ORANGE]} />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFF7ED' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  list:   { paddingHorizontal: 16, paddingBottom: 32 },

  topBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 170,
    backgroundColor: '#FFEDD5',
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },

  header:     { paddingTop: 18, paddingBottom: 20, paddingHorizontal: 4 },
  hGreet:     { fontSize: 13, color: '#EA580C', fontWeight: '600', marginBottom: 4 },
  hTitle:     { fontSize: 26, fontWeight: '900', color: '#1C0A00', marginBottom: 10 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  countBadge: { backgroundColor: ORANGE, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  countTxt:   { fontSize: 12, color: 'white', fontWeight: '700' },
  favBtn:     { backgroundColor: '#FFF1F0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#FED7AA' },
  favBtnTxt:  { fontSize: 12, color: '#C2410C', fontWeight: '700' },

  // Carte
  card: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 18, marginBottom: 12, overflow: 'hidden',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#FEE8D6',
  },
  stripe:   { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },

  badge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot:      { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  heartBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF1F0', justifyContent: 'center', alignItems: 'center' },
  heartIco: { fontSize: 17 },

  title:   { fontSize: 15, fontWeight: '800', color: '#1C0A00', marginBottom: 9, lineHeight: 21 },
  meta:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 },
  metaIco: { fontSize: 12, marginRight: 4 },
  metaTxt: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  metaSep: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 8 },

  footer:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:    { fontSize: 14, fontWeight: '800', color: '#1C0A00' },
  arrow:    { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  arrowTxt: { fontSize: 18, color: 'white', fontWeight: '700', lineHeight: 22 },

  loadTxt:  { color: '#EA580C', marginTop: 12, fontSize: 14 },
  errTxt:   { color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  retryBtn: { backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryTxt: { color: 'white', fontWeight: '700', fontSize: 14 },
});