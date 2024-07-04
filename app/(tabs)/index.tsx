import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Text, Dimensions } from 'react-native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '@/components/Card'; // Adjust path as needed

const initialJsonData = require('@/assets/data.json');


// Limit description preview to manage size of cards
const truncateText = (text, limit) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(screenWidth >= 600 ? 2 : 1);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();

    // Update # of cols as window changes
    const updateLayout = () => {
      const width = Dimensions.get('window').width;
      setScreenWidth(width);
      setNumColumns(width >= 600 ? 2 : 1);
    };
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // Use async func to store data
  const loadData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem('postsData');
      let jsonData = storedData ? JSON.parse(storedData) : initialJsonData;


      jsonData = jsonData.map((item, index) => ({
        ...item,
        id: item.id || `fallback-id-${index}`,
      }));

      setData(jsonData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (updatedData) => {
    try {
      await AsyncStorage.setItem('postsData', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Open modal when card is selected
  const handleCardPress = (item) => {
    setSelectedPost(item);
    setModalVisible(true);
  };

  // Handle hug count
  const updateHugs = (postId, newHugCount) => {
    const updatedData = data.map((item) =>
      item.id === postId ? { ...item, num_hugs: newHugCount } : item
    );
    setData(updatedData);
    saveData(updatedData); // Save updated data to AsyncStorage
  };

  // Handle comments
  const updateComments = (postId, newComments) => {
    const updatedData = data.map((item) =>
      item.id === postId ? { ...item, comments: newComments } : item
    );
    setData(updatedData);
    saveData(updatedData); // Save updated data to AsyncStorage
  };

  const renderPost = ({ item, index }) => {
    if (!item) {
      console.error('Undefined item in renderPost:', index);
      return null;
    }

    const columnStyle = {
      width: `${100 / numColumns}%`,
      paddingHorizontal: 5,
      marginBottom: 10,
      flex: 1,
    };

    // Separate age brackets from title
    const ageMatch = item.title?.match(/\[(.*?)\]/);
    const age = ageMatch ? ageMatch[1] : 'Unknown';
    const timeAgo = moment(item.created_at).fromNow();

    return (
      <TouchableOpacity key={item.id || index} onPress={() => handleCardPress(item)} style={[styles.cardContainer, columnStyle]}>
        <Card
          id={item.id || `fallback-id-${index}`}
          // init values by reading from json for item or null
          initialNumHugs={item.num_hugs || 0}
          initialComments={item.comments || []}
          initialPatientDescription={item.patient_description || []}
          initialAssessment={item.assessment || []}
          onUpdateHugs={(newHugCount) => updateHugs(item.id || `fallback-id-${index}`, newHugCount)}
          onUpdateComments={(newComments) => updateComments(item.id || `fallback-id-${index}`, newComments)}
        >
          <View style={styles.cardContent}>
            <Text style={styles.title}>{item.title?.replace(/\[(.*?)\]/, '').trim() || 'Untitled'}</Text>
            <Text style={styles.ageTimeText}>{age} | {timeAgo}</Text>
            <Text style={styles.description}>{truncateText(item.patient_description || 'No description available', 150)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="large" color="#616cc2" />
        </View>
      );
    }
    return null;
  };

  const loadMoreData = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const jsonData = require('@/assets/data.json');
      const additionalData = jsonData.slice(data.length, data.length + 10);

      if (additionalData.length > 0) {
        const updatedData = [...data, ...additionalData];
        const uniqueUpdatedData = updatedData.map((item, index) => ({
          ...item,
          id: item.id || `fallback-id-${data.length + index}`,
        }));

        setData(uniqueUpdatedData);
        setPage(page + 1);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Cases</Text>
      <FlatList
        key={numColumns}
        data={data}
        renderItem={renderPost}
        keyExtractor={(item, index) => (item?.id?.toString() || `fallback-key-${index}`)}
        contentContainerStyle={styles.listContainer}
        numColumns={numColumns}
        ListFooterComponent={renderFooter}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0eeee',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    //marginVertical: 15,
    backgroundColor: '#4e58a4',
    padding: 5,
    color: '#ffffff',
    height: 'auto'
  },
  listContainer: {
    paddingHorizontal: 5,
    paddingTop: 10,
  },
  cardContainer: {
    flex: 1,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  cardContent: {
    padding: 5,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left'
  },
  description: {
    fontSize: 14,
  },
  ageTimeText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#4451b7',
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: '#CED0CE',
  },
});

export default HomeScreen;
