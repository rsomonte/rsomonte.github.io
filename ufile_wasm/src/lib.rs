use wasm_bindgen::prelude::*;
use js_sys::Array;

// Import the functions from your core library
use ufile_core::{identify_from_bytes, identify_many_bytes};

/// Original single file identification function (maintained for backward compatibility)
#[wasm_bindgen]
pub fn identify_file_wasm(bytes: &[u8]) -> String {
    if let Some(info) = identify_from_bytes(bytes) {
        info.description
    } else {
        "Unknown file type".to_string()
    }
}

/// Process multiple files and return their descriptions
/// Takes an array of Uint8Array objects and returns an array of description strings
#[wasm_bindgen]
pub fn identify_multiple_files_wasm(file_data_array: &Array) -> Array {
    let mut byte_arrays = Vec::new();
    
    // Convert JS Array of Uint8Array to Vec<&[u8]>
    for i in 0..file_data_array.length() {
        if let Ok(uint8_array) = file_data_array.get(i).dyn_into::<js_sys::Uint8Array>() {
            let bytes = uint8_array.to_vec();
            byte_arrays.push(bytes);
        }
    }
    
    // Convert to slice references for identify_many_bytes
    let byte_slices: Vec<&[u8]> = byte_arrays.iter().map(|v| v.as_slice()).collect();
    
    // Process with ufile-core
    let results = identify_many_bytes(byte_slices);
    
    // Convert results to JS Array of description strings
    let js_array = Array::new();
    for file_info in results {
        js_array.push(&JsValue::from_str(&file_info.description));
    }
    
    js_array
}