require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { Client, MessageSelectMenu, Message } = require('discord.js-selfbot-v13');
const { ChannelType } = require('discord.js-selfbot-v13')

const token = process.env.DISCORD_TOKEN;

const app = express();
const port = 3000;
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const filePath = './data.json';

let recruitmentMessage = 'Not set';
let recruitmentDependancies = [];
/*
[
forum?=(true/false)
guildID=(numbers)
channelID=(numbers)
forumName=(name)
forumTags=(array of numbers)
]
*/

const client = new Client({
    checkUpdate: false,
});

client.once('ready', () => {
    console.log("  ___   _   _  _____  _____  ______  _____  _____ ______  _   _  _____  _____  _____ ______ \n" +
        " / _ \\ | | | ||_   _||  _  | | ___ \\|  ___|/  __ \\| ___ \\| | | ||_   _||_   _||  ___|| ___ \\\n" +
        "/ /_\\ \\| | | |  | |  | | | | | |_/ /| |__  | /  \\/| |_/ /| | | |  | |    | |  | |__  | |_/ /\n" +
        "|  _  || | | |  | |  | | | | |    / |  __| | |    |    / | | | |  | |    | |  |  __| |    / \n" +
        "| | | || |_| |  | |  \\ \\_/ / | |\\ \\ | |___ | \\__/\\| |\\ \\ | |_| | _| |_   | |  | |___ | |\\ \\ \n" +
        "\\_| |_/ \\___/   \\_/   \\___/  \\_| \\_|\\____/  \\____/\\_| \\_| \\___/  \\___/   \\_/  \\____/ \\_| \\_|\n"
    );
    
    console.log(`Logged in as ${client.user.tag}!`);
});

app.post('/submit', (req, res) => {
    console.log('Request Body:', req.body); // Log the entire request body

    if(req.body.forum === "on"){
        const newArray = [
            true,
            req.body.serverID,
            req.body.channelID,
            req.body.forumTitle,
            req.body.tagID.replace(/\r/g, '').split('\n')
        ];
        recruitmentDependancies.push(newArray);
        console.log(newArray);
        console.log(recruitmentDependancies);
    } else {
        const newArray = [
            false,
            req.body.serverID,
            req.body.channelID,
        ];
        recruitmentDependancies.push(newArray);
        console.log(newArray);
        console.log(recruitmentDependancies);
    }
});

app.post('/submitmessage', (req, res) => {
    recruitmentMessage = req.body.recruitmentMessage;
    console.log(req.body);
    console.log(recruitmentMessage);
});

app.post('/remove', (req,res) => {
    for(let i = 0; i < recruitmentDependancies.length; i++){
        currentDependancies = recruitmentDependancies[i];

        if(client.guilds.cache.get(currentDependancies[1]).name === req.body.guildName){
            recruitmentDependancies.splice(i, 1);
        }
    }
});

app.post('/sendMessages', (req, res) => {
    for(let i = 0; i < recruitmentDependancies.length; i++){
        currentDependancies = recruitmentDependancies[i];
        
        if(currentDependancies[0] === false){
            client.guilds.cache.get(currentDependancies[1]).channels.cache.get(currentDependancies[2]).send(recruitmentMessage);
            console.log('Message sent to '+client.guilds.cache.get(currentDependancies[1]).name+' in the channel '+client.guilds.cache.get(currentDependancies[1]).channels.cache.get(currentDependancies[2]).name);
        }
        if(currentDependancies[0] === true){
            if(currentDependancies[4][0] === ''){
                console.log('nothing');
                client.guilds.cache.get(currentDependancies[1]).channels.cache.get(currentDependancies[2]).threads.create({
                    name: currentDependancies[3],
                    message:{
                        content: recruitmentMessage
                    }
                });
            }else{
                console.log('something');
                client.guilds.cache.get(currentDependancies[1]).channels.cache.get(currentDependancies[2]).threads.create({
                    name: currentDependancies[3],
                    message:{
                        content: recruitmentMessage
                    },
                    appliedTags: currentDependancies[4]
                });
            }
            console.log('Message sent to '+client.guilds.cache.get(currentDependancies[1]).name+' in the channel '+client.guilds.cache.get(currentDependancies[1]).channels.cache.get(currentDependancies[2]).name);
        }
    }
});

app.get('/data', (req, res) => {
    let humanizedDependancies = [];

    for(let i = 0; i < recruitmentDependancies.length; i++){
        const currentArray = recruitmentDependancies[i];

        const newArray = [
            client.guilds.cache.get(currentArray[1]).name,
            client.guilds.cache.get(currentArray[1]).channels.cache.get(currentArray[2]).name,
            client.guilds.cache.get(currentArray[1]).iconURL({dynamic: true})
        ];
        humanizedDependancies.push(newArray);
    }

    res.json({
        recruitmentMessage,
        humanizedDependancies
    });
});

app.post('/save', (req, res) => {
    const dataToSave = {
        metadata: {
            description: recruitmentMessage,
            version: "1.0"
        },
        data: recruitmentDependancies
    };

    fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.status(500).json({ message: 'Error saving data' });
        } else {
            res.status(200).json({ message: 'Data saved successfully' });
        }
    });
});

app.post('/load', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            res.status(500).json({ message: 'Error loading data' });
            return;
        }

        try {
            const parsedData = JSON.parse(data);
            
            // Extract the metadata
            const metadata = parsedData.metadata || {};
                       
            recruitmentMessage = metadata.description || 'Not Set';
            recruitmentDependancies = parsedData.data || [];
            console.log(metadata.description);
            console.log(parsedData.data);

        } catch (parseError) {
            console.error('Error parsing the JSON:', parseError);
            res.status(500).json({ message: 'Error parsing data' });
        }
    });
});


app.listen(port, () => {
    console.log(`Bot website is running at http://localhost:${port}`);
});

client.login(token);