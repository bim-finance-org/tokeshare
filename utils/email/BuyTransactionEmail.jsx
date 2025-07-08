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
  Section,
  Row,
  Column,
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
  companyName = 'TokeShare',
}) => {
  const previewText = `Confirmation of your purchase transaction - ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-8 mx-auto p-6 w-full max-w-[600px]">
            <Heading className="text-2xl font-bold text-center p-0 my-6 mx-0 text-gray-800">
              {companyName} - Confirmation of your purchase transaction
            </Heading>

            <Section className="mb-6">
              <Text className="text-gray-800 text-base mb-2">Hello, {fullName}</Text>
              <Text className="text-gray-700 text-base mb-4">
                Your transaction is being processed. Below, you will find a summary of your request along with the
                necessary details to make the transfer.
              </Text>
            </Section>

            {/* Transaction Details Card */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <Text className="font-bold text-lg mb-4 text-gray-800">Transaction Details</Text>

              <Row>
                <Column>
                  <Text className="text-gray-600 mb-1">Date:</Text>
                  <Text className="text-gray-600 mb-1">Ref.:</Text>
                  <Text className="text-gray-600 mb-1">Blockchain:</Text>
                  <Text className="text-gray-600 mb-1">Amount:</Text>
                  <Text className="text-gray-600 mb-1">Sent:</Text>
                </Column>

                <Column>
                  <Text className="font-bold text-gray-800 mb-1">{date}</Text>
                  <Text className="font-bold text-gray-800 mb-1 underline">{transactionRef}</Text>
                  <Text className="font-bold text-gray-800 mb-1">{blockchain}</Text>
                  <Text className="font-bold text-gray-800 mb-1">
                    {tokenSymbol} {tokenAmount}
                  </Text>
                  <Text className="font-bold text-gray-800 mb-1">{walletAddress}</Text>
                </Column>
              </Row>

              <Text className="text-xs text-gray-500 mt-3">
                *Note, the rate may vary depending on market conditions.
              </Text>
            </Section>

            {/* Transfer Information Card */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <Text className="font-bold text-lg mb-4 text-gray-800">Transfer Information</Text>

              <Row>
                <Column>
                  <Text className="text-gray-600 mb-1">Amount:</Text>
                  <Text className="text-gray-600 mb-1">Beneficiary:</Text>
                  <Text className="text-gray-600 mb-1">IBAN:</Text>
                  <Text className="text-gray-600 mb-1">Alias:</Text>
                  <Text className="text-gray-600 mb-1">Bank:</Text>
                </Column>

                <Column>
                  <Text className="font-bold text-gray-800 mb-1">
                    {fiatSymbol} {fiatAmount}
                  </Text>
                  <Text className="font-bold text-gray-800 mb-1">BIM Finance</Text>
                  <Text className="font-bold text-gray-800 mb-1">FR76 1695 8000 0103 0490 4861 482</Text>
                  <Text className="font-bold text-gray-800 mb-1">TokeShare</Text>
                  <Text className="font-bold text-gray-800 mb-1">QONTO</Text>
                </Column>
              </Row>

              <Text className="text-xs text-gray-600 font-bold mt-3">
                *Don't forget to include the transaction reference when making your transfer.
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-gray-700 text-base mb-4">
                Your cryptocurrency will be credited within 2 to 4 days, depending on the speed of your transfer
                processing. We appreciate your trust.
              </Text>
              <Text className="text-gray-800 text-base mb-1">Best regards,</Text>
              <Text className="text-gray-800 text-base">The {companyName} Team</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BuyTransactionEmail;
