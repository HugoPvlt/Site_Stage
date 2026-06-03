<?php
session_start();

error_reporting(E_ALL);
ini_set('display_errors', 0); 

header('Content-Type: application/json; charset=utf-8');


if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["statut" => "erreur", "message" => "Session expirée ou non autorisée."]);
    exit;
}

$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; 
$base_de_donnees = "sitestage";

try {
    $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["statut" => "erreur", "message" => "Problème de connexion MySQL : " . $e->getMessage()]);
    exit;
}

$donneesRecues = json_decode(file_get_contents("php://input"), true);

if (!empty($donneesRecues['id'])) {
    $id_cible = $donneesRecues['id'];

    
    if ($id_cible == $_SESSION['id_utilisateur']) {
        echo json_encode(["statut" => "erreur", "message" => "Vous ne pouvez pas supprimer votre propre compte admin."]);
        exit;
    }

    try {
        
        $delete = $pdo->prepare("DELETE FROM utilisateurs WHERE id = :id");
        $delete->execute([':id' => $id_cible]);

        if ($delete->rowCount() > 0) {
            echo json_encode(["statut" => "succes", "message" => "Utilisateur supprimé avec succès."]);
        } else {
            echo json_encode(["statut" => "erreur", "message" => "Aucun utilisateur trouvé avec cet ID."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["statut" => "erreur", "message" => "Erreur SQL (Vérifiez les clés étrangères si l'utilisateur possède des fichiers) : " . $e->getMessage()]);
    }
} else {
    echo json_encode(["statut" => "erreur", "message" => "ID de l'utilisateur manquant."]);
}
?>