use std::io::{self, BufRead, Write};

fn main() {
    env_logger::init();
    log::info!("WlyMusic Backend started");

    let stdin = io::stdin();
    let mut handle = stdin.lock();

    let mut line = String::new();
    loop {
        line.clear();
        if let Ok(bytes) = handle.read_line(&mut line) {
            if bytes == 0 {
                break;
            }
            log::info!("Received: {}", line.trim());

            if let Ok(cmd) = serde_json::from_str::<serde_json::Value>(&line) {
                let response = process_command(cmd);
                if let Ok(resp) = serde_json::to_string(&response) {
                    println!("{}", resp);
                    io::stdout().flush().ok();
                }
            }
        }
    }
}

fn process_command(_cmd: serde_json::Value) -> serde_json::Value {
    serde_json::json!({
        "status": "ok",
        "message": "Backend ready"
    })
}