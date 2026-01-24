import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  PermissionsAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Geolocation from 'react-native-geolocation-service';
import { useAuth, API_URL } from '../context/AuthContext';

const EXPIRATION_OPTIONS = ['1 hour', '6 hours', '1 day', '3 days', '7 days'];
const CATEGORIES = ['Photos', 'Videos', 'Files', 'Links', 'Text'];

const COLORS = {
  primary: '#2563EB',
  bg: '#f8fafc',
  white: '#fff',
  text: '#0f172a',
  slate400: '#94a3b8',
  border: '#e2e8f0',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningBorder: '#fcd34d'
};

const ShareFormScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('Photos');
  const [linkInput, setLinkInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; type: string; name: string; size: number } | null>(null);
  const [selectedExpiration, setSelectedExpiration] = useState('1 hour');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to share files nearby.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const handleSelectMedia = async (useCamera = false) => {
    const options: any = {
      mediaType: activeTab === 'Videos' ? 'video' : 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true, // ← Đảm bảo lưu vào thư viện trên Android
      videoQuality: 'medium',
    };

    try {
      const result = useCamera 
        ? await launchCamera(options) 
        : await launchImageLibrary(options);

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to capture media');
        return;
      }

      if (!result.assets?.[0]) {
        Alert.alert('Error', 'No media returned');
        return;
      }

      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === 'android' && uri?.startsWith('file://')) {
        uri = uri.replace('file://', '');
      }

      const fileName = asset.fileName || `capture-${Date.now()}.${activeTab === 'Videos' ? 'mp4' : 'jpg'}`;
      const fileType = asset.type || (activeTab === 'Videos' ? 'video/mp4' : 'image/jpeg');
      const fileSize = asset.fileSize || 0;

      setSelectedFile({ uri: uri || '', type: fileType, name: fileName, size: fileSize });
    } catch (err) {
      console.error('[Media Picker Error]', err);
      Alert.alert('Error', 'Could not open camera/gallery');
    }
  };

  const handleSelectDocument = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      setSelectedFile({
        uri: res.uri || '',
        type: res.type || 'application/octet-stream',
        name: res.name || 'unknown',
        size: res.size || 0
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Unknown error picking file');
      }
    }
  };

  const handleShare = async () => {
    if (activeTab === 'Links' && !linkInput.trim()) return Alert.alert('Error', 'Please enter a link');
    if (activeTab === 'Text' && !textInput.trim()) return Alert.alert('Error', 'Please enter some text');
    if ((activeTab === 'Photos' || activeTab === 'Videos' || activeTab === 'Files') && !selectedFile) {
      return Alert.alert('Error', 'Please select a file to share');
    }

    setIsLoading(true);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location is required to share files nearby.');
        setIsLoading(false);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: Geolocation.GeoPosition) => {
            const { latitude, longitude } = position.coords;
            const formData = new FormData();
            formData.append('category', activeTab);
            formData.append('expiration', selectedExpiration);
            formData.append('isAnonymous', String(isAnonymous));
            formData.append('latitude', String(latitude));
            formData.append('longitude', String(longitude));

            if (isPasswordProtected && password.trim()) {
              formData.append('password', password.trim());
            }

            if (activeTab === 'Links') {
              formData.append('linkContent', linkInput.trim());
            } else if (activeTab === 'Text') {
              formData.append('textContent', textInput.trim());
            } else {
              formData.append('file', {
                uri: selectedFile?.uri,
                type: selectedFile?.type,
                name: selectedFile?.name,
              } as any);
            }

            fetch(`${API_URL.replace('/auth', '/documents')}/share`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            })
            .then(response => response.json().then(data => ({ response, data })))
            .then(({ response, data }) => {
              setIsLoading(false);
              if (response.ok) {
                Alert.alert('Success', 'Sharing started successfully!', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', data.message || 'Upload failed');
              }
              resolve();
            })
            .catch(err => {
              setIsLoading(false);
              Alert.alert('Error', err.message || 'Upload failed');
              reject(err);
            });
          },
          (error: any) => {
            console.error('Geolocation Error:', error);
            Alert.alert('GPS Error', 'Could not get current location. Please enable GPS and try again.');
            setIsLoading(false);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error: any) {
      console.error('[Share Error]', error);
      Alert.alert('Error', error.message || 'Could not share document');
      setIsLoading(false);
    }
  };

  const renderUploadArea = () => {
    if ((activeTab === 'Photos' || activeTab === 'Videos' || activeTab === 'Files') && selectedFile) {
      return (
        <View style={styles.uploadArea}>
          <Icon name="check-circle" size={48} color={COLORS.primary} />
          <Text style={[styles.uploadTitle, { marginTop: 10, marginBottom: 5 }]} numberOfLines={1}>
            {selectedFile?.name}
          </Text>
          <Text style={{ color: COLORS.slate400, marginBottom: 20 }}>
            {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
          </Text>
          <TouchableOpacity style={styles.reselectBtn} onPress={() => setSelectedFile(null)}>
            <Text style={styles.reselectText}>Change File</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'Links':
        return (
          <View style={styles.inputArea}>
            <View style={styles.iconCircle}>
              <Icon name="link" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadTitle}>Share a Link</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://example.com"
              value={linkInput}
              onChangeText={setLinkInput}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor={COLORS.slate400}
            />
          </View>
        );

      case 'Text':
        return (
          <View style={styles.inputArea}>
            <View style={styles.iconCircle}>
              <Icon name="edit-note" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadTitle}>Share Text</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Type or paste your message here..."
              value={textInput}
              onChangeText={setTextInput}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.slate400}
            />
          </View>
        );

      case 'Photos':
      case 'Videos':
        return (
          <View style={styles.uploadArea}>
            <View style={styles.iconCircle}>
              <Icon name={activeTab === 'Photos' ? "add-photo-alternate" : "video-library"} size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadTitle}>No {activeTab.toLowerCase()} selected</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => handleSelectMedia(true)}>
                <Icon name="camera-alt" size={24} color={COLORS.primary} />
                <Text style={styles.cameraBtnText}>{activeTab === 'Photos' ? 'Take Photo' : 'Record'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectBtn} onPress={() => handleSelectMedia(false)}>
                <Icon name="add" size={24} color="#fff" />
                <Text style={styles.selectBtnText}>Select {activeTab}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default: // Files
        return (
          <View style={styles.uploadArea}>
            <View style={styles.iconCircle}>
              <Icon name="folder-open" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadTitle}>No files selected</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={handleSelectDocument}>
              <Icon name="add" size={24} color="#fff" />
              <Text style={styles.selectBtnText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Document</Text>
          <TouchableOpacity onPress={handleShare} disabled={isLoading}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, activeTab === cat && styles.activeTab]}
                onPress={() => setActiveTab(cat)}
              >
                <Text style={[styles.tabText, activeTab === cat && styles.activeTabText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {renderUploadArea()}

          <View style={styles.settingsCard}>
            <Text style={styles.cardTitle}>Upload Settings</Text>
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Expiration Time</Text>
              <View style={styles.chipsContainer}>
                {EXPIRATION_OPTIONS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.chip, selectedExpiration === time && styles.activeChip]}
                    onPress={() => setSelectedExpiration(time)}
                  >
                    <Text style={[styles.chipText, selectedExpiration === time && styles.activeChipText]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBox, isPasswordProtected && { backgroundColor: COLORS.warningBg }]}>
                  <Icon name="lock" size={20} color={isPasswordProtected ? COLORS.warning : COLORS.slate400} />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>Protect with Password</Text>
                  <Text style={styles.settingRowSub}>Require a password to access</Text>
                </View>
              </View>
              <Switch
                value={isPasswordProtected}
                onValueChange={setIsPasswordProtected}
                trackColor={{ false: COLORS.border, true: COLORS.warningBorder }}
                thumbColor={isPasswordProtected ? COLORS.warning : "#f1f5f9"}
              />
            </View>

            {isPasswordProtected && (
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Set a password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor={COLORS.slate400}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Icon name={showPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.slate400} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBox, isAnonymous && { backgroundColor: '#bfdbfe' }]}>
                  <Icon name="person-off" size={20} color={isAnonymous ? COLORS.primary : COLORS.slate400} />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>Anonymous Sharing</Text>
                  <Text style={styles.settingRowSub}>Hide your device identity</Text>
                </View>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: COLORS.border, true: "#bfdbfe" }}
                thumbColor={isAnonymous ? COLORS.primary : "#f1f5f9"}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.mainShareBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleShare}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainShareText}>Start Sharing</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cancelText: { color: COLORS.primary, fontWeight: 'bold' },
  shareText: { color: COLORS.primary, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 40 },
  tabsScroll: { marginBottom: 24, flexDirection: 'row', minHeight: 45 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: COLORS.border, height: 42, justifyContent: 'center' },
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.slate400, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  uploadArea: { backgroundColor: '#fff', borderRadius: 32, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 24 },
  inputArea: { backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 24, color: COLORS.text },
  buttonRow: { flexDirection: 'row', gap: 12 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24 },
  selectBtnText: { color: '#fff', fontWeight: 'bold' },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: '#bfdbfe' },
  cameraBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  textInput: { width: '100%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, fontSize: 16, color: COLORS.text },
  textArea: { height: 120 },
  settingsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontWeight: 'bold', marginBottom: 20, fontSize: 16, color: COLORS.text },
  settingGroup: { marginBottom: 24 },
  settingLabel: { color: COLORS.slate400, fontWeight: 'bold', marginBottom: 12, fontSize: 12, textTransform: 'uppercase' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.slate400, fontWeight: 'bold', fontSize: 12 },
  activeChipText: { color: '#fff' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  settingRowTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  settingRowSub: { fontSize: 12, color: COLORS.slate400 },
  passwordInputContainer: { marginBottom: 16, position: 'relative', justifyContent: 'center', marginLeft: 48 },
  passwordInput: { width: '100%', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 12, padding: 12, paddingRight: 40, fontSize: 14, color: '#b45309' },
  eyeIcon: { position: 'absolute', right: 12 },
  footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  mainShareBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 24, alignItems: 'center' },
  mainShareText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  reselectBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 12 },
  reselectText: { color: COLORS.text, fontWeight: 'bold' }
});

export default ShareFormScreen;