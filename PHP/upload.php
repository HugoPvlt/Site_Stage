<?php
session_start();
if (!isset($_SESSION['id_utilisateur'])) {#Vérification de sécurité
    echo json_encode(["statut" => "erreur", "message" => "Non connecté."]);
    exit;
}

$id_user = $_SESSION['id_utilisateur'];
$dossier_destination = "uploads/";

if (!is_dir($dossier_destination)) {#Vérifie si le dossier existe, sinon le crée automatiquement
    mkdir($dossier_destination, 0777, true);
}

if (isset($_FILES['fichiers'])) {#Vérifie si des fichiers ont bien été reçus
    $serveur = "localhost";
    $utilisateur = "root";
    $mot_de_passe = ""; 
    $base_de_donnees = "sitestage";

    try {
        $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);#création de l'objet PDO pour se connecter à la base de données de façon sécurisée
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        echo json_encode(["statut" => "erreur", "message" => "Erreur BDD"]);
        exit;
    }

    $fichiers = $_FILES['fichiers'];
    $total = count($fichiers['name']);

    for ($i = 0; $i < $total; $i++) {#Boucle pour traiter chaque fichier un par un
        $nom_origine = basename($fichiers['name'][$i]);
        $nom_unique = time() . "_" . $nom_origine; #Génère un nom unique pour ne pas écraser les anciens fichiers
        $chemin_complet = $dossier_destination . $nom_unique;

        if (move_uploaded_file($fichiers['tmp_name'][$i], $chemin_complet)) {#Déplace le fichier temporaire vers le vrai dossier uploads
            $req = $pdo->prepare("INSERT INTO fichiers (id_utilisateur, nom_fichier, chemin_fichier) VALUES (?, ?, ?)");#requête préparée pour enregistrer les informations du fichier en BDD
            $req->execute([$id_user, $nom_origine, $chemin_complet]);
        }
    }
    echo json_encode(["statut" => "succes"]);
} else {
    echo json_encode(["statut" => "erreur", "message" => "Aucun fichier reçu."]);
}
?>