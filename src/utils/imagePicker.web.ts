// Web mock for react-native-image-picker
// Uses HTML5 file input and camera API

export interface ImagePickerResponse {
didCancel: boolean;
errorCode?: string;
errorMessage?: string;
assets?: Array<{
uri: string;
fileName?: string;
type?: string;
fileSize?: number;
}>;
}

export const launchCamera = async (options: any): Promise<ImagePickerResponse> => {
// On web, we can't directly access camera without user gesture
// Instead, we'll use file input with camera preference
const input = document.createElement('input');
input.type = 'file';
input.accept = options.mediaType === 'video' ? 'video/*' : 'image/*';
input.setAttribute('capture', ''); // Hint to use camera

return new Promise((resolve, _reject) => {
input.onchange = (e) => {
const files = (e.target as HTMLInputElement).files;
if (files && files.length > 0) {
const file = files[0];
resolve({
didCancel: false,
assets: [{
uri: URL.createObjectURL(file),
fileName: file.name,
type: file.type,
fileSize: file.size,
}],
});
} else {
resolve({ didCancel: true });
}
};
// Huỷ chụp -> resolve didCancel, không treo Promise (T12)
input.oncancel = () => resolve({ didCancel: true });
input.click();
});
};

export const launchImageLibrary = async (options: any): Promise<ImagePickerResponse> => {
const input = document.createElement('input');
input.type = 'file';
input.accept = options.mediaType === 'video' ? 'video/*' : 'image/*';
input.multiple = options.multiple || false;

return new Promise((resolve) => {
input.onchange = (e) => {
const files = (e.target as HTMLInputElement).files;
if (files && files.length > 0) {
resolve({
didCancel: false,
assets: Array.from(files).map(file => ({
uri: URL.createObjectURL(file),
fileName: file.name,
type: file.type,
fileSize: file.size,
})),
});
} else {
resolve({ didCancel: true });
}
};
// Huỷ chọn -> resolve didCancel, không treo Promise (T12)
input.oncancel = () => resolve({ didCancel: true });
input.click();
});
};
