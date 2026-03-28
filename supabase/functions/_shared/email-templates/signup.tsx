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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre adresse email pour {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="ATSanté" width="48" height="48" style={{ margin: '0 auto', display: 'block' }} />
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Bienvenue sur ATSanté !</Heading>
        <Text style={text}>
          Merci de vous être inscrit sur{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Nous sommes ravis de vous compter parmi nous.
        </Text>
        <Text style={text}>
          Veuillez confirmer votre adresse email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) en cliquant sur le bouton ci-dessous :
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmer mon email
        </Button>
        <Text style={footer}>
          Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
        </Text>
        <Hr style={divider} />
        <Text style={footerBrand}>© ATSanté — Votre solution de gestion hospitalière</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
