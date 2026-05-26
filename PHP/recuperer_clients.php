<?php
session_start();

if (!isset($_SESSION['id_utilisateur'])) {#Vérification de sécurité
    echo json_encode(["statut" => "erreur", "message" => "Non connecté."]);
    exit;
}

$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; 
$base_de_donnees = "sitestage";

try {
    $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);#création de l'objet PDO pour se connecter à la base de données de façon sécurisée
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $req = $pdo->prepare("SELECT ID, identifiant, role FROM utilisateurs WHERE role = 'client' ORDER BY ID DESC");#requête pour récupérer tout les clients
    $req->execute();
    $clients = $req->fetchAll(PDO::FETCH_ASSOC);#créé un tableau associatif
    
    echo json_encode($clients);#transforme les donnée en quelque chose de compréensible par JS
} catch (PDOException $e) {
    echo json_encode(["statut" => "erreur", "message" => "Erreur BDD"]);
}
?>