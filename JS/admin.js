const identifiant = document.getElementById('id_admin');
const MDP = document.getElementById('password');
const btn_ajouter = document.getElementById('btn-ajouter-admin');
const txt_vide = document.getElementById('txt_base');
const tab = document.getElementById('tab_id_MDP');

btn_ajouter.addEventListener('click', (evenement) => {
    evenement.preventDefault(); 

    if (identifiant.value.trim() === "" || MDP.value.trim() === "") {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const donnees = {
        identifiant: identifiant.value,
        mot_de_passe: MDP.value
    };

    fetch('../PHP/ajouter.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(donnees)
    })
    .then(reponse => reponse.json())
    .then(data => {
        if (data.statut === "succes") {
            const New_line = document.createElement('tr');
            const cell_ID = document.createElement('td');
            const cell_MDP = document.createElement('td');

            txt_vide.style.display = 'none';
            
            cell_ID.textContent = identifiant.value;
            cell_MDP.textContent = MDP.value; 
            
            New_line.appendChild(cell_ID);
            New_line.appendChild(cell_MDP);
            tab.appendChild(New_line);

            identifiant.value = "";
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