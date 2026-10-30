import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from "../firebase";

const SUBJECTS = [
  'Português', 'Literatura', 'Redação', 'Matemática', 'História', 'Geografia',
  'Ciências', 'Biologia', 'Física', 'Química', 'Inglês', 'Espanhol',
  'Filosofia', 'Sociologia', 'Arte', 'Educação Física', 'Outra',
];

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, maxLength }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A7AFBC"
      multiline={multiline} keyboardType={keyboardType || 'default'} maxLength={maxLength}
      textAlignVertical={multiline ? 'top' : 'center'} style={[styles.input, multiline && styles.multiline]} />
  </View>;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function Cadastrar({ activity, initialDate, role, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: activity ? activity.title : '',
    subject: activity && SUBJECTS.includes(activity.subject) ? activity.subject : '',
    description: activity ? activity.description : '',
    date: activity ? activity.date : initialDate,
    time: activity ? activity.time : '09:00',
    grade: activity && activity.grade !== null && activity.grade !== undefined ? String(activity.grade) : '',
  }));
  const [error, setError] = useState('');
  const change = (key, value) => { setForm((old) => ({ ...old, [key]: value })); setError(''); };

  const submit = () => {
    if (!form.title.trim()) return setError('Digite o nome da atividade.');
    if (!form.subject) return setError('Selecione uma matéria.');
    if (!validDate(form.date)) return setError('Use uma data válida no formato AAAA-MM-DD.');
    const gradeText = form.grade.trim().replace(',', '.');
    const grade = gradeText === '' ? null : Number(gradeText);
    if (role !== 'professor' && gradeText && (!Number.isFinite(grade) || grade < 0 || grade > 10)) return setError('A nota deve estar entre 0 e 10.');
    onSave({
      id: activity ? activity.id : String(Date.now()) + '-' + Math.floor(Math.random() * 100000),
      title: form.title.trim(), subject: form.subject, description: form.description.trim(),
      date: form.date, time: form.time.trim(), grade: role === 'professor' ? null : grade,
      completed: activity ? Boolean(activity.completed) : false,
    });
  };

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={onCancel} style={styles.back}><Text style={styles.backArrow}>‹</Text><Text style={styles.muted}>Voltar</Text></Pressable>
    <Text style={styles.kicker}>PLANEJE SEU PRÓXIMO PASSO</Text>
    <Text style={styles.title}>{activity ? 'Editar atividade' : 'Nova atividade'}</Text>
    <Text style={styles.intro}>{role === 'professor' ? 'Esta atividade ficará disponível para todos os usuários.' : 'Esta atividade ficará visível somente para você.'}</Text>
    <View style={styles.card}>
      <Field label="Nome da atividade *" value={form.title} onChangeText={(v) => change('title', v)} placeholder="Ex.: Revisar matemática" maxLength={80} />

      <View style={styles.field}>
        <Text style={styles.label}>Matéria *</Text>
        <Text style={styles.hint}>Selecione uma opção</Text>
        <View style={styles.subjectBox}>
          {SUBJECTS.map((subject) => {
            const selected = form.subject === subject;
            return <Pressable key={subject} onPress={() => change('subject', subject)} style={[styles.subjectOption, selected && styles.subjectOptionSelected]}>
              <Text style={[styles.subjectText, selected && styles.subjectTextSelected]}>{subject}</Text>
            </Pressable>;
          })}
        </View>
      </View>

      <Field label="Descrição" value={form.description} onChangeText={(v) => change('description', v)} placeholder="O que você vai estudar?" multiline maxLength={300} />
      <View style={styles.row}>
        <View style={styles.column}><Field label="Data *" value={form.date} onChangeText={(v) => change('date', v)} placeholder="AAAA-MM-DD" maxLength={10} /></View>
        <View style={styles.column}><Field label="Horário" value={form.time} onChangeText={(v) => change('time', v)} placeholder="09:00" maxLength={5} /></View>
      </View>
      {role === 'professor'
        ? <Text style={styles.gradeHint}>Cada estudante registra sua própria nota na tela de notas.</Text>
        : <Field label="Nota (0 a 10)" value={form.grade} onChangeText={(v) => change('grade', v)} placeholder="Adicione quando tiver um resultado" keyboardType="decimal-pad" maxLength={5} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={submit} style={styles.save}><Text style={styles.saveText}>{activity ? 'Salvar alterações' : 'Adicionar atividade'}</Text></Pressable>
      <Pressable onPress={onCancel} style={styles.cancel}><Text style={styles.muted}>Cancelar</Text></Pressable>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 22 },
  backArrow: { color: '#17243C', fontSize: 27, marginRight: 6 },
  muted: { color: '#7D8798', fontSize: 13, fontWeight: '600' },
  kicker: { color: '#27A989', fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 },
  title: { color: '#17243C', fontSize: 27, fontWeight: '800' },
  intro: { color: '#7D8798', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 19, padding: 16 },
  field: { marginBottom: 13 },
  label: { color: '#17243C', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  hint: { color: '#7D8798', fontSize: 10, marginBottom: 8 },
  input: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E7ECF2', paddingHorizontal: 11, color: '#17243C', fontSize: 13, backgroundColor: '#FCFDFE' },
  multiline: { minHeight: 85, paddingTop: 11 },
  subjectBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, padding: 10, borderWidth: 1, borderColor: '#E7ECF2', borderRadius: 12, backgroundColor: '#FCFDFE' },
  subjectOption: { borderRadius: 9, borderWidth: 1, borderColor: '#E7ECF2', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  subjectOptionSelected: { borderColor: '#35C7A4', backgroundColor: '#E8F8F3' },
  subjectText: { color: '#667286', fontSize: 11, fontWeight: '600' },
  subjectTextSelected: { color: '#147C65', fontWeight: '800' },
  row: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  gradeHint: { color: '#7D8798', fontSize: 11, lineHeight: 16, marginBottom: 13 },
  error: { color: '#C94D5B', fontSize: 12, marginBottom: 10 },
  save: { minHeight: 47, backgroundColor: '#35C7A4', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  saveText: { color: '#10283A', fontSize: 13, fontWeight: '800' },
  cancel: { alignItems: 'center', padding: 12 },
});

