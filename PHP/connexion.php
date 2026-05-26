<?php
session_start();
$serveur = "localhost";
$utilisateur = "root";
$mot_de_passe = ""; 
$base_de_donnees = "sitestage";

try { #création de l'objet PDO pour se connecter à la base de données de façon sécurisée
    $pdo = new PDO("mysql:host=$serveur;port=3308;dbname=$base_de_donnees;charset=utf8", $utilisateur, $mot_de_passe);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["statut" => "erreur", "message" => "Problème MySQL : " . $e->getMessage()]);
    exit;
}

$donneesRecues = json_decode(file_get_contents("php://input"), true);#rend les données reçu interprétable et utilisable par php

if (!empty($donneesRecues['identifiant']) && !empty($donneesRecues['mot_de_passe'])) {
    
    $identifiant = $donneesRecues['identifiant'];
    $mdp_saisi = $donneesRecues['mot_de_passe'];

    $requete = $pdo->prepare("SELECT * FROM utilisateurs WHERE identifiant = :identifiant");#Requête préparée pour sélectionner l'utilisateur ayant l'identifiant textuel donné
    $requete->execute([':identifiant' => $identifiant]);
    $user = $requete->fetch(PDO::FETCH_ASSOC);

    if ($user) {#vérifie si l'utilisateur est un admin ou un client et si le mot de passe est correct
        if ($user['role'] === 'admin' && $user['mot_de_passe'] === $mdp_saisi) {
            $_SESSION['id_utilisateur'] = $user['ID'];
            echo json_encode(["statut" => "succes", "role" => "admin"]);
        } 
        elseif (password_verify($mdp_saisi, $user['mot_de_passe'])) {
            $_SESSION['id_utilisateur'] = $user['ID'];
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