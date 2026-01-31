import { StyleSheet, Text, View } from 'react-native';

export default function ClientCardsScreen() {
  return (
        <View style={styles.container}>
          <Text>Client Card</Text>
          <Text>Add Card</Text>
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