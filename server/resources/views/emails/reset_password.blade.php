<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Code de réinitialisation de mot de passe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .code-box {
            background-color: #f8f9fa;
            border: 2px solid #3498db;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin-top: 30px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Code de réinitialisation</h1>
        </div>

        <div class="content">
            <p>Bonjour,</p>

            <p>Vous recevez cet email car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte associé à <strong>{{ $email }}</strong>.</p>

            <p>Voici votre code de réinitialisation :</p>

            <div class="code-box">
                <div class="code">{{ $resetCode }}</div>
            </div>

            <p>Saisissez ce code dans l'application pour réinitialiser votre mot de passe.</p>

            <div class="warning">
                <strong>Important :</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Ce code expire dans 15 minutes</li>
                    <li>Ne partagez jamais ce code avec personne</li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Cordialement,<br>L'équipe de votre application</p>
        </div>
    </div>
</body>
</html>
