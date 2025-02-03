import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParamList } from '../navigation/types';
import StoreKitService from '../services/StoreKit';

type Props = {
  navigation: NativeStackNavigationProp<NavigatorParamList, 'Profile'>;
};

type UserProfile = {
  name: string;
  email: string;
  grade: string;
  isPremium: boolean;
  subscriptionType?: string;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    initializeStoreKit();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as UserProfile;
      setProfile(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const initializeStoreKit = async () => {
    try {
      const storeKit = StoreKitService.getInstance();
      await storeKit.initialize();
      setSubscriptions(storeKit.getProducts());
    } catch (error) {
      console.error('Error initializing StoreKit:', error);
    }
  };

  const handlePurchase = async (sku: string) => {
    try {
      const storeKit = StoreKitService.getInstance();
      await storeKit.purchaseSubscription(sku);
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        isPremium: true,
        subscriptionType: sku,
      });
      loadProfile(); // Reload profile to show updated subscription status
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile?.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email}</Text>

        <Text style={styles.label}>Grade</Text>
        <Text style={styles.value}>{profile?.grade}</Text>

        <Text style={styles.label}>Subscription Status</Text>
        <Text style={styles.value}>
          {profile?.isPremium ? 'Premium' : 'Free'}
        </Text>
      </View>

      {!profile?.isPremium && (
        <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>Upgrade to Premium</Text>
          {subscriptions.map((subscription) => (
            <TouchableOpacity
              key={subscription.productId}
              style={styles.subscriptionOption}
              onPress={() => handlePurchase(subscription.productId)}
            >
              <Text style={styles.optionTitle}>{subscription.title}</Text>
              <Text style={styles.optionPrice}>{subscription.localizedPrice}</Text>
              <Text style={styles.optionDescription}>
                {subscription.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
  },
  subscriptionSection: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  subscriptionOption: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  optionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  optionDescription: {
    color: '#666',
  },
  signOutButton: {
    margin: 15,
    marginTop: 30,
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
  },
  signOutText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;