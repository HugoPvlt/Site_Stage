const identifiant = document.getElementById('id_admin');
const MDP = document.getElementById('password');
const btn_ajouter = document.getElementById('btn-ajouter-admin');
const txt_vide = document.getElementById('txt_base');
const tab = document.getElementById('tab_id_MDP');
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');
const barreRecherche = document.getElementById('barre-recherche');

let tousLesClients = []; 

togglePassword.addEventListener('click', function () {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    this.textContent = isPassword ? 'Masquer' : 'Voir';
});

document.addEventListener('DOMContentLoaded', () => {//Lance le chargement des clients dès que la page est prête
    chargerListeClients();
});

function chargerListeClients() {
    if (!tab) return;

    fetch('../PHP/recuperer_clients.php') //Appelle le script PHP pour récupérer les clients
    .then(reponse => reponse.json())
    .then(clients => {
        if (clients.statut === "erreur") {
            console.error(clients.message);
            return;
        }

        tousLesClients = clients; 
        afficherClients(tousLesClients); 
    })
    .catch(err => console.error("Erreur de récupération des clients :", err));
}

function afficherClients(listeAAfficher) {
    const lignesExistantes = tab.querySelectorAll('tr');//Nettoie le tableau avant d'ajouter les lignes
    Array.from(lignesExistantes).forEach((ligne, index) => {
        if (index > 0) ligne.remove();
    });

    if (listeAAfficher.length === 0) {
        if (txt_vide) txt_vide.style.display = 'block';
        return;
    }

    if (txt_vide) txt_vide.style.display = 'none';

    listeAAfficher.forEach(client => {//Boucle pour insérer chaque client dans le tableau HTML 
        const ligne = document.createElement('tr');

        const celluleIdentifiant = document.createElement('td');
        celluleIdentifiant.textContent = client.identifiant;

        const celluleMdp = document.createElement('td');
        celluleMdp.textContent = "********";//Masque le mot de passe pour la sécurité

        const celluleAction = document.createElement('td');
        const boutonSupprimer = document.createElement('button');
        boutonSupprimer.textContent = "Supprimer";
        boutonSupprimer.style.backgroundColor = '#DC3545';
        boutonSupprimer.style.color = '#FFF';
        boutonSupprimer.style.border = 'none';
        boutonSupprimer.style.padding = '5px 10px';
        boutonSupprimer.style.borderRadius = '4px';
        boutonSupprimer.style.cursor = 'pointer';

        boutonSupprimer.addEventListener('click', () => {
            const idBrut = client.id || client.id_utilisateur || client.ID;
            supprimerUtilisateur(idBrut);
        });

        celluleAction.appendChild(boutonSupprimer);

        ligne.appendChild(celluleIdentifiant);
        ligne.appendChild(celluleMdp);
        ligne.appendChild(celluleAction);

        tab.appendChild(ligne);
    });
}

if (barreRecherche) {
    barreRecherche.addEventListener('input', (evenement) => {
        const texteSaisi = evenement.target.value.toLowerCase().trim();

        const clientsFiltres = tousLesClients.filter(client => {
            return client.identifiant.toLowerCase().includes(texteSaisi);
        });

        afficherClients(clientsFiltres);
    });
}

btn_ajouter.addEventListener('click', (evenement) => {
    evenement.preventDefault(); 

    if (identifiant.value.trim() === "" || MDP.value.trim() === "") {//Vérifie que les deux champs sont remplis
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const donnees = {
        identifiant: identifiant.value,
        mot_de_passe: MDP.value
    };

    fetch('../PHP/ajouter.php', {//Envoie les données au script PHP d'ajout
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(donnees)
    })
    .then(reponse => reponse.json())
    .then(data => {
        if (data.statut === "succes") {//Si l'ajout en BDD fonctionne, on l'ajoute directement dans le tableau HTML
            chargerListeClients();

            if (barreRecherche) barreRecherche.value = ""; 

            identifiant.value = "";//Vide les champs de saisie après l'ajout
            MDP.value = "";
        } else {
            alert(data.message);
        }
    })
    .catch(erreur => {
        console.error("Erreur technique :", erreur);
        alert("Erreur lors de l'enregistrement en base de données.");
    });
});

function supprimerUtilisateur(idUtilisateur) {
    if (!idUtilisateur) {
        alert("Erreur : ID de l'utilisateur introuvable.");
        return;
    }

    if (confirm("Es-tu sûr de vouloir supprimer définitivement cet utilisateur ? Cette action supprimera également tous ses fichiers liés.")) {
        fetch('../PHP/supprimer_utilisateur.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: idUtilisateur })
        })
        .then(reponse => {
            if (!reponse.ok) {
                throw new Error("Erreur HTTP " + reponse.status);
            }
            return reponse.json();
        })
        .then(data => {
            if (data.statut === "succes") {
                alert(data.message);
                chargerListeClients();
            } else {
                alert("Erreur : " + data.message);
            }
        })
        .catch(err => {
            alert("Erreur lors de la communication avec le serveur.");
            console.error(err);
        });
    }
}