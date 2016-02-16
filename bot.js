// Get the libs
var irc = require("irc"),
  fs = require("fs"),
  jf = require("jsonfile"),
  util = require('util'),
  config = require("./config.json"),
  XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;;;
//Get Stored Data

var playerStats = JSON.parse(fs.readFileSync('./playerStats.json', 'utf8'));
//var savedData = JSON.stringify(fs.writeFileSync('./playerstats.json', '{}'))
console.log(playerStats);
var commands = {
  "battle": "battling",
  "stats": "statsing",
}

var settings = {
  channels: config["channels"],
  server: "irc.twitch.tv",
  botName: config["botName"],
  botNick: config["botNick"],
  password: config["password"], // can be obtained here: http://www.twitchapps.com/tmi
  admins: config["admins"], //admins that can control the bot
}

var usersUrl = "http://tmi.twitch.tv/group/user/nano_machina/chatters"

// add a channel to playerStats obj if not exists
for (i = 0; i < config.channels.length; i++) {
  if (!(config.channels[i] in playerStats)) {
    playerStats[config.channels[i]] = {};
    fs.writeFileSync('./playerstats.json', JSON.stringify(playerStats));
  }
  console.log(config.channels[i]);
}

console.log("*** Bot Started ***");
var startTime = new Date();

//Create viewer counters for each channel
for (var i = 0; i < settings.channels.length; i++) {
  var chanObj = settings.channels[i].substr(1);
  settings[chanObj] = {};
  settings[chanObj].viewers = 0;
  settings[chanObj].adminMsg = null;
  settings[chanObj].allowing = '';
  settings[chanObj].msgCount = 0;
}

// Create the bot name
var bot = new irc.Client(settings.server, settings.botName, {
  channels: [settings.channels + " " + settings.password],
  debug: false,
  password: settings.password,
  username: settings.botName
});

// Listen for joins
bot.addListener("join", function(channel, who) {
  settings[channel.substr(1)].viewers++;
  if (settings[channel.substr(1)].viewers >= 8) {
    console.log(channel.substr(1) + ' viewers = ' + settings[channel.substr(1)].viewers);
    if (!settings[channel.substr(1)].adminMsg) {
      console.log('starting interval for adminMsg');
      settings[channel.substr(1)].adminMsg = setInterval(function() {
        sendAdminMsg(channel)
      }, 600000);
    }
  }
});

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {
  if (text === "cookie") {
    bot.say(to, "Great! You jump off bridges when bots tell you to as well?");
    return;
  }
  textScan(text, to, from);
});

//Handle on connect event
bot.addListener("connect", function() {
  console.log("*** Bot Connected ***");
  bot.say(settings.channels[0], "Let's fight!");
  for (var i = 0; i < settings.channels.length; i++) {
    clearInterval(settings[settings.channels[i].substr(1)].adminMsg);
    settings[settings.channels[i].substr(1)].adminMsg = false;
  }
});

bot.addListener("part", function(channel, nick, reason, message) {
  settings[channel.substr(1)].viewers--;
  if (settings[channel.substr(1)].viewers < 0) {
    settings[channel.substr(1)].viewers = 0;
  }
  if (settings[channel.substr(1)].viewers < 8) {
    clearInterval(settings[channel.substr(1)].adminMsg);
    settings[channel.substr(1)].adminMsg = false;
    console.log('clearing adminMsg interval for ' + channel);
  }
  console.log(channel.substr(1) + " viewers = " + settings[channel.substr(1)].viewers);
});

bot.addListener("quit", function(nick, reason, channels, message) {
  settings[channel.substr(1)].viewers--;
  if (settings[channel.substr(1)].viewers < 0) {
    settings[channel.substr(1)].viewers = 0;
  }
  if (settings[channel.substr(1)].viewers < 8) {
    clearInterval(settings[channel.substr(1)].adminMsg);
    settings[channel.substr(1)].adminMsg = false;
    console.log('clearing adminMsg interval for ' + channel);
  }
  console.log(channel.substr(1) + " viewers = " + settings[channel.substr(1)].viewers);
});

function textScan(text, channel, from) {
  var nameCheck;
  var nameCheck = text.toLowerCase().split(" ");
  console.log(nameCheck);
  if (nameCheck[0] == "battle") {
    battle(channel, from, nameCheck[1])
    return;
  } else if (nameCheck[0] == "join") {
    generateCharacter(channel, from);
  } else if (nameCheck[0] == "stats") {
    getStats(channel, from);
    return;
  } else if (nameCheck[0] == "online") {
    try {
      var users = JSON.parse(getUsers(usersUrl));
      var userString = ""
      for (i = 0; i < users["chatters"]["viewers"].length; i++) {
        userString += users["chatters"]["viewers"][i] + " "
      }
      bot.say(channel, "Online: " + userString)
    } catch (error) {
      bot.say(channel, "Sorry, twitch's API is taking a nap. Try again!")
    }
  }
}

function pickRandomProperty(obj) {
  var result;
  var count = 0;
  for (var prop in obj)
    if (Math.random() < 1 / ++count)
      result = prop;
  return result;
}

function battle(channel, instigator, opponent) {
  if (instigator == opponent) {
    bot.say(channel, "You can't battle yourself")
  } else if (instigator in playerStats[channel] && opponent in playerStats[channel]) {
    instigatorStats = playerStats[channel][instigator];
    opponentStats = playerStats[channel][opponent];
    victoryPoints = 0;
    for (key in instigatorStats) {
      console.log("stat: " + instigatorStats[key], opponentStats[key]);
      if (instigatorStats[key] > opponentStats[key]) {
        victoryPoints++;
        console.log("points: " + victoryPoints);
      } else if (instigatorStats[key] < opponentStats[key]) {
        victoryPoints--;
        console.log("points: " + victoryPoints);
      }
    }
    if (victoryPoints > 0) {
      bot.say(channel, "You win, " + instigator);
      randomStat = pickRandomProperty(instigatorStats);
      playerStats[channel][instigator][randomStat]++
      fs.writeFileSync('./playerstats.json', JSON.stringify(playerStats));
    } else if (victoryPoints < 0) {
      bot.say(channel, instigator + " loses")
    } else {
      bot.say(channel, "Draw")
    }
  } else if (!(instigator in playerStats[channel])) {
    bot.say(channel, "You don't have a character. Type \"join\".");
  } else if (!(opponent in playerStats[channel])) {
    bot.say(channel, "Your opponent does not have a character. " +
      "Tell them to type \"join\".");
  }
}

function getUsers(url) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

// battle logic
var attributes = [
  "strength", "agility", "intelligence", "stamina", "charisma", "wisdom"
]

function getStats(channel, from) {
  if (from in playerStats[channel]) {
    var stats = playerStats[channel][from];
    bot.say(channel, "strength: " + stats.strength + ", agility: " +
      stats.agility + ", intelligence: " + stats.intelligence + ", stamina: " +
      stats.stamina + ", charisma: " + stats.charisma + ", wisdom: " +
      stats.wisdom);
  } else {
    bot.say(channel,
      "Sorry, but you don't have a character. Make one with \"join\"!")
  }
}

function generateCharacter(channel, from) {
  var remainder = 20;
  if (from in playerStats[channel]) {
    bot.say(channel, "sorry, " + from + ", but you've already got a character.");
  } else {
    var currentPlayerStats = {};
    for (var i = 0; i < attributes.length; i++) {
      currentPlayerStats[attributes[i]] = 10;
    }
    for (var i = 0; i < remainder; i++) {
      currentPlayerStats[attributes[Math.floor(Math.random() * attributes.length)]]++;
    }
    bot.say(channel, "cg, " + from + ", character created!");
    playerStats[channel][from] = currentPlayerStats;
    fs.writeFileSync('./playerstats.json', JSON.stringify(playerStats));
  }
}