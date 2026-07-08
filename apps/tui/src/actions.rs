use arboard::Clipboard;
use thiserror::Error;

use crate::model::{CONTACT_EMAIL, SKILL_RAW_URL};

#[derive(Debug, Error)]
pub enum ActionError {
    #[error("Could not open {url}. The TUI is still running; copy and open the URL manually. Cause: {source}")]
    OpenUrl { url: String, source: std::io::Error },
    #[error("Could not copy automatically. Email preserved here: {CONTACT_EMAIL}. Cause: {0}")]
    Clipboard(#[from] arboard::Error),
    #[error("Could not fetch SKILL.md from GitHub. The TUI is still running; press r to retry. Cause: {0}")]
    Network(#[from] reqwest::Error),
    #[error("GitHub returned {status} while fetching SKILL.md. The TUI is still running; press r to retry or open the gist in a browser.")]
    HttpStatus { status: reqwest::StatusCode },
    #[error("The SKILL.md fetch worker stopped before returning a result. The TUI is still running; press r to retry.")]
    SkillWorkerDisconnected,
}

pub fn open_url(url: &str) -> Result<(), ActionError> {
    open::that(url).map_err(|source| ActionError::OpenUrl {
        url: url.to_owned(),
        source,
    })
}

pub fn copy_contact_email() -> Result<(), ActionError> {
    let mut clipboard = Clipboard::new()?;
    clipboard.set_text(CONTACT_EMAIL)?;
    Ok(())
}

pub fn fetch_skill_markdown() -> Result<String, ActionError> {
    let response = reqwest::blocking::get(SKILL_RAW_URL)?;
    let status = response.status();

    if !status.is_success() {
        return Err(ActionError::HttpStatus { status });
    }

    Ok(response.text()?)
}
