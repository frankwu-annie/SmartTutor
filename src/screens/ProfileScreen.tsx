import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { auth } from '../config/firebase';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<NavigatorParamList, 'Profile'>;
};

type UserProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  selectedGrade: string;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phoneNumber: '',
    selectedGrade: '',
  });
  const [subscription, setSubscription] = useState<{ status: string }>({ status: 'free' });
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadProfile();
    loadSubscription();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const db = getDatabase();
      const profileRef = ref(db, `users/${userId}/profile`);
      const snapshot = await get(profileRef);
      const data = snapshot.val() || {};

      setProfile({
        fullName: data.fullName || '',
        email: auth.currentUser?.email || '',
        phoneNumber: data.phoneNumber || '',
        selectedGrade: data.selectedGrade || '',
      });
      setEditProfile({
        fullName: data.fullName || '',
        email: auth.currentUser?.email || '',
        phoneNumber: data.phoneNumber || '',
        selectedGrade: data.selectedGrade || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await fetch(`https://smart-ai-tutor.com/api/subscription/${auth.currentUser?.uid}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const db = getDatabase();
      const profileRef = ref(db, `users/${userId}/profile`);
      await set(profileRef, editProfile);

      setProfile(editProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleChangePassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user signed in');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setChangePasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
      console.error('Error changing password:', error);
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
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>

        {editing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editProfile.fullName}
              onChangeText={(text) => setEditProfile({ ...editProfile, fullName: text })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editProfile.phoneNumber}
              onChangeText={(text) => setEditProfile({ ...editProfile, phoneNumber: text })}
            />

            <Text style={styles.label}>Grade Level</Text>
            <TextInput
              style={styles.input}
              value={editProfile.selectedGrade}
              onChangeText={(text) => setEditProfile({ ...editProfile, selectedGrade: text })}
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditing(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile?.fullName || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{profile?.phoneNumber || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Grade:</Text>
              <Text style={styles.value}>{profile?.selectedGrade || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tier:</Text>
              <Text style={styles.value}>{subscription.status === 'premium' ? 'Premium' : 'Free'}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={() => setChangePasswordModalVisible(true)}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={changePasswordModalVisible}
          onRequestClose={() => {
            setChangePasswordModalVisible(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                  <Text style={styles.buttonText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setChangePasswordModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  card: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  profileInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  signOutText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ProfileScreen;

/* import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<NavigatorParamList, 'Profile'>;
};

type UserProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  selectedGrade: string;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phoneNumber: '',
    selectedGrade: '',
  });
  const [subscription, setSubscription] = useState<{ status: string }>({ status: 'free' });

  useEffect(() => {
    loadProfile();
    loadSubscription();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const db = getDatabase();
      const profileRef = ref(db, `users/${userId}/profile`);
      const snapshot = await get(profileRef);
      const data = snapshot.val() || {};
      
      setProfile({
        fullName: data.fullName || '',
        email: auth.currentUser?.email || '',
        phoneNumber: data.phoneNumber || '',
        selectedGrade: data.selectedGrade || '',
      });
      setEditProfile({
        fullName: data.fullName || '',
        email: auth.currentUser?.email || '',
        phoneNumber: data.phoneNumber || '',
        selectedGrade: data.selectedGrade || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await fetch(`https://smart-ai-tutor.com/api/subscription/${auth.currentUser?.uid}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const db = getDatabase();
      const profileRef = ref(db, `users/${userId}/profile`);
      await set(profileRef, editProfile);
      
      setProfile(editProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
      Alert.alert('Error', 'Failed to sign out');
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
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        
        {editing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editProfile.fullName}
              onChangeText={(text) => setEditProfile({ ...editProfile, fullName: text })}
            />
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editProfile.phoneNumber}
              onChangeText={(text) => setEditProfile({ ...editProfile, phoneNumber: text })}
            />
            
            <Text style={styles.label}>Grade Level</Text>
            <TextInput
              style={styles.input}
              value={editProfile.selectedGrade}
              onChangeText={(text) => setEditProfile({ ...editProfile, selectedGrade: text })}
            />
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditing(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile?.fullName || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{profile?.phoneNumber || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Grade:</Text>
              <Text style={styles.value}>{profile?.selectedGrade || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tier:</Text>
              <Text style={styles.value}>{subscription.status === 'premium' ? 'Premium' : 'Free'}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
  card: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  profileInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  signOutText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; */

/* import React, { useState, useEffect } from 'react';
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

export default ProfileScreen; */

