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
  const previewText = `Confirmation of your sale operation - ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              <strong>{companyName}</strong> - Confirmation of sale
            </Heading>
            <Text className="text-sm">
              Hello {fullName},
            </Text>
            <Text className="text-sm">
              Your sale operation number {transactionRef} has been successfully processed. 
              You should receive the transfer on your account in a delay of 2 to 7 days, 
              depending on the usual processing time of your bank.
            </Text>
            <Text className="text-sm">
              If you encounter difficulties, please do not hesitate to contact us using 
              this <Link href="https://tokeshare.co" className="text-blue-600">link</Link>. 
              We thank you for your trust.
            </Text>
            <Text className="text-sm">
              See you soon on {companyName}.
            </Text>
            <Text className="text-sm mt-8">
              Best regards,
              <br/>
              The {companyName} team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SellTransactionEmail; 