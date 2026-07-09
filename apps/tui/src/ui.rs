use ratatui::layout::{Alignment, Constraint, Layout, Margin, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Block, BorderType, Borders, Clear, List, ListItem, Paragraph, Wrap};
use ratatui::Frame;

use crate::app::App;
use crate::model::{
    SkillState, StatusTone, View, CONTACT_EMAIL, LINKS, SHORT_ASCII_TITLE, SUBTITLE, THEMES,
};
use crate::theme::Palette;

pub fn draw(frame: &mut Frame<'_>, app: &App) {
    let theme = app.current_theme();
    let palette = Palette::from(theme.colors);
    let root = frame.area();
    let main = Block::default().style(Style::default().bg(palette.background));
    frame.render_widget(main, root);

    let [body, status] = Layout::vertical([Constraint::Min(1), Constraint::Length(1)]).areas(root);
    let [gutter, content] = content_columns(body);

    draw_gutter(frame, gutter, palette);

    match app.view {
        View::Home => draw_home(frame, content, app, palette),
        View::Skill => draw_skill(frame, content, app, palette),
        View::Help => draw_help(frame, content, palette),
        View::Themes => draw_themes(frame, content, app, palette),
        View::Contact => draw_contact(frame, content, palette),
    }

    draw_status_line(frame, status, app, palette);
}

pub fn content_area(root: Rect) -> Rect {
    let [body, _status] = Layout::vertical([Constraint::Min(1), Constraint::Length(1)]).areas(root);
    let [_gutter, content] = content_columns(body);
    content
}

pub fn skill_content_area(area: Rect) -> Rect {
    area.inner(Margin {
        horizontal: 1,
        vertical: 1,
    })
}

fn content_columns(body: Rect) -> [Rect; 2] {
    Layout::horizontal([Constraint::Length(6), Constraint::Min(1)]).areas(body)
}

fn draw_gutter(frame: &mut Frame<'_>, area: Rect, palette: Palette) {
    let mut lines = Vec::with_capacity(area.height as usize);
    for index in 0..area.height.max(1) {
        let text = if index == 0 { "  1" } else { "  ~" };
        lines.push(Line::styled(
            text,
            Style::default()
                .fg(palette.line_numbers)
                .add_modifier(Modifier::DIM),
        ));
    }

    frame.render_widget(Paragraph::new(lines), area);
}

fn draw_home(frame: &mut Frame<'_>, area: Rect, app: &App, palette: Palette) {
    let width = area.width.min(62);
    let height = 18_u16.min(area.height);
    let centered = centered_rect(area, width, height);
    let [title_area, subtitle_area, links_area, help_area] = Layout::vertical([
        Constraint::Length(6),
        Constraint::Length(3),
        Constraint::Length(8),
        Constraint::Length(1),
    ])
    .areas(centered);

    let title = SHORT_ASCII_TITLE
        .lines()
        .map(|line| Line::styled(line, Style::default().fg(palette.accent)))
        .collect::<Vec<_>>();
    frame.render_widget(
        Paragraph::new(title).alignment(Alignment::Center),
        title_area,
    );

    let subtitle = Paragraph::new(format!("{SUBTITLE} ▲"))
        .alignment(Alignment::Center)
        .style(
            Style::default()
                .fg(palette.foreground)
                .bg(palette.selection),
        );
    frame.render_widget(
        subtitle,
        subtitle_area.inner(Margin {
            horizontal: 8,
            vertical: 1,
        }),
    );

    let items = LINKS
        .iter()
        .enumerate()
        .map(|(index, link)| {
            let active = index == app.selected_link;
            let prefix = if active { "▸" } else { " " };
            let style = if active {
                Style::default().fg(palette.accent).bg(palette.hover)
            } else {
                Style::default().fg(palette.foreground)
            };
            let key_style = if active {
                Style::default().fg(palette.accent).bg(palette.selection)
            } else {
                Style::default().fg(palette.line_numbers)
            };

            ListItem::new(Line::from(vec![
                Span::styled(format!("{prefix} {:<30}", link.title), style),
                Span::styled(link.keybind, key_style),
            ]))
            .style(if active {
                Style::default().bg(palette.selection)
            } else {
                Style::default()
            })
        })
        .collect::<Vec<_>>();

    frame.render_widget(
        List::new(items),
        links_area.inner(Margin {
            horizontal: 8,
            vertical: 0,
        }),
    );
    frame.render_widget(
        Paragraph::new("j/k move · enter open · ? help · T theme · q quit")
            .alignment(Alignment::Center)
            .style(
                Style::default()
                    .fg(palette.line_numbers)
                    .add_modifier(Modifier::DIM),
            ),
        help_area,
    );
}

fn draw_skill(frame: &mut Frame<'_>, area: Rect, app: &App, palette: Palette) {
    match &app.skill {
        SkillState::Idle | SkillState::Loading => draw_centered_message(
            frame,
            area,
            "Fetching latest SKILL.md from GitHub Gist...",
            palette,
        ),
        SkillState::Failed { message } => {
            let popup = centered_rect(area, area.width.min(78), 9);
            frame.render_widget(Clear, popup);
            let block = bordered_block("Could not load SKILL.md", palette);
            let text = Text::from(vec![
                Line::styled(
                    "Could not load SKILL.md.",
                    Style::default().fg(palette.accent),
                ),
                Line::from(""),
                Line::styled(message.as_str(), Style::default().fg(palette.foreground)),
                Line::from(""),
                Line::styled(
                    "Press r to retry, Escape to return home.",
                    Style::default().fg(palette.line_numbers),
                ),
            ]);
            frame.render_widget(
                Paragraph::new(text).block(block).wrap(Wrap { trim: false }),
                popup,
            );
        }
        SkillState::Loaded { markdown, .. } => {
            let block = bordered_block("SKILL.md", palette);
            frame.render_widget(
                Paragraph::new(markdown.as_str())
                    .block(block)
                    .style(
                        Style::default()
                            .fg(palette.foreground)
                            .bg(palette.background),
                    )
                    .wrap(Wrap { trim: false })
                    .scroll((app.skill_scroll, 0)),
                area,
            );
        }
    }
}

fn draw_help(frame: &mut Frame<'_>, area: Rect, palette: Palette) {
    let popup = centered_rect(area, area.width.min(66), 16);
    let lines = vec![
        Line::styled("Keybinds", Style::default().fg(palette.accent)),
        Line::from(""),
        Line::styled(
            "j / down move selection down",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "k / up move selection up",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "enter open selected item",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "ggh gx gli... open social links",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "gcm show contact card",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "gs render latest SKILL.md",
            Style::default().fg(palette.foreground),
        ),
        Line::styled(
            "r refresh SKILL.md in skill view",
            Style::default().fg(palette.foreground),
        ),
        Line::styled("T theme picker", Style::default().fg(palette.foreground)),
        Line::styled(
            "Escape return home",
            Style::default().fg(palette.foreground),
        ),
        Line::styled("q / ctrl+c quit", Style::default().fg(palette.foreground)),
        Line::from(""),
        Line::styled(
            "Press Enter or Escape to close.",
            Style::default()
                .fg(palette.line_numbers)
                .add_modifier(Modifier::DIM),
        ),
    ];

    frame.render_widget(
        Paragraph::new(lines).block(bordered_block("", palette)),
        popup,
    );
}

fn draw_themes(frame: &mut Frame<'_>, area: Rect, app: &App, palette: Palette) {
    let popup = centered_rect(area, area.width.min(44), 10);
    let items = THEMES
        .iter()
        .enumerate()
        .map(|(index, theme)| {
            let active = index == app.selected_theme;
            let style = if active {
                Style::default().fg(palette.accent).bg(palette.selection)
            } else {
                Style::default().fg(palette.foreground)
            };
            ListItem::new(format!("{} {}", if active { "▸" } else { " " }, theme.name)).style(style)
        })
        .collect::<Vec<_>>();
    let [title, list, help] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Length(5),
        Constraint::Length(1),
    ])
    .areas(popup.inner(Margin {
        horizontal: 2,
        vertical: 1,
    }));

    frame.render_widget(
        Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(palette.accent)),
        popup,
    );
    frame.render_widget(
        Paragraph::new("Themes").style(Style::default().fg(palette.accent)),
        title,
    );
    frame.render_widget(List::new(items), list);
    frame.render_widget(
        Paragraph::new("j/k choose · Enter or Escape closes").style(
            Style::default()
                .fg(palette.line_numbers)
                .add_modifier(Modifier::DIM),
        ),
        help,
    );
}

fn draw_contact(frame: &mut Frame<'_>, area: Rect, palette: Palette) {
    let popup = centered_rect(area, area.width.min(54), 9);
    let lines = vec![
        Line::styled("Contact Me", Style::default().fg(palette.accent)),
        Line::from(""),
        Line::styled(CONTACT_EMAIL, Style::default().fg(palette.foreground)),
        Line::from(""),
        Line::styled(
            "Enter to copy to clipboard",
            Style::default().fg(palette.accent).bg(palette.selection),
        ),
        Line::from(""),
        Line::styled(
            "Escape returns home",
            Style::default()
                .fg(palette.line_numbers)
                .add_modifier(Modifier::DIM),
        ),
    ];
    frame.render_widget(
        Paragraph::new(lines)
            .block(bordered_block("", palette))
            .alignment(Alignment::Center),
        popup,
    );
}

fn draw_status_line(frame: &mut Frame<'_>, area: Rect, app: &App, palette: Palette) {
    let mode = match app.view {
        View::Home | View::Skill | View::Contact => "NORMAL",
        View::Help | View::Themes => "MENU",
    };
    let file = match app.view {
        View::Skill => "~/SKILL.md",
        View::Help => "~/help",
        View::Themes => "~/themes",
        View::Contact => "~/contact",
        View::Home => "~/main",
    };
    let filetype = match app.view {
        View::Skill => "markdown",
        View::Home => "main",
        _ => "text",
    };

    let status = app
        .status
        .as_ref()
        .map_or_else(String::new, |message| format!(" {}", message.text));
    let status_style =
        app.status
            .as_ref()
            .map_or(palette.status_line_text, |message| match message.tone {
                StatusTone::Info => palette.accent,
                StatusTone::Error => palette.cursor,
            });
    let key_buffer = if app.key_buffer.text.is_empty() {
        String::new()
    } else {
        format!(" keys:{} ", app.key_buffer.text)
    };
    let right = format!(" Theme: {} {filetype} 1:1 ", app.current_theme().name);

    let line = Line::from(vec![
        Span::styled(
            format!(" {mode} "),
            Style::default()
                .fg(palette.normal_mode_text)
                .bg(palette.normal_mode),
        ),
        Span::styled(
            format!(" {file}"),
            Style::default()
                .fg(palette.status_line_text)
                .bg(palette.status_line),
        ),
        Span::styled(
            status,
            Style::default().fg(status_style).bg(palette.status_line),
        ),
        Span::styled(
            key_buffer,
            Style::default().fg(palette.cursor).bg(palette.status_line),
        ),
        Span::styled(
            right,
            Style::default()
                .fg(palette.status_line_text)
                .bg(palette.status_line),
        ),
    ]);

    frame.render_widget(
        Paragraph::new(line).style(Style::default().bg(palette.status_line)),
        area,
    );
}

fn draw_centered_message(frame: &mut Frame<'_>, area: Rect, message: &str, palette: Palette) {
    let popup = centered_rect(area, area.width.min(56), 3);
    frame.render_widget(
        Paragraph::new(message)
            .alignment(Alignment::Center)
            .style(Style::default().fg(palette.accent)),
        popup,
    );
}

fn bordered_block<'a>(title: &'a str, palette: Palette) -> Block<'a> {
    Block::default()
        .title(title)
        .borders(Borders::ALL)
        .border_type(BorderType::Plain)
        .border_style(Style::default().fg(palette.accent))
        .style(Style::default().bg(palette.background))
}

fn centered_rect(area: Rect, width: u16, height: u16) -> Rect {
    let width = width.min(area.width);
    let height = height.min(area.height);
    let x = area.x + area.width.saturating_sub(width) / 2;
    let y = area.y + area.height.saturating_sub(height) / 2;
    Rect {
        x,
        y,
        width,
        height,
    }
}
