const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const sodium = require('libsodium-wrappers');

(async () => {
    await sodium.ready;

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    const prefix = '!';
    const token = 'Enter Your Bot Token Here';
    const queue = new Map();

    client.once('ready', () => {
        console.log('Bot is online!');
    });

    client.on('messageCreate', async message => {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const serverQueue = queue.get(message.guild.id);
        const args = message.content.slice(prefix.length).trim().split(' ');
        const command = args.shift().toLowerCase();

        if (command === 'play') {
            execute(message, serverQueue, args);
        } else if (command === 'skip') {
            skip(message, serverQueue);
        } else if (command === 'stop') {
            stop(message, serverQueue);
        } else if (command === 'pause') {
            pause(message, serverQueue);
        } else if (command === 'resume') {
            resume(message, serverQueue);
        } else if (command === 'queue') {
            showQueue(message, serverQueue);
        } else if (command === 'remove') {
            removeSong(message, serverQueue, args);
        } else if (command === 'clear') {
            clearQueue(message, serverQueue);
        } else if (command === 'volume') {
            setVolume(message, serverQueue, args);
        } else if (command === 'nowplaying') {
            nowPlaying(message, serverQueue);
        } else if (command === 'help') {
            showHelp(message);
        }
    });

    async function execute(message, serverQueue, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.reply('I need the permissions to join and speak in your voice channel!');
        }

        const songInfo = await ytdl.getInfo(args[0]);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                player: createAudioPlayer(),
                playing: true
            };

            queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(song);

            try {
                var connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;
                connection.subscribe(queueContruct.player);

                connection.on(VoiceConnectionStatus.Ready, () => {
                    console.log('The bot has connected to the channel!');
                    play(message.guild, queueContruct.songs[0]);
                });

                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    queue.delete(message.guild.id);
                });

            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.reply(err.message);
            }
        } else {
            serverQueue.songs.push(song);
            return message.reply(`${song.title} has been added to the queue!`);
        }
    }

    function skip(message, serverQueue) {
        if (!message.member.voice.channel) return message.reply('You have to be in a voice channel to skip the music!');
        if (!serverQueue) return message.reply('There is no song that I could skip!');
        serverQueue.player.stop();
    }

    function stop(message, serverQueue) {
        if (!message.member.voice.channel) return message.reply('You have to be in a voice channel to stop the music!');
        if (!serverQueue) return message.reply('There is no song that I could stop!');

        serverQueue.songs = [];
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(message.guild.id);
    }

    function pause(message, serverQueue) {
        if (!message.member.voice.channel) return message.reply('You have to be in a voice channel to pause the music!');
        if (!serverQueue || !serverQueue.playing) return message.reply('There is no song that I could pause!');

        serverQueue.player.pause();
        serverQueue.playing = false;
        message.reply('Music paused!');
    }

    function resume(message, serverQueue) {
        if (!message.member.voice.channel) return message.reply('You have to be in a voice channel to resume the music!');
        if (!serverQueue || serverQueue.playing) return message.reply('There is no song that I could resume!');

        serverQueue.player.unpause();
        serverQueue.playing = true;
        message.reply('Music resumed!');
    }

    function showQueue(message, serverQueue) {
        if (!serverQueue) return message.reply('There is no queue.');

        let queueMsg = 'Current Queue:\n';
        serverQueue.songs.forEach((song, index) => {
            queueMsg += `${index + 1}. ${song.title}\n`;
        });

        message.reply(queueMsg);
    }

    function removeSong(message, serverQueue, args) {
        if (!serverQueue) return message.reply('There is no queue.');

        const songIndex = parseInt(args[0]);
        if (isNaN(songIndex) || songIndex < 1 || songIndex > serverQueue.songs.length) {
            return message.reply('Invalid song number.');
        }

        const removedSong = serverQueue.songs.splice(songIndex - 1, 1);
        message.reply(`Removed **${removedSong[0].title}** from the queue.`);
    }

    function clearQueue(message, serverQueue) {
        if (!serverQueue) return message.reply('There is no queue.');

        serverQueue.songs = [];
        serverQueue.player.stop();
        message.reply('Cleared the queue.');
    }

    function setVolume(message, serverQueue, args) {
        if (!message.member.voice.channel) return message.reply('You have to be in a voice channel to change the volume!');
        if (!serverQueue) return message.reply('There is no song playing.');
    
        const volume = parseFloat(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 1) {
            return message.reply('Volume must be a number between 0 and 1.');
        }
    
        const connection = serverQueue.connection;
        if (!connection) return message.reply('The bot is not connected to a voice channel.');
    
        const player = serverQueue.player;
        if (!player) return message.reply('There is no audio player.');
    
        const resource = player.state.resource;
        if (!resource) return message.reply('There is no audio resource.');
    
        resource.volume?.setVolume(volume);
        message.reply(`Volume set to ${volume * 100}%`);
    }        

    function nowPlaying(message, serverQueue) {
        if (!serverQueue) return message.reply('There is no song currently playing.');

        message.reply(`Now playing: **${serverQueue.songs[0].title}**`);
    }

    function showHelp(message) {
        const helpMessage = `
        **Bot Commands:**
        - \`!play <YouTube URL>\`: Play a song from YouTube.
        - \`!skip\`: Skip the current song.
        - \`!stop\`: Stop the music and clear the queue.
        - \`!pause\`: Pause the currently playing song.
        - \`!resume\`: Resume the paused song.
        - \`!queue\`: Show the current music queue.
        - \`!remove <song number>\`: Remove a song from the queue.
        - \`!clear\`: Clear the entire queue.
        - \`!volume <0-1>\`: Set the volume (between 0 and 1).
        - \`!nowplaying\`: Show the currently playing song.
        - \`!help\`: Show this help message.
        `;
        message.reply(helpMessage);
    }

    function play(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
            serverQueue.connection.destroy();
            queue.delete(guild.id);
            return;
        }

        const stream = ytdl(song.url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);

        serverQueue.player.play(resource);
        serverQueue.playing = true;

        serverQueue.player.on(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        });

        serverQueue.player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${resource}`);
        });

        serverQueue.textChannel.send(`Start playing: **${song.title}**`);
    }

    client.login(token);
})();