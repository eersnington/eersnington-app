import { createCliRenderer, SyntaxStyle, TextAttributes } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Link = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly keybind: string;
  readonly kind: "external" | "skill";
};

type Theme = {
  readonly name: string;
  readonly colors: {
    readonly background: string;
    readonly foreground: string;
    readonly cursor: string;
    readonly selection: string;
    readonly statusLine: string;
    readonly statusLineText: string;
    readonly normalMode: string;
    readonly normalModeText: string;
    readonly lineNumbers: string;
    readonly accent: string;
    readonly hover: string;
  };
};

type View = "home" | "skill" | "help" | "themes";

type SkillState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly markdown: string; readonly fetchedAt: Date }
  | { readonly kind: "failed"; readonly message: string };

type StatusMessage = {
  readonly text: string;
  readonly tone: "info" | "error";
};

type KeyEventLike = {
  readonly name: string;
  readonly ctrl: boolean;
  readonly shift: boolean;
  readonly sequence: string;
};

const SKILL_RAW_URL =
  "https://gist.githubusercontent.com/eersnington/4154c43469dba9aeb46e2632c86ec911/raw/SKILL.md";

const SUBTITLE = "software engineer | web, typescript, zig, f1";

const SHORT_ASCII_TITLE = `
███████╗██████╗ ███████╗███████╗    ███╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝    ████╗  ██║
███████╗██████╔╝█████╗  █████╗      ██╔██╗ ██║
╚════██║██╔══██╗██╔══╝  ██╔══╝      ██║╚██╗██║
███████║██║  ██║███████╗███████╗    ██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═══╝
`.trim();

const LINKS: readonly Link[] = [
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/eersnington",
    keybind: "ggh",
    kind: "external",
  },
  {
    id: "twitter",
    title: "Twitter",
    url: "https://twitter.com/eersnington",
    keybind: "gx",
    kind: "external",
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    url: "https://www.linkedin.com/in/sreenington",
    keybind: "gli",
    kind: "external",
  },
  {
    id: "youtube",
    title: "YouTube",
    url: "https://youtube.com/@CrazyDanTHEMinecrafter",
    keybind: "gyt",
    kind: "external",
  },
  {
    id: "email",
    title: "Contact Me",
    url: "mailto:hi@eers.dev",
    keybind: "gcm",
    kind: "external",
  },
  {
    id: "skill",
    title: "SKILL.md",
    url: SKILL_RAW_URL,
    keybind: "gs",
    kind: "skill",
  },
];

const THEMES: readonly Theme[] = [
  {
    name: "Vesper",
    colors: {
      background: "#101010",
      foreground: "#FFFFFF",
      cursor: "#FFC799",
      selection: "#1C1C1C",
      statusLine: "#171717",
      statusLineText: "#99FFE4",
      normalMode: "#FFC799",
      normalModeText: "#101010",
      lineNumbers: "#5F5F5F",
      accent: "#FFC799",
      hover: "#1C1C1C",
    },
  },
  {
    name: "Tokyo Night",
    colors: {
      background: "#1a1b26",
      foreground: "#c0caf5",
      cursor: "#c0caf5",
      selection: "#283457",
      statusLine: "#16161e",
      statusLineText: "#7aa2f7",
      normalMode: "#7aa2f7",
      normalModeText: "#16161e",
      lineNumbers: "#565f89",
      accent: "#7aa2f7",
      hover: "#292e42",
    },
  },
  {
    name: "Catppuccin",
    colors: {
      background: "#1e1e2e",
      foreground: "#cdd6f4",
      cursor: "#f5e0dc",
      selection: "#45475a",
      statusLine: "#181825",
      statusLineText: "#cdd6f4",
      normalMode: "#f5c2e7",
      normalModeText: "#181825",
      lineNumbers: "#6c7086",
      accent: "#f5c2e7",
      hover: "#313244",
    },
  },
  {
    name: "Mono",
    colors: {
      background: "#000000",
      foreground: "#ededed",
      cursor: "#ffffff",
      selection: "#1a1a1a",
      statusLine: "#111111",
      statusLineText: "#a1a1a1",
      normalMode: "#ffffff",
      normalModeText: "#000000",
      lineNumbers: "#666666",
      accent: "#ffffff",
      hover: "#1f1f1f",
    },
  },
];

const KEY_BUFFER_TIMEOUT_MS = 1_500;
const MAX_KEY_BUFFER_LENGTH = 10;

function normalizeKey(event: KeyEventLike): string {
  if (event.name.length === 1) {
    return event.shift ? event.name.toUpperCase() : event.name;
  }

  return event.name;
}

function isDownKey(event: KeyEventLike): boolean {
  return event.name === "down" || event.name === "j";
}

function isUpKey(event: KeyEventLike): boolean {
  return event.name === "up" || event.name === "k";
}

function isEnterKey(event: KeyEventLike): boolean {
  return event.name === "return" || event.name === "linefeed" || event.name === "enter";
}

function openExternalUrl(url: string): void {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  Bun.spawn([opener, ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
}

async function fetchSkillMarkdown(): Promise<SkillState> {
  let response: Response;

  try {
    response = await fetch(SKILL_RAW_URL);
  } catch (error) {
    return {
      kind: "failed",
      message: `Could not fetch SKILL.md from GitHub. The TUI is still running; press r to retry. Cause: ${error instanceof Error ? error.message : "unknown network error"}`,
    };
  }

  if (!response.ok) {
    return {
      kind: "failed",
      message: `GitHub returned ${response.status} while fetching SKILL.md. The TUI is still running; press r to retry or open the gist in a browser.`,
    };
  }

  return {
    kind: "loaded",
    markdown: await response.text(),
    fetchedAt: new Date(),
  };
}

function App() {
  const { height } = useTerminalDimensions();
  const [view, setView] = useState<View>("home");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [skillState, setSkillState] = useState<SkillState>({ kind: "idle" });
  const keyBufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillRequestId = useRef(0);
  const theme = THEMES[themeIndex] ?? THEMES[0]!;
  const colors = theme.colors;
  const syntaxStyle = useMemo(
    () =>
      SyntaxStyle.fromStyles({
        heading: { fg: colors.accent, bold: true },
        strong: { fg: colors.accent, bold: true },
        em: { fg: colors.foreground, italic: true },
        codespan: { fg: colors.cursor, bg: colors.selection },
        code: { fg: colors.foreground, bg: colors.statusLine },
        blockquote: { fg: colors.lineNumbers, italic: true },
        link: { fg: colors.accent, underline: true },
      }),
    [colors]
  );

  const loadSkill = useCallback(() => {
    const requestId = skillRequestId.current + 1;
    skillRequestId.current = requestId;
    setSkillState({ kind: "loading" });

    void fetchSkillMarkdown().then((nextState) => {
      if (skillRequestId.current === requestId) {
        setSkillState(nextState);
      }
    });
  }, []);

  const showStatusMessage = useCallback((message: StatusMessage) => {
    setStatusMessage(message);

    if (statusMessageTimer.current) {
      clearTimeout(statusMessageTimer.current);
    }

    statusMessageTimer.current = setTimeout(() => setStatusMessage(null), 2_500);
  }, []);

  const openSkillView = useCallback(() => {
    setView("skill");
    setKeyBuffer("");
    showStatusMessage({ text: "Fetching latest SKILL.md from GitHub Gist...", tone: "info" });

    if (skillState.kind === "idle" || skillState.kind === "failed") {
      loadSkill();
    }
  }, [loadSkill, showStatusMessage, skillState.kind]);

  const activateLink = useCallback(
    (link: Link) => {
      if (link.kind === "skill") {
        openSkillView();
        return;
      }

      openExternalUrl(link.url);
      showStatusMessage({ text: `Opening ${link.title}...`, tone: "info" });
    },
    [openSkillView, showStatusMessage]
  );

  const appendKeyBuffer = useCallback((key: string) => {
    setKeyBuffer((current) => {
      const next = current.length > MAX_KEY_BUFFER_LENGTH ? key : current + key;
      const matchedLink = LINKS.find((link) => next.endsWith(link.keybind));

      if (matchedLink) {
        activateLink(matchedLink);
        return "";
      }

      return next;
    });

    if (keyBufferTimer.current) {
      clearTimeout(keyBufferTimer.current);
    }

    keyBufferTimer.current = setTimeout(() => setKeyBuffer(""), KEY_BUFFER_TIMEOUT_MS);
  }, [activateLink]);

  useEffect(() => {
    return () => {
      if (keyBufferTimer.current) {
        clearTimeout(keyBufferTimer.current);
      }
      if (statusMessageTimer.current) {
        clearTimeout(statusMessageTimer.current);
      }
      syntaxStyle.destroy();
    };
  }, [syntaxStyle]);

  useKeyboard((event) => {
    if (event.ctrl && event.name === "c") {
      process.exit(0);
    }

    const key = normalizeKey(event);

    if (key === "q" && view === "home") {
      process.exit(0);
    }

    if (key === "escape") {
      setView("home");
      setKeyBuffer("");
      return;
    }

    if (key === "?") {
      setView("help");
      setKeyBuffer("");
      return;
    }

    if (key === "T") {
      setView("themes");
      setKeyBuffer("");
      return;
    }

    if (view === "themes") {
      if (isDownKey(event)) {
        setThemeIndex((current) => Math.min(current + 1, THEMES.length - 1));
      } else if (isUpKey(event)) {
        setThemeIndex((current) => Math.max(current - 1, 0));
      } else if (isEnterKey(event)) {
        setView("home");
      }
      return;
    }

    if (view === "skill") {
      if (key === "r") {
        loadSkill();
      }
      return;
    }

    if (view === "help") {
      if (isEnterKey(event)) {
        setView("home");
      }
      return;
    }

    if (isDownKey(event)) {
      setSelectedIndex((current) => Math.min(current + 1, LINKS.length - 1));
      return;
    }

    if (isUpKey(event)) {
      setSelectedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (isEnterKey(event)) {
      const selectedLink = LINKS[selectedIndex];
      if (selectedLink) {
        activateLink(selectedLink);
      }
      return;
    }

    if (key.length === 1) {
      appendKeyBuffer(key);
    }
  });

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={colors.background}>
    <box flexGrow={1} flexDirection="row" backgroundColor={colors.background}>
        <LineGutter height={Math.max(0, height - 1)} color={colors.lineNumbers} />
        <box flexGrow={1} paddingLeft={2} paddingRight={2} paddingTop={1} backgroundColor={colors.background}>
          {view === "home" ? (
            <HomeView
              colors={colors}
              links={LINKS}
              selectedIndex={selectedIndex}
            />
          ) : null}
          {view === "skill" ? (
            <SkillView colors={colors} skillState={skillState} syntaxStyle={syntaxStyle} />
          ) : null}
          {view === "help" ? <HelpView colors={colors} /> : null}
          {view === "themes" ? (
            <ThemeView colors={colors} selectedThemeIndex={themeIndex} themes={THEMES} />
          ) : null}
        </box>
      </box>
      <StatusLine
        colors={colors}
        currentTheme={theme.name}
        keyBuffer={keyBuffer}
        statusMessage={statusMessage}
        view={view}
      />
    </box>
  );
}

function LineGutter({ height, color }: { readonly height: number; readonly color: string }) {
  const rows = Array.from({ length: Math.max(1, height) }, (_, index) => index + 1);

  return (
    <box flexDirection="column" width={6} paddingRight={1} backgroundColor="transparent">
      {rows.map((line) => (
        <text key={line} fg={color} attributes={TextAttributes.DIM} truncate>
          {line === 1 ? "  1" : "  ~"}
        </text>
      ))}
    </box>
  );
}

function HomeView({
  colors,
  links,
  selectedIndex,
}: {
  readonly colors: Theme["colors"];
  readonly links: readonly Link[];
  readonly selectedIndex: number;
}) {
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center" backgroundColor="transparent">
      <box flexDirection="column" alignItems="center" gap={1} width={58} backgroundColor="transparent">
        <box flexDirection="column" alignItems="center" backgroundColor="transparent">
          {SHORT_ASCII_TITLE.split("\n").map((line) => (
            <text key={line} fg={colors.accent} wrapMode="none">
              {line}
            </text>
          ))}
        </box>
        <box paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1} backgroundColor={colors.selection}>
          <text fg={colors.foreground}>{SUBTITLE} ▲</text>
        </box>
        <NavigationLinks colors={colors} links={links} selectedIndex={selectedIndex} />
        <text fg={colors.lineNumbers} attributes={TextAttributes.DIM}>
          j/k move · enter open · ? help · T theme · q quit
        </text>
      </box>
    </box>
  );
}

function NavigationLinks({
  colors,
  links,
  selectedIndex,
}: {
  readonly colors: Theme["colors"];
  readonly links: readonly Link[];
  readonly selectedIndex: number;
}) {
  return (
    <box flexDirection="column" width={42} gap={1} backgroundColor="transparent">
      {links.map((link, index) => {
        const active = index === selectedIndex;
        const prefix = active ? "▸" : " ";

        return (
          <box
            key={link.id}
            flexDirection="row"
            justifyContent="space-between"
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={active ? colors.selection : "transparent"}
          >
            <text fg={active ? colors.accent : colors.foreground}>{prefix} {link.title}</text>
            <text fg={active ? colors.accent : colors.lineNumbers}>{link.keybind}</text>
          </box>
        );
      })}
    </box>
  );
}

function SkillView({
  colors,
  skillState,
  syntaxStyle,
}: {
  readonly colors: Theme["colors"];
  readonly skillState: SkillState;
  readonly syntaxStyle: SyntaxStyle;
}) {
  if (skillState.kind === "loading" || skillState.kind === "idle") {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
        <text fg={colors.accent}>Fetching latest SKILL.md from GitHub Gist...</text>
      </box>
    );
  }

  if (skillState.kind === "failed") {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
        <box flexDirection="column" width={76} gap={1} border borderColor={colors.accent} padding={2}>
          <text fg={colors.accent}>Could not load SKILL.md.</text>
          <text fg={colors.foreground} wrapMode="word">{skillState.message}</text>
          <text fg={colors.lineNumbers}>Press r to retry, Escape to return home.</text>
        </box>
      </box>
    );
  }

  return (
    <scrollbox
      focused
      flexGrow={1}
      scrollY
      border
      borderColor={colors.accent}
      title="SKILL.md"
      titleColor={colors.accent}
      padding={1}
      backgroundColor={colors.background}
    >
      <markdown
        content={skillState.markdown}
        syntaxStyle={syntaxStyle}
        fg={colors.foreground}
        bg={colors.background}
        conceal={false}
        concealCode={false}
        internalBlockMode="top-level"
      />
    </scrollbox>
  );
}

function HelpView({ colors }: { readonly colors: Theme["colors"] }) {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
      <box flexDirection="column" width={64} gap={1} border borderColor={colors.accent} padding={2}>
        <text fg={colors.accent}>Keybinds</text>
        <text fg={colors.foreground}>j / down       move selection down</text>
        <text fg={colors.foreground}>k / up         move selection up</text>
        <text fg={colors.foreground}>enter          open selected item</text>
        <text fg={colors.foreground}>ggh gx gli...  open social links</text>
        <text fg={colors.foreground}>gs             render latest SKILL.md</text>
        <text fg={colors.foreground}>r              refresh SKILL.md in skill view</text>
        <text fg={colors.foreground}>T              theme picker</text>
        <text fg={colors.foreground}>Escape         return home</text>
        <text fg={colors.foreground}>q / ctrl+c     quit</text>
        <text fg={colors.lineNumbers} attributes={TextAttributes.DIM}>Press Enter or Escape to close.</text>
      </box>
    </box>
  );
}

function ThemeView({
  colors,
  selectedThemeIndex,
  themes,
}: {
  readonly colors: Theme["colors"];
  readonly selectedThemeIndex: number;
  readonly themes: readonly Theme[];
}) {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
      <box flexDirection="column" width={42} gap={1} border borderColor={colors.accent} padding={2}>
        <text fg={colors.accent}>Themes</text>
        {themes.map((theme, index) => {
          const active = index === selectedThemeIndex;

          return (
            <box
              key={theme.name}
              flexDirection="row"
              paddingLeft={1}
              backgroundColor={active ? colors.selection : "transparent"}
            >
              <text fg={active ? colors.accent : colors.foreground}>{active ? "▸" : " "} {theme.name}</text>
            </box>
          );
        })}
        <text fg={colors.lineNumbers} attributes={TextAttributes.DIM}>j/k choose · Enter or Escape closes</text>
      </box>
    </box>
  );
}

function StatusLine({
  colors,
  currentTheme,
  keyBuffer,
  statusMessage,
  view,
}: {
  readonly colors: Theme["colors"];
  readonly currentTheme: string;
  readonly keyBuffer: string;
  readonly statusMessage: StatusMessage | null;
  readonly view: View;
}) {
  const file =
    view === "skill" ? "~/SKILL.md" : view === "help" ? "~/help" : view === "themes" ? "~/themes" : "~/main";
  const filetype = view === "skill" ? "markdown" : view === "home" ? "main" : "text";
  const mode = view === "home" || view === "skill" ? "NORMAL" : "MENU";

  return (
    <box height={1} flexDirection="row" backgroundColor={colors.statusLine}>
      <box paddingLeft={1} paddingRight={1} backgroundColor={colors.normalMode}>
        <text fg={colors.normalModeText}>{mode}</text>
      </box>
      <text fg={colors.statusLineText}> {file}</text>
      {statusMessage ? (
        <text fg={statusMessage.tone === "error" ? colors.cursor : colors.accent}>  {statusMessage.text}</text>
      ) : (
        <text fg={colors.lineNumbers} attributes={TextAttributes.DIM}></text>
      )}
      <box flexGrow={1} />
      {keyBuffer ? <text fg={colors.cursor}> keys:{keyBuffer} </text> : null}
      <text fg={colors.statusLineText}> Theme: {currentTheme}  {filetype}  1:1 </text>
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App />);
