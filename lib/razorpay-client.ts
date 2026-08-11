// Loads Razorpay's checkout script once and opens the payment popup.
// Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export interface OpenCheckoutParams {
  orderId: string;
  amountPaise: number;
  customerName: string;
  customerPhone: string;
  description: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onDismiss: () => void;
}

export async function openRazorpayCheckout(params: OpenCheckoutParams) {
  await loadRazorpayScript();

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: params.amountPaise,
    currency: "INR",
    name: "Travelly",
    description: params.description,
    order_id: params.orderId,
    prefill: {
      name: params.customerName,
      contact: params.customerPhone,
    },
    theme: {
      color: "#2563EB",
    },
    handler: function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      params.onSuccess(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature
      );
    },
    modal: {
      ondismiss: params.onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
