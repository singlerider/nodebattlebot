# Twitch Bot
basic scaffold derived from [https://github.com/nmynarcik/twitch-bot](https://github.com/nmynarcik/twitch-bot)

## Directions
You'll need a [Twitch.tv](http://Twitch.tv) account to get started.

**1**:

```shell
git clone https://github.com/singlerider/nodebattlebot
cd nodebattlebot
npm install xmlhttprequest
cp configExample.json config.json
cp playerStatsExample.json playerStats.json
```

**2**: Get OAUTH (as password) here: [http://www.twitchapps.com/tmi](http://www.twitchapps.com/tmi)

**3**: Input pertinent information into `config.json`

**4**:

```shell
node bot.js
```

**5**: Win

### Commands
`join` the fight by creating a character

check your `stats`

`battle [username]` to pick a fight with a buddy

see who is `online`

`reset` everything and start over
