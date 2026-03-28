/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://wziwaoqxnteklnuwpnpi.supabase.co/storage/v1/object/public/email-assets/logo-atsante.png'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez le changement d'email pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="ATSanté" width="48" height="48" style={{ margin: '0 auto', display: 'block' }} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Confirmer le changement d'email</Heading>
        <Text style={text}>
          Vous avez demandé à changer votre adresse email pour {siteName} de{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          vers{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>
          Cliquez sur le bouton ci-dessous pour confirmer ce changement :
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmer le changement
        </Button>
        <Text style={footer}>
          Si vous n'avez pas demandé ce changement, veuillez sécuriser votre compte immédiatement.
        </Text>
        <Hr style={divider} />
        <Text style={footerBrand}>© ATSanté — Votre solution de gestion hospitalière</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const header = { textAlign: 'center' as const, padding: '10px 0' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(187, 65%, 35%)', margin: '0' }
const divider = { borderColor: '#e5e7eb', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 15%, 50%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(187, 65%, 35%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(187, 65%, 35%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerBrand = { fontSize: '11px', color: '#b0b0b0', textAlign: 'center' as const, margin: '10px 0 0' }
