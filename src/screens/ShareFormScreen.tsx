import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Switch,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShareForm } from '../hooks/useShareForm';
import { COLORS } from '../constants/appColors';
import type { ShareCategory } from '../types/shareForm';

const EXPIRATION_OPTIONS = ['1 hour', '6 hours', '1 day', '3 days', '7 days'];
const CATEGORIES = ['Photos', 'Videos', 'Files', 'Links', 'Text'];

const ShareFormScreen = ({ navigation }: any) => {
  const {
    formData,
    isLoading,
    uploadProgress,
    errors,
    setCategory,
    setLinkInput,
    setTextInput,
    setSelectedFile,
    setExpiration,
    setIsAnonymous,
    setIsPasswordProtected,
    setPassword,
    setIsPublicSharing,
    handleSelectMedia,
    handleSelectDocument,
    handleShare,
  } = useShareForm(navigation);

  const handleSetCategory = (cat: string) => {
    setCategory(cat as ShareCategory);
  };

  const renderUploadArea = () => {
    if (
      ['Photos', 'Videos', 'Files'].includes(formData.category) &&
      formData.selectedFile
    ) {
      return (
        <View style={styles.uploadArea}>
          <Icon name="check-circle" size={48} color={COLORS.primary} />
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {formData.selectedFile.name}
          </Text>
          <Text style={styles.fileSizeText}>
            {(formData.selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </Text>
          <TouchableOpacity
            style={styles.reselectBtn}
            onPress={() => setSelectedFile(null)}>
            <Text style={styles.reselectText}>Change File</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (formData.category) {
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
              value={formData.linkContent}
              onChangeText={setLinkInput}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor={COLORS.slate400}
            />
            {errors.linkInput && (
              <Text style={styles.errorText}>{errors.linkInput}</Text>
            )}
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
              value={formData.textContent}
              onChangeText={setTextInput}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.slate400}
            />
            {errors.textInput && (
              <Text style={styles.errorText}>{errors.textInput}</Text>
            )}
          </View>
        );

      case 'Photos':
      case 'Videos':
        return (
          <View style={styles.uploadArea}>
            <View style={styles.iconCircle}>
              <Icon
                name={
                  formData.category === 'Photos'
                    ? 'add-photo-alternate'
                    : 'video-library'
                }
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.uploadTitle}>
              No {formData.category.toLowerCase()} selected
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => handleSelectMedia(true)}>
                <Icon name="camera-alt" size={24} color={COLORS.primary} />
                <Text style={styles.cameraBtnText}>
                  {formData.category === 'Photos' ? 'Take Photo' : 'Record'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => handleSelectMedia(false)}>
                <Icon name="add" size={24} color="#fff" />
                <Text style={styles.selectBtnText}>
                  Select {formData.category}
                </Text>
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
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={handleSelectDocument}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tab,
                  formData.category === cat && styles.activeTab,
                ]}
                onPress={() => handleSetCategory(cat)}>
                <Text
                  style={[
                    styles.tabText,
                    formData.category === cat && styles.activeTabText,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {renderUploadArea()}

          <View style={styles.settingsCard}>
            <Text style={styles.cardTitle}>Upload Settings</Text>

            {/* Sharing Mode */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Sharing Mode</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      formData.isPublicSharing && {
                        backgroundColor: '#dcfce7',
                      },
                    ]}>
                    <Icon
                      name="public"
                      size={20}
                      color={
                        formData.isPublicSharing ? '#16a34a' : COLORS.slate400
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.settingRowTitle}>Public Sharing</Text>
                    <Text style={styles.settingRowSub}>
                      Share without login required
                    </Text>
                  </View>
                </View>
                <Switch
                  value={formData.isPublicSharing}
                  onValueChange={setIsPublicSharing}
                  trackColor={{ false: '#e2e8f0', true: '#dcfce7' }}
                  thumbColor={formData.isPublicSharing ? '#16a34a' : '#f1f5f9'}
                />
              </View>
            </View>

            {/* Expiration Time */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Expiration Time</Text>
              <View style={styles.chipsContainer}>
                {EXPIRATION_OPTIONS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.chip,
                      formData.expiration === time && styles.activeChip,
                    ]}
                    onPress={() => setExpiration(time)}>
                    <Text
                      style={[
                        styles.chipText,
                        formData.expiration === time && styles.activeChipText,
                      ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Password Protection */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconBox,
                    formData.isPasswordProtected && {
                      backgroundColor: '#fffbeb',
                    },
                  ]}>
                  <Icon
                    name="lock"
                    size={20}
                    color={
                      formData.isPasswordProtected ? '#f59e0b' : COLORS.slate400
                    }
                  />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>
                    Protect with Password
                  </Text>
                  <Text style={styles.settingRowSub}>
                    Require a password to access
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isPasswordProtected}
                onValueChange={setIsPasswordProtected}
                trackColor={{ false: '#e2e8f0', true: '#fcd34d' }}
                thumbColor={
                  formData.isPasswordProtected ? '#f59e0b' : '#f1f5f9'
                }
              />
            </View>

            {/* Password Input */}
            {formData.isPasswordProtected && (
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Set a password"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={setPassword}
                  placeholderTextColor="#b45309"
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
            )}

            {/* Anonymous Sharing */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconBox,
                    formData.isAnonymous && { backgroundColor: '#bfdbfe' },
                  ]}>
                  <Icon
                    name="person-off"
                    size={20}
                    color={
                      formData.isAnonymous ? COLORS.primary : COLORS.slate400
                    }
                  />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>Anonymous Sharing</Text>
                  <Text style={styles.settingRowSub}>
                    Hide your device identity
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
                thumbColor={formData.isAnonymous ? COLORS.primary : '#f1f5f9'}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer with Share Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.mainShareBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleShare}
            disabled={isLoading}>
            {isLoading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#fff" />
                {uploadProgress > 0 && (
                  <Text style={styles.uploadProgressText}>
                    Uploading {uploadProgress}%
                  </Text>
                )}
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cancelText: { color: COLORS.primary, fontWeight: 'bold' },
  shareText: { color: COLORS.primary, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 40 },
  tabsScroll: { marginBottom: 24, flexDirection: 'row', minHeight: 45 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 42,
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.slate400, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  inputArea: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.text,
  },
  fileSizeText: {
    color: COLORS.slate400,
    marginBottom: 20,
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  selectBtnText: { color: '#fff', fontWeight: 'bold' },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  cameraBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  textInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: { height: 120 },
  settingsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.text,
  },
  settingGroup: { marginBottom: 24 },
  settingLabel: {
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.slate400, fontWeight: 'bold', fontSize: 12 },
  activeChipText: { color: '#fff' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRowTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  settingRowSub: { fontSize: 12, color: COLORS.slate400 },
  passwordInputContainer: {
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
    marginLeft: 48,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    paddingRight: 40,
    fontSize: 14,
    color: '#b45309',
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mainShareBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
  },
  mainShareText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadProgressText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  reselectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  reselectText: { color: COLORS.text, fontWeight: 'bold' },
  errorText: {
    color: COLORS.danger || '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
});

export default ShareFormScreen;
