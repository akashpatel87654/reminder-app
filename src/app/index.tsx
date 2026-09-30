import { Button, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { styles } from '../lib/styles';

export default function Home() {
  return (
    <View style={styles.screen}>
      <Text>Subscriptions coming in T3.</Text>
      <Button title="Log out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
