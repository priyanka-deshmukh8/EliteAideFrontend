import React, { useState } from 'react';
import { Modal, View, StyleSheet, Text, TextInput, Button, Switch, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '@env';
import { Task } from './CalendarScreen'; // Ensure the path is correct
import Geolocation from 'react-native-geolocation-service';
import { useTasks } from '../../context/TaskContext';
import CategorySelector from '../../components/AIchat/CategorySelector';

// Props interface for the modal
interface CreateTaskModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onClose: () => void;
  selectedDate: Date;
  onSaveTask: (newTask: Omit<Task, 'id'>) => void;
  refreshTasks: () => Promise<void>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isVisible, onClose, selectedDate, onSaveTask, refreshTasks }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [isAutocomplete, setIsAutocomplete] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { addTask } = useTasks();

  const handleSave = async () => {
    if (!title || !dueDate || !time) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    // Get user's location
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const access_token = await AsyncStorage.getItem('access_token');

        const formattedDueDate = formatDate(dueDate);

        const taskData = {
          title,
          description,
          priority,
          status: "Pending",
          due_date: formattedDueDate,
          type: "Errands",
          location: { latitude, longitude }
        };

        try {
          const response = await fetch(`${BASE_URL}v1/tasks/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify(taskData),
          });

          if (response.ok) {
            const responseData = await response.json();
            onSaveTask({
              time: formattedDueDate,
              summary: title,
              detail: description,
              date: new Date(formattedDueDate),
              color: '#2196F3',
              status: 'Pending',
            });
            await refreshTasks();
            onClose();
          } else {
            const errorData = await response.json();
            alert(`Failed to save task: ${errorData.message}`);
          }
        } catch (error) {
          alert('An error occurred while saving the task.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        // Handle location error
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const formatDate = (dateString: string): string => {
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toISOString();
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        setDueDate(currentDate.toISOString());
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  const showTimePickerModal = () => {
    DateTimePickerAndroid.open({
      value: new Date(),
      onChange: (event, selectedTime) => {
        if (selectedTime) {
          const formattedTime = selectedTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          setTime(formattedTime);
        }
      },
      mode: 'time',
      is24Hour: false,
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#16213C', '#3272A0', '#3272A0', '#3272A0', '#1E4E8D']}
          style={styles.gradientBorder}
        >
          <View style={styles.modalContent}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Create Task</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Icon name="times" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Title</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter task title"
              placeholderTextColor="#808080"
              value={title} 
              onChangeText={setTitle} 
            />

            <Text style={styles.label}>Category</Text>
            <CategorySelector
              selectedCategory={category}
              onCategorySelect={setCategory}
            />

            <View style={styles.priorityContainer}>
              <Text style={styles.label}>Priority level:</Text>
              <TouchableOpacity 
                style={styles.priorityButton}
                onPress={() => {
                  // Add logic to show picker or dropdown
                }}
              >
                <Text style={[
                  styles.priorityText, 
                  { color: priority === 'high' ? '#FF6B6B' : priority === 'medium' ? '#FFB946' : '#6BCB77' }
                ]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
                <View style={[
                  styles.priorityDot,
                  { backgroundColor: priority === 'high' ? '#FF6B6B' : priority === 'medium' ? '#FFB946' : '#6BCB77' }
                ]} />
                <Icon name="chevron-down" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Due Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={styles.dateTimeInput} 
                onPress={showDatePicker}
              >
                <Icon name="calendar" size={20} color="#FFB946" />
                <Text style={[
                  styles.dateTimeText,
                  !dueDate && styles.placeholderText
                ]}>
                  {dueDate || 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dateTimeInput} 
                onPress={showTimePickerModal}
              >
                <Icon name="clock-o" size={20} color="#6BCB77" />
                <Text style={[
                  styles.dateTimeText,
                  !time && styles.placeholderText
                ]}>
                  {time || 'Select Time'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Task description"
              placeholderTextColor="#808080"
              multiline 
              value={description} 
              onChangeText={setDescription} 
            />

            <View style={styles.bottomSection}>
              {loading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.autocompleteContainer}>
                    <Text style={styles.autocompleteText}>Autocomplete task</Text>
                    <Switch 
                      value={isAutocomplete} 
                      onValueChange={setIsAutocomplete}
                      trackColor={{ false: '#767577', true: '#3272A0' }}
                      thumbColor={isAutocomplete ? '#FFFFFF' : '#f4f3f4'}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.buttonWrapper, 
                      isPressed && styles.buttonWrapperPressed
                    ]} 
                    onPress={handleSave}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                  >
                    <LinearGradient
                      colors={['#3272A0', '#1E4E8D']}
                      style={styles.createButton}
                    >
                      <Text style={styles.buttonText}>CREATE TASK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorder: {
    width: '80%',
    borderRadius: 15,
    padding: 2,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 13,
    maxHeight: '90%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#3272A0',
    borderRadius: 0,
    padding: 8,
    marginBottom: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    margin: 2,
    borderWidth: 1,
    borderColor: '#3272A0',
    textAlign: 'center',
    width: '30%',
  },
  selectedCategory: {
    backgroundColor: '#3272A0',
  },
  categoryText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 10,
  },
  priorityContainer: {
    marginBottom: 10,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#3272A0',
    padding: 10,
  },
  priorityText: {
    fontSize: 16,
    marginRight: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  dateTimeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1E23',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3272A0',
    height: 48,
  },
  dateTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  placeholderText: {
    color: '#6F6F6F',
  },
  bottomSection: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    marginHorizontal: -15,
    marginBottom: -15,
  },
  autocompleteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  autocompleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#65779E',
  },
  closeIcon: {
    padding: 8,
    borderRadius: 20,
  },
  buttonWrapper: {
    borderRadius: 25,
    transform: [{ scale: 1 }],
    shadowColor: '#3272A0',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonWrapperPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    elevation: 4,
  },
  createButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3272A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default React.memo(CreateTaskModal);