require('dotenv').config();

const Discord = require('discord.js');
const fs = require('fs');
const request = require('request');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('ChannelChatter is working!')
})

client.on('message', msg => {
    let authorPrefix = `[**` + msg.author.username + `**]: `;

    if(msg.author.username === client.user.username) return;
    if(msg.channel.type !== "dm") return;

    let attachment = msg.attachments.first();
    if(attachment) {
        //TODO image name as a timestamp
        creteTempDir();
        let tempPath = `./temp/${attachment.name}`;
        
        //callback - send image right after download is finished and then delete it
        let picStream = fs.createWriteStream(tempPath);
        picStream.on('close', function() {
            //TODO check if presence is null
            let channelMembers = msg.author.presence.member.voice.channel.members;
            channelMembers.forEach((member) => {
                if(member.user.bot) return;
            
                member.user.createDM();
                member.user.send(authorPrefix + msg.content, {files: [tempPath]});
            });
            
            setTimeout(function() {
                fs.unlinkSync(tempPath);
            }, 3000);
        });

        downloadImage(attachment.proxyURL, picStream)
    } else {
        let channelMembers = msg.author.presence.member.voice.channel.members;
        channelMembers.forEach((member) => {
            if(member.user.bot) return;
            
            member.user.createDM();
            member.user.send(authorPrefix + msg.content);
        });

    }
});

function downloadImage(url, picStream){
    request.get(url)
        .on('error', console.error)
        .pipe(picStream);
}

function creteTempDir(){
    var dir = './temp';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

client.login(process.env.DISCORD_TOKEN);