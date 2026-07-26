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

// Variables d'environnement & IDs (Modifie les IDs selon ton nouveau serveur si besoin)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const RECRUTEMENT_CHANNEL_ID = '1526171548472446986'; // Salon pour envoyer le panel !panel
const CANDIDATURE_DEST_CHANNEL_ID = '1530409770539024465'; // Salon où arrivent les candidatures du site
const LOGO_URL = 'https://media.discordapp.net/attachments/1531037885145550918/1531044082040705174/image.png';

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
        .setURL('https://ton-site.onrender.com/recrutement') // Remplace par ton URL Render une fois créée
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
app.get('/recrutement', (req, res) => res.render('recrutement')); // Assure-toi de créer recrutement.ejs si tu en as besoin
app.get('/reglement', (req, res) => res.render('reglement')); // Si tu veux ajouter une page règlement

// Traitement du formulaire de recrutement
app.post('/recrutement', applyLimiter, async (req, res) => {
  const { service, discordTag, discordId, prenom, age, ambition, motivation, experience, roleModerateur } = req.body;

  if (!discordTag || !discordId || !prenom || !age || !motivation) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires." });
  }

  try {
    const channel = await client.channels.fetch(CANDIDATURE_DEST_CHANNEL_ID);
    if (!channel) {
      return res.status(500).json({ error: "Salon Discord de destination introuvable." });
    }

    const isCM = service && service.toLowerCase().includes('community');

    const embed = new EmbedBuilder()
      .setTitle(`DOSSIER DE CANDIDATURE — ${(service || 'GÉNÉRAL').toUpperCase()}`)
      .setColor(isCM ? 0xE52D48 : 0x1E222B)
      .setThumbnail(LOGO_URL)
      .addFields(
        { name: "Identification Discord", value: `• **Compte :** \`${discordTag}\`\n• **ID :** \`${discordId}\``, inline: true },
        { name: "Informations IRL", value: `• **Prénom :** ${prenom}\n• **Âge :** ${age} ans`, inline: true },
        { name: "\u200B", value: "\u200B", inline: false },
        { name: "Ambitions", value: `\`\`\`\n${ambition || 'Non renseignée'}\n\`\`\``, inline: false },
        { name: "Motivations", value: `\`\`\`\n${motivation}\n\`\`\``, inline: false },
        { name: "Expériences Passées", value: `\`\`\`\n${experience || 'Aucune expérience mentionnée.'}\n\`\`\``, inline: false },
        { name: "Vision du poste de Modérateur", value: `\`\`\`\n${roleModerateur || 'Non renseigné'}\n\`\`\``, inline: false }
      )
      .setFooter({ text: "Urgence Lilloise — Système de Recrutement" })
      .setTimestamp();

    if (isCM) {
      embed.addFields({ name: "Statut du Dossier", value: "❌ **CANDIDATURE FERMÉE** (Poste indisponible)", inline: false });
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${discordId}`)
        .setLabel('Accepter')
        .setStyle(ButtonStyle.Success)
        .setDisabled(isCM),
      new ButtonBuilder()
        .setCustomId(`refuse_${discordId}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(isCM)
    );

    await channel.send({ embeds: [embed], components: [buttons] });
    
    if (isCM) {
      return res.status(400).json({ error: "Les recrutements pour le poste de Community Manager sont actuellement fermés." });
    }

    return res.json({ success: true, message: "Candidature envoyée avec succès !" });

  } catch (err) {
    console.error("Erreur lors de l'envoi de la candidature :", err);
    return res.status(500).json({ error: "Erreur lors de la communication avec le serveur Discord." });
  }
});

// Gestion des Interactions (Boutons Accepter / Refuser)
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      const [action, targetUserId] = interaction.customId.split('_');
      
      if (action === 'accept') {
        await interaction.deferUpdate();
        const staffUser = interaction.user;
        const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        const targetUser = await client.users.fetch(targetUserId);

        const acceptEmbed = new EmbedBuilder()
          .setTitle("🪪 Recrutement")
          .setDescription("Votre demande de recrutement vient d'être revue.\n\n🌐 **Statut de la réponse**\n> **Acceptée.**\n\n🎉 Félicitations ! Votre candidature a été acceptée !")
          .setColor(0x2ED573)
          .setThumbnail(LOGO_URL)
          .setFooter({ text: "Tous droits réservés" });

        await targetUser.send({ embeds: [acceptEmbed] }).catch(() => console.log("Impossible d'envoyer un MP."));

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
        const targetUser = await client.users.fetch(targetUserId);

        const refuseEmbed = new EmbedBuilder()
          .setTitle("🪪 Recrutement")
          .setDescription(`Votre demande de recrutement a été refusée.\n\n📌 **Raison :**\n> *${reason}*`)
          .setColor(0xE52D48)
          .setThumbnail(LOGO_URL)
          .setFooter({ text: "Tous droits réservés" });

        await targetUser.send({ embeds: [refuseEmbed] }).catch(() => console.log("Impossible d'envoyer un MP."));

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
