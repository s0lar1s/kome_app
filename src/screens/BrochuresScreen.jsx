import { StyleSheet, Text, View } from 'react-native';

export default function BrochuresScreen() {
  return (
        <View style={styles.container}>
          <Text>Брошура 1</Text>
          <Text>Брошура 2</Text>
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