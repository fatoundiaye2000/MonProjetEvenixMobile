// screens/EventDetailScreen.js
// ✅ Bouton ❤️ favori dans la navigation header + bouton Participer TP7
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Alert, StatusBar, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../services/api';
import { isFavori, toggleFavori } from '../services/favorisService';

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
          Animated.timing(py, { toValue: sy-100-Math.random()*80, duration, useNativeDriver: true }),
          Animated.timing(px, { toValue: sx+(Math.random()-0.5)*80, duration, useNativeDriver: true }),
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
  { sx: width*0.05, sy: height*0.88, size: 7,  color: ORANGE, duration: 3000, delay: 0   },
  { sx: width*0.22, sy: height*0.91, size: 5,  color: BLUE,   duration: 3800, delay: 350 },
  { sx: width*0.42, sy: height*0.86, size: 9,  color: '#FB923C', duration: 3200, delay: 700 },
  { sx: width*0.60, sy: height*0.90, size: 6,  color: BLUE,   duration: 2800, delay: 150 },
  { sx: width*0.78, sy: height*0.87, size: 8,  color: ORANGE, duration: 4000, delay: 550 },
  { sx: width*0.93, sy: height*0.85, size: 5,  color: '#93C5FD', duration: 3500, delay: 950 },
];

const getTC = (nomType) => {
  if (!nomType) return { accent: ORANGE, bg: '#FFF7ED', light: '#FFEDD5' };
  const n = nomType.toLowerCase();
  if (n.includes('concert') || n.includes('musique')) return { accent: ORANGE, bg: '#FFF7ED', light: '#FFEDD5' };
  if (n.includes('conf') || n.includes('séminaire'))  return { accent: BLUE, bg: '#EFF6FF', light: '#DBEAFE' };
  if (n.includes('sport'))    return { accent: '#16A34A', bg: '#F0FDF4', light: '#DCFCE7' };
  if (n.includes('festival')) return { accent: '#D97706', bg: '#FFFBEB', light: '#FEF3C7' };
  if (n.includes('expo') || n.includes('art')) return { accent: '#9333EA', bg: '#FDF4FF', light: '#FAE8FF' };
  return { accent: ORANGE, bg: '#FFF7ED', light: '#FFEDD5' };
};

function InfoRow({ icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIco}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoVal}>{display}</Text>
      </View>
    </View>
  );
}

function Section({ title, accent, children }) {
  return (
    <View style={s.section}>
      <View style={[s.secBar, { backgroundColor: accent }]} />
      <View style={s.secContent}>
        <Text style={[s.secTitle, { color: accent }]}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

export default function EventDetailScreen({ route, navigation }) {
  const { eventId }       = route.params;
  const [ev, setEv]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [pLoad,   setPLoad]     = useState(false);
  const [fav,     setFav]       = useState(false);

  const cOp   = useRef(new Animated.Value(0)).current;
  const cY    = useRef(new Animated.Value(20)).current;
  const btnSc = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const heartSc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadDetail();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadDetail = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/evenements/getById/${eventId}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setEv(data);

      // Vérifier si déjà en favori
      const already = isFavori(data.idEvent);
      setFav(already);

      const titre = typeof data.titreEvent === 'string' ? data.titreEvent : 'Détail';

      // ✅ Ajouter le bouton ❤️ dans le header de navigation
      navigation.setOptions({
        title: titre,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => handleToggleFavFromHeader(data, already)}
            style={{ marginRight: 16, padding: 4 }}
          >
            <Text style={{ fontSize: 24 }}>{already ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        ),
      });

      Animated.parallel([
        Animated.timing(cOp, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(cY,  { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]).start();
    } catch (e) {
      Alert.alert('Erreur', `Impossible de charger cet événement.\n${e.message}`);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  // Depuis le header (avant que ev soit dans le state)
  const handleToggleFavFromHeader = (eventData, currentFav) => {
    Animated.sequence([
      Animated.spring(heartSc, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartSc, { toValue: 1,   useNativeDriver: true }),
    ]).start();
    const isNowFav = toggleFavori(eventData);
    setFav(isNowFav);
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => handleToggleFav()}
          style={{ marginRight: 16, padding: 4 }}
        >
          <Text style={{ fontSize: 24 }}>{isNowFav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      ),
    });
  };

  // Depuis le corps de l'écran (ev est dans le state)
  const handleToggleFav = () => {
    if (!ev) return;
    Animated.sequence([
      Animated.spring(heartSc, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartSc, { toValue: 1,   useNativeDriver: true }),
    ]).start();
    const isNowFav = toggleFavori(ev);
    setFav(isNowFav);
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleFav}
          style={{ marginRight: 16, padding: 4 }}
        >
          <Text style={{ fontSize: 24 }}>{isNowFav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      ),
    });
  };

  // ── Participer TP7 ──────────────────────────────────────────────────────────
  const handleParticiper = async () => {
    setPLoad(true);
    Animated.spring(btnSc, { toValue: 0.94, useNativeDriver: true }).start();
    try {
      const token  = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Non connecté', 'Vous devez être connecté pour participer.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.replace('Login') },
        ]);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/api/reservations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dateReservation: today, nbrPersonnes: 1,
          user:      { idUser: parseInt(userId) },
          evenement: { idEvent: eventId },
        }),
      });
      if (res.status === 200 || res.status === 201) {
        const titre = typeof ev?.titreEvent === 'string' ? ev.titreEvent : 'cet événement';
        Alert.alert('🎉 Inscription confirmée !', `Vous participez à "${titre}".`,
          [{ text: 'Super !', onPress: () => navigation.goBack() }]);
      } else if (res.status === 401) {
        await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userRoles']);
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        navigation.replace('Login');
      } else if (res.status === 403) {
        Alert.alert('Accès refusé', 'Le rôle ADMIN est requis pour effectuer une réservation.');
      } else {
        Alert.alert('Erreur', await res.text());
      }
    } catch {
      Alert.alert('Erreur réseau', 'Impossible de joindre le serveur.');
    } finally {
      setPLoad(false);
      Animated.spring(btnSc, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
  };

  const fmt  = d => { try { return d ? new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) : '—'; } catch { return d || '—'; }};
  const fmtH = d => { try { return d ? new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : ''; } catch { return ''; }};

  const nomType = typeof ev?.typeEvent === 'object' ? (ev?.typeEvent?.nomType || '') : (ev?.typeEvent || '');
  const tc      = getTC(nomType);
  const prix    = ev?.tarif?.prixNormal ?? ev?.tarif?.prix ?? null;
  const ville   = ev?.villeEvent || ev?.adresse?.ville || '';
  const rue     = ev?.adresse?.rue || '';
  const orgNom  = ev?.organisateur ? `${ev.organisateur.prenom||''} ${ev.organisateur.nom||''}`.trim() : null;
  const orgEmail = ev?.organisateur?.email || null;

  if (loading) return (
    <View style={[s.root, { justifyContent:'center', alignItems:'center' }]}>
      <ActivityIndicator size="large" color={ORANGE} />
      <Text style={s.loadTxt}>Chargement...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <View style={[s.topBg, { backgroundColor: tc.light }]} />
      {PARTS.map((p, i) => <Particle key={i} {...p} />)}

      <Animated.ScrollView
        style={{ opacity: cOp, transform: [{ translateY: cY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[s.hero, { borderLeftColor: tc.accent }]}>
          <View style={s.heroTop}>
            <View style={[s.pill, { backgroundColor: tc.bg }]}>
              <View style={[s.pillDot, { backgroundColor: tc.accent }]} />
              <Text style={[s.pillTxt, { color: tc.accent }]}>{nomType || 'Événement'}</Text>
            </View>

            {/* Bouton favori dans le corps */}
            <Animated.View style={{ transform: [{ scale: heartSc }] }}>
              <TouchableOpacity onPress={handleToggleFav} style={s.favBtnHero} activeOpacity={0.8}>
                <Text style={{ fontSize: 22 }}>{fav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {ev?.isPromotion && (
            <View style={s.promoBadge}><Text style={s.promoTxt}>🔥 PROMO</Text></View>
          )}
          <Text style={s.heroTitle}>{typeof ev?.titreEvent === 'string' ? ev.titreEvent : 'Événement'}</Text>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          {[
            { ico: '📅', lbl: 'Date',   val: fmt(ev?.dateDebut) },
            { ico: '⏰', lbl: 'Heure',  val: fmtH(ev?.dateDebut) || '—' },
            { ico: '💺', lbl: 'Places', val: ev?.nbPlaces !== null && ev?.nbPlaces !== undefined ? String(ev.nbPlaces) : '—' },
          ].map((st, i) => (
            <View key={i} style={[s.statCard, { borderTopColor: tc.accent }]}>
              <Text style={s.statIco}>{st.ico}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
              <Text style={s.statVal} numberOfLines={2}>{st.val}</Text>
            </View>
          ))}
        </View>

        {ev?.descriptionEvent ? (
          <Section title="À propos" accent={tc.accent}>
            <Text style={s.desc}>{String(ev.descriptionEvent)}</Text>
          </Section>
        ) : null}

        <Section title="Lieu & Date" accent={tc.accent}>
          <InfoRow icon="📍" label="Ville"   value={ville} />
          <InfoRow icon="🏛️" label="Lieu"    value={ev?.lieuEvent} />
          <InfoRow icon="🗺️" label="Adresse" value={rue} />
          <InfoRow icon="📅" label="Début"   value={fmt(ev?.dateDebut)} />
          <InfoRow icon="📅" label="Fin"     value={fmt(ev?.dateFin)} />
        </Section>

        <Section title="Tarif" accent={tc.accent}>
          <View style={[s.tarifBox, { backgroundColor: tc.bg, borderColor: tc.light }]}>
            <Text style={[s.tarifPrice, { color: tc.accent }]}>
              {prix === 0 ? 'Gratuit 🎟️' : prix !== null ? `${prix} €` : '—'}
            </Text>
            {ev?.isPromotion && ev?.tarif?.prixPromo != null && (
              <Text style={s.tarifPromo}>Prix promo : {ev.tarif.prixPromo} €</Text>
            )}
          </View>
        </Section>

        {(orgNom || orgEmail) ? (
          <Section title="Administrateur" accent={tc.accent}>
            {orgNom   ? <InfoRow icon="👤" label="Nom"   value={orgNom}   /> : null}
            {orgEmail ? <InfoRow icon="✉️" label="Email" value={orgEmail} /> : null}
          </Section>
        ) : null}

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* Bouton Participer */}
      <View style={s.bottomBar}>
        <Animated.View style={{ transform: [{ scale: btnSc }] }}>
          <Animated.View style={[s.glowView, {
            backgroundColor: tc.accent,
            opacity: glow.interpolate({ inputRange:[0,1], outputRange:[0.12, 0.32] }),
            transform: [{ scale: glow.interpolate({ inputRange:[0,1], outputRange:[1, 1.06] }) }],
          }]} />
          <TouchableOpacity
            style={[s.btn, { backgroundColor: tc.accent }, pLoad && { opacity: 0.65 }]}
            onPress={handleParticiper}
            disabled={pLoad}
            activeOpacity={0.92}
          >
            {pLoad
              ? <ActivityIndicator color="white" />
              : <Text style={s.btnTxt}>🎟️  Participer à l'événement</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#FFF7ED' },
  scroll:  { paddingHorizontal: 16, paddingTop: 14 },
  loadTxt: { color: '#EA580C', marginTop: 12, fontSize: 14 },

  topBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 190, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },

  hero: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12, borderLeftWidth: 4, shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pill:     { flexDirection:'row', alignItems:'center', paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  pillDot:  { width:7, height:7, borderRadius:4, marginRight:6 },
  pillTxt:  { fontSize:11, fontWeight:'800', letterSpacing:0.4 },
  favBtnHero: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF1F0', justifyContent: 'center', alignItems: 'center' },
  promoBadge: { alignSelf:'flex-start', backgroundColor:'#FEF3C7', borderRadius:20, paddingHorizontal:10, paddingVertical:4, marginBottom:8, borderWidth:1, borderColor:'#FDE68A' },
  promoTxt: { fontSize:11, fontWeight:'800', color:'#D97706' },
  heroTitle:{ fontSize:21, fontWeight:'900', color:'#1C0A00', lineHeight:28, marginTop: 8 },

  stats:    { flexDirection:'row', gap:8, marginBottom:12 },
  statCard: { flex:1, backgroundColor:'#FFFFFF', borderRadius:14, padding:12, alignItems:'center', borderTopWidth:3, shadowColor:ORANGE, shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  statIco:  { fontSize:18, marginBottom:5 },
  statLbl:  { fontSize:10, color:'#9CA3AF', fontWeight:'700', letterSpacing:0.5, marginBottom:3 },
  statVal:  { fontSize:11, color:'#1C0A00', fontWeight:'700', textAlign:'center' },

  section:    { flexDirection:'row', backgroundColor:'#FFFFFF', borderRadius:18, marginBottom:10, overflow:'hidden', shadowColor:ORANGE, shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  secBar:     { width:4 },
  secContent: { flex:1, padding:16 },
  secTitle:   { fontSize:11, fontWeight:'800', letterSpacing:1, textTransform:'uppercase', marginBottom:12 },
  desc:       { fontSize:14, color:'#4B5563', lineHeight:22 },

  infoRow:   { flexDirection:'row', alignItems:'flex-start', marginBottom:10 },
  infoIco:   { fontSize:15, marginRight:12, marginTop:1 },
  infoLabel: { fontSize:10, color:'#9CA3AF', fontWeight:'700', letterSpacing:0.5, marginBottom:2 },
  infoVal:   { fontSize:13, color:'#1C0A00', fontWeight:'600' },

  tarifBox:   { borderRadius:12, padding:16, borderWidth:1 },
  tarifPrice: { fontSize:26, fontWeight:'900', marginBottom:4 },
  tarifPromo: { fontSize:13, color:'#D97706', fontWeight:'600' },

  bottomBar: { position:'absolute', bottom:0, left:0, right:0, paddingHorizontal:16, paddingBottom:26, paddingTop:12, backgroundColor:'rgba(255,247,237,0.96)', borderTopWidth:1, borderTopColor:'#FED7AA' },
  glowView:  { position:'absolute', top:0, left:0, right:0, bottom:0, borderRadius:16 },
  btn:       { height:54, borderRadius:16, justifyContent:'center', alignItems:'center', shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:14, elevation:10 },
  btnTxt:    { fontSize:16, fontWeight:'800', color:'white', letterSpacing:0.4 },
});