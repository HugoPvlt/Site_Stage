const bouton = document.getElementById('btn-choisir');
const selecteurFichier = document.getElementById('explorateur-fichier');
const conteneurFormDroite = document.querySelector('.form_arborescence'); 
const conteneurFormGauche = document.querySelector('.form_fichier'); 
const barreRecherche = document.getElementById('barre-recherche');

let tousLesFichiers = []; 

bouton.addEventListener('click', () => {//Déclenche le clic sur le sélecteur caché quand on clique sur le bouton visible
    selecteurFichier.click();
});

selecteurFichier.addEventListener('change', (evenement) => {
    const fichiers = evenement.target.files;
    
    if (fichiers.length > 0) {
        const formData = new FormData();//Prépare un objet FormData pour empaqueter les fichiers
        Array.from(fichiers).forEach(fichier => {
            formData.append('fichiers[]', fichier);
        });

        fetch('../PHP/upload.php', {//Envoie les fichiers au script PHP d'upload
            method: 'POST',
            body: formData
        })
        .then(reponse => reponse.json())
        .then(data => {
            if (data.statut === "succes") {//Si l'upload réussit, on rafraîchit la liste des fichiers à l'écran
                if (barreRecherche) barreRecherche.value = "";
                chargerFichiersUtilisateur();
            } else {
                alert(data.message);
            }
        })
        .catch(err => console.error("Erreur d'envoi :", err));

        selecteurFichier.value = "";
    }
});

function chargerFichiersUtilisateur() {//Récupère et affiche la liste des documents de l'utilisateur connecté
    fetch('../PHP/recuperer_fichiers.php')
    .then(reponse => reponse.json())
    .then(fichiers => {
        tousLesFichiers = fichiers;
        afficherFichiers(tousLesFichiers);
    })
    .catch(err => alert("Erreur chargement fichiers : " + err));
}

function afficherFichiers(listeAAfficher) {
    conteneurFormDroite.innerHTML = "";
    
    if (listeAAfficher.length === 0) {
        conteneurFormDroite.style.display = '';
        conteneurFormDroite.style.flexDirection = '';
        conteneurFormDroite.style.justifyContent = '';
        
        const p = document.createElement('p');
        p.textContent = "Aucun fichier trouvé";
        conteneurFormDroite.appendChild(p);
        return;
    }

    conteneurFormDroite.style.display = 'flex';
    conteneurFormDroite.style.flexDirection = 'column';
    conteneurFormDroite.style.justifyContent = 'flex-start';

    listeAAfficher.forEach(fichier => {//Boucle pour créer un lien cliquable pour chaque fichier trouvé
        const nouveauBloc = document.createElement('div');
        nouveauBloc.className = 'bloc-fichier-temporaire';
        nouveauBloc.style.marginTop = '10px';
        nouveauBloc.style.width = '100%';
        nouveauBloc.style.display = 'flex';
        nouveauBloc.style.justifyContent = 'space-between';
        nouveauBloc.style.alignItems = 'center';

        const zoneTexte = document.createElement('div');

        const texteInfo = document.createElement('p');
        texteInfo.textContent = "Fichier lié : ";
        texteInfo.style.fontWeight = 'bold';
        texteInfo.style.display = 'inline';

        const lienFichier = document.createElement('a');
        lienFichier.href = "#"; 
        lienFichier.textContent = fichier.nom_fichier;
        lienFichier.style.color = '#007BFF';
        lienFichier.style.textDecoration = 'underline';
        lienFichier.style.cursor = 'pointer';
        lienFichier.style.marginLeft = '5px';

        lienFichier.addEventListener('click', (e) => {//Gère l'affichage du fichier dans la zone de gauche lors du clic
            e.preventDefault(); 
            conteneurFormGauche.innerHTML = "";
            const urlServeur = "../PHP/" + fichier.chemin_fichier;

            if (fichier.nom_fichier.match(/\.(jpeg|jpg|png|gif)$/i)) {//Affiche le fichier si c'est une image
                const img = document.createElement('img');
                img.src = urlServeur;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.display = 'block';
                conteneurFormGauche.appendChild(img);
            } 
            else if (fichier.nom_fichier.endsWith('.pdf')) {//Intègre un iframe si c'est un document PDF
                const iframe = document.createElement('iframe');
                iframe.src = urlServeur;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.display = 'block';
                conteneurFormGauche.appendChild(iframe);
            } 
            else if (fichier.nom_fichier.endsWith('.docx')) {//Utilise la bibliothèque docx pour lire et afficher un fichier Word
                const zoneWord = document.createElement('div');
                zoneWord.style.width = '100%';
                zoneWord.style.height = '100%';
                zoneWord.style.overflowY = 'auto';
                conteneurFormGauche.appendChild(zoneWord);

                fetch(urlServeur)
                .then(res => res.blob())
                .then(blob => {
                    docx.renderAsync(blob, zoneWord)
                        .catch(err => console.error(err));
                });
            }
            else {//Message par défaut si le format ne peut pas être lu dans le navigateur
                const p = document.createElement('p');
                p.textContent = `Visualisation indisponible pour ce type de fichier (${fichier.nom_fichier}).`;
                p.style.textAlign = 'center';
                p.style.marginTop = '20px';
                conteneurFormGauche.appendChild(p);
            }
        });

        const boutonSupprimer = document.createElement('button');
        boutonSupprimer.textContent = "Retirer";
        boutonSupprimer.style.backgroundColor = '#DC3545';
        boutonSupprimer.style.color = '#FFF';
        boutonSupprimer.style.border = 'none';
        boutonSupprimer.style.padding = '5px 10px';
        boutonSupprimer.style.borderRadius = '4px';
        boutonSupprimer.style.cursor = 'pointer';
        boutonSupprimer.style.fontSize = '12px';
        boutonSupprimer.style.marginLeft = '15px';

        boutonSupprimer.addEventListener('click', () => {
            supprimerFichier(fichier.id); 
        });

        zoneTexte.appendChild(texteInfo);
        zoneTexte.appendChild(lienFichier);
        nouveauBloc.appendChild(zoneTexte);
        nouveauBloc.appendChild(boutonSupprimer);
        conteneurFormDroite.appendChild(nouveauBloc);
    });
}

function supprimerFichier(idFichier) {
    if (!idFichier) {
        alert("Erreur critique : L'ID du fichier est vide ou indéfini !");
        return;
    }

    if (confirm("Es-tu sûr de vouloir retirer ce fichier ?")) {
        fetch('../PHP/supprimer_fichier.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: idFichier })
        })
        .then(reponse => {
            if (!reponse.ok) {
                throw new Error("Le serveur PHP a répondu avec une erreur HTTP " + reponse.status);
            }
            return reponse.text(); // On récupère d'abord en texte brut pour éviter le crash si le PHP renvoie une erreur fatale
        })
        .then(texteBrut => {
            try {
                const data = JSON.parse(texteBrut);
                if (data.statut === "succes") {
                    alert(data.message);
                    chargerFichiersUtilisateur();
                } else {
                    alert("Erreur renvoyée par PHP : " + data.message);
                }
            } catch (errJson) {
                alert("Le serveur PHP n'a pas renvoyé de JSON valide. Réponse reçue : " + texteBrut);
            }
        })
        .catch(err => {
            alert("Erreur réseau ou JavaScript : " + err.message);
            console.error(err);
        });
    }
}

if (barreRecherche) {
    barreRecherche.addEventListener('input', (evenement) => {
        const texteSaisi = evenement.target.value.toLowerCase().trim();

        const fichiersFiltres = tousLesFichiers.filter(fichier => {
            return fichier.nom_fichier.toLowerCase().includes(texteSaisi);
        });

        afficherFichiers(fichiersFiltres);
    });
}

document.addEventListener('DOMContentLoaded', chargerFichiersUtilisateur);