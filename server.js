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
                { name: 'Frameworks / Compétences', value: '```\n' + (req.body.dev_skills || 'Non renseigné') + '\n```', inline: false }
            ];
        }

        const embed = new EmbedBuilder()
            .setColor('#8b5cf6')
            .setTitle(`DOSSIER DE CANDIDATURE — ${poste.toUpperCase()}`)
            .addFields(
                { name: 'Identification Discord', value: `• **Compte :** \`${discordTag}\`\n• **ID :** \`${discordId}\``, inline: false },
                { name: 'Informations IRL', value: `• **Prénom :** ${prenom}\n• **Âge :** ${age} ans`, inline: false },
                { name: 'Motivation', value: '```\n' + motivation + '\n```', inline: false },
                ...specificFields,
                { name: 'Statut du Dossier', value: '⏳ **EN ATTENTE DE TRAITEMENT**', inline: false }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'NewStreet Roleplay — Système de Recrutement • Made by ymn_Offcl' });

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

        const channel = await client.channels.fetch(STAFF_CHANNEL_ID);
        if (!channel) {
            throw new Error(`Salon staff introuvable avec l'ID : ${STAFF_CHANNEL_ID}`);
        }

        await channel.send({
            embeds: [embed],
            components: [row]
        });

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
                    <p>Ton dossier pour le poste de <strong>${poste}</strong> a bien été transmis à l'équipe.</p>
                    <a href="/recrutement">Retourner au site</a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('ERREUR CRITIQUE DANS /submit-application :', error);
        res.status(500).send(`Erreur serveur : ${error.message}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: "Tu n'as pas la permission d'utiliser cette action.", ephemeral: true });
    }

    if (interaction.isButton()) {
        const [action, candidateDiscordId] = interaction.customId.split('_');

        if (action === 'accept') {
            try {
                const candidate = await client.users.fetch(candidateDiscordId);
                const acceptEmbed = new EmbedBuilder()
                    .setColor('#8b5cf6')
                    .setThumbnail(LOGO_URL)
                    .addFields(
                        { name: '🎫 Recrutement', value: "Votre demande de recrutement vient d'être revue." },
                        { name: '🌐 Statut de la réponse', value: '```\nAcceptée.\n```' },
                        { name: '🎉 Félicitations !', value: "Votre candidature a été acceptée !\nIl vous est donc demandé d'ouvrir un ticket sur le Discord principal, dans la catégorie Direction, afin de poursuivre les formalités. Merci de ne faire aucune mention (@) dans votre ticket." }
                    )
                    .setFooter({ text: 'NewStreet Roleplay — Système de Recrutement • Tous droits réservés' });

                await candidate.send({ embeds: [acceptEmbed] });
                
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('accepted').setLabel('Accepté ✅').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('refused').setLabel('Refuser').setStyle(ButtonStyle.Danger).setDisabled(true)
                );

                await interaction.update({ content: `Candidature acceptée par ${interaction.user}`, components: [disabledRow] });
            } catch (error) {
                console.error('Erreur acceptation :', error);
                await interaction.reply({ content: "Erreur lors de l'acceptation (le joueur a peut-être ses MP fermés).", ephemeral: true });
            }

        } else if (action === 'refuse') {
            const modal = new ModalBuilder()
                .setCustomId(`modal_refuse_${candidateDiscordId}`)
                .setTitle('Motif du refus de la candidature');

            const reasonInput = new TextInputBuilder()
                .setCustomId('refuse_reason')
                .setLabel('Raison du refus')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Expliquez pourquoi la candidature est refusée...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_refuse_')) {
            const candidateDiscordId = interaction.customId.split('_')[2];
            const reason = interaction.fields.getTextInputValue('refuse_reason');

            try {
                const candidate = await client.users.fetch(candidateDiscordId);
                
                const refuseEmbed = new EmbedBuilder()
                    .setColor('#ef4444')
                    .setThumbnail(LOGO_URL)
                    .addFields(
                        { name: '🎫 Recrutement', value: "Votre demande de recrutement vient d'être revue." },
                        { name: '🌐 Statut de la réponse', value: '```\nRefusée.\n```' },
                        { name: '❌ Motif du refus', value: '```\n' + reason + '\n```' },
                        { name: '💬 Message', value: "Bonjour. Nous vous informons que votre candidature pour le staff de **NewStreet Roleplay** n'a malheureusement **pas été retenue**.\n\nMerci pour l'intérêt que vous portez à notre serveur." }
                    )
                    .setFooter({ text: 'NewStreet Roleplay — Système de Recrutement • Tous droits réservés' });

                await candidate.send({ embeds: [refuseEmbed] });

                const originalEmbed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(originalEmbed)
                    .setColor('#ef4444');

                const fields = updatedEmbed.data.fields.map(field => {
                    if (field.name === 'Statut du Dossier') {
                        return { name: '❌ Refusé — Raison', value: '```\n' + reason + '\n```', inline: false };
                    }
                    return field;
                });
                updatedEmbed.setFields(fields);

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('accepted').setLabel('Accepter').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('refused').setLabel('Refusé ❌').setStyle(ButtonStyle.Danger).setDisabled(true)
                );

                await interaction.update({ 
                    content: `Candidature refusée par ${interaction.user}`, 
                    embeds: [updatedEmbed], 
                    components: [disabledRow] 
                });

            } catch (error) {
                console.error('Erreur lors du refus avec motif :', error);
                await interaction.reply({ content: "Erreur lors du traitement du refus (le joueur a peut-être ses MP fermés).", ephemeral: true });
            }
        }
    }
});

client.once('ready', () => {
    console.log(`✅ Bot Discord connecté avec succès en tant que ${client.user.tag}`);
});

if (!TOKEN) {
    console.log("⚠️ ATTENTION : DISCORD_BOT_TOKEN est manquant dans les variables d'environnement Render !");
} else {
    client.login(TOKEN).catch(err => {
        console.error('❌ Erreur critique lors de la connexion du bot Discord :', err.message);
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Serveur web démarré sur le port ${PORT}`);
});
