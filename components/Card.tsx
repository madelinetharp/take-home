import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const Card = ({ id, children, initialNumHugs, initialComments, onUpdateHugs, onUpdateComments, initialPatientDescription, initialAssessment }) => {
  const [numHugs, setNumHugs] = useState(initialNumHugs);
  const [isHugged, setIsHugged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [comments, setComments] = useState(Object.values(initialComments || {}));
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userCommentIds, setUserCommentIds] = useState([]);
  const [patientDescription, setPatientDescription] = useState(initialPatientDescription || ''); // Initialize with provided initial value
  const [assessment, setAssessment] = useState(initialAssessment || ''); // Initialize with provided initial value
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullAssessment, setShowFullAssessment] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      setWindowWidth(Dimensions.get('window').width);
    };
    const subscription = Dimensions.addEventListener('change', updateLayout);
    loadSavedState();
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const loadSavedState = async () => {
    try {
      const savedHugged = await AsyncStorage.getItem(`hugged_${id}`);
      const savedSaved = await AsyncStorage.getItem(`saved_${id}`);
      const savedPatientDescription = await AsyncStorage.getItem(`patient_description_${id}`);
      const savedAssessment = await AsyncStorage.getItem(`assessment_${id}`);

      if (savedHugged !== null) setIsHugged(JSON.parse(savedHugged));
      if (savedSaved !== null) setIsSaved(JSON.parse(savedSaved));
      if (savedPatientDescription !== null) setPatientDescription(JSON.parse(savedPatientDescription));
      if (savedAssessment !== null) setAssessment(JSON.parse(savedAssessment));
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  };

  const saveState = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const handleHeartPress = () => {
    const newHugCount = isHugged ? numHugs - 1 : numHugs + 1;
    setNumHugs(newHugCount);
    setIsHugged(!isHugged);
    onUpdateHugs(newHugCount);
    saveState(`hugged_${id}`, !isHugged);
  };

  const handleSavePress = () => {
    setIsSaved(!isSaved);
    saveState(`saved_${id}`, !isSaved);
  };

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    const newCommentObj = {
      id: Date.now(),
      parent_id: id,
      display_name: "Current User", // Placeholder name, used to check if user posted comment
      text: newComment,
      created_at: new Date().toISOString(),
    };
    const updatedComments = [...comments, newCommentObj];
    setComments(updatedComments);
    onUpdateComments(updatedComments);
    setNewComment('');
  };

  const deleteComment = (commentId) => {
    const updatedComments = comments.filter(comment => comment.id !== commentId);
    setComments(updatedComments);
    onUpdateComments(updatedComments);
    setUserCommentIds(userCommentIds.filter(id => id !== commentId));
  };

  const renderDeleteButton = (commentId, displayName) => {
    // Only allow user to delete comment if commenting from app
    const isCurrentUserComment = displayName === "Current User";
    if (isCurrentUserComment) {
      return (
        <TouchableOpacity onPress={() => deleteComment(commentId)}>
          <Ionicons name="close-circle" size={30} color="#b11937d6" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  useEffect(() => {
    setUserCommentIds(comments.map(comment => comment.id));
  }, [comments]);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const toggleAssessment = () => {
    setShowFullAssessment(!showFullAssessment);
  };
  // Replace ### with heading style
  const renderAssessmentContent = () => {
    const lines = assessment.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('###')) {
        return <Text key={index} style={styles.heading}>{line.replace('###', '').trim()}</Text>;
      } else {
        if (!showFullAssessment && index >= 3) {
          return null; 
        }
        return <Text key={index} style={styles.additionalDataText}>{line}</Text>;
      }
    });
  };
  // Toggle icons for hug, comment, and save. Open comment modal onclick
  return (
    <TouchableOpacity onPress={() => setDetailsModalVisible(true)} activeOpacity={1}>
      <View style={styles.card}>
        <View style={styles.cardContent}>{children}</View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconAction} onPress={handleHeartPress}>
            <Ionicons
              name={isHugged ? 'people' : 'people-outline'}
              size={24}
              color={isHugged ? '#e985b1' : '#E985B1'}
            />
            <Text style={styles.hug}>{numHugs} {numHugs === 1 ? 'Hug' : 'Hugs'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={() => setCommentsModalVisible(true)}>
            <Ionicons name="chatbubble-outline" size={24} color='#000000a2' />
            <Text style={styles.action}>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} onPress={handleSavePress}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? '#727fdf' : '#727fdf'}
            />
            <Text style={styles.saved}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={commentsModalVisible}
          onRequestClose={() => setCommentsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalView}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setCommentsModalVisible(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.additionalDataTitle}>Comments</Text>
              <ScrollView style={styles.commentList}>
                {comments.map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.commentUser}>{comment.display_name}</Text>
                      {renderDeleteButton(comment.id, comment.display_name)}
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.commentDate}>{moment(comment.created_at).fromNow()}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.addCommentContainer}>
                <TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAddComment}>
                  <Text style={styles.addButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={detailsModalVisible}
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setDetailsModalVisible(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <ScrollView>
              <Text style={styles.additionalDataTitle}>Patient Description:</Text>
              <Text style={styles.additionalDataText}>
                {showFullDescription ? patientDescription : `${patientDescription.slice(0, 100)}... `}
                <Text style={styles.showMore} onPress={() => setShowFullDescription(!showFullDescription)}>
                  {showFullDescription ? 'Show Less' : 'Show More'}
                </Text>
              </Text>
              <Text style={styles.additionalDataTitle}>Assessment:</Text>
              <Text style={styles.additionalDataText}></Text>
              
                {renderAssessmentContent()}
                {!showFullAssessment && (
                  <Text style={styles.showMore} onPress={() => setShowFullAssessment(!showFullAssessment)}>
                    Show More
                  </Text>
                )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  cardContent: {
    padding: 15,
    minHeight: 150,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    fontSize: 14,
    marginLeft: 5,
    color: '#000000c0',
  },
  hug: {
    fontSize: 14,
    marginLeft: 5,
    color: '#e985b1',
  },
  saved: {
    fontSize: 14,
    marginLeft: 5,
    color: '#727fdf',
  },
  showMore: {
    color: '#3d64ce',
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    marginHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  additionalDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  additionalDataText: {
    marginBottom: 10,
  },
  commentList: {
    flex: 1,
    height: 'auto',
  },
  commentItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentText: {
    marginBottom: 5,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginTop: 10,
    width: 400,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    minWidth: 250,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#626fd6',
    borderRadius: 20,
    width: 70,
    textAlign: 'center',
    padding: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
});

export default Card;
