// screens/RegisterScreen.js
// Champs : Prénom, Nom, Email, Téléphone, Mot de passe
// Après inscription : Alert succès → retour Login
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, ScrollView, Alert,
} from 'react-native';
import BASE_URL from '../services/api';

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
      px.setValue(sx + (Math.random() - 0.5) * 30);
      py.setValue(sy); op.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 0.85, duration: 450, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(py, { toValue: sy - 110 - Math.random() * 90, duration, useNativeDriver: true }),
          Animated.timing(px, { toValue: sx + (Math.random() - 0.5) * 90, duration, useNativeDriver: true }),
        ]),
        Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(loop);
    };
    loop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: 0, top: 0,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: op,
      transform: [{ translateX: px }, { translateY: py }],
    }} />
  );
}

const PARTS = [
  { sx: width*0.04,  sy: height*0.87, size: 10, color: ORANGE,    duration: 3000, delay: 0    },
  { sx: width*0.16,  sy: height*0.91, size: 6,  color: BLUE,      duration: 3800, delay: 300  },
  { sx: width*0.30,  sy: height*0.85, size: 12, color: '#FB923C', duration: 3200, delay: 700  },
  { sx: width*0.44,  sy: height*0.90, size: 7,  color: BLUE,      duration: 2900, delay: 100  },
  { sx: width*0.58,  sy: height*0.86, size: 9,  color: ORANGE,    duration: 4000, delay: 500  },
  { sx: width*0.70,  sy: height*0.92, size: 6,  color: '#93C5FD', duration: 3500, delay: 900  },
  { sx: width*0.82,  sy: height*0.84, size: 8,  color: BLUE,      duration: 2700, delay: 200  },
  { sx: width*0.93,  sy: height*0.89, size: 5,  color: ORANGE,    duration: 3700, delay: 1100 },
  { sx: width*0.10,  sy: height*0.77, size: 5,  color: '#FDBA74', duration: 4200, delay: 1400 },
  { sx: width*0.62,  sy: height*0.79, size: 7,  color: BLUE,      duration: 3100, delay: 600  },
];

// ─── Champ réutilisable ───────────────────────────────────────────────────────
function Field({ label, icon, value, onChange, placeholder, keyboard, secure, showToggle, showPwd, onToggle }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.field, focused && s.fieldOn]}>
        <Text style={s.fIco}>{icon}</Text>
        <TextInput
          style={[s.fInput, showToggle && { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#FED7AA"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          autoCapitalize={keyboard === 'email-address' || keyboard === 'phone-pad' ? 'none' : 'words'}
          autoCorrect={false}
          secureTextEntry={secure && !showPwd}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding: 8 }}>
            <Text style={{ fontSize: 16 }}>{showPwd ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const [prenom,   setPrenom]   = useState('');
  const [nom,      setNom]      = useState('');
  const [email,    setEmail]    = useState('');
  const [tel,      setTel]      = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState('');

  const logoOp = useRef(new Animated.Value(0)).current;
  const logoY  = useRef(new Animated.Value(-24)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const cardY  = useRef(new Animated.Value(32)).current;
  const btnSc  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(logoY,  { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOp, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(cardY,  { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleRegister = async () => {
    const prenomT = prenom.trim();
    const nomT    = nom.trim();
    const emailT  = email.trim();
    const telT    = tel.trim();

    // Validation
    if (!prenomT || !nomT || !emailT || !password) {
      setErrMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password.length < 3) {
      setErrMsg('Le mot de passe doit contenir au moins 3 caractères.');
      return;
    }

    setErrMsg('');
    setLoading(true);

    try {
      // POST /api/users/register
      const res = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prenom:    prenomT,
          nom:       nomT,
          email:     emailT,
          telephone: telT,
          password:  password,
        }),
      });

      if (!res.ok) {
        let msg = "Erreur lors de l'inscription";
        try {
          const json = await res.json();
          msg = json.message || json.error || msg;
        } catch {
          const txt = await res.text();
          if (txt && txt.length < 150) msg = txt;
        }
        setErrMsg(msg);
        setLoading(false);
        return;
      }

      // ✅ Inscription réussie → message de succès → retour Login
      setLoading(false);
      Alert.alert(
        '🎉 Compte créé avec succès !',
        `Bienvenue ${prenomT} !\nVotre compte a été créé. Vous pouvez maintenant vous connecter.`,
        [{ text: 'Se connecter', onPress: () => navigation.replace('Login') }]
      );

    } catch (e) {
      setErrMsg('Serveur inaccessible.\nVérifiez que le backend est démarré.');
      setLoading(false);
    }
  };

  const clear = () => setErrMsg('');

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <View style={s.topBg} />
      <View style={[s.deco, { width: 240, height: 240, top: -80, right: -70, backgroundColor: ORANGE, opacity: 0.07 }]} />
      <View style={[s.deco, { width: 160, height: 160, top:  60, left:  -50, backgroundColor: BLUE,   opacity: 0.06 }]} />
      {PARTS.map((p, i) => <Particle key={i} {...p} />)}
      <View style={s.bottomLine} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View style={[s.logoArea, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
            <View style={s.logoBox}>
              <Text style={s.logoE}>E</Text>
            </View>
            <Text style={s.appName}>Evenix</Text>
            <Text style={s.appSub}>Créez votre compte</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
            <Text style={s.cardTitle}>Inscription</Text>
            <Text style={s.cardSub}>Rejoignez la communauté Evenix 🎉</Text>

            {/* Erreur */}
            {errMsg ? (
              <View style={s.errBox}>
                <Text style={s.errIco}>⚠️</Text>
                <Text style={s.errTxt}>{errMsg}</Text>
              </View>
            ) : null}

            {/* Prénom + Nom côte à côte */}
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Field label="PRÉNOM" icon="👤" value={prenom} onChange={t => { setPrenom(t); clear(); }} placeholder="Marie" />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Field label="NOM" icon="👤" value={nom} onChange={t => { setNom(t); clear(); }} placeholder="Dupont" />
              </View>
            </View>

            {/* Email */}
            <Field label="EMAIL" icon="✉️" value={email} onChange={t => { setEmail(t); clear(); }} placeholder="votre@email.com" keyboard="email-address" />

            {/* Téléphone */}
            <Field label="TÉLÉPHONE" icon="📱" value={tel} onChange={t => { setTel(t); clear(); }} placeholder="+33 6 12 34 56 78" keyboard="phone-pad" />

            {/* Mot de passe */}
            <Field label="MOT DE PASSE" icon="🔑" value={password} onChange={t => { setPassword(t); clear(); }} placeholder="••••••••" secure showToggle showPwd={showPwd} onToggle={() => setShowPwd(v => !v)} />

            {/* Bouton S'inscrire */}
            <Animated.View style={{ transform: [{ scale: btnSc }], marginTop: 6 }}>
              <TouchableOpacity
                style={[s.btn, loading && { opacity: 0.65 }]}
                onPress={handleRegister}
                onPressIn={() => Animated.spring(btnSc, { toValue: 0.96, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(btnSc, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
                disabled={loading}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={s.btnTxt}>Créer mon compte  →</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {/* Lien retour login */}
            <View style={s.sep}>
              <View style={s.sepLine} />
              <Text style={s.sepTxt}>DÉJÀ UN COMPTE ?</Text>
              <View style={s.sepLine} />
            </View>

            <TouchableOpacity
              style={s.loginBtn}
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.85}
            >
              <Text style={s.loginTxt}>Se connecter  →</Text>
            </TouchableOpacity>

          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFF7ED' },
  scroll: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 20 },
  deco:   { position: 'absolute', borderRadius: 999 },

  topBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.30,
    backgroundColor: '#FFEDD5', borderBottomLeftRadius: 56, borderBottomRightRadius: 56,
  },
  bottomLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: ORANGE, opacity: 0.35,
  },

  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: ORANGE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 10,
  },
  logoE:   { fontSize: 28, fontWeight: '900', color: 'white' },
  appName: { fontSize: 26, fontWeight: '900', color: '#1C0A00', letterSpacing: 0.6 },
  appSub:  { fontSize: 12, color: '#EA580C', marginTop: 4, letterSpacing: 0.8 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 26, padding: 24,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 22, elevation: 10,
    borderWidth: 1, borderColor: '#FEE8D6',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1C0A00', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#9CA3AF', marginBottom: 18 },

  errBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF1F2', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#FECDD3',
  },
  errIco: { fontSize: 15, marginRight: 8, marginTop: 1 },
  errTxt: { flex: 1, fontSize: 13, color: '#BE123C', fontWeight: '600', lineHeight: 18 },

  row: { flexDirection: 'row' },

  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '800', color: '#FB923C', letterSpacing: 1.3, marginBottom: 7 },
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderRadius: 13, paddingHorizontal: 13,
    height: 52, borderWidth: 1.5, borderColor: '#FED7AA',
  },
  fieldOn: {
    borderColor: ORANGE, backgroundColor: '#FFFBF8',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  fIco:   { fontSize: 15, marginRight: 9 },
  fInput: { flex: 1, fontSize: 15, color: '#1C0A00', fontWeight: '500' },

  btn: {
    height: 54, borderRadius: 15, backgroundColor: ORANGE,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 13, elevation: 10,
  },
  btnTxt: { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.4 },

  sep:     { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 14 },
  sepLine: { flex: 1, height: 1, backgroundColor: '#FEE8D6' },
  sepTxt:  { fontSize: 10, color: '#FDBA74', marginHorizontal: 10, fontWeight: '700', letterSpacing: 1.2 },

  loginBtn: {
    height: 50, borderRadius: 15, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FED7AA',
  },
  loginTxt: { fontSize: 15, fontWeight: '700', color: ORANGE },
});