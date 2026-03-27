/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vous êtes invité à rejoindre {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🏥 ATSanté</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Félicitations ! 🎉</Heading>
        <Text style={text}>
          Vous avez été invité à rejoindre{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          , votre plateforme de gestion hospitalière.
        </Text>
        <Text style={text}>
          Merci pour votre confiance ! Cliquez sur le bouton ci-dessous pour accepter
          l'invitation et accéder à votre espace de travail.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accepter l'invitation
        </Button>
        <Text style={subtext}>
          Une fois connecté, vous pourrez configurer votre clinique, gérer vos patients
          et profiter de toutes les fonctionnalités d'ATSanté.
        </Text>
        <Text style={footer}>
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email en toute sécurité.
        </Text>
        <Hr style={divider} />
        <Text style={footerBrand}>© ATSanté — Votre solution de gestion hospitalière</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const header = { textAlign: 'center' as const, padding: '10px 0' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(187, 65%, 35%)', margin: '0' }
const divider = { borderColor: '#e5e7eb', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: 'hsl(215, 25%, 15%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(215, 15%, 50%)', lineHeight: '1.6', margin: '0 0 20px' }
const subtext = { fontSize: '13px', color: 'hsl(215, 15%, 60%)', lineHeight: '1.5', margin: '20px 0', padding: '12px 16px', backgroundColor: '#f8fafb', borderRadius: '8px', borderLeft: '3px solid hsl(187, 65%, 35%)' }
const link = { color: 'hsl(187, 65%, 35%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(187, 65%, 35%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '10px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerBrand = { fontSize: '11px', color: '#b0b0b0', textAlign: 'center' as const, margin: '10px 0 0' }
