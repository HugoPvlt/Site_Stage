const identifiant = document.getElementById('id_admin');
const MDP = document.getElementById('password');
const btn_ajouter = document.getElementById('btn-ajouter-admin');
const txt_vide = document.getElementById('txt_base');
const tab = document.getElementById('tab_id_MDP');


btn_ajouter.addEventListener('click', (evenement) => {
    evenement.preventDefault(); 

    const New_line = document.createElement('tr');
    const cell_ID = document.createElement('td');
    const cell_MDP = document.createElement('td');

    txt_vide.style.display = 'none';
    
    cell_ID.textContent = identifiant.value;
    cell_MDP.textContent = MDP.value; 
    
    New_line.appendChild(cell_ID);
    New_line.appendChild(cell_MDP);
    tab.appendChild(New_line);

});

