import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from "../firebase";

const SUBJECTS = [
  'Português', 'Literatura', 'Redação', 'Matemática', 'História', 'Geografia',
  'Ciências', 'Biologia', 'Física', 'Química', 'Inglês', 'Espanhol',
  'Filosofia', 'Sociologia', 'Arte', 'Educação Física', 'Outra',
];

const dateLabel = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ActivityCard({ activity, onToggleComplete, onEdit, onDelete, onSaveGrade }) {
  const [confirm, setConfirm] = useState(false);
  const [gradeMode, setGradeMode] = useState(false);
  const [gradeDraft, setGradeDraft] = useState(activity.grade === null || activity.grade === undefined ? '' : String(activity.grade));
  const [gradeError, setGradeError] = useState('');
  const hasGrade = activity.grade !== null && activity.grade !== undefined;

  const submitGrade = () => {
    const value = Number(gradeDraft.trim().replace(',', '.'));
    if (!gradeDraft.trim() || !Number.isFinite(value) || value < 0 || value > 10) {
      setGradeError('Informe uma nota de 0 a 10.');
      return;
    }
    onSaveGrade(activity, value);
    setGradeMode(false);
    setGradeError('');
  };

  return <View style={styles.card}>
    <View style={[styles.mark, activity.completed && styles.doneMark]} />
    <View style={styles.cardBody}>
      <View style={styles.titleRow}>
        <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
        <Text style={[styles.grade, hasGrade ? styles.hasGrade : styles.noGrade]}>{hasGrade ? Number(activity.grade).toLocaleString('pt-BR') + '/10' : 'Sem nota'}</Text>
      </View>
      <Text style={styles.meta}>{dateLabel(activity.date)}{activity.time ? ' · ' + activity.time : ''}</Text>
      {activity.isShared ? <Text style={styles.shared}>ATIVIDADE DO PROFESSOR</Text> : null}
      {activity.description ? <Text style={styles.description} numberOfLines={2}>{activity.description}</Text> : null}

      {activity.canRecordGrade ? (
        gradeMode ? <View style={styles.gradeEditor}>
          <TextInput value={gradeDraft} onChangeText={(value) => { setGradeDraft(value); setGradeError(''); }} keyboardType="decimal-pad" placeholder="Nota de 0 a 10" placeholderTextColor="#A7AFBC" style={styles.gradeInput} />
          <Pressable onPress={submitGrade} style={styles.gradeSave}><Text style={styles.gradeSaveText}>Salvar nota</Text></Pressable>
          <Pressable onPress={() => { setGradeMode(false); setGradeError(''); }} style={styles.gradeCancel}><Text style={styles.meta}>Cancelar</Text></Pressable>
          {gradeError ? <Text style={styles.gradeError}>{gradeError}</Text> : null}
        </View> : <Pressable onPress={() => { setGradeDraft(hasGrade ? String(activity.grade) : ''); setGradeMode(true); }} style={styles.gradeAction}>
          <Text style={styles.gradeActionText}>{hasGrade ? 'Atualizar minha nota' : 'Adicionar minha nota'}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => onToggleComplete(activity)}><Text style={styles.complete}>{activity.completed ? 'Desfazer conclusão' : 'Marcar como feita'}</Text></Pressable>
        {activity.canManage ? <>
          <Pressable onPress={() => onEdit(activity)}><Text style={styles.edit}>Editar</Text></Pressable>
          {confirm ? <>
            <Pressable onPress={() => onDelete(activity.id)}><Text style={styles.delete}>Confirmar</Text></Pressable>
            <Pressable onPress={() => setConfirm(false)}><Text style={styles.meta}>Cancelar</Text></Pressable>
          </> : <Pressable onPress={() => setConfirm(true)}><Text style={styles.delete}>Excluir</Text></Pressable>}
        </> : null}
      </View>
    </View>
  </View>;
}

function SubjectSection({ subject, activities, onToggleComplete, onEdit, onDelete, onSaveGrade }) {
  const graded = activities.filter((a) => a.grade !== null && a.grade !== undefined && Number.isFinite(Number(a.grade)));
  const average = graded.length
    ? (graded.reduce((sum, a) => sum + Number(a.grade), 0) / graded.length).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '—';

  return <View style={styles.subjectSection}>
    <View style={styles.subjectHeader}>
      <View style={styles.subjectTitleRow}>
        <View style={styles.subjectMark} />
        <Text style={styles.subjectTitle}>{subject}</Text>
        <Text style={styles.subjectCount}>{activities.length}</Text>
      </View>
      <Text style={styles.subjectAverage}>Média da matéria: {average}</Text>
    </View>
    {activities.map((activity) => (
      <ActivityCard key={activity.id} activity={activity} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} onSaveGrade={onSaveGrade} />
    ))}
  </View>;
}

export default function Notas({ activities, onCreate, onEdit, onDelete, onToggleComplete, onSaveGrade }) {
  const [filter, setFilter] = useState('concluidas');
  const graded = activities.filter((a) => a.grade !== null && a.grade !== undefined && Number.isFinite(Number(a.grade)));
  const average = graded.length
    ? (graded.reduce((sum, a) => sum + Number(a.grade), 0) / graded.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    : '—';
  const shown = activities
    .filter((a) => filter === 'todas' || a.completed)
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const presentSubjects = Array.from(new Set(shown.map((a) => a.subject || 'Sem matéria')));
  presentSubjects.sort((a, b) => {
    const indexA = SUBJECTS.indexOf(a);
    const indexB = SUBJECTS.indexOf(b);
    return (indexA < 0 ? SUBJECTS.length : indexA) - (indexB < 0 ? SUBJECTS.length : indexB);
  });

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.head}><View><Text style={styles.kicker}>ACOMPANHE SUA EVOLUÇÃO</Text><Text style={styles.title}>Notas por matéria</Text></View><Text style={styles.icon}>✓</Text></View>
    <Text style={styles.intro}>Atividades públicas e pessoais, com notas individuais.</Text>
    <View style={styles.stats}>
      <View style={styles.stat}><Text style={styles.statNum}>{activities.filter((a) => a.completed).length}</Text><Text style={styles.statLabel}>concluídas</Text></View>
      <View style={styles.stat}><Text style={styles.statNum}>{graded.length}</Text><Text style={styles.statLabel}>com nota</Text></View>
      <View style={styles.stat}><Text style={styles.average}>{average}</Text><Text style={styles.statLabel}>média geral</Text></View>
    </View>
    <View style={styles.filters}>
      <Pressable onPress={() => setFilter('concluidas')} style={[styles.filter, filter === 'concluidas' && styles.activeFilter]}><Text style={styles.filterText}>Concluídas</Text></Pressable>
      <Pressable onPress={() => setFilter('todas')} style={[styles.filter, filter === 'todas' && styles.activeFilter]}><Text style={styles.filterText}>Todas</Text></Pressable>
    </View>
    <View style={styles.listHead}><Text style={styles.section}>{filter === 'todas' ? 'Todas as matérias' : 'Matérias concluídas'}</Text><Text style={styles.meta}>{shown.length} atividades</Text></View>
    {shown.length ? presentSubjects.map((subject) => {
      const subjectActivities = shown.filter((activity) => (activity.subject || 'Sem matéria') === subject);
      return <SubjectSection key={subject} subject={subject} activities={subjectActivities} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} onSaveGrade={onSaveGrade} />;
    }) : (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{filter === 'todas' ? 'Sua lista está vazia' : 'Suas conquistas começam aqui'}</Text>
        <Text style={styles.meta}>{filter === 'todas' ? 'Cadastre uma atividade para acompanhar seus estudos.' : 'Marque uma atividade como feita para vê-la aqui.'}</Text>
        <Pressable onPress={onCreate} style={styles.newButton}><Text style={styles.newText}>＋  Nova atividade</Text></Pressable>
      </View>
    )}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 23, paddingBottom: 28 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#27A989', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  title: { color: '#17243C', fontSize: 23, fontWeight: '800' },
  icon: { color: '#8978EA', backgroundColor: '#F0EDFF', borderRadius: 13, overflow: 'hidden', fontSize: 22, padding: 9 },
  intro: { color: '#7D8798', fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 15 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  stat: { flex: 1, minHeight: 73, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 14 },
  statNum: { color: '#17243C', fontSize: 20, fontWeight: '800' },
  average: { color: '#8978EA', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#7D8798', fontSize: 9, marginTop: 3 },
  filters: { flexDirection: 'row', backgroundColor: '#E9EDF3', borderRadius: 11, padding: 4, marginBottom: 18 },
  filter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34, borderRadius: 8 },
  activeFilter: { backgroundColor: '#FFFFFF' },
  filterText: { color: '#17243C', fontSize: 11, fontWeight: '700' },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  section: { color: '#17243C', fontSize: 15, fontWeight: '800' },
  subjectSection: { marginBottom: 8 },
  subjectHeader: { backgroundColor: '#E8F8F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  subjectTitleRow: { flexDirection: 'row', alignItems: 'center' },
  subjectMark: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#27A989', marginRight: 8 },
  subjectTitle: { flex: 1, color: '#17243C', fontSize: 13, fontWeight: '800' },
  subjectCount: { color: '#147C65', fontSize: 10, fontWeight: '800' },
  subjectAverage: { color: '#527267', fontSize: 10, marginTop: 5, marginLeft: 15 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 15, padding: 12, marginBottom: 8 },
  mark: { width: 4, borderRadius: 3, backgroundColor: '#E9B05B', marginRight: 10 },
  doneMark: { backgroundColor: '#35C7A4' },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  activityTitle: { flex: 1, color: '#17243C', fontSize: 12, lineHeight: 17, fontWeight: '800', marginRight: 7 },
  grade: { borderRadius: 7, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4, fontSize: 9, fontWeight: '800' },
  hasGrade: { color: '#8978EA', backgroundColor: '#F0EDFF' },
  noGrade: { color: '#7D8798', backgroundColor: '#F2F4F7' },
  meta: { color: '#7D8798', fontSize: 10, marginTop: 5 },
  shared: { color: '#8978EA', fontSize: 9, fontWeight: '800', marginTop: 5 },
  description: { color: '#17243C', fontSize: 11, marginTop: 6, lineHeight: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  complete: { color: '#27A989', fontSize: 10, fontWeight: '800' },
  edit: { color: '#8978EA', fontSize: 10, fontWeight: '800' },
  delete: { color: '#C94D5B', fontSize: 10, fontWeight: '700' },
  gradeAction: { alignSelf: 'flex-start', backgroundColor: '#F0EDFF', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginTop: 8 },
  gradeActionText: { color: '#6E5CC6', fontSize: 10, fontWeight: '800' },
  gradeEditor: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  gradeInput: { width: 105, height: 35, borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 8, paddingHorizontal: 9, color: '#17243C', fontSize: 11 },
  gradeSave: { backgroundColor: '#35C7A4', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 9 },
  gradeSaveText: { color: '#10283A', fontSize: 10, fontWeight: '800' },
  gradeCancel: { padding: 5 },
  gradeError: { width: '100%', color: '#C94D5B', fontSize: 10 },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 16, padding: 21 },
  emptyTitle: { color: '#17243C', fontSize: 13, fontWeight: '800' },
  newButton: { backgroundColor: '#E8F8F3', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 13 },
  newText: { color: '#17243C', fontSize: 11, fontWeight: '800' },
});

