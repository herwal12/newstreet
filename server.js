const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ton URL de Webhook Discord direct
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1531088041177780406/zKMSZvEofxe_qZkudboy8NTnsBdt-1xLoOMqOxbRYQgu4wdzcmJDZItMWNw38wWicgIv';
const LOGO_URL = 'https://media.discordapp.net/attachments/1531037885145550918/1531044082040705174/image.png';

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

// Traitement des candidatures avec le design exact souhaité
const handleApplicationSubmission = async (req, res) => {
  try {
    const data = req.body;
    
    const service = data.poste || data.service || "Modération";
    const discordTag = data.discordTag || data.discord || data.pseudo || "Non renseigné";
    const discordId = data.discordId || '1074640294177415168'; // Fallback ou ID réel si envoyé par le form
    const prenom = data.prenom || "Non renseigné";
    const age = data.age || "Non renseigné";

    if (!discordTag || discordTag === "Non renseigné") {
      return res.status(400).json({ error: "Veuillez renseigner votre pseudo Discord." });
    }

    // Construction des champs de l'embed à l'identique de ton modèle
    const fields = [
      {
        name: "Identification Discord",
        value: `• **Compte :** \`${discordTag}\`\n• **ID :** \`${discordId}\``,
        inline: true
      },
      {
        name: "Informations IRL",
        value: `• **Prénom :** ${prenom}\n• **Âge :** ${age} ans`,
        inline: true
      }
    ];

    // Ajout dynamique de toutes les questions du formulaire sous forme de blocs de code
    for (const [key, value] of Object.entries(data)) {
      if (!['poste', 'service', 'discordTag', 'discord', 'pseudo', 'discordId', 'prenom', 'age'].includes(key) && value) {
        // Formate joliment le nom de la clé (ex: "ambitions" -> "Ambitions")
        const formattedTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        
        fields.push({
          name: formattedTitle,
          value: `\`\`\`\n${String(value).substring(0, 1024)}\n\`\`\``,
          inline: false
        });
      }
    }

    // Ajout du statut "En attente" par défaut pour que l'équipe puisse voir qu'elle est à traiter
    fields.push({
      name: "Statut du Dossier",
      value: "⏳ **EN ATTENTE DE TRAITEMENT**",
      inline: false
    });

    const payload = {
      embeds: [{
        title: `DOSSIER DE CANDIDATURE — ${service.toUpperCase()}`,
        color: 0x111214, // Couleur sombre type fond embed discord
        thumbnail: { url: LOGO_URL },
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: { text: "Urgence Lilloise — Système de Recrutement • Made by ymn_Offcl" }
      }]
    };

    // Envoi direct via fetch vers ton Webhook Discord
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Erreur Webhook Discord: ${webhookResponse.statusText}`);
    }

    // Page de succès stylée
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
    return res.status(500).json({ error: "Erreur lors de la communication avec le webhook Discord." });
  }
};

app.post('/submit-application', applyLimiter, handleApplicationSubmission);
app.post('/recrutement', applyLimiter, handleApplicationSubmission);

app.listen(PORT, () => {
  console.log(`Serveur Web démarré sur le port ${PORT}`);
});
