<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
        }
        .verification-code {
            background-color: #f8f9fa;
            border: 2px solid #007bff;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 25px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #007bff;
            font-family: 'Courier New', monospace;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>

        <div class="content">
            <p>Thank you for registering! Please use the following code to verify your email address:</p>

            <div class="verification-code">
                {{ $code }}
            </div>

            <div class="warning">
                <strong>Important:</strong> This code will expire in 24 hours. If you need a new code, you can request one through the verification page.
            </div>

            <p>If you didn't create an account, please ignore this email.</p>
        </div>

        <div class="footer">
            <p><strong>Thank you,</strong><br>{{ config('app.name', 'Your Application') }}</p>
        </div>
    </div>
</body>
</html>
