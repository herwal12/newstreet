app.post('/submit-application', async (req, res) => {
    try {
        const { poste, discordTag, discordId, prenom, age, motivation } = req.body;

        // Vérification de sécurité si le client bot n'est pas prêt
        if (!client.isReady()) {
            console.error('Erreur : Le bot Discord n\'est pas encore connecté lors de la soumission.');
            return res.status(500).send('Erreur interne : Le bot Discord est hors ligne. Réessayez dans quelques instants.');
        }

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
                    <p>Ton dossier pour le poste de <strong>${poste}</strong> a bien été transmis à l'équipe de NewStreet Roleplay.</p>
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
