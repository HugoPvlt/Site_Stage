<?php
session_start();
if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode([]);
    exit;
}

$id_user = $_SESSION['id_utilisateur'];

$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; 
$base_de_donnees = "sitestage";

try {
    $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);#création de l'objet PDO pour se connecter à la base de données de façon sécurisée
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $req = $pdo->prepare("SELECT id, nom_fichier, chemin_fichier FROM fichiers WHERE id_utilisateur = ? ORDER BY id DESC");#requête préparée avec marqueur pour récupérer tous les fichiers de l'utilisateur connecté
    $req->execute([$id_user]);
    $fichiers = $req->fetchAll(PDO::FETCH_ASSOC);#créé un tableau associatif
    
    echo json_encode($fichiers);#transforme les donnée en quelque chose de compréensible par JS
} catch (PDOException $e) {
    echo json_encode([]);
}
?>