const nodemailer = require('nodemailer');

const sendEmail = async(email, otp) => {
    try{
        const transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Digivault Verification code',
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DigiVault Verification</title>
            <style>
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; }
                @media screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .content-padding { padding: 20px !important; }
                    .mobile-title { font-size: 24px !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
                <tr>
                    <td align="center" style="padding: 40px 10px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #1e293b; border-bottom: 1px solid #334155;">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background-color: #4F46E5; width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; display: inline-block;"></td>
                                            <td style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 1px;">DigiVault</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td class="content-padding" style="padding: 40px 50px; text-align: center;">
                                    <div style="margin-bottom: 25px;">
                                        <span style="display: inline-block; background-color: rgba(79, 70, 229, 0.1); padding: 12px; border-radius: 50%;">
                                            <img src="https://img.icons8.com/ios-filled/50/4f46e5/lock-landscape.png" alt="security" width="32" height="32" style="display: block; border: 0;" />
                                        </span>
                                    </div>
                                    <h1 class="mobile-title" style="color: #f8fafc; font-size: 28px; font-weight: 600; margin: 0 0 10px 0;">verification Code</h1>
                                    <p style="color: #94a3b8; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                        A login attempt was detected. Use the One-Time Password below to complete your verification.
                                    </p>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                        <tr>
                                            <td align="center">
                                                <div style="background-color: #0f172a; border: 1px dashed #4F46E5; border-radius: 12px; padding: 20px 40px; display: inline-block;">
                                                    <span style="font-family: 'Courier New', Courier, monospace; color: #4F46E5; font-size: 36px; font-weight: 700; letter-spacing: 8px; display: block;">${otp}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center">
                                                <p style="color: #64748b; font-size: 14px; margin: 0;">
                                                    <span style="display: inline-block; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; margin-right: 5px;"></span>
                                                    This code expires in <strong style="color: #cbd5e1;">1 minute</strong>.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
                                    <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 5px 0;">&copy; 2026 DigiVault Security Systems</p>
                                    <p style="color: #cbd5e1; font-size: 12px; margin: 0;">If you didn't request this, please ignore this email.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
            `,
        };

        await transporter.sendMail(mail);
        console.log(`email send sucessfully to: ${email}`)
    
    } catch (err) {
        console.log('email send failed');
        throw new Error('email could not be sent')
    }
};

module.exports = sendEmail;
