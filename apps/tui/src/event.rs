use crossterm::event::{
    Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, MouseEvent, MouseEventKind,
};

pub const MOUSE_SCROLL_LINES: i16 = 5;

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum Command {
    Quit,
    Escape,
    Help,
    Themes,
    MoveBy(i16),
    Enter,
    RetrySkill,
    KeyChar(char),
    Noop,
}

pub fn map_event(event: Event) -> Command {
    match event {
        Event::Key(key_event) if should_handle_key(key_event.kind) => map_key_event(key_event),
        Event::Mouse(mouse_event) => map_mouse_event(mouse_event),
        _ => Command::Noop,
    }
}

fn should_handle_key(kind: KeyEventKind) -> bool {
    matches!(kind, KeyEventKind::Press | KeyEventKind::Repeat)
}

pub fn map_key_event(event: KeyEvent) -> Command {
    if event.modifiers.contains(KeyModifiers::CONTROL) && event.code == KeyCode::Char('c') {
        return Command::Quit;
    }

    match event.code {
        KeyCode::Esc => Command::Escape,
        KeyCode::Enter => Command::Enter,
        KeyCode::Up => Command::MoveBy(-1),
        KeyCode::Down => Command::MoveBy(1),
        KeyCode::Char('?') => Command::Help,
        KeyCode::Char('T') => Command::Themes,
        KeyCode::Char('r') => Command::RetrySkill,
        KeyCode::Char('q') => Command::KeyChar('q'),
        KeyCode::Char('j') => Command::MoveBy(1),
        KeyCode::Char('k') => Command::MoveBy(-1),
        KeyCode::Char(ch) => Command::KeyChar(ch),
        _ => Command::Noop,
    }
}

pub fn map_mouse_event(event: MouseEvent) -> Command {
    match event.kind {
        MouseEventKind::ScrollUp => Command::MoveBy(-MOUSE_SCROLL_LINES),
        MouseEventKind::ScrollDown => Command::MoveBy(MOUSE_SCROLL_LINES),
        _ => Command::Noop,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crossterm::event::{KeyEventKind, MouseButton, MouseEventKind};

    fn key(code: KeyCode, kind: KeyEventKind) -> KeyEvent {
        KeyEvent {
            code,
            modifiers: KeyModifiers::NONE,
            kind,
            state: crossterm::event::KeyEventState::NONE,
        }
    }

    fn mouse(kind: MouseEventKind) -> MouseEvent {
        MouseEvent {
            kind,
            column: 0,
            row: 0,
            modifiers: KeyModifiers::NONE,
        }
    }

    #[test]
    fn map_key_event_should_map_vim_navigation() {
        assert_eq!(
            map_key_event(key(KeyCode::Char('j'), KeyEventKind::Press)),
            Command::MoveBy(1)
        );
        assert_eq!(
            map_key_event(key(KeyCode::Char('k'), KeyEventKind::Press)),
            Command::MoveBy(-1)
        );
    }

    #[test]
    fn map_event_should_accept_arrow_press_and_repeat() {
        assert_eq!(
            map_event(Event::Key(key(KeyCode::Down, KeyEventKind::Press))),
            Command::MoveBy(1)
        );
        assert_eq!(
            map_event(Event::Key(key(KeyCode::Up, KeyEventKind::Repeat))),
            Command::MoveBy(-1)
        );
    }

    #[test]
    fn map_event_should_ignore_key_release() {
        assert_eq!(
            map_event(Event::Key(key(KeyCode::Down, KeyEventKind::Release))),
            Command::Noop
        );
    }

    #[test]
    fn map_mouse_event_should_map_scroll_wheel_to_five_line_moves() {
        assert_eq!(
            map_mouse_event(mouse(MouseEventKind::ScrollDown)),
            Command::MoveBy(MOUSE_SCROLL_LINES)
        );
        assert_eq!(
            map_mouse_event(mouse(MouseEventKind::ScrollUp)),
            Command::MoveBy(-MOUSE_SCROLL_LINES)
        );
    }

    #[test]
    fn map_mouse_event_should_ignore_drag_and_move() {
        assert_eq!(
            map_mouse_event(mouse(MouseEventKind::Down(MouseButton::Left))),
            Command::Noop
        );
        assert_eq!(map_mouse_event(mouse(MouseEventKind::Moved)), Command::Noop);
    }
}
