require('dotenv').config();

const Discord = require('discord.js');
const fs = require('fs');
const request = require('request');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    let authorPrefix = `[**` + msg.author.username + `**]: `;

    if(msg.author.username == client.user.username) { return; }

    let attachment = msg.attachments.first();
    if(attachment) {
        //TODO image name as a timestamp
        creteTempDir();
        let tempPath = `./temp/${attachment.name}`;
        
        //callback - send image right after download is finished and then delete it
        let picStream = fs.createWriteStream(tempPath);
        picStream.on('close', function() {
            msg.reply(authorPrefix + msg.content, {files: [tempPath]});
            
            setTimeout(function() {
                fs.unlinkSync(tempPath);
            }, 3000);
        });

        downloadImage(attachment.proxyURL, picStream)
    } else {
        msg.reply(authorPrefix + msg.content);
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