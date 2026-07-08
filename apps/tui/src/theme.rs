use ratatui::style::Color;

use crate::model::ThemeColors;

#[derive(Debug, Clone, Copy)]
pub struct Palette {
    pub background: Color,
    pub foreground: Color,
    pub cursor: Color,
    pub selection: Color,
    pub status_line: Color,
    pub status_line_text: Color,
    pub normal_mode: Color,
    pub normal_mode_text: Color,
    pub line_numbers: Color,
    pub accent: Color,
    pub hover: Color,
}

impl From<ThemeColors> for Palette {
    fn from(colors: ThemeColors) -> Self {
        Self {
            background: hex_color(colors.background),
            foreground: hex_color(colors.foreground),
            cursor: hex_color(colors.cursor),
            selection: hex_color(colors.selection),
            status_line: hex_color(colors.status_line),
            status_line_text: hex_color(colors.status_line_text),
            normal_mode: hex_color(colors.normal_mode),
            normal_mode_text: hex_color(colors.normal_mode_text),
            line_numbers: hex_color(colors.line_numbers),
            accent: hex_color(colors.accent),
            hover: hex_color(colors.hover),
        }
    }
}

fn hex_color(value: &str) -> Color {
    let value = value.trim_start_matches('#');
    if value.len() != 6 {
        return Color::Reset;
    }

    let red = u8::from_str_radix(&value[0..2], 16).unwrap_or_default();
    let green = u8::from_str_radix(&value[2..4], 16).unwrap_or_default();
    let blue = u8::from_str_radix(&value[4..6], 16).unwrap_or_default();

    Color::Rgb(red, green, blue)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_color_should_parse_rgb_values() {
        assert_eq!(hex_color("#FFC799"), Color::Rgb(255, 199, 153));
    }
}
