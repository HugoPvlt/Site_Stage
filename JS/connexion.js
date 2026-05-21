const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', function () {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    this.textContent = isPassword ? 'Masquer' : 'Voir';
});

const formulaire = document.querySelector('form'); 
const inputIdentifiant = document.querySelector('#identifiant'); 

formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault(); 

    const donnees = {
        identifiant: inputIdentifiant.value,
        mot_de_passe: passwordInput.value
    };

    fetch('../PHP/connexion.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(donnees)
    })
    .then(reponse => reponse.json())
    .then(data => {
        if (data.statut === "succes") {
            if (data.role === "admin") {
                alert("Bonjour Admin !");
                window.location.href = "admin.html";
            } else {
                alert("Connexion réussie !");
                window.location.href = "client.html";
            }
        } else {
            alert(data.message);
        }
    })
    .catch(erreur => {
        console.error("Erreur technique :", erreur);
        alert("Impossible de joindre le serveur de connexion.");
    });
});