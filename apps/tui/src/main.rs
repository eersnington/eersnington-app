mod actions;
mod app;
mod event;
mod model;
mod theme;
mod ui;

use std::io::{self, Stdout};
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::Result;
use app::{App, Effect};
use crossterm::event as crossterm_event;
use crossterm::event::Event;
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;

use crate::actions::ActionError;

type AppTerminal = Terminal<CrosstermBackend<Stdout>>;

struct TerminalGuard;

impl TerminalGuard {
    fn enter() -> Result<Self> {
        enable_raw_mode()?;
        if let Err(error) = execute!(io::stdout(), EnterAlternateScreen) {
            let _ = disable_raw_mode();
            return Err(error.into());
        }
        Ok(Self)
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = disable_raw_mode();
        let _ = execute!(io::stdout(), LeaveAlternateScreen);
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

        terminal.draw(|frame| ui::draw(frame, &app))?;

        if crossterm_event::poll(Duration::from_millis(50))? {
            if let Event::Key(key_event) = crossterm_event::read()? {
                let command = event::map_key_event(key_event);
                let effects = app.handle(command, Instant::now());
                execute_effects(effects, &mut app, &mut pending_skill_fetch);
            }
        }
    }

    Ok(())
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
