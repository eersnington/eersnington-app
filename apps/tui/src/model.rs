use std::time::{Duration, Instant, SystemTime};

pub const SKILL_RAW_URL: &str =
    "https://gist.githubusercontent.com/eersnington/4154c43469dba9aeb46e2632c86ec911/raw/SKILL.md";
pub const CONTACT_EMAIL: &str = "hi@eers.dev";
pub const SUBTITLE: &str = "software engineer | web, typescript, zig, f1";
pub const KEY_BUFFER_TIMEOUT: Duration = Duration::from_millis(1_500);
pub const STATUS_TIMEOUT: Duration = Duration::from_secs(3);
pub const MAX_KEY_BUFFER_LENGTH: usize = 10;

pub const SHORT_ASCII_TITLE: &str = r#"███████╗██████╗ ███████╗███████╗    ███╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝    ████╗  ██║
███████╗██████╔╝█████╗  █████╗      ██╔██╗ ██║
╚════██║██╔══██╗██╔══╝  ██╔══╝      ██║╚██╗██║
███████║██║  ██║███████╗███████╗    ██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═══╝"#;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum View {
    Home,
    Skill,
    Help,
    Themes,
    Contact,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum LinkKind {
    External,
    Skill,
    Contact,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct Link {
    pub id: &'static str,
    pub title: &'static str,
    pub url: &'static str,
    pub keybind: &'static str,
    pub kind: LinkKind,
}

pub const LINKS: &[Link] = &[
    Link {
        id: "github",
        title: "GitHub",
        url: "https://github.com/eersnington",
        keybind: "ggh",
        kind: LinkKind::External,
    },
    Link {
        id: "twitter",
        title: "Twitter",
        url: "https://twitter.com/eersnington",
        keybind: "gx",
        kind: LinkKind::External,
    },
    Link {
        id: "linkedin",
        title: "LinkedIn",
        url: "https://www.linkedin.com/in/sreenington",
        keybind: "gli",
        kind: LinkKind::External,
    },
    Link {
        id: "youtube",
        title: "YouTube",
        url: "https://youtube.com/@CrazyDanTHEMinecrafter",
        keybind: "gyt",
        kind: LinkKind::External,
    },
    Link {
        id: "email",
        title: "Contact Me",
        url: "mailto:hi@eers.dev",
        keybind: "gcm",
        kind: LinkKind::Contact,
    },
    Link {
        id: "skill",
        title: "SKILL.md",
        url: SKILL_RAW_URL,
        keybind: "gs",
        kind: LinkKind::Skill,
    },
];

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct Theme {
    pub name: &'static str,
    pub colors: ThemeColors,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct ThemeColors {
    pub background: &'static str,
    pub foreground: &'static str,
    pub cursor: &'static str,
    pub selection: &'static str,
    pub status_line: &'static str,
    pub status_line_text: &'static str,
    pub normal_mode: &'static str,
    pub normal_mode_text: &'static str,
    pub line_numbers: &'static str,
    pub accent: &'static str,
    pub hover: &'static str,
}

pub const THEMES: &[Theme] = &[
    Theme {
        name: "Vesper",
        colors: ThemeColors {
            background: "#101010",
            foreground: "#FFFFFF",
            cursor: "#FFC799",
            selection: "#1C1C1C",
            status_line: "#171717",
            status_line_text: "#99FFE4",
            normal_mode: "#FFC799",
            normal_mode_text: "#101010",
            line_numbers: "#5F5F5F",
            accent: "#FFC799",
            hover: "#1C1C1C",
        },
    },
    Theme {
        name: "Tokyo Night",
        colors: ThemeColors {
            background: "#1a1b26",
            foreground: "#c0caf5",
            cursor: "#c0caf5",
            selection: "#283457",
            status_line: "#16161e",
            status_line_text: "#7aa2f7",
            normal_mode: "#7aa2f7",
            normal_mode_text: "#16161e",
            line_numbers: "#565f89",
            accent: "#7aa2f7",
            hover: "#292e42",
        },
    },
    Theme {
        name: "Catppuccin",
        colors: ThemeColors {
            background: "#1e1e2e",
            foreground: "#cdd6f4",
            cursor: "#f5e0dc",
            selection: "#45475a",
            status_line: "#181825",
            status_line_text: "#cdd6f4",
            normal_mode: "#f5c2e7",
            normal_mode_text: "#181825",
            line_numbers: "#6c7086",
            accent: "#f5c2e7",
            hover: "#313244",
        },
    },
    Theme {
        name: "Mono",
        colors: ThemeColors {
            background: "#000000",
            foreground: "#ededed",
            cursor: "#ffffff",
            selection: "#1a1a1a",
            status_line: "#111111",
            status_line_text: "#a1a1a1",
            normal_mode: "#ffffff",
            normal_mode_text: "#000000",
            line_numbers: "#666666",
            accent: "#ffffff",
            hover: "#1f1f1f",
        },
    },
];

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum SkillState {
    Idle,
    Loading,
    Loaded {
        markdown: String,
        fetched_at: SystemTime,
    },
    Failed {
        message: String,
    },
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum StatusTone {
    Info,
    Error,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct StatusMessage {
    pub text: String,
    pub tone: StatusTone,
    pub expires_at: Option<Instant>,
}

#[derive(Debug, Clone, Eq, PartialEq, Default)]
pub struct KeyBuffer {
    pub text: String,
    pub expires_at: Option<Instant>,
}
