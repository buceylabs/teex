use super::*;

#[test]
fn file_type_helpers_are_case_insensitive_for_supported_extensions() {
    assert!(is_markdown(Path::new("README.MD")));
    assert!(is_markdown(Path::new("notes.Markdown")));
    assert!(!is_markdown(Path::new("notes.txt")));

    assert!(is_text_like(Path::new("data.JSON")));
    assert!(is_text_like(Path::new("script.TSX")));
    assert!(!is_text_like(Path::new("archive.zip")));
    assert!(!is_text_like(Path::new("no_extension")));

    assert_eq!(file_kind(Path::new("post.md")), "markdown");
    assert_eq!(file_kind(Path::new("post.txt")), "text");
    assert_eq!(file_kind(Path::new("main.rs")), "code");
    assert_eq!(file_kind(Path::new("app.swift")), "code");
    assert_eq!(file_kind(Path::new("data.json")), "code");
    assert_eq!(file_kind(Path::new("main.cpp")), "code");
    assert_eq!(file_kind(Path::new("style.CSS")), "code");

    assert!(is_code(Path::new("lib.rs")));
    assert!(is_code(Path::new("index.JS")));
    assert!(!is_code(Path::new("readme.txt")));
    assert!(!is_code(Path::new("notes.md")));
}

#[test]
fn utility_helpers_build_expected_strings_and_ids() {
    assert_eq!(
        window_event("teex://open", "teex-window-2"),
        "teex://open/teex-window-2"
    );
    assert_eq!(
        path_to_string(Path::new("/tmp/example.txt")),
        "/tmp/example.txt"
    );

    let a = next_transfer_request_id();
    let b = next_transfer_request_id();
    assert!(a.starts_with("tab-transfer-"));
    assert!(b.starts_with("tab-transfer-"));
    assert_ne!(a, b);
}
