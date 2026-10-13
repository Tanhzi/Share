// Simple Icon component using emoji for web
import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Emoji mapping for Material Icons
const EMOJI_MAP: Record<string, string> = {
  // Navigation
  home: '🏠',
  user: '👤',
  users: '👥',
  settings: '⚙️',
  search: '🔍',
  plus: '+',
  minus: '−',
  check: '✓',
  close: '✕',
  x: '✕',
  'arrow-back': '←',
  'arrow-forward': '→',
  'arrow-left': '←',
  'arrow-right': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-up': '⌃',
  'chevron-down': '⌄',
  menu: '☰',
  'more-horiz': '⋯',
  'more-vert': '⋮',
  filter: '🔽',
  'filter-list': '🎚️',
  
  // Status
  'check-circle': '✅',
  'close-circle': '❌',
  'error-outline': '⚠️',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  help: '❓',
  'help-outline': '❓',
  
  // Actions
  share: '📤',
  download: '📥',
  upload: '📤',
  save: '💾',
  delete: '🗑️',
  edit: '✏️',
  copy: '📋',
  cut: '✂️',
  print: '🖨️',
  refresh: '🔄',
  sync: '🔄',
  
  // Time
  schedule: '🕒',
  history: '🕒',
  clock: '🕒',
  calendar: '📅',
  'calendar-today': '📅',
  event: '📅',
  
  // Rating
  star: '⭐',
  favorite: '❤️',
  heart: '❤️',
  'thumb-up': '👍',
  'thumb-down': '👎',
  
  // Visibility
  visibility: '👁️',
  'visibility-off': '🙈',
  show: '👁️',
  hide: '🙈',
  
  // Security
  lock: '🔒',
  'lock-open': '🔓',
  'lock-outline': '🔓',
  key: '🔑',
  password: '🔑',
  
  // Communication
  notifications: '🔔',
  'notifications-none': '🔔',
  'notifications-off': '🔕',
  email: '📧',
  mail: '📧',
  send: '📤',
  inbox: '📥',
  
  // Files
  file: '📄',
  folder: '📁',
  'folder-open': '📂',
  'insert-drive-file': '📄',
  description: '📝',
  note: '📝',
  'file-plus': '📄+',
  'file-minus': '📄-',
  'file-check': '📄✓',
  'file-x': '📄✕',
  
  // Media
  image: '🖼️',
  photo: '📷',
  picture: '🖼️',
  video: '📹',
  music: '🎵',
  'audio-file': '🎵',
  
  // Devices
  smartphone: '📱',
  tablet: '📱',
  laptop: '💻',
  computer: '💻',
  desktop: '💻',
  tv: '📺',
  monitor: '💻',
  
  // Connectivity
  wifi: '📶',
  'wifi-off': '📶̸',
  bluetooth: '🔵',
  gps: '🛰️',
  location: '📍',
  'location-on': '📍',
  'location-off': '📍̸',
  'my-location': '🎯',
  map: '🗺️',
  navigation: '🧭',
  'near-me': '📍',
  
  // Transportation
  car: '🚗',
  bus: '🚌',
  train: '🚆',
  flight: '✈️',
  'directions-car': '🚗',
  'directions-bus': '🚌',
  'directions-bike': '🚴',
  'directions-walk': '🚶',
  'directions-railway': '🚆',
  'directions-subway': '🚇',
  bike: '🚴',
  walk: '🚶',
  
  // Food
  restaurant: '🍽️',
  'local-dining': '🍽️',
  'local-cafe': '☕',
  coffee: '☕',
  'free-breakfast': '☕',
  
  // Shopping
  shopping: '🛒',
  'shopping-cart': '🛒',
  store: '🏪',
  
  // Finance
  payment: '💳',
  'credit-card': '💳',
  money: '💰',
  wallet: '💳',
  bank: '🏦',
  'account-balance': '💳',
  
  // Analytics
  analytics: '📊',
  chart: '📊',
  'bar-chart': '📊',
  'pie-chart': '🥧',
  'trending-up': '📈',
  'trending-down': '📉',
  'insert-chart': '📊',
  
  // Package
  package: '📦',
  box: '📦',
  'local-shipping': '🚚',
  delivery: '🚚',
  truck: '🚚',
  ship: '🚢',
  
  // Organization
  tag: '🏷️',
  label: '🏷️',
  bookmark: '🔖',
  flag: '🚩',
  'local-offer': '🏷️',
  
  // Achievement
  award: '🏆',
  medal: '🏅',
  trophy: '🏆',
  'emoji-events': '🏆',
  
  // Energy
  bolt: '⚡',
  flash: '⚡',
  'flash-on': '⚡',
  'flash-off': '⚡̸',
  'battery-full': '🔋',
  'batterychargingfull': '🔋⚡',
  'battery-std': '🔋',
  
  // Weather
  'brightness-auto': '☀️',
  'brightness-high': '☀️',
  'brightness-low': '🌙',
  'light-mode': '☀️',
  'dark-mode': '🌙',
  sunny: '☀️',
  sun: '☀️',
  moon: '🌙',
  night: '🌙',
  nightlight: '🌙',
  cloud: '☁️',
  'wb-cloudy': '☁️',
  rain: '🌧️',
  snow: '❄️',
  wind: '💨',
  air: '💨',
  thermometer: '🌡️',
  water: '💧',
  'water-drop': '💧',
  fire: '🔥',
  'local-fire-department': '🔥',
  lightbulb: '💡',
  power: '🔌',
  'power-settings-new': '🔌',
  plug: '🔌',
  
  // Tech
  cpu: '💻',
  storage: '💾',
  database: '💾',
  server: '💻',
  'cloud-upload': '☁️⬆️',
  'cloud-download': '☁️⬇️',
  'cloud-off': '☁️',
  globe: '🌍',
  link: '🔗',
  'insert-link': '🔗',
  attach: '📎',
  attachment: '📎',
  'attach-file': '📎',
  
  // User
  login: '🔑',
  logout: '🚪',
  'exit-to-app': '🚪',
  'person-add': '👤+',
  'person-remove': '👤-',
  'person-check': '👤✓',
  'person-x': '👤✕',
  
  // Messages
  message: '💬',
  'message-circle': '💬',
  comment: '💬',
  chat: '💬',
  'contact-support': '💬',
  
  // Phone
  call: '📞',
  phone: '📞',
  'call-end': '📞',
  'call-made': '📞➡️',
  'call-received': '📞⬅️',
  'call-missed': '📞❌',
  'call-merge': '📞📞',
  'call-split': '📞➿',
  
  // Media controls
  play: '▶️',
  'play-arrow': '▶️',
  'play-circle': '▶️',
  'play-circle-outline': '▶️',
  'play-circle-filled': '▶️',
  pause: '⏸️',
  stop: '⏹️',
  record: '⏺️',
  eject: '⏏️',
  'fast-forward': '⏩',
  'fast-rewind': '⏪',
  'skip-next': '⏭️',
  'skip-previous': '⏮️',
  repeat: '🔁',
  shuffle: '🔀',
  
  // Camera
  'photo-camera': '📷',
  camera: '📷',
  'camera-alt': '📷',
  'camera-front': '🤳',
  'camera-rear': '📷',
  'photo-library': '🖼️',
  'image-search': '🔍🖼️',
  
  // Storage
  disc: '💿',
  'hard-drive': '💾',
  'save-alt': '💾',
  archive: '📦',
  
  // Screen
  airplay: '📡',
  cast: '📡',
  screen: '🖥️',
  fullscreen: '⛶',
  'fullscreen-exit': '⛶',
  maximize: '⛶',
  minimize: '⛶',
  expand: '↗️',
  shrink: '↙️',
  zoom: '🔍',
  'zoom-in': '🔍+',
  'zoom-out': '🔍-',
  
  // View
  grid: '▦',
  list: '☰',
  'view-list': '☰',
  'view-module': '▦',
  'layout-grid': '▦',
  'list-ordered': '1️⃣2️⃣',
  
  // Text
  'align-left': '⬅️',
  'align-center': '↔️',
  'align-right': '➡️',
  bold: '**B**',
  italic: '*I*',
  underline: '<u>U</u>',
  strikethrough: '~S~',
  format: 'A',
  'text-fields': 'T',
  title: 'T',
  
  // Code
  code: '</>',
  terminal: '💻',
  command: '⌘',
  
  // Default
  apps: '▦',
  dashboard: '▦',
  default: '📄',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const iconName = name?.toLowerCase() || '';
  
  // Get emoji from map
  let emoji = EMOJI_MAP[iconName] || EMOJI_MAP.default;
  
  // Try partial match
  if (!emoji) {
    for (const [key] of Object.entries(EMOJI_MAP)) {
      if (iconName.includes(key) || key.includes(iconName)) {
        emoji = EMOJI_MAP[key];
        break;
      }
    }
  }
  
  return (
    <Text
      style={[
        {
          fontSize: size,
          color: color,
          textAlign: 'center',
          lineHeight: size,
        },
        style,
      ]}
    >
      {emoji}
    </Text>
  );
};

export default Icon;
