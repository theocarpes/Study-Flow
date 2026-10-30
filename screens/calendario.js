import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from "../firebase";

const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const dateKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

function ActivityRow({ activity, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return <View style={styles.activity}>
    <View style={styles.accent} />
    <View style={styles.activityBody}>
      <View style={styles.titleRow}>
        <Text style={styles.activityTitle} numberOfLines={1}>{activity.title}</Text>
        {activity.completed ? <Text style={styles.badge}>FEITA</Text> : null}
      </View>
      <Text style={styles.meta}>{(activity.subject || 'Estudos') + (activity.time ? ' · ' + activity.time : '')}</Text>
      {activity.isShared ? <Text style={styles.shared}>ATIVIDADE DO PROFESSOR</Text> : null}
      {activity.canManage ? <View style={styles.actions}>
        <Pressable onPress={() => onEdit(activity)}><Text style={styles.edit}>Editar</Text></Pressable>
        {confirm ? <>
          <Pressable onPress={() => onDelete(activity.id)}><Text style={styles.delete}>Confirmar exclusão</Text></Pressable>
          <Pressable onPress={() => setConfirm(false)}><Text style={styles.meta}>Cancelar</Text></Pressable>
        </> : <Pressable onPress={() => setConfirm(true)}><Text style={styles.delete}>Excluir</Text></Pressable>}
      </View> : null}
    </View>
  </View>;
}

export default function Calendario({ activities, selectedDate, onSelectDate, onCreate, onEdit, onDelete }) {
  const selected = parseDate(selectedDate);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array(offset).fill(null).concat(Array.from({ length: count }, (_, i) => i + 1));
  while (cells.length % 7) cells.push(null);
  const today = dateKey(new Date());
  const dayItems = activities.filter((a) => a.date === selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const moveMonth = (n) => onSelectDate(dateKey(new Date(year, month + n, 1)));
  const dayLabel = parseDate(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.head}><View><Text style={styles.kicker}>VISÃO GERAL</Text><Text style={styles.title}>Calendário</Text></View><Text style={styles.icon}>▦</Text></View>
    <Text style={styles.intro}>Escolha um dia para ver ou planejar seus estudos.</Text>
    <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.arrow}>‹</Text></Pressable>
        <Text style={styles.monthTitle}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
        <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.arrow}>›</Text></Pressable>
      </View>
      <View style={styles.week}>{weekdays.map((d) => <Text key={d} style={styles.weekday}>{d}</Text>)}</View>
      <View style={styles.grid}>{cells.map((day, i) => {
        if (!day) return <View key={'blank' + i} style={styles.cell} />;
        const value = dateKey(new Date(year, month, day));
        const active = value === selectedDate;
        const has = activities.some((a) => a.date === value);
        return <Pressable key={value} onPress={() => onSelectDate(value)} style={styles.cell}>
          <View style={[styles.day, active && styles.selected, value === today && !active && styles.today]}><Text style={[styles.dayText, active && styles.selectedText]}>{day}</Text></View>
          <View style={[styles.dot, has && styles.hasActivity]} />
        </Pressable>;
      })}</View>
      <Pressable onPress={() => onSelectDate(today)} style={styles.todayLink}><Text style={styles.link}>Ir para hoje</Text></Pressable>
    </View>

    <View style={styles.listHead}><View><Text style={styles.section}>Atividades do dia</Text><Text style={styles.dayLabel}>{dayLabel}</Text></View><Text style={styles.count}>{dayItems.length}</Text></View>
    {dayItems.length ? dayItems.map((a) => <ActivityRow key={a.id} activity={a} onEdit={onEdit} onDelete={onDelete} />) : (
      <View style={styles.empty}><Text style={styles.emptyTitle}>Dia livre para planejar</Text><Text style={styles.meta}>Adicione uma atividade para este dia.</Text></View>
    )}
    <Pressable onPress={() => onCreate(selectedDate)} style={styles.create}><Text style={styles.createText}>＋  Adicionar neste dia</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 23, paddingBottom: 28 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#27A989', fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 5 },
  title: { color: '#17243C', fontSize: 27, fontWeight: '800' },
  icon: { color: '#27A989', backgroundColor: '#E8F8F3', fontSize: 23, overflow: 'hidden', borderRadius: 13, padding: 8 },
  intro: { color: '#7D8798', fontSize: 13, marginTop: 7, marginBottom: 15 },
  calendar: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 18, padding: 14 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  monthButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  arrow: { color: '#17243C', fontSize: 24 },
  monthTitle: { color: '#17243C', fontSize: 14, fontWeight: '800' },
  week: { flexDirection: 'row', marginBottom: 6 },
  weekday: { width: '14.2857%', textAlign: 'center', color: '#7D8798', fontSize: 9, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', height: 42, alignItems: 'center', justifyContent: 'center' },
  day: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: '#35C7A4' },
  today: { borderWidth: 1, borderColor: '#35C7A4' },
  dayText: { color: '#17243C', fontSize: 12, fontWeight: '600' },
  selectedText: { color: '#FFFFFF', fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 0, backgroundColor: 'transparent' },
  hasActivity: { backgroundColor: '#8978EA' },
  todayLink: { alignSelf: 'center', padding: 8 },
  link: { color: '#27A989', fontSize: 11, fontWeight: '800' },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21, marginBottom: 10 },
  section: { color: '#17243C', fontSize: 15, fontWeight: '800' },
  dayLabel: { color: '#7D8798', fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  count: { color: '#27A989', backgroundColor: '#E8F8F3', overflow: 'hidden', borderRadius: 15, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 16, padding: 19 },
  emptyTitle: { color: '#17243C', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  meta: { color: '#7D8798', fontSize: 11, marginTop: 5 },
  activity: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  accent: { width: 4, backgroundColor: '#35C7A4' },
  activityBody: { flex: 1, padding: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  activityTitle: { flex: 1, color: '#17243C', fontSize: 12, fontWeight: '800' },
  badge: { color: '#27A989', backgroundColor: '#E8F8F3', overflow: 'hidden', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: '800' },
  shared: { color: '#8978EA', fontSize: 9, fontWeight: '800', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 14, marginTop: 7 },
  edit: { color: '#27A989', fontSize: 11, fontWeight: '800' },
  delete: { color: '#C94D5B', fontSize: 11, fontWeight: '700' },
  create: { alignItems: 'center', justifyContent: 'center', minHeight: 46, backgroundColor: '#17243C', borderRadius: 12, marginTop: 12 },
  createText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

