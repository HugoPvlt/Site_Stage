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
    $id_fichier = $donneesRecues['id'];

    try {
        $requete = $pdo->prepare("SELECT chemin_fichier FROM fichiers WHERE id = :id");
        $requete->execute([':id' => $id_fichier]);
        $fichier = $requete->fetch(PDO::FETCH_ASSOC);

        if ($fichier) {
            $chemin_physique = __DIR__ . '/' . $fichier['chemin_fichier']; 

            $fichier_supprime_disque = false;
            if (file_exists($chemin_physique)) {
                if (unlink($chemin_physique)) {
                    $fichier_supprime_disque = true;
                }
            }

            $delete = $pdo->prepare("DELETE FROM fichiers WHERE id = :id");
            $delete->execute([':id' => $id_fichier]);

            if ($delete->rowCount() > 0) {
                if ($fichier_supprime_disque) {
                    echo json_encode(["statut" => "succes", "message" => "Fichier supprimé de la base et du dossier informatique."]);
                } else {
                    echo json_encode(["statut" => "succes", "message" => "Retiré de la base, mais le fichier n'a pas pu être effacé du dossier uploads."]);
                }
            } else {
                echo json_encode(["statut" => "erreur", "message" => "L'ID existe mais la suppression SQL n'a pas fonctionné."]);
            }
        } else {
            echo json_encode(["statut" => "erreur", "message" => "Aucun fichier trouvé en base avec l'ID : " . $id_fichier]);
        }
    } catch (PDOException $e) {
        echo json_encode(["statut" => "erreur", "message" => "Erreur SQL : " . $e->getMessage()]);
    }
} else {
    echo json_encode(["statut" => "erreur", "message" => "L'ID envoyé au serveur est vide ou corrompu."]);
}
?>