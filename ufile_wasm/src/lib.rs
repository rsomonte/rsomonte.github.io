use wasm_bindgen::prelude::*;

// Import the function and struct from your core library
use ufile_core::{identify_from_bytes, FileInfo};

#[wasm_bindgen]
pub fn identify_file_wasm(bytes: &[u8]) -> String {
    if let Some(info) = identify_from_bytes(bytes) {
        // Format a user-friendly string to send back to JavaScript
        format!(
            "File Type Found:\n  Description: {}",
            info.description
        )
    } else {
        "Could not determine file type.".to_string()
    }
}