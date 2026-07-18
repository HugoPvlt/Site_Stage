const bouton = document.getElementById('btn-choisir');
const selecteurFichier = document.getElementById('explorateur-fichier');
const conteneurFormDroite = document.querySelector('.form_arborescence'); 
const conteneurFormGauche = document.querySelector('.form_fichier'); 
const barreRecherche = document.getElementById('barre-recherche');
const toggleRenommageAuto = document.getElementById('toggle-renommage-auto');



// Catégories utilisées pour ranger les PDF en fonction des mots présents dans leur contenu
const CONFIG_CATEGORIES_PDF = [
  {
        nom: " Factures",
        motsClefs: [
           "facture",
            "numéro de facture",
            "référence facture",
            "montant total",
            "montant ttc",
            "montant ht",
            "tva",
            "conditions de paiement",
            "date d'échéance",
            "total à payer",
            "ht",
            "ttc"
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
            "prix unitaire",
            "quantité",
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
let nomsAffichesActuels = new Map();


const cacheTextesPDF = new Map();// Permet d'éviter de re-analyser un PDF déjà traité 
const cacheDatesCreation = new Map();// Permet d'éviter de re-lire les métadonnées d'un fichier déjà traité

bouton.addEventListener('click', () => {
    selecteurFichier.click();
});
if (toggleRenommageAuto) {
    toggleRenommageAuto.addEventListener('change', () => {
        // Si une recherche est en cours, on la relance pour ne pas l'écraser
        if (barreRecherche && barreRecherche.value.trim() !== "") {
            barreRecherche.dispatchEvent(new Event('input'));
        } else {
            afficherFichiers(tousLesFichiers); // réaffiche avec ou sans renommage selon l'état du toggle
        }
    });
}

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

    const messageChargement = document.createElement('p');
    messageChargement.textContent = "Analyse du contenu des fichiers en cours...";
    messageChargement.className = 'message-chargement-pdf';
    conteneurFormDroite.appendChild(messageChargement);

    // On catégorise TOUS les fichiers (peu importe leur type) directement par contenu.
    const groupes = new Map();

    for (const fichier of listeAAfficher) {
        const { nom, score, dateCreation } = await categoriserFichier(fichier);
        if (!groupes.has(nom)) {
            groupes.set(nom, []);
        }
        groupes.get(nom).push({ fichier, score, dateCreation });
    }

    messageChargement.remove();

    CONFIG_CATEGORIES_PDF.forEach(categorie => {// création des blocs html, un par catégorie
        const entrees = groupes.get(categorie.nom);
        if (!entrees || entrees.length === 0) return;

        entrees.sort((a, b) => b.score - a.score); // les fichiers les plus pertinents en premier

        const conteneurDossier = document.createElement('div');
        conteneurDossier.className = 'dossier-statique-wrapper';
        
        const enteteDossier = document.createElement('div');
        enteteDossier.className = 'dossier-header';
        
        const listeFichiersDossier = document.createElement('div');
        listeFichiersDossier.className = 'dossier-content-fichiers';
        
        enteteDossier.innerHTML = `<span>${categorie.nom} </span> <span class="badge-compteur">${entrees.length}</span>`;

        enteteDossier.addEventListener('click', () => {
            const enCoursDaffichage = listeFichiersDossier.classList.contains('visible');
            if (enCoursDaffichage) {
                listeFichiersDossier.classList.remove('visible');
                enteteDossier.classList.remove('dossier-header-border');
            } else {
                listeFichiersDossier.classList.add('visible');
                enteteDossier.classList.add('dossier-header-border');
            }
        });

            entrees.forEach(({ fichier, score, dateCreation }) => {
            const renommageActif = !toggleRenommageAuto || toggleRenommageAuto.checked;

            // On ne renomme pas si le renommage auto est désactivé, ni les fichiers non classés
            const nomAffichage = (renommageActif && categorie.nom !== " PDF non classés")
                ? genererNomAffichage(fichier, categorie.nom, dateCreation)
                : null;

            // On mémorise le nom réellement affiché pour que la recherche puisse le retrouver
            nomsAffichesActuels.set(fichier.id, nomAffichage || fichier.nom_fichier);

            const bloc = creerBlocFichier(fichier, nomAffichage, score);
            listeFichiersDossier.appendChild(bloc);
        });

            conteneurDossier.appendChild(enteteDossier);
            conteneurDossier.appendChild(listeFichiersDossier);
            conteneurFormDroite.appendChild(conteneurDossier);
        });
}


async function extraireTexteDocx(urlServeur) {
    const res = await fetch(urlServeur);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.toLowerCase();
}
async function extraireTexteXlsx(urlServeur) {
    const res = await fetch(urlServeur);
    const arrayBuffer = await res.arrayBuffer();
    const classeur = XLSX.read(arrayBuffer, { type: 'array' });

    let texteComplet = "";
    classeur.SheetNames.forEach(nomFeuille => {
        const feuille = classeur.Sheets[nomFeuille];
        const texteFeuille = XLSX.utils.sheet_to_csv(feuille); // convertit toutes les cellules en texte
        texteComplet += texteFeuille + " ";
    });

    return texteComplet.toLowerCase();
}

async function extraireTexteCsv(urlServeur) {
    const res = await fetch(urlServeur);
    const texte = await res.text();
    return texte.toLowerCase();
}

async function extraireTextePptx(urlServeur) {
    const res = await fetch(urlServeur);
    const blob = await res.blob();
    const zip = await JSZip.loadAsync(blob);

    let texteComplet = "";
    const fichiersSlides = Object.keys(zip.files).filter(nom =>
        nom.match(/^ppt\/slides\/slide\d+\.xml$/)
    );

    for (const nomFichier of fichiersSlides) {
        const xml = await zip.file(nomFichier).async("string");
        const morceauxTexte = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]);
        texteComplet += morceauxTexte.join(" ") + " ";
    }

    return texteComplet.toLowerCase();
}
// Retourne { nom, score, dateCreation } où score est le nombre de mots-clés
async function categoriserFichier(fichier) {
    let texte = cacheTextesPDF.get(fichier.id);
    let dateCreation = cacheDatesCreation.get(fichier.id);

    if (texte === undefined) {
        try {
            const urlServeur = "../PHP/" + fichier.chemin_fichier;
            const nomMinuscule = fichier.nom_fichier.toLowerCase();

            if (nomMinuscule.endsWith('.pdf')) {
                texte = await extraireTextePDF(urlServeur);
                dateCreation = await extraireDateCreationPDF(urlServeur);
            } else if (nomMinuscule.endsWith('.docx')) {
                texte = await extraireTexteDocx(urlServeur);
                dateCreation = await extraireDateCreation(urlServeur);
            } else if (nomMinuscule.endsWith('.xlsx')) {
                texte = await extraireTexteXlsx(urlServeur);
                dateCreation = await extraireDateCreation(urlServeur);
            } else if (nomMinuscule.endsWith('.pptx')) {
                texte = await extraireTextePptx(urlServeur);
                dateCreation = await extraireDateCreation(urlServeur);
            } else if (nomMinuscule.endsWith('.csv')) {
                texte = await extraireTexteCsv(urlServeur);
                dateCreation = null;
            } else {
                
                texte = "";
            }
        } catch (err) {
            console.error("Erreur lors de l'analyse de " + fichier.nom_fichier + " :", err);
            texte = "";
        }
        cacheTextesPDF.set(fichier.id, texte);
        cacheDatesCreation.set(fichier.id, dateCreation || null);
    }

    const { nom, score } = determinerCategoriePDF(texte);
    return { nom, score, dateCreation };
}

// Extrait la date de création depuis les métadonnées internes du PDF (si disponible).
async function extraireDateCreationPDF(urlServeur) {
    try {
        const pdf = await pdfjsLib.getDocument(urlServeur).promise;
        const { info } = await pdf.getMetadata();
        if (info && info.CreationDate) {
            return FormatDatePDF(info.CreationDate);
        }
    } catch (err) {
        console.error("Erreur lecture métadonnées PDF :", err);
    }
    return null;
}

// Les PDF stockent la date au format "D:20260707143210+02'00'"
function FormatDatePDF(dateBrute) {
    const match = dateBrute.match(/D:(\d{4})(\d{2})(\d{2})/);
    if (!match) return null;
    const [, annee, mois, jour] = match;
    const dateObj = new Date(`${annee}-${mois}-${jour}`);
    return isNaN(dateObj.getTime()) ? null : dateObj;
}


// Extrait la date de création depuis les métadonnées internes 
async function extraireDateCreation(urlServeur) {
    try {
        const res = await fetch(urlServeur);
        const blob = await res.blob();
        const zip = await JSZip.loadAsync(blob);
        const coreXml = await zip.file("docProps/core.xml").async("string");
        const match = coreXml.match(/<dcterms:created[^>]*>([^<]+)<\/dcterms:created>/);
        if (match) {
            const dateObj = new Date(match[1]);
            return isNaN(dateObj.getTime()) ? null : dateObj;
        }
    } catch (err) {
        console.error("Erreur lecture métadonnées DOCX :", err);
    }
    return null;
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
// Transforme " Factures" -> "factures", " PDF non classés" -> "pdf_non_classes", etc.
function slugifierNomCategorie(nom) {
    return nom
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function formaterDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return null;
    const jj = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const aaaa = dateObj.getFullYear();
    return `${aaaa}-${mm}-${jj}`;
}

// Construit le nom affiché, ex "factures_2026-07-07.pdf"
function genererNomAffichage(fichier, nomCategorie, dateCreation) {
    const slug = slugifierNomCategorie(nomCategorie);
    const date = formaterDate(dateCreation);
    const extension = fichier.nom_fichier.slice(fichier.nom_fichier.lastIndexOf('.'));
    const suffixeDate = date ? `_${date}` : ""; // le "_" n'est ajouté que si une date existe
    return `${slug}${suffixeDate}${extension}`;
}

// Crée le bloc (lien + bouton "Retirer") représentant un fichier.
function creerBlocFichier(fichier, nomAffichage, score) {
    const nouveauBloc = document.createElement('div');
    nouveauBloc.className = 'bloc-fichier-temporaire';

    const zoneTexte = document.createElement('div');
    const texteInfo = document.createElement('p');
    texteInfo.className = 'texte-info-fichier';

    const lienFichier = document.createElement('a');
    lienFichier.href = "#"; 
    lienFichier.textContent = nomAffichage || fichier.nom_fichier;
    lienFichier.className = 'lien-fichier-pdf';

    lienFichier.addEventListener('click', (e) => {
        e.preventDefault(); 
        conteneurFormGauche.innerHTML = "";
        const urlServeur = "../PHP/" + fichier.chemin_fichier;
        const nomMinuscule = fichier.nom_fichier.toLowerCase();

        if (nomMinuscule.match(/\.(jpeg|jpg|png|gif)$/)) {
            const img = document.createElement('img');
            img.src = urlServeur;
            img.className = 'visu-media';
            conteneurFormGauche.appendChild(img);
        } 
        else if (nomMinuscule.endsWith('.pdf')) {
            const iframe = document.createElement('iframe');
            iframe.src = urlServeur;
            iframe.className = 'visu-media';
            conteneurFormGauche.appendChild(iframe);
        } 
        else if (nomMinuscule.endsWith('.docx')) {
            const zoneWord = document.createElement('div');
            zoneWord.className = 'visu-media visu-media--docx';
            conteneurFormGauche.appendChild(zoneWord);

            fetch(urlServeur)
            .then(res => res.blob())
            .then(blob => {
                docx.renderAsync(blob, zoneWord).catch(err => console.error(err));
            });
        }
        else if (nomMinuscule.endsWith('.xlsx') || nomMinuscule.endsWith('.xls')) {
            const zoneTableau = document.createElement('div');
            zoneTableau.className = 'visu-media visu-media--tableau';
            conteneurFormGauche.appendChild(zoneTableau);

            fetch(urlServeur)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => {
                const classeur = XLSX.read(arrayBuffer, { type: 'array' });
                const premiereFeuille = classeur.Sheets[classeur.SheetNames[0]];
                zoneTableau.innerHTML = XLSX.utils.sheet_to_html(premiereFeuille);
            })
            .catch(err => {
                console.error(err);
                zoneTableau.textContent = "Impossible d'afficher ce fichier.";
            });
        }
        else if (nomMinuscule.endsWith('.csv')) {
            const zoneTableau = document.createElement('div');
            zoneTableau.className = 'visu-media visu-media--tableau';
            conteneurFormGauche.appendChild(zoneTableau);

            fetch(urlServeur)
            .then(res => res.text())
            .then(texteCsv => {
                const classeur = XLSX.read(texteCsv, { type: 'string' });
                const feuille = classeur.Sheets[classeur.SheetNames[0]];
                zoneTableau.innerHTML = XLSX.utils.sheet_to_html(feuille);
            })
            .catch(err => {
                console.error(err);
                zoneTableau.textContent = "Impossible d'afficher ce fichier.";
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
            const nomOrigine = fichier.nom_fichier.toLowerCase();
            const nomAffiche = (nomsAffichesActuels.get(fichier.id) || "").toLowerCase();

            return nomOrigine.includes(texteSaisi) || nomAffiche.includes(texteSaisi);
        });

        afficherFichiers(fichiersFiltres);
    });
}

document.addEventListener('DOMContentLoaded', chargerFichiersUtilisateur);  