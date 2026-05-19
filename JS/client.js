const bouton = document.getElementById('btn-choisir');
const selecteurFichier = document.getElementById('explorateur-fichier');

bouton.addEventListener('click', () => {
    selecteurFichier.click();
});

selecteurFichier.addEventListener('change', (evenement) => {
    const fichierSelectionne = evenement.target.files[0];
    
    if (fichierSelectionne) {
        alert("Fichier sélectionné : " + fichierSelectionne.name);
    }
});