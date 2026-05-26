const bouton = document.getElementById('btn-choisir');
const selecteurFichier = document.getElementById('explorateur-fichier');
const conteneurFormDroite = document.querySelector('.form_arborescence'); 
const conteneurFormGauche = document.querySelector('.form_fichier'); 

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
        conteneurFormDroite.innerHTML = "";
        
        if (fichiers.length === 0) {
            const p = document.createElement('p');
            p.textContent = "Aucun fichier ajouter pour le moment";
            conteneurFormDroite.appendChild(p);
            return;
        }

        fichiers.forEach(fichier => {//Boucle pour créer un lien cliquable pour chaque fichier trouvé
            const nouveauBloc = document.createElement('div');
            nouveauBloc.className = 'bloc-fichier-temporaire';
            nouveauBloc.style.marginTop = '10px';

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

            nouveauBloc.appendChild(texteInfo);
            nouveauBloc.appendChild(lienFichier);
            conteneurFormDroite.appendChild(nouveauBloc);
        });
    });
}

document.addEventListener('DOMContentLoaded', chargerFichiersUtilisateur);