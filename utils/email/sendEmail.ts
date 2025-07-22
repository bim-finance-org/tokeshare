import { Resend } from 'resend';
import { renderAsync } from '@react-email/render';
import SellTransactionEmail from './SellTransactionEmail.jsx';
import BuyTransactionEmail from './BuyTransactionEmail.jsx';
import React from 'react';

// Vérification des variables d'environnement
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

// Initialisation de Resend avec l'API key depuis les variables d'environnement
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Interface de base pour les données d'email
interface BaseEmailData {
  email: string;
  fullName: string;
  transactionRef: string;
}

// Interface spécifique pour les emails d'achat
interface BuyEmailData extends BaseEmailData {
  date?: string;
  blockchain: string;
  fiatSymbol?: string;
  fiatAmount: string | number;
  tokenSymbol: string;
  tokenAmount: string | number;
  walletAddress: string;
}

// Interface spécifique pour les emails de vente
interface SellEmailData extends BaseEmailData {
  // Ajoutez ici des propriétés spécifiques à la vente si nécessaire
}

/**
 * Envoie un email de confirmation de transaction en fonction du type de transaction
 */
export async function sendTransactionEmail(
  data: BaseEmailData & { transactionType: 'buy' | 'sell' } & Partial<BuyEmailData>,
) {
  if (data.transactionType === 'buy') {
    // Validation des données spécifiques à l'achat
    console.log(data);
    if (!data.blockchain || !data.fiatAmount || !data.tokenSymbol || !data.tokenAmount || !data.walletAddress) {
      throw new Error("Données manquantes pour l'email d'achat");
    }

    return sendBuyTransactionEmail({
      email: data.email,
      fullName: data.fullName,
      transactionRef: data.transactionRef,
      date: data.date,
      blockchain: data.blockchain,
      fiatSymbol: data.fiatSymbol,
      fiatAmount: data.fiatAmount,
      tokenSymbol: data.tokenSymbol,
      tokenAmount: data.tokenAmount,
      walletAddress: data.walletAddress,
    });
  } else {
    return sendSellTransactionEmail({
      email: data.email,
      fullName: data.fullName,
      transactionRef: data.transactionRef,
    });
  }
}

/**
 * Envoie un email de confirmation d'achat avec les détails spécifiques
 */
async function sendBuyTransactionEmail(data: BuyEmailData) {
  validateEmailConfig();

  // Validation des données requises
  console.log(data);
  if (!data.email || !data.fullName || !data.transactionRef) {
    throw new Error("Données manquantes pour l'envoi de l'email");
  }

  try {
    const props = {
      fullName: data.fullName,
      transactionRef: data.transactionRef,
      date: data.date || new Date().toLocaleDateString(),
      blockchain: data.blockchain,
      fiatSymbol: data.fiatSymbol,
      fiatAmount: data.fiatAmount,
      tokenSymbol: data.tokenSymbol,
      tokenAmount: data.tokenAmount,
      walletAddress: data.walletAddress,
      companyName: 'TokeShare',
    };

    // Conversion du composant React en HTML
    const html = await renderAsync(React.createElement(BuyTransactionEmail, props));

    return await sendEmail({
      to: data.email,
      subject: `Your purchase transaction - TokeShare`,
      html,
      transactionType: 'buy',
    });
  } catch (error) {
    handleEmailError(error);
  }
}

/**
 * Envoie un email de confirmation de vente
 */
async function sendSellTransactionEmail(data: SellEmailData) {
  validateEmailConfig();

  // Validation des données requises
  if (!data.email || !data.fullName || !data.transactionRef) {
    throw new Error("Données manquantes pour l'envoi de l'email");
  }

  try {
    const props = {
      fullName: data.fullName,
      transactionRef: data.transactionRef,
      companyName: 'TokeShare',
    };

    // Conversion du composant React en HTML
    const html = await renderAsync(React.createElement(SellTransactionEmail, props));

    return await sendEmail({
      to: data.email,
      subject: `Your sale transaction - TokeShare`,
      html,
      transactionType: 'sell',
    });
  } catch (error) {
    handleEmailError(error);
  }
}

/**
 * Fonction interne pour envoyer l'email
 */
async function sendEmail({
  to,
  subject,
  html,
  transactionType,
}: {
  to: string;
  subject: string;
  html: string;
  transactionType: 'buy' | 'sell';
}) {
  // Envoi de l'email
  const { data: emailData, error: emailError } = await resend!.emails.send({
    from: `TokeShare <${RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  if (emailError) {
    console.error('Error sending confirmation email:', emailError);
    throw new Error(emailError.message);
  }

  console.log(`Email de confirmation ${transactionType} envoyé avec succès:`, emailData);
  return { success: true, message: 'Email sent successfully' };
}

/**
 * Valide la configuration d'email
 */
function validateEmailConfig() {
  if (!resend) {
    console.error('Error: RESEND_API_KEY is not configured');
    throw new Error('Configuration email manquante');
  }

  if (!RESEND_FROM_EMAIL) {
    console.error('Error: RESEND_FROM_EMAIL is not configured');
    throw new Error('Configuration email manquante');
  }
}

/**
 * Gère les erreurs d'envoi d'email
 */
function handleEmailError(error: unknown) {
  console.error('Error in sendTransactionEmail:', error);
  throw new Error(error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email");
}
