import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function authErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já possui uma conta.',
    'auth/invalid-email': 'O e-mail informado não é válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/operation-not-allowed': 'Ative E-mail/senha em Authentication no Firebase Console.',
    'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/network-request-failed': 'Sem conexão com o Firebase. Confira sua internet.',
  };
  return messages[error?.code] || error?.message || 'Não foi possível concluir. Tente novamente.';
}

export default function Login({ onLogin, onRegister, error }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setFormError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) return setFormError('Digite um e-mail válido.');
    if (password.length < 6) return setFormError('A senha precisa ter pelo menos 6 caracteres.');
    if (mode === 'register') {
      if (!name.trim()) return setFormError('Digite seu nome.');
      if (password !== confirmation) return setFormError('As senhas não coincidem.');
    }

    setSubmitting(true);
    try {
      if (mode === 'register') await onRegister({ name: name.trim(), email: cleanEmail, password });
      else await onLogin({ email: cleanEmail, password });
    } catch (submitError) {
      setFormError(authErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.logo}><Text style={styles.logoText}>SF</Text></View>
    <Text style={styles.brand}>STUDY FLOW</Text>
    <Text style={styles.title}>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</Text>
    <Text style={styles.subtitle}>Seu espaço para organizar e acompanhar os estudos.</Text>

    <View style={styles.modeSwitch}>
      <Pressable onPress={() => { setMode('login'); setFormError(''); }} style={[styles.modeButton, mode === 'login' && styles.modeActive]}>
        <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Entrar</Text>
      </Pressable>
      <Pressable onPress={() => { setMode('register'); setFormError(''); }} style={[styles.modeButton, mode === 'register' && styles.modeActive]}>
        <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>Criar conta</Text>
      </Pressable>
    </View>

    <View style={styles.form}>
      {mode === 'register' ? <>
        <Text style={styles.label}>Nome</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#A7AFBC" style={styles.input} autoCapitalize="words" />
      </> : null}

      <Text style={styles.label}>E-mail</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="voce@email.com" placeholderTextColor="#A7AFBC" style={styles.input} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.label}>Senha</Text>
      <TextInput value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor="#A7AFBC" style={styles.input} secureTextEntry />

      {mode === 'register' ? <>
        <Text style={styles.label}>Confirme a senha</Text>
        <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="Digite a senha novamente" placeholderTextColor="#A7AFBC" style={styles.input} secureTextEntry />
      </> : null}

      {formError || error ? <Text style={styles.error}>{formError || error}</Text> : null}
      <Pressable disabled={submitting} onPress={submit} style={[styles.submit, submitting && styles.submitDisabled]}>
        <Text style={styles.submitText}>{submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
      </Pressable>
    </View>

    <Text style={styles.footnote}>{mode === 'register'
      ? 'Novas contas são criadas como estudante. Um administrador precisa liberar o perfil de professor.'
      : 'Suas atividades e seus resultados ficam vinculados à sua conta.'}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingTop: 35, paddingBottom: 35 },
  logo: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#35C7A4', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  brand: { color: '#17243C', textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 10 },
  title: { color: '#17243C', fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 24 },
  subtitle: { color: '#7D8798', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#E9EDF3', borderRadius: 12, padding: 4, marginBottom: 17 },
  modeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  modeActive: { backgroundColor: '#FFFFFF' },
  modeText: { color: '#7D8798', fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: '#17243C' },
  form: { backgroundColor: '#FFFFFF', borderRadius: 19, borderWidth: 1, borderColor: '#E7ECF2', padding: 17 },
  label: { color: '#17243C', fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: { minHeight: 45, borderRadius: 10, borderWidth: 1, borderColor: '#E7ECF2', paddingHorizontal: 11, color: '#17243C', fontSize: 13, backgroundColor: '#FCFDFE' },
  error: { color: '#C94D5B', fontSize: 11, marginTop: 10 },
  submit: { minHeight: 47, backgroundColor: '#35C7A4', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: '#10283A', fontSize: 13, fontWeight: '800' },
  footnote: { color: '#8993A2', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 16 },
});
