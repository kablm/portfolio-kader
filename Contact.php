<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    $mail = new PHPMailer(true);

    try {
        // Paramètres du serveur
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'kaderbelem428@gmail.com'; // Remplacez par votre adresse Gmail
        $mail->Password   = 'xvwhrrpygjmdlhnw'; // Remplacez par votre mot de passe Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Destinataires
        $mail->setFrom('kaderbelem428@gmail.com', 'Kader Belem');
        $mail->addAddress('belemkader530@gmail.com'); // Remplacez par l'adresse destinataire

        // Contenu
        $mail->isHTML(true);
        $mail->Subject = 'Nouveau message de votre portfolio';
        $mail->Body    = "Nom: $name<br>Email: $email<br>Message:<br>$message";

        $mail->send();
        echo 'Message envoyé avec succès!';
    } catch (Exception $e) {
        echo "Une erreur est survenue. Veuillez réessayer. Erreur: {$mail->ErrorInfo}";
    }
}
?>
