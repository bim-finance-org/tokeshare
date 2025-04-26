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
  Link,
  Section,
  Row,
  Column
} from '@react-email/components';

const BuyTransactionEmail = ({ 
  fullName,
  transactionRef,
  date,
  blockchain,
  fiatSymbol,
  fiatAmount,
  tokenSymbol,
  tokenAmount,
  walletAddress,
  companyName = 'TokeShare'
}) => {
  const previewText = `Confirmation of your purchase transaction - ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[800px]">
            <Heading className="text-2xl font-normal text-center p-0 my-8 mx-0">
              <strong>{companyName}</strong> - Transaction Confirmation
            </Heading>
            
            <Section className="mb-6">
              <Text className="text-base mb-2">Hello, {fullName}</Text>
              <Text className="text-base mb-4">Your transaction is being processed. Below, you will find a summary of your request along with the necessary details to make the transfer.</Text>
            </Section>
            
            {/* Transaction Details Card */}
            <Section className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
              <Text className="font-bold text-lg mb-4">Transaction Details</Text>
              
              <Row>
                <Column className="w-1/2">
                  <Text className="text-gray-600">Date:</Text>
                  <Text className="text-gray-600 font-bold">Ref.:</Text>
                  <Text className="text-gray-600">Blockchain:</Text>
                  <Text className="text-gray-600">Amount:</Text>
                  <Text className="text-gray-600">Sent:</Text>
                </Column>
                
                <Column className="w-1/2">
                  <Text className="font-bold">{date}</Text>
                  <Text className="font-bold underline">{transactionRef}</Text>
                  <Text className="font-bold">{blockchain}</Text>
                  <Text className="font-bold">{tokenSymbol} {tokenAmount}</Text>
                  <Text className="font-bold">{walletAddress}</Text>
                </Column>
              </Row>
              
              <Text className="text-xs text-gray-600 mt-3">*Note, the rate may vary depending on market conditions.</Text>
            </Section>
            
            {/* Transfer Information Card */}
            <Section className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
              <Text className="font-bold text-lg mb-4">Transfer Information</Text>
              
              <Row>
                <Column className="w-1/2">
                  <Text className="text-gray-600">Amount:</Text>
                  <Text className="text-gray-600">Beneficiary:</Text>
                  <Text className="text-gray-600">IBAN:</Text>
                  <Text className="text-gray-600">Alias:</Text>
                  <Text className="text-gray-600">Bank:</Text>
                </Column>
                
                <Column className="w-1/2">
                  <Text className="font-bold">{fiatSymbol} {fiatAmount}</Text>
                  <Text className="font-bold">BIM Finance</Text>
                  <Text className="font-bold">FR76 1695 8000 0103 0490 4861 482</Text>
                  <Text className="font-bold">TokeShare</Text>
                  <Text className="font-bold">QONTO</Text>
                </Column>
              </Row>
              
              <Text className="text-xs text-gray-600 font-bold mt-3">*Don't forget to include the transaction reference when making your transfer.</Text>
            </Section>
            
            <Section className="mb-6">
              <Text className="text-base mb-4">Your cryptocurrency will be credited within 0 to 2 days, depending on the speed of your transfer processing. We appreciate your trust.</Text>
              <Text className="text-base mb-1">Best regards,</Text>
              <Text className="text-base">The {companyName} Team</Text>
            </Section>
            
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BuyTransactionEmail; 