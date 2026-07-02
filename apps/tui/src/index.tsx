import { SyntaxStyle, TextAttributes } from "@opentui/core";
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { createEffect, createMemo, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js";

type Link = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly keybind: string;
  readonly kind: "external" | "skill" | "contact";
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

type View = "home" | "skill" | "help" | "themes" | "contact";

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
const CONTACT_EMAIL = "hi@eers.dev";

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
    url: `mailto:${CONTACT_EMAIL}`,
    keybind: "gcm",
    kind: "contact",
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
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  Bun.spawn([opener, ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
}

function getClipboardCommands(): readonly (readonly string[])[] {
  if (process.platform === "darwin") {
    return [["pbcopy"]];
  }

  if (process.platform === "win32") {
    return [["cmd", "/c", "clip"]];
  }

  return [
    ["wl-copy"],
    ["xclip", "-selection", "clipboard"],
    ["xsel", "--clipboard", "--input"],
  ];
}

async function writeClipboardText(text: string): Promise<boolean> {
  for (const command of getClipboardCommands()) {
    try {
      const subprocess = Bun.spawn([...command], {
        stdin: "pipe",
        stdout: "ignore",
        stderr: "ignore",
      });

      subprocess.stdin.write(text);
      subprocess.stdin.end();

      if ((await subprocess.exited) === 0) {
        return true;
      }
    } catch {
      // Try the next platform clipboard command.
    }
  }

  return false;
}

async function copyContactEmail(): Promise<StatusMessage> {
  const copied = await writeClipboardText(CONTACT_EMAIL);

  if (copied) {
    return { text: `Copied ${CONTACT_EMAIL} to clipboard.`, tone: "info" };
  }

  return {
    text: `Could not copy automatically. Email preserved here: ${CONTACT_EMAIL}`,
    tone: "error",
  };
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
  const renderer = useRenderer();
  const dimensions = useTerminalDimensions();
  const [view, setView] = createSignal<View>("home");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [themeIndex, setThemeIndex] = createSignal(0);
  const [keyBuffer, setKeyBuffer] = createSignal("");
  const [statusMessage, setStatusMessage] = createSignal<StatusMessage | null>(null);
  const [contactCopyMessage, setContactCopyMessage] = createSignal<StatusMessage | null>(null);
  const [skillState, setSkillState] = createSignal<SkillState>({ kind: "idle" });
  let keyBufferTimer: ReturnType<typeof setTimeout> | null = null;
  let statusMessageTimer: ReturnType<typeof setTimeout> | null = null;
  let skillRequestId = 0;
  const theme = createMemo(() => THEMES[themeIndex()] ?? THEMES[0]!);
  const colors = createMemo(() => theme().colors);
  const syntaxStyle = createMemo(() => {
    const currentColors = colors();

    return SyntaxStyle.fromStyles({
      heading: { fg: currentColors.accent, bold: true },
      strong: { fg: currentColors.accent, bold: true },
      em: { fg: currentColors.foreground, italic: true },
      codespan: { fg: currentColors.cursor, bg: currentColors.selection },
      code: { fg: currentColors.foreground, bg: currentColors.statusLine },
      blockquote: { fg: currentColors.lineNumbers, italic: true },
      link: { fg: currentColors.accent, underline: true },
    });
  });

  function loadSkill(): void {
    const requestId = skillRequestId + 1;
    skillRequestId = requestId;
    setSkillState({ kind: "loading" });

    void fetchSkillMarkdown().then((nextState) => {
      if (skillRequestId === requestId) {
        setSkillState(nextState);
      }
    });
  }

  function showStatusMessage(message: StatusMessage): void {
    setStatusMessage(message);

    if (statusMessageTimer) {
      clearTimeout(statusMessageTimer);
    }

    statusMessageTimer = setTimeout(() => setStatusMessage(null), 2_500);
  }

  function openSkillView(): void {
    setView("skill");
    setKeyBuffer("");
    showStatusMessage({ text: "Fetching latest SKILL.md from GitHub Gist...", tone: "info" });

    const currentSkillState = skillState();

    if (currentSkillState.kind === "idle" || currentSkillState.kind === "failed") {
      loadSkill();
    }
  }

  function openContactView(): void {
    setView("contact");
    setKeyBuffer("");
    setContactCopyMessage(null);
    showStatusMessage({ text: "Press Enter to copy my email address.", tone: "info" });
  }

  function activateLink(link: Link): void {
    if (link.kind === "skill") {
      openSkillView();
      return;
    }

    if (link.kind === "contact") {
      openContactView();
      return;
    }

    openExternalUrl(link.url);
    showStatusMessage({ text: `Opening ${link.title}...`, tone: "info" });
  }

  function appendKeyBuffer(key: string): void {
    const current = keyBuffer();
    const next = current.length > MAX_KEY_BUFFER_LENGTH ? key : current + key;
    const matchedLink = LINKS.find((link) => next.endsWith(link.keybind));

    if (matchedLink) {
      activateLink(matchedLink);
      setKeyBuffer("");
    } else {
      setKeyBuffer(next);
    }

    if (keyBufferTimer) {
      clearTimeout(keyBufferTimer);
    }

    keyBufferTimer = setTimeout(() => setKeyBuffer(""), KEY_BUFFER_TIMEOUT_MS);
  }

  createEffect(() => {
    const style = syntaxStyle();
    onCleanup(() => style.destroy());
  });

  onCleanup(() => {
    if (keyBufferTimer) {
      clearTimeout(keyBufferTimer);
    }
    if (statusMessageTimer) {
      clearTimeout(statusMessageTimer);
    }
  });

  useKeyboard((event) => {
    if (event.ctrl && event.name === "c") {
      renderer.destroy();
      return;
    }

    const key = normalizeKey(event);
    const currentView = view();

    if (key === "q" && currentView === "home") {
      renderer.destroy();
      return;
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

    if (currentView === "themes") {
      if (isDownKey(event)) {
        setThemeIndex((current) => Math.min(current + 1, THEMES.length - 1));
      } else if (isUpKey(event)) {
        setThemeIndex((current) => Math.max(current - 1, 0));
      } else if (isEnterKey(event)) {
        setView("home");
      }
      return;
    }

    if (currentView === "skill") {
      if (key === "r") {
        loadSkill();
      }
      return;
    }

    if (currentView === "contact") {
      if (isEnterKey(event)) {
        void copyContactEmail().then(setContactCopyMessage);
      }
      return;
    }

    if (currentView === "help") {
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
      const selectedLink = LINKS[selectedIndex()];
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
    <box flexDirection="column" flexGrow={1} backgroundColor={colors().background}>
      <box flexGrow={1} flexDirection="row" backgroundColor={colors().background}>
        <LineGutter height={Math.max(0, dimensions().height - 1)} color={colors().lineNumbers} />
        <box
          flexGrow={1}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          backgroundColor={colors().background}
        >
          <Show when={view() === "home"}>
            <HomeView colors={colors()} links={LINKS} selectedIndex={selectedIndex()} />
          </Show>
          <Show when={view() === "skill"}>
            <SkillView colors={colors()} skillState={skillState()} syntaxStyle={syntaxStyle()} />
          </Show>
          <Show when={view() === "help"}>
            <HelpView colors={colors()} />
          </Show>
          <Show when={view() === "themes"}>
            <ThemeView colors={colors()} selectedThemeIndex={themeIndex()} themes={THEMES} />
          </Show>
          <Show when={view() === "contact"}>
            <ContactView colors={colors()} copyMessage={contactCopyMessage()} />
          </Show>
        </box>
      </box>
      <StatusLine
        colors={colors()}
        currentTheme={theme().name}
        keyBuffer={keyBuffer()}
        statusMessage={statusMessage()}
        view={view()}
      />
    </box>
  );
}

function LineGutter(props: { readonly height: number; readonly color: string }) {
  const rows = createMemo(() => Array.from({ length: Math.max(1, props.height) }, (_, index) => index + 1));

  return (
    <box flexDirection="column" width={6} paddingRight={1} backgroundColor="transparent">
      <For each={rows()}>
        {(line) => (
          <text fg={props.color} attributes={TextAttributes.DIM} truncate>
            {line === 1 ? "  1" : "  ~"}
          </text>
        )}
      </For>
    </box>
  );
}

function HomeView(props: {
  readonly colors: Theme["colors"];
  readonly links: readonly Link[];
  readonly selectedIndex: number;
}) {
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center" backgroundColor="transparent">
      <box
        flexDirection="column"
        alignItems="center"
        gap={1}
        width={58}
        backgroundColor="transparent"
      >
        <box flexDirection="column" alignItems="center" backgroundColor="transparent">
          <For each={SHORT_ASCII_TITLE.split("\n")}>
            {(line) => (
              <text fg={props.colors.accent} wrapMode="none">
                {line}
              </text>
            )}
          </For>
        </box>
        <box
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
          backgroundColor={props.colors.selection}
        >
          <text fg={props.colors.foreground}>{SUBTITLE} ▲</text>
        </box>
        <NavigationLinks colors={props.colors} links={props.links} selectedIndex={props.selectedIndex} />
        <text fg={props.colors.lineNumbers} attributes={TextAttributes.DIM}>
          j/k move · enter open · ? help · T theme · q quit
        </text>
      </box>
    </box>
  );
}

function NavigationLinks(props: {
  readonly colors: Theme["colors"];
  readonly links: readonly Link[];
  readonly selectedIndex: number;
}) {
  return (
    <box flexDirection="column" width={42} gap={1} backgroundColor="transparent">
      <For each={props.links}>
        {(link, index) => {
          const active = () => index() === props.selectedIndex;
          const prefix = () => (active() ? "▸" : " ");

          return (
            <box
              flexDirection="row"
              justifyContent="space-between"
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={active() ? props.colors.selection : "transparent"}
            >
              <text fg={active() ? props.colors.accent : props.colors.foreground}>
                {prefix()} {link.title}
              </text>
              <text fg={active() ? props.colors.accent : props.colors.lineNumbers}>{link.keybind}</text>
            </box>
          );
        }}
      </For>
    </box>
  );
}

function SkillView(props: {
  readonly colors: Theme["colors"];
  readonly skillState: SkillState;
  readonly syntaxStyle: SyntaxStyle;
}) {
  return (
    <Switch>
      <Match when={props.skillState.kind === "loading" || props.skillState.kind === "idle"}>
        <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
          <text fg={props.colors.accent}>Fetching latest SKILL.md from GitHub Gist...</text>
        </box>
      </Match>
      <Match when={props.skillState.kind === "failed" ? props.skillState : null}>
        {(failedState) => (
          <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
            <box
              flexDirection="column"
              width={76}
              gap={1}
              border
              borderColor={props.colors.accent}
              padding={2}
            >
              <text fg={props.colors.accent}>Could not load SKILL.md.</text>
              <text fg={props.colors.foreground} wrapMode="word">
                {failedState().message}
              </text>
              <text fg={props.colors.lineNumbers}>Press r to retry, Escape to return home.</text>
            </box>
          </box>
        )}
      </Match>
      <Match when={props.skillState.kind === "loaded" ? props.skillState : null}>
        {(loadedState) => (
          <scrollbox
            focused
            flexGrow={1}
            scrollY
            border
            borderColor={props.colors.accent}
            focusedBorderColor={props.colors.accent}
            title="SKILL.md"
            titleColor={props.colors.accent}
            padding={1}
            backgroundColor={props.colors.background}
          >
            <markdown
              content={loadedState().markdown}
              syntaxStyle={props.syntaxStyle}
              fg={props.colors.foreground}
              bg={props.colors.background}
              conceal={false}
              concealCode={false}
              internalBlockMode="top-level"
            />
          </scrollbox>
        )}
      </Match>
    </Switch>
  );
}

function HelpView(props: { readonly colors: Theme["colors"] }) {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
      <box flexDirection="column" width={64} gap={1} border borderColor={props.colors.accent} padding={2}>
        <text fg={props.colors.accent}>Keybinds</text>
        <text fg={props.colors.foreground}>j / down move selection down</text>
        <text fg={props.colors.foreground}>k / up move selection up</text>
        <text fg={props.colors.foreground}>enter open selected item</text>
        <text fg={props.colors.foreground}>ggh gx gli... open social links</text>
        <text fg={props.colors.foreground}>gcm show contact card</text>
        <text fg={props.colors.foreground}>gs render latest SKILL.md</text>
        <text fg={props.colors.foreground}>r refresh SKILL.md in skill view</text>
        <text fg={props.colors.foreground}>T theme picker</text>
        <text fg={props.colors.foreground}>Escape return home</text>
        <text fg={props.colors.foreground}>q / ctrl+c quit</text>
        <text fg={props.colors.lineNumbers} attributes={TextAttributes.DIM}>
          Press Enter or Escape to close.
        </text>
      </box>
    </box>
  );
}

function ContactView(props: { readonly colors: Theme["colors"]; readonly copyMessage: StatusMessage | null }) {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
      <box
        flexDirection="column"
        alignItems="center"
        width={52}
        gap={1}
        border
        borderColor={props.colors.accent}
        padding={2}
        backgroundColor={props.colors.background}
      >
        <text fg={props.colors.accent}>Contact Me</text>
        <text fg={props.colors.foreground}>{CONTACT_EMAIL}</text>
        <box paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1} backgroundColor={props.colors.selection}>
          <text fg={props.colors.accent}>Enter to copy to clipboard</text>
        </box>
        <Show
          when={props.copyMessage}
          fallback={
            <text fg={props.colors.lineNumbers} attributes={TextAttributes.DIM}>
              Escape returns home
            </text>
          }
        >
          {(message) => <text fg={message().tone === "error" ? props.colors.cursor : props.colors.accent}>{message().text}</text>}
        </Show>
      </box>
    </box>
  );
}

function ThemeView(props: {
  readonly colors: Theme["colors"];
  readonly selectedThemeIndex: number;
  readonly themes: readonly Theme[];
}) {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center" backgroundColor="transparent">
      <box flexDirection="column" width={42} gap={1} border borderColor={props.colors.accent} padding={2}>
        <text fg={props.colors.accent}>Themes</text>
        <For each={props.themes}>
          {(theme, index) => {
            const active = () => index() === props.selectedThemeIndex;

            return (
              <box
                flexDirection="row"
                paddingLeft={1}
                backgroundColor={active() ? props.colors.selection : "transparent"}
              >
                <text fg={active() ? props.colors.accent : props.colors.foreground}>
                  {active() ? "▸" : " "} {theme.name}
                </text>
              </box>
            );
          }}
        </For>
        <text fg={props.colors.lineNumbers} attributes={TextAttributes.DIM}>
          j/k choose · Enter or Escape closes
        </text>
      </box>
    </box>
  );
}

function StatusLine(props: {
  readonly colors: Theme["colors"];
  readonly currentTheme: string;
  readonly keyBuffer: string;
  readonly statusMessage: StatusMessage | null;
  readonly view: View;
}) {
  const file = () =>
    props.view === "skill"
      ? "~/SKILL.md"
      : props.view === "help"
        ? "~/help"
        : props.view === "themes"
          ? "~/themes"
          : props.view === "contact"
            ? "~/contact"
            : "~/main";
  const filetype = () => (props.view === "skill" ? "markdown" : props.view === "home" ? "main" : "text");
  const mode = () => (props.view === "home" || props.view === "skill" || props.view === "contact" ? "NORMAL" : "MENU");

  return (
    <box height={1} flexDirection="row" backgroundColor={props.colors.statusLine}>
      <box paddingLeft={1} paddingRight={1} backgroundColor={props.colors.normalMode}>
        <text fg={props.colors.normalModeText}>{mode()}</text>
      </box>
      <text fg={props.colors.statusLineText}> {file()}</text>
      <Show
        when={props.statusMessage}
        fallback={<text fg={props.colors.lineNumbers} attributes={TextAttributes.DIM}></text>}
      >
        {(message) => (
          <text fg={message().tone === "error" ? props.colors.cursor : props.colors.accent}>
            {" "}
            {message().text}
          </text>
        )}
      </Show>
      <box flexGrow={1} />
      <Show when={props.keyBuffer}>{(buffer) => <text fg={props.colors.cursor}> keys:{buffer()} </text>}</Show>
      <text fg={props.colors.statusLineText}>
        {" "}
        Theme: {props.currentTheme} {filetype()} 1:1{" "}
      </text>
    </box>
  );
}

await render(() => <App />, { exitOnCtrlC: false });
