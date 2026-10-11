export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda není povolena.' })
  }

  try {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    const rawBody = chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : ''
    const body = rawBody ? JSON.parse(rawBody) : {}
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Zadej platný e-mail.' })
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const emailFrom = process.env.EMAIL_FROM || 'noreply@localhost'
    const emailTo = process.env.EMAIL_TO || 'info@mynuta.cz'

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(503).json({ error: 'Emailový server není nakonfigurovaný.' })
    }

    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"MYNUTA" <${emailFrom}>`,
      to: emailTo,
      replyTo: email,
      subject: 'Přihlášení k novinkám – MYNUTA',
      text: `Nové přihlášení k novinkám:\n\nE-mail: ${email}\n\nVytvořeno: ${new Date().toISOString()}`,
      html: `
        <p><strong>Nové přihlášení k novinkám</strong></p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Čas:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Subscribe error', error)
    return res.status(500).json({ error: 'Přihlášení se nepodařilo odeslat.' })
  }
}
