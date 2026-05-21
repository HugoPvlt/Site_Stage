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
    $mdp_hache = password_hash($donneesRecues['mot_de_passe'], PASSWORD_BCRYPT);
    $role = "client";

    $requete = $pdo->prepare("INSERT INTO utilisateurs (identifiant, mot_de_passe, role) VALUES (:identifiant, :mot_de_passe, :role)");
    
    $requete->execute([
        ':identifiant' => $identifiant,
        ':mot_de_passe' => $mdp_hache,
        ':role' => $role
    ]);

    echo json_encode(["statut" => "succes", "message" => "Client ajouté avec succès !"]);
} else {
    echo json_encode(["statut" => "erreur", "message" => "Données incomplètes."]);
}
?>