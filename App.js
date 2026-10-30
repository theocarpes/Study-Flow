import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './screens/login';
import Inicio from './screens/inicio';
import Cadastrar from './screens/cadastrar';
import Calendario from './screens/calendario';
import Notas from './screens/notas';

const todayKey = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

function readActivity(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.titulo,
    subject: data.materia,
    description: data.descricao || '',
    date: data.data,
    time: data.horario || '',
    ownerId: data.criadoPor,
    visibility: data.visibilidade === 'global' ? 'global' : 'private',
  };
}

function profileFrom(firebaseUser, profileData) {
  return {
    id: firebaseUser.uid,
    name: profileData.nome || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Estudante',
    email: firebaseUser.email || profileData.email || '',
    role: profileData.tipo === 'professor' ? 'professor' : 'estudante',
  };
}

function firebaseMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'O Firestore negou a operação. Confira se as regras e os campos salvos estão iguais.';
  }
  return error?.message || 'Não foi possível conectar ao Firebase.';
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [dataError, setDataError] = useState('');
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState({});
  const [editing, setEditing] = useState(null);
  const [returnTo, setReturnTo] = useState('inicio');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const registering = useRef(false);

  useEffect(() => onAuthStateChanged(auth, async (firebaseUser) => {
    if (registering.current) {
      setAuthReady(true);
      return;
    }

    if (!firebaseUser) {
      setUser(null);
      setActivities([]);
      setProgress({});
      setAuthReady(true);
      return;
    }

    setAuthReady(false);
    try {
      let profileSnapshot = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

      // A conta pode ter sido criada antes do perfil. Cria um perfil seguro de estudante.
      if (!profileSnapshot.exists()) {
        const profile = {
          nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Estudante',
          email: firebaseUser.email || '',
          tipo: 'estudante',
        };
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), profile);
        profileSnapshot = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      }

      if (!profileSnapshot.exists()) throw new Error('Não foi possível carregar o perfil desta conta.');
      setUser(profileFrom(firebaseUser, profileSnapshot.data()));
      setAuthError('');
      setScreen('inicio');
    } catch (error) {
      setUser(null);
      setAuthError(firebaseMessage(error));
      await signOut(auth).catch(() => {});
    } finally {
      setAuthReady(true);
    }
  }), []);

  useEffect(() => {
    if (!user?.id) {
      setActivities([]);
      setProgress({});
      return undefined;
    }

    const uid = user.id;
    let globalActivities = [];
    let ownedActivities = [];
    setDataError('');

    const publishActivities = () => {
      const unique = new Map();
      [...globalActivities, ...ownedActivities].forEach((activity) => unique.set(activity.id, activity));
      setActivities(Array.from(unique.values()));
    };

    // Regras do Firestore exigem consultas separadas para globais e próprias.
    const stopGlobal = onSnapshot(
      query(collection(db, 'atividades'), where('visibilidade', '==', 'global')),
      (snapshot) => {
        globalActivities = snapshot.docs.map(readActivity);
        publishActivities();
      },
      (error) => setDataError(firebaseMessage(error)),
    );
    const stopOwned = onSnapshot(
      query(collection(db, 'atividades'), where('criadoPor', '==', uid)),
      (snapshot) => {
        ownedActivities = snapshot.docs.map(readActivity);
        publishActivities();
      },
      (error) => setDataError(firebaseMessage(error)),
    );
    const stopProgress = onSnapshot(
      collection(db, 'usuarios', uid, 'resultados'),
      (snapshot) => {
        const saved = {};
        snapshot.docs.forEach((result) => {
          const data = result.data();
          saved[result.id] = {
            completed: Boolean(data.concluida),
            grade: data.nota === undefined ? null : data.nota,
          };
        });
        setProgress(saved);
      },
      (error) => setDataError(firebaseMessage(error)),
    );

    return () => {
      stopGlobal();
      stopOwned();
      stopProgress();
    };
  }, [user?.id]);

  const register = async ({ name, email, password }) => {
    registering.current = true;
    setAuthError('');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const profile = { nome: name, email, tipo: 'estudante' };
      await setDoc(doc(db, 'usuarios', credential.user.uid), profile);
      setUser(profileFrom(credential.user, profile));
      setScreen('inicio');
    } catch (error) {
      if (auth.currentUser) await signOut(auth).catch(() => {});
      throw error;
    } finally {
      registering.current = false;
      setAuthReady(true);
    }
  };

  const login = async ({ email, password }) => {
    setAuthError('');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    let profileSnapshot = await getDoc(doc(db, 'usuarios', credential.user.uid));

    if (!profileSnapshot.exists()) {
      const profile = {
        nome: credential.user.displayName || email.split('@')[0] || 'Estudante',
        email,
        tipo: 'estudante',
      };
      await setDoc(doc(db, 'usuarios', credential.user.uid), profile);
      profileSnapshot = await getDoc(doc(db, 'usuarios', credential.user.uid));
    }

    if (!profileSnapshot.exists()) throw new Error('Não foi possível criar o perfil desta conta.');
    setUser(profileFrom(credential.user, profileSnapshot.data()));
    setScreen('inicio');
  };

  const logout = async () => {
    setEditing(null);
    setAuthError('');
    await signOut(auth);
    setScreen('login');
  };

  const create = (date) => {
    setReturnTo(screen === 'cadastrar' ? 'inicio' : screen);
    setEditing(null);
    if (date) setSelectedDate(date);
    setScreen('cadastrar');
  };

  const edit = (activity) => {
    if (!activity.canManage) return;
    setReturnTo(screen);
    setEditing(activity);
    setSelectedDate(activity.date);
    setScreen('cadastrar');
  };

  const finishForm = () => {
    setEditing(null);
    setScreen(returnTo);
  };

  const save = async (draft) => {
    if (!user) return;
    const existing = activities.find((item) => item.id === draft.id);
    if (existing && existing.ownerId !== user.id) return;

    const visibility = existing
      ? existing.visibility
      : (user.role === 'professor' ? 'global' : 'private');
    const activityDocument = {
      titulo: draft.title,
      materia: draft.subject,
      descricao: draft.description || '',
      data: draft.date,
      horario: draft.time || '',
      visibilidade: visibility === 'global' ? 'global' : 'privada',
      criadoPor: existing ? existing.ownerId : user.id,
    };

    try {
      await setDoc(doc(db, 'atividades', draft.id), activityDocument);
      if (visibility === 'private') {
        await setDoc(doc(db, 'usuarios', user.id, 'resultados', draft.id), {
          concluida: Boolean(draft.completed),
          nota: draft.grade === undefined ? null : draft.grade,
        }, { merge: true });
      }
      setDataError('');
      finishForm();
    } catch (error) {
      setDataError(firebaseMessage(error));
    }
  };

  const remove = async (id) => {
    const activity = activities.find((item) => item.id === id);
    if (!activity || activity.ownerId !== user?.id) return;
    try {
      await deleteDoc(doc(db, 'atividades', id));
      setDataError('');
    } catch (error) {
      setDataError(firebaseMessage(error));
    }
  };

  const updateProgress = async (activityId, changes) => {
    if (!user) return;
    const result = {};
    if (Object.prototype.hasOwnProperty.call(changes, 'completed')) result.concluida = Boolean(changes.completed);
    if (Object.prototype.hasOwnProperty.call(changes, 'grade')) result.nota = changes.grade;
    try {
      await setDoc(doc(db, 'usuarios', user.id, 'resultados', activityId), result, { merge: true });
      setDataError('');
    } catch (error) {
      setDataError(firebaseMessage(error));
    }
  };

  const toggleComplete = (activity) => updateProgress(activity.id, { completed: !activity.completed });
  const saveGrade = (activity, grade) => updateProgress(activity.id, { grade });

  const go = (name) => {
    setEditing(null);
    setScreen(name);
  };

  if (!authReady) {
    return <View style={styles.loading}><StatusBar style="dark" /><ActivityIndicator size="large" color="#27A989" /><Text style={styles.loadingText}>Conectando ao Study Flow...</Text></View>;
  }

  if (!user) {
    return (
      <View style={styles.app}>
        <StatusBar style="dark" />
        <Login onLogin={login} onRegister={register} error={authError} />
      </View>
    );
  }

  const visibleActivities = activities.map((activity) => {
    const savedProgress = progress[activity.id] || {};
    const isGlobal = activity.visibility === 'global';
    return {
      ...activity,
      completed: Boolean(savedProgress.completed),
      grade: savedProgress.grade === undefined ? null : savedProgress.grade,
      canManage: activity.ownerId === user.id,
      isShared: isGlobal && activity.ownerId !== user.id,
      canRecordGrade: isGlobal && user.role === 'estudante',
    };
  });

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      {dataError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{dataError}</Text><Pressable onPress={() => setDataError('')}><Text style={styles.dismiss}>Fechar</Text></Pressable></View> : null}
      <View style={styles.screen}>
        {screen === 'inicio' && <Inicio user={user} activities={visibleActivities} onCreate={() => create()} onEdit={edit} onNavigate={go} onLogout={logout} />}
        {screen === 'cadastrar' && <Cadastrar activity={editing} initialDate={selectedDate} role={user.role} onSave={save} onCancel={finishForm} />}
        {screen === 'calendario' && <Calendario activities={visibleActivities} selectedDate={selectedDate} onSelectDate={setSelectedDate} onCreate={create} onEdit={edit} onDelete={remove} />}
        {screen === 'notas' && <Notas activities={visibleActivities} onCreate={() => create()} onEdit={edit} onDelete={remove} onToggleComplete={toggleComplete} onSaveGrade={saveGrade} />}
      </View>
      <View style={styles.tabs}>
        {[['inicio', '⌂', 'Início'], ['calendario', '▦', 'Calendário'], ['notas', '✓', 'Notas']].map(([key, icon, label]) => (
          <Pressable key={key} onPress={() => go(key)} style={styles.tab}>
            <Text style={[styles.tabIcon, screen === key && styles.selected]}>{icon}</Text>
            <Text style={[styles.tabLabel, screen === key && styles.selected]}>{label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => create()} style={styles.tab}>
          <Text style={[styles.tabIcon, screen === 'cadastrar' && styles.selected]}>＋</Text>
          <Text style={[styles.tabLabel, screen === 'cadastrar' && styles.selected]}>Nova</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F5F7FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { color: '#7D8798', fontSize: 12, marginTop: 12 },
  screen: { flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', paddingHorizontal: 14, paddingVertical: 9 },
  errorText: { flex: 1, color: '#A63845', fontSize: 11, lineHeight: 16 },
  dismiss: { color: '#A63845', fontSize: 10, fontWeight: '800', paddingLeft: 10 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E7ECF2', paddingVertical: 9 },
  tab: { minWidth: 65, alignItems: 'center', paddingHorizontal: 5 },
  tabIcon: { color: '#7D8798', fontSize: 20 },
  tabLabel: { color: '#7D8798', fontSize: 10, fontWeight: '600', marginTop: 2 },
  selected: { color: '#27A989' },
});
