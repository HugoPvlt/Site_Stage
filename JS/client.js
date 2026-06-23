const bouton = document.getElementById('btn-choisir');
const selecteurFichier = document.getElementById('explorateur-fichier');
const conteneurFormDroite = document.querySelector('.form_arborescence'); 
const conteneurFormGauche = document.querySelector('.form_fichier'); 
const barreRecherche = document.getElementById('barre-recherche');

const CONFIG_DOSSIERS = [
    { nom: " Documents PDF", extensions: ['.pdf'] },
    { nom: " Images & Photos", extensions: ['.jpg', '.jpeg', '.png', '.gif'] },
    { nom: " Fichiers Word", extensions: ['.docx'] },
    { nom: " Autres fichiers", extensions: [] } 
];

// Catégories utilisées pour ranger les PDF en fonction des mots présents dans leur contenu
const CONFIG_CATEGORIES_PDF = [
  {
        nom: " Factures",
        motsClefs: [
            "facture",  
            "total à payer",
            "date d'échéance",
            "règlement",
            "ttc",             
            "ht"              
        ]
    },
    {
        nom: " Contrats",
        motsClefs: [
            "contrat", 
            "prestataire",
            "ci-après dénommé",
            "d'une part",
            "d'autre part",
            "convenu ce qui suit",
            "article 1",
            "obligations des parties",
            "exemplaires originaux",
            "lu et approuvé"
        ]
    },
    {
        nom: " Devis",
        motsClefs: [
            "devis",
            "proposition commerciale",
            "estimation",
            "bon pour accord",
            "coût estimatif",
            "validité du devis",
            "total estimé"
        ]
    },
    {
        nom: " Identité",
        motsClefs: [
            "carte nationale d'identité",
            "république française",
            "date de naissance",
            "lieu de naissance",
            "nationalité",
            "signature du titulaire",
            "passeport"
        ]
    },
    { nom: " PDF non classés", motsClefs: [] }
];
let tousLesFichiers = []; 


const cacheTextesPDF = new Map();// Permet d'éviter de re-analyser un PDF déjà traité 

bouton.addEventListener('click', () => {
    selecteurFichier.click();
});

selecteurFichier.addEventListener('change', (evenement) => {
    const fichiers = evenement.target.files;
    
    if (fichiers.length > 0) {
        const formData = new FormData();//si l'utilisateur a séléctionner plusieurs fichiers on les ajoute 1 par 1 dans la liste
        Array.from(fichiers).forEach(fichier => {
            formData.append('fichiers[]', fichier);
        });

        fetch('../PHP/upload.php', {//envoie les données au fichier upload qui va ajouter le fichier dans le dossier upload et les infos dans la BDD
            method: 'POST',
            body: formData
        })
        .then(reponse => reponse.json())
        .then(data => {
            if (data.statut === "succes") {// recharge les fichier si l'ajout a fonctionner
                if (barreRecherche) barreRecherche.value = "";
                chargerFichiersUtilisateur();
            } else {
                alert(data.message);
            }
        })
        .catch(err => console.error(err));

        selecteurFichier.value = "";
    }
});

function chargerFichiersUtilisateur() {
    fetch('../PHP/recuperer_fichiers.php')// recupere les fichiers de l'utilisatuer en fonction de son id
    .then(reponse => reponse.json())
    .then(fichiers => {
        tousLesFichiers = fichiers;
        afficherFichiers(tousLesFichiers);// affiche les fichiers
    })
    .catch(err => alert("Erreur chargement fichiers : " + err));
}

async function afficherFichiers(listeAAfficher) {
    conteneurFormDroite.innerHTML = "";// On efface ce qu'il y avait avant
    
    if (listeAAfficher.length === 0) {
        conteneurFormDroite.removeAttribute('style');
        const p = document.createElement('p');
        p.textContent = "Aucun fichier trouvé";
        conteneurFormDroite.appendChild(p);
        return;
    }

    const distributionDossiers = CONFIG_DOSSIERS.map(dossier => ({
        nom: dossier.nom,
        extensions: dossier.extensions,
        fichiers: []
    }));

    listeAAfficher.forEach(fichier => {
        const nomFichierMinuscule = fichier.nom_fichier.toLowerCase();
        
        let trouve = distributionDossiers.find(dossier => // on cherche le premier dossier de CONFIG_DOSSIERS qui accepte l'extension de ce fichier
            dossier.extensions.some(ext => nomFichierMinuscule.endsWith(ext))
        );

        if (!trouve) {// si on n'a trouvé aucun dossier correspondant, on le met dans le tout dernier ("Autres fichiers")
            trouve = distributionDossiers[distributionDossiers.length - 1];
        }

        trouve.fichiers.push(fichier);// on range le fichier dans son dossier attitré
    });

    for (const dossierStatique of distributionDossiers) {
        if (dossierStatique.fichiers.length === 0) continue;

        const conteneurDossier = document.createElement('div');// créé les blocs html
        conteneurDossier.className = 'dossier-statique-wrapper';
        
        const enteteDossier = document.createElement('div');
        enteteDossier.className = 'dossier-header';
        
        const listeFichiersDossier = document.createElement('div');
        listeFichiersDossier.className = 'dossier-content-fichiers';
        
        enteteDossier.innerHTML = `<span>${dossierStatique.nom} </span> <span class="badge-compteur">${dossierStatique.fichiers.length}</span>`;

        enteteDossier.addEventListener('click', () => {
            const enCoursDaffichage = listeFichiersDossier.classList.contains('visible');// gere l'affichage des dossier
            if (enCoursDaffichage) {//il regarde si le dossier a déjà la classe CSS visible
                listeFichiersDossier.classList.remove('visible');
                enteteDossier.classList.remove('dossier-header-border');
                enteteDossier.querySelector('span').textContent = `${dossierStatique.nom} `;
            } else {
                listeFichiersDossier.classList.add('visible');
                enteteDossier.classList.add('dossier-header-border');
                enteteDossier.querySelector('span').textContent = `${dossierStatique.nom} `;
            }
        });

        
        if (dossierStatique.nom === " Documents PDF") {// gestion de l'affichage pour les pdf avec leur sous dossier
            const messageChargement = document.createElement('p');
            messageChargement.textContent = "Analyse du contenu des PDF en cours...";
            messageChargement.className = 'message-chargement-pdf';
            listeFichiersDossier.appendChild(messageChargement);

            afficherSousDossiersPDF(dossierStatique.fichiers, listeFichiersDossier, messageChargement);
        } else {
            dossierStatique.fichiers.forEach(fichier => {
                listeFichiersDossier.appendChild(creerBlocFichier(fichier));
            });
        }

        conteneurDossier.appendChild(enteteDossier);
        conteneurDossier.appendChild(listeFichiersDossier);
        conteneurFormDroite.appendChild(conteneurDossier);
    }
}


async function afficherSousDossiersPDF(fichiersPDF, conteneurParent, messageChargement) {// Analyse chaque PDF et les répartit dans des sous-dossiers en fonction de leur contenu.
    
    const groupes = new Map();

    for (const fichier of fichiersPDF) {
        const { nom, score } = await categoriserPDF(fichier);
        if (!groupes.has(nom)) {
            groupes.set(nom, []);//le code vérifie si la catégorie existe déjà dans le dictionnaire si elle n'existe pas encore, il crée une liste vide [] pour cette catégorie.
        }
        groupes.get(nom).push({ fichier, score });//il ajoute le fichier actuel et son score de correspondance dans la bonne liste
    }

    messageChargement.remove();

    CONFIG_CATEGORIES_PDF.forEach(categorie => {// création des blocs html
        const entrees = groupes.get(categorie.nom);
        if (!entrees || entrees.length === 0) return;

        const sousDossier = document.createElement('div');
        sousDossier.className = 'dossier-statique-wrapper sous-dossier-pdf';

        const enteteSousDossier = document.createElement('div');
        enteteSousDossier.className = 'dossier-header sous-dossier-header';
        enteteSousDossier.innerHTML = `<span>${categorie.nom} </span> <span class="badge-compteur">${entrees.length}</span>`;

        const contenuSousDossier = document.createElement('div');
        contenuSousDossier.className = 'dossier-content-fichiers';

        enteteSousDossier.addEventListener('click', () => {
            const enCoursDaffichage = contenuSousDossier.classList.contains('visible');
            if (enCoursDaffichage) {
                contenuSousDossier.classList.remove('visible');
                enteteSousDossier.classList.remove('dossier-header-border');
            } else {
                contenuSousDossier.classList.add('visible');
                enteteSousDossier.classList.add('dossier-header-border');
            }
        });

        entrees.forEach(({ fichier }) => {
            const bloc = creerBlocFichier(fichier);

            contenuSousDossier.appendChild(bloc);
        });

        sousDossier.appendChild(enteteSousDossier);
        sousDossier.appendChild(contenuSousDossier);
        conteneurParent.appendChild(sousDossier);
    });
}


// Retourne { nom, score } où score est le pourcentage de mots-clés matchés (0 si non classé).
async function categoriserPDF(fichier) {
    let texte = cacheTextesPDF.get(fichier.id);// permet de savoir si on a déja lu ce fichier

    if (texte === undefined) {// si on l'a pas déja lu on extrait le texte
        try {
            const urlServeur = "../PHP/" + fichier.chemin_fichier;
            texte = await extraireTextePDF(urlServeur);
        } catch (err) {
            console.error("Erreur lors de l'analyse du PDF " + fichier.nom_fichier + " :", err);
            texte = "";
        }
        cacheTextesPDF.set(fichier.id, texte);
    }

    return determinerCategoriePDF(texte);
}

// Extrait tout le texte d'un PDF en minuscule, via pdf.js.
async function extraireTextePDF(urlServeur) {
    const pdf = await pdfjsLib.getDocument(urlServeur).promise;
    let texteComplet = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const contenu = await page.getTextContent();
        texteComplet += contenu.items.map(item => item.str).join(" ") + " ";
    }

    return texteComplet.toLowerCase();
}




// Nombre minimum de mots-clés différents à trouver pour valider une catégorie.
const SEUIL_CLASSEMENT_MOTS = 2;

function determinerCategoriePDF(texteMinuscule) {
    let meilleureCategorie = null;
    let meilleurNombreMots = 0;

    for (const categorie of CONFIG_CATEGORIES_PDF) {
        if (categorie.motsClefs.length === 0) continue;

        let motsTrouvesDansCetteCategorie = 0;

        categorie.motsClefs.forEach(mot => {
            const motMinuscule = mot.toLowerCase();

            // On vérifie d'abord si le texte contient le mot
            if (texteMinuscule.includes(motMinuscule)) {
                motsTrouvesDansCetteCategorie++;
            }
        });

        // La catégorie qui valide le plus de mots-clés différents gagne
        if (motsTrouvesDansCetteCategorie > meilleurNombreMots) {
            meilleurNombreMots = motsTrouvesDansCetteCategorie;
            meilleureCategorie = categorie;
        }
    }

    if (meilleurNombreMots >= SEUIL_CLASSEMENT_MOTS) {
        return { nom: meilleureCategorie.nom, score: meilleurNombreMots };
    }

    return { nom: CONFIG_CATEGORIES_PDF[CONFIG_CATEGORIES_PDF.length - 1].nom, score: 0 };
}

// Crée le bloc (lien + bouton "Retirer") représentant un fichier.
function creerBlocFichier(fichier) {
    const nouveauBloc = document.createElement('div');
    nouveauBloc.className = 'bloc-fichier-temporaire';

    const zoneTexte = document.createElement('div');
    const texteInfo = document.createElement('p');
    texteInfo.className = 'texte-info-fichier';

    const lienFichier = document.createElement('a');
    lienFichier.href = "#"; 
    lienFichier.textContent = fichier.nom_fichier;
    lienFichier.className = 'lien-fichier-pdf';

    lienFichier.addEventListener('click', (e) => {
        e.preventDefault(); 
        conteneurFormGauche.innerHTML = "";
        const urlServeur = "../PHP/" + fichier.chemin_fichier;

        if (fichier.nom_fichier.match(/\.(jpeg|jpg|png|gif)$/i)) {
            const img = document.createElement('img');
            img.src = urlServeur;
            img.className = 'visu-media';
            conteneurFormGauche.appendChild(img);
        } 
        else if (fichier.nom_fichier.endsWith('.pdf')) {
            const iframe = document.createElement('iframe');
            iframe.src = urlServeur;
            iframe.className = 'visu-media';
            conteneurFormGauche.appendChild(iframe);
        } 
        else if (fichier.nom_fichier.endsWith('.docx')) {
            const zoneWord = document.createElement('div');
            zoneWord.className = 'visu-media visu-media--docx';
            conteneurFormGauche.appendChild(zoneWord);

            fetch(urlServeur)
            .then(res => res.blob())
            .then(blob => {
                docx.renderAsync(blob, zoneWord).catch(err => console.error(err));
            });
        }
        else {
            const p = document.createElement('p');
            p.textContent = `Visualisation indisponible (${fichier.nom_fichier}).`;
            p.className = 'visu-indisponible';
            conteneurFormGauche.appendChild(p);
        }
    });

    const boutonSupprimer = document.createElement('button');
    boutonSupprimer.textContent = "Retirer";
    boutonSupprimer.className = 'btn-retirer';

    boutonSupprimer.addEventListener('click', () => {
        supprimerFichier(fichier.id); 
    });

    zoneTexte.appendChild(texteInfo);
    zoneTexte.appendChild(lienFichier);
    nouveauBloc.appendChild(zoneTexte);
    nouveauBloc.appendChild(boutonSupprimer);

    return nouveauBloc;
}

function supprimerFichier(idFichier) {
    if (!idFichier) {
        alert("Erreur : L'ID du fichier est vide ou indéfini ");
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
                throw new Error("HTTP " + reponse.status);
            }
            return reponse.text(); 
        })
        .then(texteBrut => {
            try {
                const data = JSON.parse(texteBrut);
                if (data.statut === "succes") {
                    alert(data.message);
                    chargerFichiersUtilisateur();
                } else {
                    alert(data.message);
                }
            } catch (errJson) {
                alert("Réponse reçue : " + texteBrut);
            }
        })
        .catch(err => {
            alert("Erreur : " + err.message);
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