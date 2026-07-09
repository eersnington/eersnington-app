use ratatui::text::Line;

pub fn max_markdown_scroll(markdown: &str, viewport_width: u16, viewport_height: u16) -> u16 {
    let content_width = viewport_width.max(1) as usize;
    let rendered_lines = markdown
        .lines()
        .map(|line| Line::from(line).width().max(1).div_ceil(content_width))
        .sum::<usize>();

    rendered_lines
        .saturating_sub(viewport_height as usize)
        .min(u16::MAX as usize) as u16
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn max_markdown_scroll_should_be_zero_when_content_fits() {
        assert_eq!(max_markdown_scroll("one\ntwo\nthree", 10, 3), 0);
    }

    #[test]
    fn max_markdown_scroll_should_stop_at_last_renderable_line() {
        assert_eq!(max_markdown_scroll("1\n2\n3\n4\n5", 10, 3), 2);
    }

    #[test]
    fn max_markdown_scroll_should_account_for_wrapped_lines() {
        assert_eq!(max_markdown_scroll("1234567890", 5, 2), 0);
        assert_eq!(max_markdown_scroll("12345678901", 5, 2), 1);
    }

    #[test]
    fn max_markdown_scroll_should_handle_zero_sized_viewports() {
        assert_eq!(max_markdown_scroll("123", 0, 0), 3);
    }

    #[test]
    fn max_markdown_scroll_should_count_terminal_cell_width() {
        assert_eq!(max_markdown_scroll("你好", 3, 1), 1);
    }
}
