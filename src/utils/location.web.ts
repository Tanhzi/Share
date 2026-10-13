// Web implementation for geolocation using browser's API

export const requestLocationPermission = async (): Promise<boolean> => {
  if (!('geolocation' in navigator)) {
    console.warn('Geolocation is not supported by this browser');
    return false;
  }

  return new Promise((resolve) => {
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
      if (result.state === 'granted') {
        resolve(true);
      } else if (result.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      } else {
        resolve(false);
      }
    }).catch(() => {
      resolve(false);
    });
  });
};

export const getCurrentPosition = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error.message));
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
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    }
  );
};

export const clearWatch = (watchId: number): void => {
  if ('geolocation' in navigator && navigator.geolocation.clearWatch) {
    navigator.geolocation.clearWatch(watchId);
  }
};
