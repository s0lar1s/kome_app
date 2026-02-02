import { StyleSheet, Text, View } from 'react-native';

export default function CodesScreen() {
  return (
        <View style={styles.container}>
          <Text>Promo codes</Text>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});