export type Theme = {
  name: string;
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    statusLine: string;
    statusLineText: string;
    normalMode: string;
    normalModeText: string;
    lineNumbers: string;
    accent: string;
    hover: string;
  };
};

// Default theme (current one)
export const defaultTheme: Theme = {
  name: 'Default',
  colors: {
    background: '#1E1E2E', // Dark background
    foreground: '#CDD6F4', // Light text
    cursor: '#F5E0DC', // Cursor color
    selection: '#313346', // Selection highlight
    statusLine: '#181825', // Status line background
    statusLineText: '#CDD6F4', // Status line text
    normalMode: '#89B4FA', // Mode indicator
    normalModeText: '#181825', // Mode indicator text
    lineNumbers: '#6C7086', // Line numbers color
    accent: '#89B4FA', // Accent color
    hover: '#313346', // Hover color
  },
};

// Catppuccin Mocha theme
export const catppuccinTheme: Theme = {
  name: 'Catppuccin',
  colors: {
    background: '#1E1E2E', // Base
    foreground: '#CDD6F4', // Text
    cursor: '#F5E0DC', // Rosewater
    selection: '#45475A', // Surface1
    statusLine: '#181825', // Mantle
    statusLineText: '#CDD6F4', // Text
    normalMode: '#F5C2E7', // Pink
    normalModeText: '#181825', // Mantle
    lineNumbers: '#6C7086', // Subtext0
    accent: '#F5C2E7', // Pink
    hover: '#313244', // Surface0
  },
};

// Claude theme based on the image
export const claudeTheme: Theme = {
  name: 'Claude',
  colors: {
    background: '#1C1C1C', // Dark background (almost black)
    foreground: '#E6E6E6', // Light text
    cursor: '#E86C52', // Coral cursor
    selection: '#2D2D2D', // Slightly lighter selection
    statusLine: '#141414', // Darker status line
    statusLineText: '#7EB6FF', // Light blue text
    normalMode: '#E86C52', // Coral mode indicator
    normalModeText: '#141414', // Dark text on mode indicator
    lineNumbers: '#666666', // Medium gray line numbers
    accent: '#E86C52', // Coral accent
    hover: '#2D2D2D', // Slightly lighter hover
  },
};

// Light theme
export const lightTheme: Theme = {
  name: 'Light',
  colors: {
    background: '#F8F8F2', // Light background
    foreground: '#282A36', // Dark text
    cursor: '#FF79C6', // Pink cursor
    selection: '#E6E6E6', // Light selection
    statusLine: '#F1F1F1', // Light status line
    statusLineText: '#44475A', // Dark status text
    normalMode: '#50FA7B', // Green mode indicator
    normalModeText: '#282A36', // Dark text on mode
    lineNumbers: '#6272A4', // Muted blue line numbers
    accent: '#BD93F9', // Purple accent
    hover: '#F1F1F1', // Light hover
  },
};

// All available themes
export const themes: Theme[] = [
  defaultTheme,
  catppuccinTheme,
  claudeTheme,
  lightTheme,
];
