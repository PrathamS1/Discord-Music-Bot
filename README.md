# Discord Music Bot

![Discord Music Bot Logo](<logo_url>)

Discord Music Bot is a versatile Discord bot designed to enhance your server's music experience. With this bot, you can play music from YouTube, manage music queues, control playback, and more.

## Features

- **Play Music**: Play music from YouTube by providing a video URL.
- **Manage Queue**: Add, remove, and view the music queue.
- **Control Playback**: Skip songs, pause/resume playback, and stop the music.
- **Volume Control**: Adjust the volume of the music playback.
- **Now Playing**: Display the currently playing song.
- **Help Command**: Get information about available bot commands.

## Installation

To use Discord Music Bot, follow these steps:

1. Clone the repository:

2. Install dependencies:

3. Set up environment variables:
- Create a `.env` file in the project root.
- Add your Discord bot token to the `.env` file:
  ```
  BOT_TOKEN=<your_bot_token>
  ```

4. Start the bot:

## Usage

Once the bot is running and connected to your Discord server, you can use the following commands:

- `!play <YouTube_URL>`: Play a song from YouTube.
- `!skip`: Skip the current song.
- `!stop`: Stop the music and clear the queue.
- `!pause`: Pause the currently playing song.
- `!resume`: Resume the paused song.
- `!queue`: Show the current music queue.
- `!remove <song_number>`: Remove a song from the queue.
- `!clear`: Clear the entire queue.
- `!volume <0-1>`: Set the volume (between 0 and 1).
- `!nowplaying`: Show the currently playing song.
- `!help`: Show available bot commands.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
