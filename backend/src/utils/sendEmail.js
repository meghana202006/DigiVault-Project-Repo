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
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Welcome to DigiVault!</h2>
                  <p>Your verification code is:</p>
                  <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
                  <p>This code expires in 1 minutes.</p>
                </div>
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
