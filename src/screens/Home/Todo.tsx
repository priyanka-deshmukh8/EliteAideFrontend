import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { BASE_URL } from '@env';
import notificationService from '../../utils/notificationService';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date: string;
  type: string;
}

const ToDoScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        'https://api.eliteaide.tech/v1/tasks/user-tasks?page=1&items_per_page=200',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      if (data.message?.task_details?.data) {
        const now = new Date();
        const pendingTasks = data.message.task_details.data.filter(
          (task: Task) => task.status === 'Pending' && new Date(task.due_date) > now
        );
        setTasks(pendingTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return '#ff4757'; // High
      case 2: return '#ffa502'; // Medium
      case 1: return '#2ed573'; // Low
      default: return '#979797';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStartTask = async (taskId: number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication required',
        });
        return;
      }

      const response = await fetch(`${BASE_URL}v1/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'In Progress' }),
      });

      if (!response.ok) throw new Error('Failed to update task status');

      // Update the task status locally
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: 'In Progress' } : task
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Task Started',
        text2: 'The task is now in progress.',
      });
    } catch (error) {
      console.error('Error starting task:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start task',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      // Your existing task completion logic
      
      // Show completion notification
      notificationService.showTaskNotification(
        'Task Completed! 🎉',
        'Great job on completing your task!'
      );
      
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>To-Do Tasks</Text>
        <TouchableOpacity onPress={() => fetchTasks()}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#979797" />
          <Text style={styles.emptyText}>No pending tasks</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
                </View>
              </View>
              
              <Text style={styles.taskDescription}>{task.description}</Text>
              
              <View style={styles.taskFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#65779E" />
                  <Text style={styles.dateText}>Due: {formatDate(task.due_date)}</Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    loading && styles.actionButtonDisabled
                  ]}
                  onPress={() => handleStartTask(task.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Start Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#000000',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyText: {
    color: '#65779E',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    color: '#979797',
    fontSize: 14,
    marginBottom: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#979797',
    fontSize: 14,
    marginLeft: 4,
  },
  actionButton: {
    backgroundColor: '#65779E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
});

export default React.memo(ToDoScreen);