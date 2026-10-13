// Mobile implementation for geolocation using react-native-geolocation-service
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'ShareDocu needs access to your location to scan nearby documents.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
};

export const getCurrentPosition = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};

export const watchPosition = (
  callback: (position: { latitude: number; longitude: number }) => void,
  errorCallback: (error: any) => void
): number => {
  const config = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  };

  return Geolocation.watchPosition(
    position =>
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
    errorCallback,
    config
  );
};

export const clearWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};
