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

type QuickShareAction = {
  category: ShareCategory;
  title: string;
  subtitle: string;
  icon: string;
  tone: string;
  onPress: () => void;
};

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
if (!size) {
return 'Unknown size';
}

if (size < 1024 * 1024) {
return `${(size / 1024).toFixed(1)} KB`;
}

return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const ShareFormScreen = ({ navigation }: any) => {
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
setPassword,
handleSelectMedia,
handleSelectDocument,
handleShare,
} = useShareForm(navigation);

  const handleSetCategory = (cat: string) => {
    setCategory(cat as ShareCategory);
  };

  const openMediaPicker = (
    category: Extract<ShareCategory, 'Photos' | 'Videos'>,
    useCamera: boolean
  ) => {
    setCategory(category);
    handleSelectMedia(useCamera, category);
  };

  const openDocumentPicker = () => {
    setCategory('Files');
    handleSelectDocument();
  };

const quickActions: QuickShareAction[] = [
{
category: 'Photos',
title: 'Photos',
subtitle: 'Capture or select photos',
icon: 'image',
tone: '#eff6ff',
onPress: () => openMediaPicker('Photos', false),
},
{
category: 'Videos',
title: 'Videos',
subtitle: 'Record or select videos',
icon: 'videocam',
tone: '#ecfdf5',
onPress: () => openMediaPicker('Videos', false),
},
{
category: 'Files',
title: 'Files',
subtitle: 'PDF, Word, ZIP...',
icon: 'upload-file',
tone: '#f8fafc',
onPress: openDocumentPicker,
},
{
category: 'Links',
title: 'Links',
subtitle: 'Paste URL to share',
icon: 'link',
tone: '#fff7ed',
onPress: () => handleSetCategory('Links'),
},
{
category: 'Text',
title: 'Text',
subtitle: 'Notes or messages',
icon: 'notes',
tone: '#f5f3ff',
onPress: () => handleSetCategory('Text'),
},
];

  const hasShareContent =
    formData.category === 'Links'
      ? Boolean(formData.linkContent.trim())
      : formData.category === 'Text'
        ? Boolean(formData.textContent.trim())
        : Boolean(formData.selectedFile);

  const renderQuickActions = () => (
    <View style={styles.quickActionsCard}>
      <View style={styles.sectionHeader}>
        <View>
<Text style={styles.sectionTitle}>What do you want to share?</Text>
<Text style={styles.sectionSubtitle}>
Select content type, app will open the appropriate tool.
</Text>
        </View>
        <View style={styles.activeTypeBadge}>
          <Text style={styles.activeTypeText}>
            {CATEGORY_LABELS[formData.category]}
          </Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map(action => {
          const isActive = formData.category === action.category;

          return (
            <TouchableOpacity
              key={action.category}
              style={[
                styles.quickAction,
                isActive && styles.activeQuickAction,
              ]}
              onPress={action.onPress}
              activeOpacity={0.82}>
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: action.tone },
                  isActive && styles.activeQuickIcon,
                ]}>
                <Icon
                  name={action.icon}
                  size={24}
                  color={isActive ? '#fff' : COLORS.primary}
                />
              </View>
              <View style={styles.quickCopy}>
                <Text
                  style={[
                    styles.quickTitle,
                    isActive && styles.activeQuickTitle,
                  ]}>
                  {action.title}
                </Text>
                <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderUploadArea = () => {
    if (
      ['Photos', 'Videos', 'Files'].includes(formData.category) &&
      formData.selectedFile
    ) {
      return (
        <View style={styles.contentCard}>
          <View style={styles.selectedFileRow}>
            <View style={styles.successIcon}>
              <Icon name="check" size={24} color="#fff" />
            </View>
            <View style={styles.selectedFileInfo}>
              <Text style={styles.uploadTitle} numberOfLines={1}>
                {formData.selectedFile.name}
              </Text>
              <Text style={styles.fileSizeText}>
                {CATEGORY_LABELS[formData.category]} ·{' '}
                {formatFileSize(formData.selectedFile.size)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            {formData.category !== 'Files' && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  openMediaPicker(
                    formData.category as Extract<
                      ShareCategory,
                      'Photos' | 'Videos'
                    >,
                    true
                  )
                }>
                <Icon name="photo-camera" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryBtnText}>
                  {formData.category === 'Photos' ? 'Chụp lại' : 'Quay lại'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.reselectBtn}
              onPress={() =>
                formData.category === 'Files'
                  ? openDocumentPicker()
                  : openMediaPicker(
                      formData.category as Extract<
                        ShareCategory,
                        'Photos' | 'Videos'
                      >,
                      false
                    )
              }>
              <Icon name="swap-horiz" size={20} color={COLORS.text} />
              <Text style={styles.reselectText}>Change content</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    switch (formData.category) {
      case 'Links':
        return (
          <View style={styles.contentCard}>
            <View style={styles.contentIntro}>
              <View style={styles.iconCircle}>
                <Icon name="link" size={30} color={COLORS.primary} />
              </View>
              <View style={styles.contentIntroCopy}>
<Text style={styles.uploadTitle}>Paste link</Text>
<Text style={styles.helperText}>
People nearby can open this URL from the scan list.
</Text>
              </View>
            </View>
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
<View style={styles.contentCard}>
<View style={styles.contentIntro}>
<View style={styles.iconCircle}>
<Icon name="edit-note" size={30} color={COLORS.primary} />
</View>
<View style={styles.contentIntroCopy}>
<Text style={styles.uploadTitle}>Enter content</Text>
<Text style={styles.helperText}>
For quick notes, codes, instructions or announcements.
</Text>
</View>
</View>
<TextInput
style={[styles.textInput, styles.textArea]}
placeholder="Enter or paste content to share..."
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
          <View style={styles.contentCard}>
            <View style={styles.contentIntro}>
              <View style={styles.iconCircle}>
                <Icon
                  name={
                    formData.category === 'Photos'
                      ? 'add-photo-alternate'
                      : 'video-library'
                  }
                  size={34}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.contentIntroCopy}>
<Text style={styles.uploadTitle}>
{formData.category === 'Photos'
? 'Select photo to share'
: 'Select video to share'}
</Text>
<Text style={styles.helperText}>
Use camera or select from device storage.
</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  openMediaPicker(
                    formData.category as Extract<
                      ShareCategory,
                      'Photos' | 'Videos'
                    >,
                    true
                  )
                }>
                <Icon name="camera-alt" size={24} color={COLORS.primary} />
<Text style={styles.secondaryBtnText}>
{formData.category === 'Photos' ? 'Take photo' : 'Record video'}
</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() =>
                  openMediaPicker(
                    formData.category as Extract<
                      ShareCategory,
                      'Photos' | 'Videos'
                    >,
                    false
                  )
                }>
                <Icon name="add" size={24} color="#fff" />
<Text style={styles.selectBtnText}>
Select {CATEGORY_LABELS[formData.category].toLowerCase()}
</Text>
              </TouchableOpacity>
            </View>
            {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
          </View>
        );

default: // Files
return (
<View style={styles.contentCard}>
<View style={styles.contentIntro}>
<View style={styles.iconCircle}>
<Icon name="folder-open" size={34} color={COLORS.primary} />
</View>
<View style={styles.contentIntroCopy}>
<Text style={styles.uploadTitle}>Select any file</Text>
<Text style={styles.helperText}>
Suitable for documents, compressed files, PDF, Word or other data.
</Text>
</View>
</View>
<TouchableOpacity
style={styles.selectBtn}
onPress={openDocumentPicker}>
<Icon name="add" size={24} color="#fff" />
<Text style={styles.selectBtnText}>Browse files</Text>
</TouchableOpacity>
{errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
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
          <Text style={styles.headerTitle}>Share Data</Text>
          <TouchableOpacity onPress={handleShare} disabled={isLoading}>
            <Text style={styles.shareText}>Send</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {renderQuickActions()}

          {renderUploadArea()}

<View style={styles.settingsCard}>
<View style={styles.sectionHeader}>
<View>
<Text style={styles.sectionTitle}>Access Settings</Text>
<Text style={styles.sectionSubtitle}>
These options apply after others scan your content.
</Text>
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
                      {EXPIRATION_LABELS[time] || time}
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
Password Protection
</Text>
<Text style={styles.settingRowSub}>
Recipients must enter password
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
<Text style={styles.settingRowTitle}>Anonymous</Text>
<Text style={styles.settingRowSub}>
Hide device identity
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
<View style={styles.mainShareContent}>
<Icon
name={hasShareContent ? 'near-me' : 'error-outline'}
size={22}
color="#fff"
/>
<Text style={styles.mainShareText}>
{hasShareContent
? `Share ${CATEGORY_LABELS[
formData.category
].toLowerCase()}`
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
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: COLORS.text,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  activeTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  activeTypeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    width: '48%',
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeQuickAction: {
    backgroundColor: '#ffffff',
    borderColor: COLORS.primary,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeQuickIcon: { backgroundColor: COLORS.primary },
  quickCopy: { flex: 1 },
  quickTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeQuickTitle: { color: COLORS.primary },
  quickSubtitle: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  contentIntro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contentIntroCopy: { flex: 1 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  helperText: {
    color: '#64748b',
    lineHeight: 18,
    marginTop: 4,
    fontSize: 13,
  },
  selectedFileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFileInfo: { flex: 1 },
  fileSizeText: {
    color: COLORS.slate400,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  selectBtnText: { color: '#fff', fontWeight: 'bold' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  textInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
  },
  textArea: { height: 120 },
  settingsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  reselectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
  },
  reselectText: { color: COLORS.text, fontWeight: 'bold' },
  errorText: {
    color: COLORS.danger || '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
});

export default ShareFormScreen;
