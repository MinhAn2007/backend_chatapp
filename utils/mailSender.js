const nodemailer = require('nodemailer')

const mailSender = async (email, title, body) => {
    try {
        //to send email ->  firstly create a Transporter
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,  //-> Host SMTP detail
            secure: false,
            auth: {
                user: process.env.MAIL_USER,  //-> User's mail for authentication
                pass: process.env.MAIL_PASS,  //-> User's password for authentication
            },
        }) 
        //now Send e-mails to users
        let info = await transporter.sendMail({
            from: 'minhan',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })

        console.log("Info is here: ", info)
        return info

    } catch (error) {
        if (error.code === 'EAUTH' && error.command === 'API') {
            console.log("Ignoring 'Missing credentials for 'PLAIN'' error.");
        } else {
            console.log(error.message);
        }
    }
}

module.exports = mailSender;