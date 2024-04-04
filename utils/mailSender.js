const nodemailer = require('nodemailer')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,  
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,  
            },
        }) 
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