require('dotenv').config();

const Discord = require('discord.js');
const fs = require('fs');
const request = require('request');
const schedule = require('node-schedule');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('ChannelChatter is working!');
})

client.on('message', msg => {
    const authorUsername = msg.author.username;

    if(msg.channel.type !== "dm") return;
    if(authorUsername === client.user.username) { return; }
    else { msg.react('🖕'); }
    if(msg.author.presence.status === 'offline') {
        sendRequiredPresenceError(msg.author);
        return;
    }
    if(msg.author.presence.member.voice.channel === null) {
        sendNotConnectedToVoiceChannelError(msg.author);
        return;
    }


    const authorPrefix = `[**` + authorUsername + `**]: `;
    const attachment = msg.attachments.first();
    const content = authorPrefix + msg.content

    let channelMembers = msg.author.presence.member.voice.channel.members;
    removeAuthorFromChannelList(authorUsername, channelMembers);

    if(attachment) {
        const randomName = generateRandomString(32);
        const tempPath = `./temp/${randomName}.png`;
        
        //callback - send image right after download is finished and then delete it
        const picStream = fs.createWriteStream(tempPath);
        picStream.on('close', function() {
            sendMessageToVoiceChannel(channelMembers, content, tempPath);

            setTimeout(function() {
                fs.unlinkSync(tempPath);
            }, 10000); //10 seconds 
        });

        downloadImage(attachment.proxyURL, picStream);
    } else {
        sendMessageToVoiceChannel(channelMembers, content);
    }
});

function scheduleTempFolderClear(){
    const rule = new schedule.RecurrenceRule();
    rule.hour = 4;

    createTempDir();
    let job = schedule.scheduleJob(rule, function(){
        console.log("Cleaning temp folder");
        removeDirContent('./temp')
      });
}

function removeDirContent(dir){
    try { var files = fs.readdirSync(dir); }
    catch(e) { return; }
    if (files.length > 0){
        for (let i = 0; i < files.length; i++) {
          let filePath = dir + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            removeDirContent(filePath);
        }
    }
}

function removeAuthorFromChannelList(authorUsername, channelMembers) {
    let memberDel = null;
    channelMembers.forEach((member) => {
        if(member.user.username === authorUsername) {
            memberDel = member;
            return;
        }
    })
    channelMembers.delete(memberDel.user.id);
}

function sendRequiredPresenceError(user) {
    user.createDM();
    user.send("You have to be online and visible in order to send messages to voice channel.");
}

function sendNotConnectedToVoiceChannelError(user) {
    user.createDM();
    user.send("You have to be connected to voice channel in order to send voice channel messages.");
}

function createTempDir(){
    const dir = './temp';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function generateRandomString(length){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
}

function sendMessageToVoiceChannel(members, content, filePath){
    members.forEach((member) => {
        if(member.user.bot) return;
        
        member.user.createDM();
        if(filePath)
            member.user.send(content, {files: [filePath]});
        else
            member.user.send(content); 
    });
}

function downloadImage(url, stream){
    request.get(url)
        .on('error', console.error)
        .pipe(stream);
}

scheduleTempFolderClear();
client.login(process.env.DISCORD_TOKEN);