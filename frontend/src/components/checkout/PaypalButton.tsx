import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';
import type { CreateOrderActions, OnApproveActions, OnApproveData } from '@paypal/paypal-js';

interface PaypalButtonProps {
  amount: string; // Payment amount as a string
  onSuccess: (details: Record<string, unknown>) => void; // Callback for successful payment
}

const PaypalButton: React.FC<PaypalButtonProps> = ({ amount, onSuccess }) => {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '',
        currency: 'USD',
      }}
    >
      <PayPalButtons
        createOrder={async (
          data: Record<string, unknown>,
          actions: CreateOrderActions
        ) => {
          try {
            // Use actions to create the order with intent and purchase_units
            const orderId = await actions.order.create({
              intent: 'CAPTURE', // Explicitly add the intent
              purchase_units: [
                {
                  amount: {
                    currency_code: 'USD', // Specify the currency code
                    value: amount, // The payment amount
                  },
                },
              ],
            });
            return orderId; // Return the order ID to proceed with the payment
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            toast.error('Order creation failed. Please try again.');
            return Promise.reject('Order creation failed');
          }
        }}
        onApprove={async (
          data: OnApproveData,
          actions: OnApproveActions
        ) => {
          try {
            const details = await actions.order?.capture();
            if (details) {
              onSuccess(details); // Trigger success logic
              toast.success('Payment successful!');
            }
          } catch (error) {
            console.error('Error capturing order:', error);
            toast.error('Payment failed. Please try again.');
          }
        }}
        onError={(err: unknown) => {
          console.error('PayPal Error:', err);
          toast.error('An error occurred with PayPal. Please try again.');
        }}
        forceReRender={[amount]} // Re-render when amount changes
      />
    </PayPalScriptProvider>
  );
};

export default PaypalButton;
