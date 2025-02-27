const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.HOST,
            port: 465,
            secure: true, // use false for STARTTLS; true for SSL on port 465
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            text: text,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error, Email not sent" });
      }
};

module.exports = sendEmail;