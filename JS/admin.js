const identifiant = document.getElementById('id_admin');
const MDP = document.getElementById('password');
const btn_ajouter = document.getElementById('btn-ajouter-admin');
const txt_vide = document.getElementById('txt_base');
const tab = document.getElementById('tab_id_MDP');

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

        const lignesExistantes = tab.querySelectorAll('tr');//Nettoie le tableau avant d'ajouter les lignes
        Array.from(lignesExistantes).forEach((ligne, index) => {
            if (index > 0) ligne.remove();
        });

        if (clients.length === 0) {
            if (txt_vide) txt_vide.style.display = 'block';
            return;
        }

        if (txt_vide) txt_vide.style.display = 'none';

        clients.forEach(client => {//Boucle pour insérer chaque client dans le tableau HTML 
            const ligne = document.createElement('tr');

            const celluleIdentifiant = document.createElement('td');
            celluleIdentifiant.textContent = client.identifiant;

            const celluleMdp = document.createElement('td');
            celluleMdp.textContent = "********";//Masque le mot de passe pour la sécurité

            ligne.appendChild(celluleIdentifiant);
            ligne.appendChild(celluleMdp);

            tab.appendChild(ligne);
        });
    })
    .catch(err => console.error("Erreur de récupération des clients :", err));
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
            if (txt_vide) txt_vide.style.display = 'none';

            const New_line = document.createElement('tr');
            const cell_ID = document.createElement('td');
            const cell_MDP = document.createElement('td');
            
            cell_ID.textContent = identifiant.value;
            cell_MDP.textContent = "********"; 
            
            New_line.appendChild(cell_ID);
            New_line.appendChild(cell_MDP);
            tab.appendChild(New_line);

            identifiant.value = "";//#Vide les champs de saisie après l'ajout
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