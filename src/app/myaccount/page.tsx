'use client';

import Sidebar from '@/components/Sidebar';
import { User, Mail, Phone, Building, MapPin, Calendar, Edit2, Save, X, Camera } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  businessName?: string;
  address?: string;
  joinedAt: any;
  photoURL?: string; // ← Added for real photo
}

export default function MyAccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    businessName: '',
    address: '',
    photoURL: '',
  });

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        router.push('/login');
        return;
      }

      try {
        // ← Fixed: 'users' collection mein admin ka data hona chahiye
        const userDoc = await getDoc(doc(db, 'Admin', auth.currentUser.uid));
        
        let profileData: UserProfile = {
          displayName: auth.currentUser.displayName || 'Admin User',
          email: auth.currentUser.email || '',
          phoneNumber: '',
          businessName: 'Sure Wholesaler',
          address: '',
          joinedAt: auth.currentUser.metadata.creationTime,
          photoURL: auth.currentUser.photoURL || '',
        };

        if (userDoc.exists()) {
          const data = userDoc.data();
          profileData = {
            ...profileData,
            displayName: data.displayName || profileData.displayName,
            phoneNumber: data.phoneNumber || '',
            businessName: data.businessName || profileData.businessName,
            address: data.address || '',
            photoURL: data.photoURL || profileData.photoURL,
            joinedAt: data.createdAt || profileData.joinedAt,
          };
        }

        setProfile(profileData);
        setFormData({
          displayName: profileData.displayName,
          phoneNumber: profileData.phoneNumber || '',
          businessName: profileData.businessName || '',
          address: profileData.address || '',
          photoURL: profileData.photoURL || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setFormData({ ...formData, photoURL: downloadURL });
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !profile) return;

    setSaving(true);
    try {
      // Update Auth displayName & photoURL
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL || null,
      });

      // Update Firestore
      await updateDoc(doc(db, 'Admin', auth.currentUser.uid), {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        address: formData.address,
        photoURL: formData.photoURL,
      });

      setProfile({
        ...profile,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        address: formData.address,
        photoURL: formData.photoURL,
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber || '',
        businessName: profile.businessName || '',
        address: profile.address || '',
        photoURL: profile.photoURL || '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Unable to load profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-2">Manage your profile information and business details</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>
            <div className="relative px-8 pb-8 -mt-16">
              <div className="flex items-end gap-6">
                {/* Real Photo Avatar with Upload */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl shadow-xl border-4 border-white overflow-hidden">
                    {(formData.photoURL || profile.photoURL) ? (
                      <Image
                        src={formData.photoURL || profile.photoURL!}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                        {(profile.displayName || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {editing && (
                    <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <div className="text-center text-white">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-sm font-medium">Change Photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.displayName || 'Admin User'}</h2>
                  <p className="text-gray-600">{profile.businessName || 'Wholesaler'}</p>
                </div>

                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingPhoto}
                      className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition disabled:opacity-70"
                    >
                      <Save className="w-5 h-5" />
                      {saving || uploadingPhoto ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of the form remains same */}
            <div className="px-8 pb-10 border-t pt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{profile.displayName || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="text-lg text-gray-900">{profile.email}</p>
                  <p className="text-sm text-gray-500 mt-1">Cannot be changed directly</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{profile.phoneNumber || 'Not set'}</p>
                  )}
                </div>

                {/* Business Name */}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4" />
                    Business Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{profile.businessName || 'Not set'}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Business Address
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 whitespace-pre-wrap">{profile.address || 'Not set'}</p>
                  )}
                </div>

                {/* Member Since */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="text-lg text-gray-900">
                    {profile.joinedAt
                      ? new Date(profile.joinedAt.toDate ? profile.joinedAt.toDate() : profile.joinedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}