const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables d'environnement & IDs des salons de candidatures
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const RECRUTEMENT_CHANNEL_ID = '1526171548472446986'; 
const LOGO_URL = 'https://media.discordapp.net/attachments/1531037885145550918/1531044082040705174/image.png';

// Dictionnaire des salons selon le poste choisi
const CHANNEL_IDS = {
    "Gérant Illégal": "1531076334888157324",
    "Gérant Légal": "1531076371043057766",
    "Modération": "1531076399266267216",
    "Développeur": "1531076424616644688",
    "Community Manager": "1531076453792481280"
};

// Initialisation du Bot Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Connexion du Bot
client.login(DISCORD_BOT_TOKEN).catch(err => {
  console.error("❌ Erreur de connexion au Bot Discord:", err);
});

client.once('ready', () => {
  console.log(`✅ Bot Discord connecté en tant que : ${client.user.tag}`);
});

// Commande pour envoyer le panel de recrutement dans le salon dédié
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.content !== '!panel') return;

  const embed = new EmbedBuilder()
    .setColor('#e52d48')
    .setTitle('URGENCE LILLOISE • RECRUTEMENTS')
    .setDescription("Les recrutements sont actuellement **ouverts**.\n\nClique sur le bouton ci-dessous pour accéder au site et postuler directement !")
    .setThumbnail(LOGO_URL)
    .setFooter({ text: 'Urgence Lilloise • Équipe de recrutement' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Accéder au site / Postuler')
        .setStyle(ButtonStyle.Link)
        .setURL('https://newstreet.onrender.com/recrutement')
        .setEmoji('🔗')
    );

  const channel = client.channels.cache.get(RECRUTEMENT_CHANNEL_ID);
  if (channel) {
    await channel.send({ embeds: [embed], components: [row] });
    message.reply('✅ Panel de recrutement envoyé avec succès !');
  } else {
    message.reply('❌ Erreur : Impossible de trouver le salon de recrutement.');
  }
});

// Configuration EJS & Middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives. Réessayez plus tard." }
});

// Routes du site web
app.get('/', (req, res) => res.render('index'));
app.get('/recrutement', (req, res) => res.render('recrutement')); 
app.get('/reglement', (req, res) => res.render('reglement')); 

// Logique universelle et souple pour le traitement des candidatures
const handleApplicationSubmission = async (req, res) => {
  try {
    const data = req.body;
    
    // Récupération intelligente et tolérante des champs de base
    const service = data.poste || data.service || "Général";
    const discordTag = data.discordTag || data.discord || data.pseudo || "Non renseigné";
    const discordId = data.discordId || 'unknown';
    const prenom = data.prenom || "Non renseigné";
    const age = data.age || "Non renseigné";

    // Vérification minimale pour éviter le spam vide
    if (!discordTag || discordTag === "Non renseigné") {
      return res.status(400).json({ error: "Veuillez renseigner votre pseudo Discord." });
    }

    const targetChannelId = CHANNEL_IDS[service] || CHANNEL_IDS["Modération"];
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    
    if (!channel) {
      return res.status(500).json({ error: "Salon Discord de destination introuvable." });
    }

    // Création dynamique des champs de l'embed à partir de TOUT ce que l'utilisateur a rempli
    const dynamicFields = [];
    for (const [key, value] of Object.entries(data)) {
      // On exclut les champs déjà gérés à part pour éviter les doublons
      if (!['poste', 'service', 'discordTag', 'discord', 'pseudo', 'discordId', 'prenom', 'age'].includes(key) && value) {
        dynamicFields.push({
          name: `🔹 ${key.toUpperCase()}`,
          value: `\`\`\`\n${String(value).substring(0, 1000)}\n\`\`\``,
          inline: false
        });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`📄 DOSSIER DE CANDIDATURE — ${service.toUpperCase()}`)
      .setColor(0x8b5cf6)
      .setThumbnail(LOGO_URL)
      .addFields(
        { name: "👤 Identification", value: `• **Discord :** \`${discordTag}\`\n• **ID :** \`${discordId}\``, inline: true },
        { name: "🏷️ Informations", value: `• **Prénom :** ${prenom}\n• **Âge :** ${age} ans`, inline: true },
        { name: "\u200B", value: "\u200B", inline: false },
        ...dynamicFields
      )
      .setFooter({ text: "Urgence Lilloise — Système de Recrutement" })
      .setTimestamp();

    const targetIdForButton = discordId !== 'unknown' ? discordId : 'unknown';
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${targetIdForButton}`)
        .setLabel('Accepter')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`refuse_${targetIdForButton}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [buttons] });
    
    // Réponse propre au navigateur (affichage d'une page de succès élégante)
    return res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Candidature envoyée</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                body { background: #070913; color: white; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: rgba(17, 24, 39, 0.9); border: 1px solid rgba(139, 92, 246, 0.4); padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 0 30px rgba(139, 92, 246, 0.2); }
                h1 { color: #34d399; margin-bottom: 15px; }
                p { color: #9ca3af; margin-bottom: 25px; }
                a { background: #8b5cf6; color: white; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: 600; }
                a:hover { background: #7c3aed; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Candidature envoyée avec succès !</h1>
                <p>Ton dossier a bien été transmis à l'équipe sur Discord.</p>
                <a href="/recrutement">Retour au site</a>
            </div>
        </body>
        </html>
    `);

  } catch (err) {
    console.error("Erreur lors de l'envoi de la candidature :", err);
    return res.status(500).json({ error: "Erreur lors de la communication avec le serveur Discord." });
  }
};

// Routes POST gérant ton formulaire
app.post('/submit-application', applyLimiter, handleApplicationSubmission);
app.post('/recrutement', applyLimiter, handleApplicationSubmission);

// Gestion des Interactions (Boutons Accepter / Refuser)
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      const [action, targetUserId] = interaction.customId.split('_');
      
      if (action === 'accept') {
        await interaction.deferUpdate();
        const staffUser = interaction.user;
        const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

        const acceptEmbed = new EmbedBuilder()
          .setTitle("🪪 Recrutement")
          .setDescription("Votre demande de recrutement vient d'être revue.\n\n🌐 **Statut de la réponse**\n> **Acceptée.**\n\n🎉 Félicitations ! Votre candidature a été acceptée !")
          .setColor(0x2ED573)
          .setThumbnail(LOGO_URL)
          .setFooter({ text: "Tous droits réservés" });

        if (targetUserId && targetUserId !== 'unknown') {
          const targetUser = await client.users.fetch(targetUserId).catch(() => null);
          if (targetUser) {
            await targetUser.send({ embeds: [acceptEmbed] }).catch(() => console.log("Impossible d'envoyer un MP."));
          }
        }

        originalEmbed.setColor(0x2ED573);
        originalEmbed.addFields({ name: "Statut du Dossier", value: `✅ **ACCEPTÉ** par ${staffUser.tag}`, inline: false });

        await interaction.editReply({ embeds: [originalEmbed], components: [] });

      } else if (action === 'refuse') {
        const modal = new ModalBuilder()
          .setCustomId(`modal_refuse_${targetUserId}`)
          .setTitle('Motif du refus de la candidature');

        const reasonInput = new TextInputBuilder()
          .setCustomId('refuse_reason')
          .setLabel('Raison du refus :')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ex: Réponse trop courte...')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_refuse_')) {
        const targetUserId = interaction.customId.replace('modal_refuse_', '');
        const reason = interaction.fields.getTextInputValue('refuse_reason');

        await interaction.deferUpdate();

        const staffUser = interaction.user;
        const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

        const refuseEmbed = new EmbedBuilder()
          .setTitle("🪪 Recrutement")
          .setDescription(`Votre demande de recrutement a été refusée.\n\n📌 **Raison :**\n> *${reason}*`)
          .setColor(0xE52D48)
          .setThumbnail(LOGO_URL)
          .setFooter({ text: "Tous droits réservés" });

        if (targetUserId && targetUserId !== 'unknown') {
          const targetUser = await client.users.fetch(targetUserId).catch(() => null);
          if (targetUser) {
            await targetUser.send({ embeds: [refuseEmbed] }).catch(() => console.log("Impossible d'envoyer un MP."));
          }
        }

        originalEmbed.setColor(0xE52D48);
        originalEmbed.addFields(
          { name: "Statut du Dossier", value: `❌ **REFUSÉ** par ${staffUser.tag}`, inline: false },
          { name: "Raison du Refus", value: `\`\`\`\n${reason}\n\`\`\``, inline: false }
        );

        await interaction.editReply({ embeds: [originalEmbed], components: [] });
      }
    }

  } catch (error) {
    console.error("Erreur lors du traitement de l'interaction :", error);
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Web démarré sur le port ${PORT}`);
});
