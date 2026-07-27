const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID;

// Ton lien logo fourni
const LOGO_URL = 'https://media.discordapp.net/attachments/1531037885145550918/1531044475844034660/b6e1646d-f78e-4cdf-bb30-f3cbea3f7b71.png?ex=6a67c7c8&is=6a667648&hm=5f8b76a683be2631f9c5b3ea925ea26ddf5bb1ff8053a2ad61fa13bccb15f6fc&=&format=webp&quality=lossless';

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
            throw new Error('La variable d\'environnement DISCORD_BOT_TOKEN est manquante sur Render.');
        }

        if (!STAFF_CHANNEL_ID) {
            throw new Error('La variable d\'environnement STAFF_CHANNEL_ID est manquante sur Render.');
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
