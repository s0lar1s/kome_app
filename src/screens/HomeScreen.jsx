import { RefreshControl, StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { bannersApi } from '../Api';
import { useNavigation } from '@react-navigation/native';

import Banners from '../components/Banners.jsx';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - H_PADDING * 2;

export default function HomeScreen() {
  const [banners, setBanners] = useState([]);
  const [toggleRefresh, setToggleRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchData() {
      setRefreshing(true);
      try {
        const bannersResult = await bannersApi.getAll();
        setBanners(bannersResult.data || []);
      } catch (err) {
        alert('Cannot load data');
      } finally {
        setRefreshing(false);
      }
    }

    fetchData();
  }, [toggleRefresh]);

  const itemPressHandler = (itemId) => {
    navigation.navigate('BannersDetail', { itemId });
  };

  const refreshHandler = () => {
    setToggleRefresh((state) => !state);
  };


  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshHandler} />}
    >
      {/* Banners Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banners</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.bannersList}
        >
          {banners.map((item) => (
            <View key={item.id} style={[styles.bannerCard, { width: CARD_WIDTH }]}>
              <Banners 
                {...item} 
                onPress={itemPressHandler}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  section: {
    paddingHorizontal: H_PADDING,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  bannersList: {
    paddingRight: H_PADDING,
  },
  bannerCard: {
    marginRight: CARD_GAP,
  },
  bottomPadding: {
    height: 24,
  },
});
