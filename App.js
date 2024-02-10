import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';

const API_ENDPOINT = 'https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=1&api_key=6f102c62f41998d151e5a1b48713cf13&format=json&nojsoncallback=1&extras=url_s';

const App = () => {
  const [images, setImages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [animatedValue] = useState(new Animated.Value(0));

  const loadData = async () => {
    try {
      const response = await axios.get(API_ENDPOINT);
      const fetchedImages = response.data.photos.photo;
      setImages(shuffleArray(fetchedImages));
      await AsyncStorage.setItem('cachedImages', JSON.stringify(fetchedImages));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const refreshData = async () => {
    try {
      const response = await axios.get(API_ENDPOINT);
      const fetchedImages = response.data.photos.photo;
      setImages(shuffleArray(fetchedImages));
      await AsyncStorage.setItem('cachedImages', JSON.stringify(fetchedImages));
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('cachedImages');
        if (cachedData !== null) {
          setImages(shuffleArray(JSON.parse(cachedData)));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      refreshData();
    }
  }, [isOnline]);

  const handleAnimation = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={loadData} style={styles.navButton}>
          <Icon name="home" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshData} style={styles.navButton}>
          <Icon name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.gallery}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                onPress={handleAnimation}
                style={styles.imageContainer}
              >
                <Animated.Image
                  source={{ uri: image.url_s }}
                  style={[styles.image, {
                    transform: [
                      {
                        scale: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        }),
                      },
                    ],
                  }]}
                />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
  },
  gallery: {
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  imageContainer: {
    width: (windowWidth - 48) / 2,
    height: 200,
    marginVertical: 6,
    borderRadius: 5,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
  },
});

export default App;
