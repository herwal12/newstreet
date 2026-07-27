const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID;

const LOGO_URL = 'https://media.discordapp.net/attachments/1531037885145550918/1531044081747230830/Logo_Fivem_N.png?ex=6a67c76a&is=6a6675ea&hm=692140dcde62bd6e8dad05a69b7a8bb750a15266e7aa4d00749a3830e6ac4ada&=&format=webp&quality=lossless&width=1216&height=1216';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/recrutement', (req, res) => {
    res.render('recrutement');
});

app.post('/submit-application', async (req, res) => {
    try {
        const { poste, discordTag, discordId, prenom, age, motivation } = req.body;

        if (!TOKEN) {
            throw new Error("La variable d'environnement DISCORD_BOT_TOKEN est manquante sur Render.");
        }

        if (!STAFF_CHANNEL_ID) {
            throw new Error("La variable d'environnement STAFF_CHANNEL_ID est manquante sur Render.");
        }

        let specificFields = [];

        if (poste === 'Gérant Légal') {
            specificFields = [
                { name: 'Présentation du projet / entreprise légale', value: '```\n' + (req.body.legal_presentation || 'Non renseigné') + '\n```', inline: false },
                { name: 'Expérience dans le milieu légal', value: '```\n' + (req.body.legal_experience || 'Non renseigné') + '\n```', inline: false },
                { name: 'Disponibilités et Activité', value: '```\n' + (req.body.legal_activity || 'Non renseigné') + '\n```', inline: false }
            ];
        } else if (poste === 'Gérant Illégal') {
            specificFields = [
                { name: 'Présentation du projet illégal', value: '```\n' + (req.body.illegal_presentation || 'Non renseigné') + '\n```', inline: false },
                { name: 'Expérience dans le milieu illégal', value: '```\n' + (req.body.illegal_experience || 'Non renseigné') + '\n```', inline: false },
                { name: 'Équilibrage / Vision', value: '```\n' + (req.body.illegal_balance || 'Non renseigné') + '\n```', inline: false }
            ];
        } else if (poste === 'Community Manager') {
            specificFields = [
                { name: 'Présentation', value: '```\n' + (req.body.cm_presentation || 'Non renseigné') + '\n```', inline: false },
                { name: 'Expérience', value: '```\n' + (req.body.cm_experience || 'Non renseigné') + '\n```', inline: false },
                { name: 'Animation / Idées', value: '```\n' + (req.body.cm_activity || 'Non renseigné') + '\n```', inline: false }
            ];
        } else if (poste === 'Modération') {
            specificFields = [
                { name: 'Mise en situation', value: '```\n' + (req.body.sit_1 || 'Non renseigné') + '\n```', inline: false }
            ];
        } else if (poste === 'Développeur') {
            specificFields = [
                { name: 'Présentation', value: '```\n' + (req.body.dev_presentation || 'Non renseigné') + '\n```', inline: false },
                { name: 'Langages maîtrisés', value: '```\n' + (req.body.dev_languages || 'Non renseigné') + '\n```', inline: false },
                { name: 'Frameworks / Compétences', value: '```\n' + (req.body.dev_skills || 'Non renseigné') + '\n
