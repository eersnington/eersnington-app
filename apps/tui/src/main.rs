mod actions;
mod app;
mod event;
mod model;
mod scroll;
mod theme;
mod ui;

use std::fmt;
use std::io::{self, Stdout};
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::Result;
use app::{App, Effect};
use crossterm::event as crossterm_event;
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::Rect;
use ratatui::Terminal;

use crate::actions::ActionError;

type AppTerminal = Terminal<CrosstermBackend<Stdout>>;

struct TerminalGuard;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
struct EnableScrollMouseCapture;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
struct DisableScrollMouseCapture;

impl crossterm::Command for EnableScrollMouseCapture {
    fn write_ansi(&self, f: &mut impl fmt::Write) -> fmt::Result {
        f.write_str("\x1b[?1000h\x1b[?1006h")
    }
}

impl crossterm::Command for DisableScrollMouseCapture {
    fn write_ansi(&self, f: &mut impl fmt::Write) -> fmt::Result {
        f.write_str("\x1b[?1006l\x1b[?1000l")
    }
}

impl TerminalGuard {
    fn enter() -> Result<Self> {
        enable_raw_mode()?;
        if let Err(error) = execute!(io::stdout(), EnterAlternateScreen, EnableScrollMouseCapture) {
            let _ = disable_raw_mode();
            return Err(error.into());
        }
        Ok(Self)
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = disable_raw_mode();
        let _ = execute!(
            io::stdout(),
            DisableScrollMouseCapture,
            LeaveAlternateScreen
        );
    }
}

fn main() -> Result<()> {
    if std::env::var_os("EERSNINGTON_NATIVE_SMOKE").is_some() {
        println!("eersnington native ok");
        return Ok(());
    }

    let _guard = TerminalGuard::enter()?;
    let backend = CrosstermBackend::new(io::stdout());
    let mut terminal = Terminal::new(backend)?;
    let result = run_app(&mut terminal, App::default());
    terminal.show_cursor()?;
    result
}

fn run_app(terminal: &mut AppTerminal, mut app: App) -> Result<()> {
    let mut pending_skill_fetch: Option<Receiver<Result<String, ActionError>>> = None;

    while !app.should_quit {
        let now = Instant::now();
        app.tick(now);

        if let Some(receiver) = pending_skill_fetch.take() {
            match receiver.try_recv() {
                Ok(result) => app.complete_skill_fetch(result, now),
                Err(mpsc::TryRecvError::Empty) => pending_skill_fetch = Some(receiver),
                Err(mpsc::TryRecvError::Disconnected) => {
                    app.complete_skill_fetch(Err(ActionError::SkillWorkerDisconnected), now);
                }
            }
        }

        for command in read_commands(Duration::from_millis(50))? {
            let effects = app.handle(command, Instant::now());
            execute_effects(effects, &mut app, &mut pending_skill_fetch);
        }

        clamp_scroll_to_terminal(&mut app, terminal)?;
        terminal.draw(|frame| ui::draw(frame, &app))?;
    }

    Ok(())
}

fn read_commands(timeout: Duration) -> io::Result<Vec<event::Command>> {
    let mut commands = Vec::new();
    if !crossterm_event::poll(timeout)? {
        return Ok(commands);
    }

    loop {
        commands.push(event::map_event(crossterm_event::read()?));

        if !crossterm_event::poll(Duration::ZERO)? {
            break;
        }
    }

    Ok(commands)
}

fn clamp_scroll_to_terminal(app: &mut App, terminal: &AppTerminal) -> Result<()> {
    let size = terminal.size()?;
    app.clamp_skill_scroll(max_skill_scroll(
        app,
        Rect::new(0, 0, size.width, size.height),
    ));
    Ok(())
}

fn max_skill_scroll(app: &App, root: Rect) -> u16 {
    match &app.skill {
        model::SkillState::Loaded { markdown, .. } if app.view == model::View::Skill => {
            let content = ui::content_area(root);
            let skill_content = ui::skill_content_area(content);
            scroll::max_markdown_scroll(markdown, skill_content.width, skill_content.height)
        }
        _ => 0,
    }
}

fn execute_effects(
    effects: Vec<Effect>,
    app: &mut App,
    pending_skill_fetch: &mut Option<Receiver<Result<String, ActionError>>>,
) {
    for effect in effects {
        match effect {
            Effect::OpenUrl { title, url } => {
                let result = actions::open_url(url);
                app.complete_open_url(title, result, Instant::now());
            }
            Effect::CopyContactEmail => {
                let result = actions::copy_contact_email();
                app.complete_copy_contact_email(result, Instant::now());
            }
            Effect::FetchSkill => {
                let (sender, receiver) = mpsc::channel();
                thread::spawn(move || {
                    let _ = sender.send(actions::fetch_skill_markdown());
                });
                *pending_skill_fetch = Some(receiver);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crossterm::Command;
    use std::time::SystemTime;

    #[test]
    fn scroll_mouse_capture_should_not_enable_motion_tracking() {
        let mut ansi = String::new();

        EnableScrollMouseCapture.write_ansi(&mut ansi).unwrap();

        assert_eq!(ansi, "\x1b[?1000h\x1b[?1006h");
    }

    #[test]
    fn scroll_mouse_capture_should_disable_only_enabled_modes() {
        let mut ansi = String::new();

        DisableScrollMouseCapture.write_ansi(&mut ansi).unwrap();

        assert_eq!(ansi, "\x1b[?1006l\x1b[?1000l");
    }

    #[test]
    fn max_skill_scroll_should_use_rendered_skill_content_area() {
        let app = App {
            view: model::View::Skill,
            skill: model::SkillState::Loaded {
                markdown: "1\n2\n3\n4\n5".to_owned(),
                fetched_at: SystemTime::UNIX_EPOCH,
            },
            ..App::default()
        };

        assert_eq!(max_skill_scroll(&app, Rect::new(0, 0, 12, 7)), 1);
    }

    #[test]
    fn max_skill_scroll_should_be_zero_outside_loaded_skill_view() {
        let app = App {
            view: model::View::Home,
            skill: model::SkillState::Loaded {
                markdown: "1\n2\n3\n4\n5".to_owned(),
                fetched_at: SystemTime::UNIX_EPOCH,
            },
            ..App::default()
        };

        assert_eq!(max_skill_scroll(&app, Rect::new(0, 0, 12, 7)), 0);
    }
}
