use std::time::{Instant, SystemTime};

use crate::actions::ActionError;
use crate::event::Command;
use crate::model::{
    KeyBuffer, Link, LinkKind, SkillState, StatusMessage, StatusTone, Theme, View, CONTACT_EMAIL,
    KEY_BUFFER_TIMEOUT, LINKS, MAX_KEY_BUFFER_LENGTH, STATUS_TIMEOUT, THEMES,
};

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum Effect {
    OpenUrl {
        title: &'static str,
        url: &'static str,
    },
    CopyContactEmail,
    FetchSkill,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct App {
    pub view: View,
    pub selected_link: usize,
    pub selected_theme: usize,
    pub key_buffer: KeyBuffer,
    pub status: Option<StatusMessage>,
    pub skill: SkillState,
    pub skill_scroll: u16,
    pub should_quit: bool,
}

impl Default for App {
    fn default() -> Self {
        Self {
            view: View::Home,
            selected_link: 0,
            selected_theme: 0,
            key_buffer: KeyBuffer::default(),
            status: None,
            skill: SkillState::Idle,
            skill_scroll: 0,
            should_quit: false,
        }
    }
}

impl App {
    pub fn current_theme(&self) -> Theme {
        THEMES
            .get(self.selected_theme)
            .copied()
            .unwrap_or(THEMES[0])
    }

    pub fn handle(&mut self, command: Command, now: Instant) -> Vec<Effect> {
        match command {
            Command::Quit => {
                self.should_quit = true;
                return Vec::new();
            }
            Command::Escape => {
                self.view = View::Home;
                self.key_buffer.text.clear();
                return Vec::new();
            }
            Command::Help => {
                self.view = View::Help;
                self.key_buffer.text.clear();
                return Vec::new();
            }
            Command::Themes => {
                self.view = View::Themes;
                self.key_buffer.text.clear();
                return Vec::new();
            }
            _ => {}
        }

        match self.view {
            View::Home => self.handle_home(command, now),
            View::Skill => self.handle_skill(command),
            View::Help => self.handle_help(command),
            View::Themes => self.handle_themes(command),
            View::Contact => self.handle_contact(command),
        }
    }

    pub fn tick(&mut self, now: Instant) {
        if self
            .key_buffer
            .expires_at
            .is_some_and(|expires_at| now >= expires_at)
        {
            self.key_buffer.text.clear();
            self.key_buffer.expires_at = None;
        }

        if self
            .status
            .as_ref()
            .and_then(|message| message.expires_at)
            .is_some_and(|expires_at| now >= expires_at)
        {
            self.status = None;
        }
    }

    pub fn complete_open_url(
        &mut self,
        title: &str,
        result: Result<(), ActionError>,
        now: Instant,
    ) {
        match result {
            Ok(()) => self.show_status(format!("Opening {title}..."), StatusTone::Info, now),
            Err(error) => self.show_status(error.to_string(), StatusTone::Error, now),
        }
    }

    pub fn complete_copy_contact_email(&mut self, result: Result<(), ActionError>, now: Instant) {
        match result {
            Ok(()) => self.show_status(
                format!("Copied {CONTACT_EMAIL} to clipboard."),
                StatusTone::Info,
                now,
            ),
            Err(error) => self.show_status(error.to_string(), StatusTone::Error, now),
        }
    }

    pub fn complete_skill_fetch(&mut self, result: Result<String, ActionError>, now: Instant) {
        self.skill = match result {
            Ok(markdown) => {
                self.show_status(
                    "Finished fetching SKILL.md.".to_owned(),
                    StatusTone::Info,
                    now,
                );
                SkillState::Loaded {
                    markdown,
                    fetched_at: SystemTime::now(),
                }
            }
            Err(error) => {
                let message = error.to_string();
                self.show_status(message.clone(), StatusTone::Error, now);
                SkillState::Failed { message }
            }
        };
    }

    fn handle_home(&mut self, command: Command, now: Instant) -> Vec<Effect> {
        match command {
            Command::KeyChar('q') => {
                self.should_quit = true;
                Vec::new()
            }
            Command::MoveDown => {
                self.selected_link = (self.selected_link + 1).min(LINKS.len() - 1);
                Vec::new()
            }
            Command::MoveUp => {
                self.selected_link = self.selected_link.saturating_sub(1);
                Vec::new()
            }
            Command::Enter => LINKS
                .get(self.selected_link)
                .map_or_else(Vec::new, |link| self.activate_link(link, now)),
            Command::KeyChar(ch) => self.append_key_buffer(ch, now),
            _ => Vec::new(),
        }
    }

    fn handle_skill(&mut self, command: Command) -> Vec<Effect> {
        match command {
            Command::RetrySkill => self.start_skill_fetch(),
            Command::MoveDown => {
                self.skill_scroll = self.skill_scroll.saturating_add(1);
                Vec::new()
            }
            Command::MoveUp => {
                self.skill_scroll = self.skill_scroll.saturating_sub(1);
                Vec::new()
            }
            _ => Vec::new(),
        }
    }

    fn handle_help(&mut self, command: Command) -> Vec<Effect> {
        if command == Command::Enter {
            self.view = View::Home;
        }
        Vec::new()
    }

    fn handle_themes(&mut self, command: Command) -> Vec<Effect> {
        match command {
            Command::MoveDown => {
                self.selected_theme = (self.selected_theme + 1).min(THEMES.len() - 1)
            }
            Command::MoveUp => self.selected_theme = self.selected_theme.saturating_sub(1),
            Command::Enter => self.view = View::Home,
            _ => {}
        }
        Vec::new()
    }

    fn handle_contact(&mut self, command: Command) -> Vec<Effect> {
        if command == Command::Enter {
            return vec![Effect::CopyContactEmail];
        }
        Vec::new()
    }

    fn append_key_buffer(&mut self, ch: char, now: Instant) -> Vec<Effect> {
        if self.key_buffer.text.len() > MAX_KEY_BUFFER_LENGTH {
            self.key_buffer.text.clear();
        }

        self.key_buffer.text.push(ch);
        self.key_buffer.expires_at = Some(now + KEY_BUFFER_TIMEOUT);

        let matched_link = LINKS
            .iter()
            .find(|link| self.key_buffer.text.ends_with(link.keybind));

        if let Some(link) = matched_link {
            self.key_buffer.text.clear();
            self.key_buffer.expires_at = None;
            return self.activate_link(link, now);
        }

        Vec::new()
    }

    fn activate_link(&mut self, link: &Link, now: Instant) -> Vec<Effect> {
        match link.kind {
            LinkKind::External => vec![Effect::OpenUrl {
                title: link.title,
                url: link.url,
            }],
            LinkKind::Skill => {
                self.open_skill_view(now);
                self.start_skill_fetch()
            }
            LinkKind::Contact => {
                self.view = View::Contact;
                self.key_buffer.text.clear();
                self.status = None;
                Vec::new()
            }
        }
    }

    fn open_skill_view(&mut self, now: Instant) {
        self.view = View::Skill;
        self.key_buffer.text.clear();
        self.skill_scroll = 0;
        self.show_status(
            "Fetching latest SKILL.md from GitHub Gist...".to_owned(),
            StatusTone::Info,
            now,
        );
    }

    fn start_skill_fetch(&mut self) -> Vec<Effect> {
        self.skill = SkillState::Loading;
        vec![Effect::FetchSkill]
    }

    fn show_status(&mut self, text: String, tone: StatusTone, now: Instant) {
        self.status = Some(StatusMessage {
            text,
            tone,
            expires_at: Some(now + STATUS_TIMEOUT),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn handle_home_should_keep_selection_within_bounds() {
        let mut app = App::default();
        let now = Instant::now();

        app.handle(Command::MoveUp, now);
        assert_eq!(app.selected_link, 0);

        for _ in 0..100 {
            app.handle(Command::MoveDown, now);
        }
        assert_eq!(app.selected_link, LINKS.len() - 1);
    }

    #[test]
    fn tick_should_expire_key_buffer() {
        let mut app = App::default();
        let now = Instant::now();

        app.handle(Command::KeyChar('g'), now);
        app.tick(now + KEY_BUFFER_TIMEOUT + std::time::Duration::from_millis(1));

        assert_eq!(app.key_buffer.text, "");
    }

    #[test]
    fn key_sequence_should_activate_contact_view() {
        let mut app = App::default();
        let now = Instant::now();

        app.handle(Command::KeyChar('g'), now);
        app.handle(Command::KeyChar('c'), now);
        app.handle(Command::KeyChar('m'), now);

        assert_eq!(app.view, View::Contact);
    }
}
