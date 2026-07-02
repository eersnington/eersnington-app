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

// Vesper theme
export const vesperTheme: Theme = {
  name: "Vesper",
  colors: {
    background: "#101010", // Near-black background
    foreground: "#FFFFFF", // Bright text
    cursor: "#FFC799", // Peach cursor
    selection: "#1C1C1C", // Raised surface
    statusLine: "#171717", // Dark status line
    statusLineText: "#99FFE4", // Mint status text
    normalMode: "#FFC799", // Peach mode indicator
    normalModeText: "#101010", // Dark text on mode
    lineNumbers: "#5F5F5F", // Muted gray line numbers
    accent: "#FFC799", // Peach accent
    hover: "#1C1C1C", // Raised surface hover
  },
};

// Tokyo Night theme
export const tokyoNightTheme: Theme = {
  name: "Tokyo Night",
  colors: {
    background: "#1a1b26", // Background
    foreground: "#c0caf5", // Foreground
    cursor: "#c0caf5", // Cursor
    selection: "#283457", // Selection
    statusLine: "#16161e", // Dark chrome
    statusLineText: "#7aa2f7", // Blue text
    normalMode: "#7aa2f7", // Blue mode indicator
    normalModeText: "#16161e", // Dark text on mode
    lineNumbers: "#565f89", // Comment gray
    accent: "#7aa2f7", // Blue accent
    hover: "#292e42", // Highlight surface
  },
};

// Catppuccin Mocha theme
export const catppuccinTheme: Theme = {
  name: "Catppuccin",
  colors: {
    background: "#1e1e2e", // Base
    foreground: "#cdd6f4", // Text
    cursor: "#f5e0dc", // Rosewater
    selection: "#45475a", // Surface 1
    statusLine: "#181825", // Mantle
    statusLineText: "#cdd6f4", // Text
    normalMode: "#f5c2e7", // Pink
    normalModeText: "#181825", // Mantle
    lineNumbers: "#6c7086", // Overlay 0
    accent: "#f5c2e7", // Pink
    hover: "#313244", // Surface0
  },
};

// Vercel-inspired monochrome theme
export const monoTheme: Theme = {
  name: "Mono",
  colors: {
    background: "#000000", // Vercel black
    foreground: "#ededed", // High-contrast text
    cursor: "#ffffff", // White cursor
    selection: "#1a1a1a", // Raised surface
    statusLine: "#111111", // Dark chrome
    statusLineText: "#a1a1a1", // Muted status text
    normalMode: "#ffffff", // White mode indicator
    normalModeText: "#000000", // Black text on mode
    lineNumbers: "#666666", // Muted gray line numbers
    accent: "#ffffff", // Monochrome accent
    hover: "#1f1f1f", // Hover surface
  },
};

// All available themes
export const themes: Theme[] = [vesperTheme, tokyoNightTheme, catppuccinTheme, monoTheme];
