import React from 'react';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Preview, 
  Text,
  Tailwind,
  Link
} from '@react-email/components';

const SellTransactionEmail = ({ 
  fullName, 
  transactionRef,
  companyName = 'TokeShare'
}) => {
  const previewText = `Confirmation de votre opération de vente - ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              <strong>{companyName}</strong> - Confirmation de vente
            </Heading>
            <Text className="text-sm">
              Bonjour {fullName},
            </Text>
            <Text className="text-sm">
              Votre opération de vente n°{transactionRef} a été traitée avec succès. 
              Vous devriez recevoir le virement sur votre compte dans un délai de 2 à 7 jours, 
              en fonction du temps de traitement habituel de votre banque.
            </Text>
            <Text className="text-sm">
              Si vous rencontrez des difficultés, n'hésitez pas à nous contacter en utilisant 
              ce <Link href="https://tokeshare.co/contact" className="text-blue-600">lien</Link>. 
              Nous vous remercions de votre confiance.
            </Text>
            <Text className="text-sm">
              À bientôt sur {companyName}.
            </Text>
            <Text className="text-sm mt-8">
              Cordialement,
              <br/>
              L'équipe de {companyName}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SellTransactionEmail; 