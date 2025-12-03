import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone, reason, message, agreed } = req.body;

    if (!name || !email || !reason || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sendToCompany = resend.emails.send({
      from: 'Contact Form <info@rencomhq.com>',
      to: ['info@rencomhq.com'],
      subject: `New Contact Form Submission - ${reason}`,
      replyTo: email,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <p><strong>Agreement:</strong> ${agreed ? 'User agreed' : 'User did not agree'}</p>
      `,
    });

    const sendToUser = resend.emails.send({
      from: 'RenCom <info@rencomhq.com>',
      to: [email],
      subject: "We've received your message!",
      replyTo: 'info@rencomhq.com',
      html: `
        <h1>Hi ${name},</h1>
        <p>Thanks for getting in touch with RenCom!</p>
        <p>We've successfully received your message and will get back to you within 1-2 business days.</p>
        <br />
        <p><strong>Your message details:</strong></p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Message:</strong> ${message}</p>
        <br />
        <p>Best regards,</p>
        <p>The RenCom Team</p>
      `,
    });

    const [companyEmail, userEmail] = await Promise.all([sendToCompany, sendToUser]);

    if (companyEmail.error) {
      return res.status(500).json({ error: companyEmail.error.message });
    }
    if (userEmail.error) {
      return res.status(500).json({ error: userEmail.error.message });
    }

    return res.json({ message: 'Email sent!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});