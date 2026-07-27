const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du Bot Discord (Assure-toi de mettre ton token et l'ID du salon staff)
const TOKEN = process.env.DISCORD_TOKEN || 'TON_TOKEN_DE_BOT_DISCORD';
const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID || 'ID_DU_SALON_DE_RECRUTEMENT';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuration d'Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes du site web
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/recrutement', (req, res) => {
    res.render('recrutement');
});

// Route de traitement du formulaire de candidature
app.post('/submit-application', async (req, res) => {
    try {
        const { poste, discordTag, discordId, prenom, age, motivation } = req.body;

        let specificFields = [];

        if (poste === 'Gérant Légal') {
            specificFields = [
                { name: '📖 Présentation', value: req.body.legal_presentation || 'Non renseigné', inline: false },
                { name: '💼 Expérience', value: req.body.legal_experience || 'Non renseigné', inline: false },
                { name: '📈 Gestion & Activité', value: req.body.legal_activity || 'Non renseigné', inline: false }
            ];
        } else if (poste === 'Gérant Illégal') {
            specificFields = [
                { name: '📖 Présentation', value: req.body.illegal_presentation || 'Non renseigné', inline: false },
                { name: '🔪 Expérience', value: req.body.illegal_experience || 'Non renseigné', inline: false },
                { name: '⚖️ Équilibrage', value: req.body.illegal_balance || 'Non renseigné', inline: false }
            ];
        } else if (poste === 'Community Manager') {
            specificFields = [
                { name: '📖 Présentation', value: req.body.cm_presentation || 'Non renseigné', inline: false },
                { name: '📱 Expérience', value: req.body.cm_experience || 'Non renseigné', inline: false },
                { name: '💡 Animation', value: req.body.cm_activity || 'Non renseigné', inline: false }
            ];
        } else if (poste === 'Modération') {
            specificFields = [
                { name: '🛡️ Mise en situation', value: req.body.sit_1 || 'Non renseigné', inline: false }
            ];
        } else if (poste === 'Développeur') {
            specificFields = [
                { name: '📖 Présentation', value: req.body.dev_presentation || 'Non renseigné', inline: false },
                { name: '💻 Langages', value: req.body.dev_languages || 'Non renseigné', inline: false },
                { name: '⚙️ Frameworks / Compétences', value: req.body.dev_skills || 'Non renseigné', inline: false }
            ];
        }

        // Création de l'embed en mauve (#8b5cf6)
        const embed = new EmbedBuilder()
            .setColor('#8b5cf6')
            .setTitle(`📋 Nouvelle Candidature : ${poste}`)
            .setDescription('Une nouvelle candidature vient d\'être soumise via le site web de NewStreet Roleplay.')
            .addFields(
                { name: '🏷️ Poste visé', value: poste, inline: false },
                { name: '👤 Prénom', value: prenom, inline: true },
                { name: '🎂 Âge', value: `${age} ans`, inline: true },
                { name: '💬 Tag Discord', value: discordTag, inline: true },
                { name: '🆔 ID Discord', value: discordId, inline: true },
                { name: '🎯 Motivations principales', value: motivation, inline: false },
                ...specificFields
            )
            .setTimestamp()
            .setFooter({ text: 'NewStreet Roleplay - Système de Recrutement' });

        // Création des boutons Accepter / Refuser avec l'ID du joueur injecté
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${discordId}`)
                    .setLabel('Accepter')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`refuse_${discordId}`)
                    .setLabel('Refuser')
                    .setStyle(ButtonStyle.Danger)
            );

        // Récupération du salon staff via le client Discord et envoi du message avec boutons
        const channel = await client.channels.fetch(STAFF_CHANNEL_ID);
        if (!channel) {
            throw new Error('Salon staff introuvable. Vérifie l\'ID du salon.');
        }

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        // Page de confirmation pour l'utilisateur
        res.send(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Candidature Envoyée</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
                <style>
                    body { background: #070913; color: white; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: rgba(17, 24, 39, 0.8); border: 1px solid rgba(139, 92, 246, 0.4); padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); max-width: 500px; }
                    h2 { color: #a78bfa; margin-bottom: 15px; }
                    p { color: #9ca3af; font-size: 14px; margin-bottom: 25px; }
                    a { background: #8b5cf6; color: white; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: 600; transition: background 0.3s; }
                    a:hover { background: #7c3aed; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Candidature envoyée avec succès !</h2>
                    <p>Ton dossier pour le poste de <strong>${poste}</strong> a bien été transmis à l'équipe de NewStreet Roleplay.</p>
                    <a href="/recrutement">Retourner au site</a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la candidature :', error);
        res.status(500).send('Une erreur est survenue lors de l\'envoi de votre candidature.');
    }
});

// Écoute des clics sur les boutons (Accepter / Refuser) par le staff
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, candidateDiscordId] = interaction.customId.split('_');

    // Vérification de la permission Administrateur (ou modérateur)
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: 'Tu n\'as pas la permission d\'utiliser ce bouton.', ephemeral: true });
    }

    try {
        const candidate = await client.users.fetch(candidateDiscordId);

        if (action === 'accept') {
            // Envoi du message privé au joueur accepté
            await candidate.send('🎉 Félicitations ! Ta candidature pour **NewStreet Roleplay** a été **acceptée**. Un membre de l\'équipe va prendre contact avec toi.');
            
            // Désactivation des boutons et mise à jour du message staff
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accepted').setLabel('Accepté ✅').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('refused').setLabel('Refuser').setStyle(ButtonStyle.Danger).setDisabled(true)
            );

            await interaction.update({ content: `Candidature acceptée par ${interaction.user}`, components: [disabledRow] });

        } else if (action === 'refuse') {
            // Envoi du message privé au joueur refusé
            await candidate.send('❌ Bonjour, nous le regrettons mais ta candidature pour **NewStreet Roleplay** n\'a pas été retenue pour le moment.');

            // Désactivation des boutons et mise à jour du message staff
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accepted').setLabel('Accepter').setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('refused').setLabel('Refusé ❌').setStyle(ButtonStyle.Danger).setDisabled(true)
            );

            await interaction.update({ content: `Candidature refusée par ${interaction.user}`, components: [disabledRow] });
        }

    } catch (error) {
        console.error('Erreur lors du traitement du bouton :', error);
        await interaction.reply({ content: 'Une erreur est survenue (le joueur a peut-être ses messages privés fermés ou son ID est invalide).', ephemeral: true });
    }
});

// Événement de démarrage du bot
client.once('ready', () => {
    console.log(`Bot Discord connecté en tant que ${client.user.tag}`);
});

// Lancement simultané du serveur Express et connexion du Bot
client.login(TOKEN);
app.listen(PORT, () => {
    console.log(`Serveur web démarré sur le port ${PORT}`);
});
