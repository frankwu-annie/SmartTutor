import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<TabParamList, 'Dashboard'>;
};

type Subject = 'Math' | 'Reading' | 'Science';
type Grade = 'K' | '1' | '2' | '3' | '4' | '5';

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<Grade>('K');
  const [progress, setProgress] = useState<{
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
  }>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      setUserGrade(userData?.grade || 'K');

      const completedQuizzes = userData?.completedQuizzes || [];
      const averageScore = completedQuizzes.reduce((acc, quiz) => acc + quiz.score, 0) / 
                          (completedQuizzes.length || 1);

      setProgress({
        totalQuizzes: 15, // Placeholder - should be fetched from your quiz database
        completedQuizzes: completedQuizzes.length,
        averageScore,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const subjects: Subject[] = ['Math', 'Reading', 'Science'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{progress.completedQuizzes}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{Math.round(progress.averageScore)}%</Text>
            <Text style={styles.statLabel}>Avg. Score</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available Tests</Text>
      {subjects.map((subject) => (
        <TouchableOpacity
          key={subject}
          style={styles.subjectCard}
          onPress={() => navigation.navigate('Quiz')}
        >
          <Text style={styles.subjectTitle}>{subject}</Text>
          <Text style={styles.subjectGrade}>Grade {userGrade}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
  },
  progressCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 10,
  },
  subjectCard: {
    backgroundColor: 'white',
    margin: 15,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  subjectGrade: {
    color: '#666',
    marginTop: 5,
  },
});

export default DashboardScreen;
