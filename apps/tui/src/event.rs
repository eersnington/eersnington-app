use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum Command {
    Quit,
    Escape,
    Help,
    Themes,
    MoveUp,
    MoveDown,
    Enter,
    RetrySkill,
    KeyChar(char),
    Noop,
}

pub fn map_key_event(event: KeyEvent) -> Command {
    if event.modifiers.contains(KeyModifiers::CONTROL) && event.code == KeyCode::Char('c') {
        return Command::Quit;
    }

    match event.code {
        KeyCode::Esc => Command::Escape,
        KeyCode::Enter => Command::Enter,
        KeyCode::Up => Command::MoveUp,
        KeyCode::Down => Command::MoveDown,
        KeyCode::Char('?') => Command::Help,
        KeyCode::Char('T') => Command::Themes,
        KeyCode::Char('r') => Command::RetrySkill,
        KeyCode::Char('q') => Command::KeyChar('q'),
        KeyCode::Char('j') => Command::MoveDown,
        KeyCode::Char('k') => Command::MoveUp,
        KeyCode::Char(ch) => Command::KeyChar(ch),
        _ => Command::Noop,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crossterm::event::KeyEventKind;

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent {
            code,
            modifiers: KeyModifiers::NONE,
            kind: KeyEventKind::Press,
            state: crossterm::event::KeyEventState::NONE,
        }
    }

    #[test]
    fn map_key_event_should_map_vim_navigation() {
        assert_eq!(map_key_event(key(KeyCode::Char('j'))), Command::MoveDown);
        assert_eq!(map_key_event(key(KeyCode::Char('k'))), Command::MoveUp);
    }
}
