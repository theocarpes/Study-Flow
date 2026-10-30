import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { auth, db } from "../firebase";

const keyFor = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const prettyDate = (value, part) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', part === 'day' ? { day: '2-digit' } : { month: 'short' }).replace('.', '');
};

export default function Inicio({ user, activities, onCreate, onEdit, onNavigate, onLogout }) {
  const today = keyFor(new Date());
  const done = activities.filter((a) => a.completed).length;
  const upcoming = activities.filter((a) => !a.completed && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  const roleLabel = user.role === 'professor' ? 'Professor' : 'Estudante';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}><Text style={styles.logoText}>SF</Text></View>
        <View style={styles.brandCopy}><Text style={styles.brandText}>STUDY FLOW</Text><Text style={styles.accountText}>{user.name} · {roleLabel}</Text></View>
        <Pressable onPress={onLogout} style={styles.logout}><Text style={styles.logoutText}>Sair</Text></Pressable>
      </View>
      <Text style={styles.kicker}>SEU ESPAÇO DE ESTUDOS</Text>
      <Text style={styles.title}>Olá, {user.name.split(' ')[0]} 👋</Text>
      <Text style={styles.sub}>Organize sua rotina e acompanhe cada conquista.</Text>

      <View style={styles.hero}>
        <Text style={styles.pill}>{user.role === 'professor' ? 'PARA SUA TURMA' : 'SEU PROGRESSO'}</Text>
        <Text style={styles.heroTitle}>{user.role === 'professor' ? 'Compartilhe conhecimento.' : 'Um passo de cada vez.'}</Text>
        <Text style={styles.heroCopy}>{activities.length ? 'Você já concluiu ' + done + ' de ' + activities.length + ' atividades visíveis.' : 'Comece adicionando sua primeira atividade de estudo.'}</Text>
        <Pressable onPress={onCreate} style={styles.primary}><Text style={styles.primaryText}>{user.role === 'professor' ? '＋  Publicar atividade' : '＋  Cadastrar atividade pessoal'}</Text></Pressable>
      </View>

      <Text style={styles.section}>Organize sua rotina</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => onNavigate('calendario')} style={styles.action}><Text style={styles.actionIcon}>▦</Text><Text style={styles.actionTitle}>Calendário</Text><Text style={styles.actionSub}>Veja seus dias</Text></Pressable>
        <Pressable onPress={() => onNavigate('notas')} style={styles.action}><Text style={[styles.actionIcon, styles.purple]}>✓</Text><Text style={styles.actionTitle}>Notas</Text><Text style={styles.actionSub}>Acompanhe resultados</Text></Pressable>
      </View>

      <View style={styles.heading}><View><Text style={styles.section}>Próximas atividades</Text><Text style={styles.actionSub}>Públicas e suas atividades pessoais</Text></View><Pressable onPress={() => onNavigate('calendario')}><Text style={styles.link}>Ver calendário ›</Text></Pressable></View>
      {upcoming.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Tudo em dia por aqui</Text><Text style={styles.actionSub}>Cadastre uma atividade para montar seu plano de estudos.</Text></View>
      ) : upcoming.map((a) => (
        <Pressable key={a.id} disabled={!a.canManage} onPress={() => onEdit(a)} style={styles.item}>
          <View style={styles.date}><Text style={styles.dateDay}>{prettyDate(a.date, 'day')}</Text><Text style={styles.dateMonth}>{prettyDate(a.date, 'month')}</Text></View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>{a.title}</Text>
            <Text style={styles.actionSub}>{(a.subject || 'Estudos') + (a.time ? ' · ' + a.time : '')}</Text>
          </View>
          {a.isShared ? <Text style={styles.sharedLabel}>PROFESSOR</Text> : <Text style={styles.arrow}>›</Text>}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 26 },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  logo: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#35C7A4', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  brandCopy: { flex: 1, marginLeft: 10 },
  brandText: { color: '#17243C', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  accountText: { color: '#7D8798', fontSize: 9, marginTop: 3 },
  logout: { paddingHorizontal: 11, paddingVertical: 7, backgroundColor: '#FFFFFF', borderRadius: 9, borderWidth: 1, borderColor: '#E7ECF2' },
  logoutText: { color: '#7D8798', fontSize: 10, fontWeight: '700' },
  kicker: { color: '#27A989', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 7 },
  title: { color: '#17243C', fontSize: 26, fontWeight: '800' },
  sub: { color: '#7D8798', fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  hero: { backgroundColor: '#202E4A', borderRadius: 21, padding: 20, marginBottom: 24 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#314260', color: '#D7E3F5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginTop: 14 },
  heroCopy: { color: '#D1DBE8', fontSize: 12, lineHeight: 19, marginTop: 5 },
  primary: { alignSelf: 'flex-start', backgroundColor: '#35C7A4', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11, marginTop: 16 },
  primaryText: { color: '#10283A', fontSize: 11, fontWeight: '800' },
  section: { color: '#17243C', fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 11, marginTop: 12, marginBottom: 23 },
  action: { flex: 1, minHeight: 115, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 16, padding: 14 },
  actionIcon: { color: '#27A989', fontSize: 20, marginBottom: 9 },
  purple: { color: '#8978EA' },
  actionTitle: { color: '#17243C', fontSize: 13, fontWeight: '800' },
  actionSub: { color: '#7D8798', fontSize: 10, marginTop: 4, lineHeight: 15 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  link: { color: '#27A989', fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E7ECF2', padding: 20 },
  emptyTitle: { color: '#17243C', fontSize: 13, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E7ECF2', padding: 11, marginBottom: 8 },
  date: { width: 45, height: 46, borderRadius: 11, backgroundColor: '#E8F8F3', alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: '#17243C', fontSize: 15, fontWeight: '800' },
  dateMonth: { color: '#7D8798', fontSize: 9, textTransform: 'uppercase' },
  itemInfo: { flex: 1, marginLeft: 11 },
  itemTitle: { color: '#17243C', fontSize: 12, fontWeight: '700' },
  sharedLabel: { color: '#8978EA', fontSize: 8, fontWeight: '800', marginLeft: 6 },
  arrow: { color: '#7D8798', fontSize: 21, paddingHorizontal: 5 },
});

