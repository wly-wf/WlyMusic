use rodio::{Decoder, OutputStream, Sink};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufReader, BufRead, Write};
use std::thread;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackInfo {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "cmd", content = "data")]
pub enum Command {
    Play(Option<String>),
    Pause,
    Resume,
    Stop,
    GetState,
}

#[derive(Debug, Serialize)]
pub struct Response {
    pub status: String,
    pub message: Option<String>,
    pub data: Option<serde_json::Value>,
}

fn play_file(path: &str) -> Result<f64, String> {
    let file = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;
    let decoder = Decoder::new(BufReader::new(file))
        .map_err(|e| format!("Failed to create decoder: {}", e))?;

    let (_stream, stream_handle) = OutputStream::try_default()
        .map_err(|e| format!("Failed to create output stream: {}", e))?;
    let sink = Sink::try_new(&stream_handle)
        .map_err(|e| format!("Failed to create sink: {}", e))?;

    sink.append(decoder);
    sink.sleep_until_end();

    Ok(0.0)
}

fn process_command(cmd: Command) -> Response {
    match cmd {
        Command::Play(path_opt) => {
            let path = path_opt.unwrap_or_else(|| "/home/wly/Music/test.mp3".to_string());
            log::info!("Playing: {}", path);

            let path_clone = path.clone();
            thread::spawn(move || {
                match play_file(&path_clone) {
                    Ok(_duration) => log::info!("Playback finished"),
                    Err(e) => log::error!("Playback error: {}", e),
                }
            });

            Response {
                status: "ok".to_string(),
                message: Some(format!("Started playing: {}", path)),
                data: Some(serde_json::json!({ "path": path })),
            }
        }
        Command::Pause => Response {
            status: "ok".to_string(),
            message: Some("Pause not implemented".to_string()),
            data: None,
        },
        Command::Resume => Response {
            status: "ok".to_string(),
            message: Some("Resume not implemented".to_string()),
            data: None,
        },
        Command::Stop => Response {
            status: "ok".to_string(),
            message: Some("Stop not implemented".to_string()),
            data: None,
        },
        Command::GetState => Response {
            status: "ok".to_string(),
            message: Some("State retrieved".to_string()),
            data: Some(serde_json::json!({
                "isPlaying": false,
                "position": 0,
                "duration": 0
            })),
        },
    }
}

fn main() {
    env_logger::init();
    log::info!("WlyMusic Backend started");

    let stdin = std::io::stdin();
    let mut handle = stdin.lock();

    let mut line = String::new();
    loop {
        line.clear();
        match handle.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {
                log::info!("Received: {}", line.trim());
                if let Ok(cmd) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(cmd_str) = cmd.get("cmd").and_then(|c| c.as_str()) {
                        let response = match cmd_str {
                            "play" => {
                                let path = cmd.get("data").and_then(|d| d.get("path")).and_then(|p| p.as_str()).map(String::from);
                                process_command(Command::Play(path))
                            }
                            "pause" => process_command(Command::Pause),
                            "resume" => process_command(Command::Resume),
                            "stop" => process_command(Command::Stop),
                            "getState" => process_command(Command::GetState),
                            _ => Response {
                                status: "error".to_string(),
                                message: Some(format!("Unknown command: {}", cmd_str)),
                                data: None,
                            },
                        };
                        if let Ok(resp) = serde_json::to_string(&response) {
                            println!("{}", resp);
                            std::io::stdout().flush().ok();
                        }
                    }
                }
            }
            Err(_) => break,
        }
    }
}