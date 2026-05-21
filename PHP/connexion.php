<?php
$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; 
$base_de_donnees = "sitestage";

try {
    $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["statut" => "erreur", "message" => "Problème MySQL : " . $e->getMessage()]);
    exit;
}

$donneesRecues = json_decode(file_get_contents("php://input"), true);

if (!empty($donneesRecues['identifiant']) && !empty($donneesRecues['mot_de_passe'])) {
    
    $identifiant = $donneesRecues['identifiant'];
    $mdp_saisi = $donneesRecues['mot_de_passe'];

    $requete = $pdo->prepare("SELECT * FROM utilisateurs WHERE identifiant = :identifiant");
    $requete->execute([':identifiant' => $identifiant]);
    $user = $requete->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if ($user['role'] === 'admin' && $user['mot_de_passe'] === $mdp_saisi) {
            echo json_encode(["statut" => "succes", "role" => "admin"]);
        } 
        elseif (password_verify($mdp_saisi, $user['mot_de_passe'])) {
            echo json_encode(["statut" => "succes", "role" => $user['role']]);
        } 
        else {
            echo json_encode(["statut" => "erreur", "message" => "Identifiant ou mot de passe incorrect."]);
        }
    } else {
        echo json_encode(["statut" => "erreur", "message" => "Identifiant ou mot de passe incorrect."]);
    }
} else {
    echo json_encode(["statut" => "erreur", "message" => "Veuillez remplir tous les champs."]);
}
?>
