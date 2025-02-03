import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<TabParamList, 'Quiz'>;
};

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

const QuizScreen: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Get user's grade
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      const userData = userDoc.docs[0].data();
      const userGrade = userData.grade;

      // Fetch questions for user's grade
      const questionsQuery = query(
        collection(db, 'questions'),
        where('grade', '==', userGrade),
        where('subject', '==', 'Math') // Default to Math, can be made dynamic
      );
      
      const querySnapshot = await getDocs(questionsQuery);
      const loadedQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      setQuestions(loadedQuestions.slice(0, 10)); // Limit to 10 questions
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    }
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    if (selectedAnswer === null) {
      Alert.alert('Please select an answer');
      return;
    }

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setQuizComplete(true);
      await saveQuizResults();
    }
  };

  const saveQuizResults = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const finalScore = ((score + (selectedAnswer === questions[currentQuestion].correctAnswer ? 1 : 0)) / questions.length) * 100;

      await updateDoc(doc(db, 'users', userId), {
        completedQuizzes: arrayUnion({
          date: new Date().toISOString(),
          score: finalScore,
          subject: 'Math',
          totalQuestions: questions.length,
        }),
      });
    } catch (error) {
      console.error('Error saving quiz results:', error);
      Alert.alert('Error', 'Failed to save quiz results');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (quizComplete) {
    const finalScore = ((score + (selectedAnswer === questions[currentQuestion].correctAnswer ? 1 : 0)) / questions.length) * 100;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.scoreText}>Your Score: {Math.round(finalScore)}%</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentQuestion(0);
            setScore(0);
            setSelectedAnswer(null);
            setQuizComplete(false);
            loadQuestions();
          }}
        >
          <Text style={styles.buttonText}>Start New Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {questions[currentQuestion]?.question}
        </Text>

        {questions[currentQuestion]?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === option && styles.selectedOption,
            ]}
            onPress={() => handleAnswer(option)}
          >
            <Text style={[
              styles.optionText,
              selectedAnswer === option && styles.selectedOptionText,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, !selectedAnswer && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedAnswer}
        >
          <Text style={styles.buttonText}>
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
  },
  questionContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default QuizScreen;
