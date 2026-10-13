import React, { useState, useCallback, useEffect } from 'react';
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
import { useWebDragDrop } from '../hooks/useWebDragDrop';
import { useAuth } from '../context/AuthContext';
import { SYNC_URL } from '../config/env';
import { apiGet } from '../api/client';
import { getParams } from '../utils/SimpleNavigation';
import { COLORS } from '../constants/appColors';
import type { ShareCategory } from '../types/shareForm';

const EXPIRATION_OPTIONS = ['1 hour', '6 hours', '1 day', '3 days', '7 days'];

const CATEGORY_LABELS: Record<ShareCategory, string> = {
  Photos: 'Photos',
  Videos: 'Videos',
  Files: 'Files',
  Links: 'Links',
  Text: 'Text',
};

const EXPIRATION_LABELS: Record<string, string> = {
  '1 hour': '1 hour',
  '6 hours': '6 hours',
  '1 day': '1 day',
  '3 days': '3 days',
  '7 days': '7 days',
};

const formatFileSize = (size = 0) => {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const detectFileType = (fileName: string): ShareCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic', 'heif'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', '3gp', 'm4v', 'ts'];
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

  if (imageExts.includes(ext)) return 'Photos';
  if (videoExts.includes(ext)) return 'Videos';
  if (audioExts.includes(ext)) return 'Files';
  if (docExts.includes(ext)) return 'Files';
  if (archiveExts.includes(ext)) return 'Files';
  return 'Files';
};

const getFileIcon = (fileName: string): string => {
  const type = detectFileType(fileName);
  switch (type) {
    case 'Photos': return 'image';
    case 'Videos': return 'videocam';
    default: return 'insert-drive-file';
  }
};

const getFileIconColor = (fileName: string): string => {
  const type = detectFileType(fileName);
  switch (type) {
    case 'Photos': return '#a855f7';
    case 'Videos': return '#f43f5e';
    default: return '#6366f1';
  }
};

const detectTextType = (text: string): 'link' | 'text' => {
  const trimmed = text.trim();
  if (trimmed.match(/^https?:\/\//i)) return 'link';
  return 'text';
};

const ShareFormScreen = ({ navigation, route }: any) => {
  const {
    formData,
    isLoading,
    uploadProgress,
    errors,
    setCategory,
    setLinkInput,
    setTextInput,
    setExpiration,
    setIsAnonymous,
    setIsPasswordProtected,
    setIsPublicSharing,
    setPassword,
    setSelectedFile,
    handleSelectDocument,
    handleSelectMedia,
    handleShare,
  } = useShareForm(navigation);

  const { token } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [textInputValue, setTextInputValue] = useState('');

  // Check if user has linked partner
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const data = await apiGet<{ isLinked: boolean }>(`${SYNC_URL}/status`, token);
        if (data.isLinked) setIsLinked(true);
      } catch (e) {
        console.warn('Failed to check sync status', e);
      }
    })();
  }, [token]);

  // Auto-enable linked-only when navigated from Sync "Send File"
  useEffect(() => {
    const params = route?.params || navigation?.params || getParams();
    if (params?.linkedOnly && isLinked) {
      setIsPublicSharing(true);
    }
  }, [isLinked, navigation?.params, route?.params, setIsPublicSharing]);

  const handleFileDrop = useCallback((file: { uri: string; name: string; type: string; size: number }) => {
    const detectedType = detectFileType(file.name);
    setCategory(detectedType);
    setSelectedFile({
      uri: file.uri,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  }, [setCategory, setSelectedFile]);

  const { dropRef, isDragging } = useWebDragDrop({
    onFileDrop: handleFileDrop,
    enabled: inputMode === 'file' && !formData.selectedFile,
  });

  const handlePickFile = async () => {
    await handleSelectDocument();
  };

  const handleTextChange = (text: string) => {
    setTextInputValue(text);
    const type = detectTextType(text);
    if (type === 'link') {
      setCategory('Links');
      setLinkInput(text);
    } else {
      setCategory('Text');
      setTextInput(text);
    }
  };

  const hasShareContent =
    inputMode === 'file'
      ? Boolean(formData.selectedFile)
      : Boolean(textInputValue.trim());

  const detectedLabel =
    inputMode === 'file'
      ? formData.selectedFile
        ? CATEGORY_LABELS[detectFileType(formData.selectedFile.name)]
        : 'File'
      : detectTextType(textInputValue) === 'link'
        ? 'Link'
        : 'Text';

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
          <TouchableOpacity
            onPress={() => {
              if (hasShareContent) handleShare();
            }}
            disabled={isLoading}>
            <Text style={[styles.shareText, !hasShareContent && styles.sendDisabled]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Two Big Cards */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                inputMode === 'file' && styles.modeCardActive,
              ]}
              onPress={() => setInputMode('file')}>
              <View
                style={[
                  styles.modeIconBox,
                  inputMode === 'file' && styles.modeIconBoxActive,
                ]}>
                <Icon
                  name="upload-file"
                  size={32}
                  color={inputMode === 'file' ? '#fff' : COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  inputMode === 'file' && styles.modeTitleActive,
                ]}>
                Upload File
              </Text>
              <Text style={styles.modeSub}>
                Any file type supported
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                inputMode === 'text' && styles.modeCardActive,
              ]}
              onPress={() => setInputMode('text')}>
              <View
                style={[
                  styles.modeIconBox,
                  inputMode === 'text' && styles.modeIconBoxActive,
                ]}>
                <Icon
                  name="edit-note"
                  size={32}
                  color={inputMode === 'text' ? '#fff' : COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  inputMode === 'text' && styles.modeTitleActive,
                ]}>
                Write / Link
              </Text>
              <Text style={styles.modeSub}>
                Notes, messages, or URLs
              </Text>
            </TouchableOpacity>
          </View>

          {/* File Upload Area */}
          {inputMode === 'file' && (
            <View
              ref={dropRef as any}
              style={[
                styles.contentCard,
                isDragging && styles.contentCardDragging,
              ]}>
              {formData.selectedFile ? (
                <>
                  <View style={styles.fileInfoRow}>
                    <View style={styles.fileIconBox}>
                      <Icon
                        name={getFileIcon(formData.selectedFile.name)}
                        size={28}
                        color={getFileIconColor(formData.selectedFile.name)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={2}>
                        {formData.selectedFile.name}
                      </Text>
                      <Text style={styles.fileMeta}>
                        {CATEGORY_LABELS[detectFileType(formData.selectedFile.name)]} · {formatFileSize(formData.selectedFile.size)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.changeFileRow}>
                    <TouchableOpacity
                      style={styles.changeFileBtn}
                      onPress={handlePickFile}>
                      <Icon name="swap-horiz" size={18} color={COLORS.primary} />
                      <Text style={styles.changeFileText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => setSelectedFile(null)}>
                      <Icon name="close" size={18} color={COLORS.danger} />
                      <Text style={styles.removeFileText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.pickFileArea}
                    onPress={handlePickFile}>
                    <View style={styles.pickIconCircle}>
                      <Icon name="cloud-upload" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.pickTitle}>Tap to upload any file</Text>
                    <Text style={styles.pickSub}>
                      Images, videos, PDFs, documents, archives & more
                    </Text>
                    <Text style={styles.pickHint}>
                      File type auto-detected by extension
                    </Text>
                    {Platform.OS === 'web' && (
                      <View style={styles.dragHint}>
                        <Icon name="open-with" size={14} color="#94a3b8" />
                        <Text style={styles.dragHintText}>
                          or drag & drop file here
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cameraBtn}
                    onPress={() => handleSelectMedia(true, 'Photos')}>
                    <Icon name="photo-camera" size={18} color="#fff" />
                    <Text style={styles.cameraBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                </>
              )}
              {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
            </View>
          )}

          {/* Text / Link Input Area */}
          {inputMode === 'text' && (
            <View style={styles.contentCard}>
              <View style={styles.typeBadge}>
                <Icon
                  name={detectTextType(textInputValue) === 'link' ? 'link' : 'notes'}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.typeBadgeText}>
                  {detectTextType(textInputValue) === 'link' ? 'URL Link' : 'Text Note'}
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={
                  detectTextType(textInputValue) === 'link'
                    ? 'https://example.com'
                    : 'Enter your note, message, or code...'
                }
                value={textInputValue}
                onChangeText={handleTextChange}
                multiline
                textAlignVertical="top"
                placeholderTextColor={COLORS.slate400}
              />
              {errors.textInput && (
                <Text style={styles.errorText}>{errors.textInput}</Text>
              )}
              {errors.linkInput && (
                <Text style={styles.errorText}>{errors.linkInput}</Text>
              )}
            </View>
          )}

          {/* Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Access Settings</Text>

            {/* Expiration */}
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
                      {EXPIRATION_LABELS[time] || time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Password */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBox, formData.isPasswordProtected && { backgroundColor: '#fffbeb' }]}>
                  <Icon
                    name="lock"
                    size={20}
                    color={formData.isPasswordProtected ? '#f59e0b' : COLORS.slate400}
                  />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>Password Protection</Text>
                  <Text style={styles.settingRowSub}>Require password to access</Text>
                </View>
              </View>
              <Switch
                value={formData.isPasswordProtected}
                onValueChange={setIsPasswordProtected}
                trackColor={{ false: '#e2e8f0', true: '#fcd34d' }}
                thumbColor={formData.isPasswordProtected ? '#f59e0b' : '#f1f5f9'}
              />
            </View>

            {formData.isPasswordProtected && (
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Set password"
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

            {/* Anonymous */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBox, formData.isAnonymous && { backgroundColor: '#bfdbfe' }]}>
                  <Icon
                    name="person-off"
                    size={20}
                    color={formData.isAnonymous ? COLORS.primary : COLORS.slate400}
                  />
                </View>
                <View>
                  <Text style={styles.settingRowTitle}>Anonymous</Text>
                  <Text style={styles.settingRowSub}>Hide your identity</Text>
                </View>
              </View>
              <Switch
                value={formData.isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
                thumbColor={formData.isAnonymous ? COLORS.primary : '#f1f5f9'}
              />
            </View>

            {/* Linked Only - chỉ hiện khi đã link partner */}
            {isLinked && (
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={[styles.iconBox, formData.isPublicSharing && { backgroundColor: '#dcfce7' }]}>
                    <Icon
                      name="link"
                      size={20}
                      color={formData.isPublicSharing ? '#059669' : COLORS.slate400}
                    />
                  </View>
                  <View>
                    <Text style={styles.settingRowTitle}>Linked Only</Text>
                    <Text style={styles.settingRowSub}>Only visible to your synced partner</Text>
                  </View>
                </View>
                <Switch
                  value={formData.isPublicSharing}
                  onValueChange={setIsPublicSharing}
                  trackColor={{ false: '#e2e8f0', true: '#a7f3d0' }}
                  thumbColor={formData.isPublicSharing ? '#059669' : '#f1f5f9'}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Share Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.mainShareBtn, isLoading && { opacity: 0.7 }]}
            onPress={() => {
              if (hasShareContent) handleShare();
            }}
            disabled={isLoading || !hasShareContent}>
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
              <View style={styles.mainShareContent}>
                <Icon
                  name={hasShareContent ? 'near-me' : 'error-outline'}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.mainShareText}>
                  {hasShareContent
                    ? `Share ${detectedLabel.toLowerCase()}`
                    : 'Select content to share'}
                </Text>
              </View>
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
  content: { padding: 16, paddingBottom: 28 },

  /* Mode Selector */
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  modeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modeTitleActive: {
    color: COLORS.primary,
  },
  modeSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },

  /* Content Card */
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  contentCardDragging: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
  },

  /* File Info */
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fileMeta: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 4,
  },
  changeFileRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  changeFileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  changeFileText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  removeFileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeFileText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 13,
  },

  /* Pick File Area */
  pickFileArea: {
    alignItems: 'center',
    padding: 24,
  },
  pickIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  pickSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  dragHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dragHintText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  cameraBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sendDisabled: {
    color: '#94a3b8',
  },

  /* Type Badge */
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  /* Text Input */
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
  textArea: { minHeight: 120 },

  /* Settings */
  settingsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: COLORS.text,
    marginBottom: 16,
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
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
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

  /* Footer */
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mainShareBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainShareContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainShareText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadProgressText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
});

export default ShareFormScreen;
