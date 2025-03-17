<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$errors = [];
if (isset($_POST['submit'])) {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $message = trim($_POST['message']);

    if (empty($name)) {
        $errors[] = 'Name is required';
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email';
    }

    if (empty($message)) {
        $errors[] = 'Message is required';
    }

    if (empty($errors)) {
        $to = 'example@example.com';
        $subject = 'New message from contact form';
        $headers = [
            'From' => $email,
            'Reply-To' => $email,
            'Content-Type' => 'text/plain; charset=UTF-8'
        ];
        $body = "Name: $name\nEmail: $email\nMessage:\n$message";

        if (mail($to, $subject, $body, $headers)) {
            echo 'Message sent successfully';
        } else {
            echo 'Error sending message. Please check server settings.';
        }
    } else {
        foreach ($errors as $error) {
            echo "$error<br>";
        }
    }
}


