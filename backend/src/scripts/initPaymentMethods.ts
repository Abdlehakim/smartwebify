// src/scripts/initPaymentMethods.ts
import PaymentMethod, { IPaymentMethod } from "@/models/payment/PaymentMethods";
import { PAYMENT_METHOD_KEYS, PAYMENT_METHOD_META, EMPTY_METHOD_CFG } from "@/constants/paymentMethodsData";

export default async function initPaymentMethods(): Promise<void> {
  for (const key of PAYMENT_METHOD_KEYS) {
    const desired = {
      name: key,
      label: PAYMENT_METHOD_META[key]?.defaultLabel ?? EMPTY_METHOD_CFG.label,
      help: PAYMENT_METHOD_META[key]?.defaultHelp ?? EMPTY_METHOD_CFG.help,
      payOnline: PAYMENT_METHOD_META[key]?.payOnline ?? EMPTY_METHOD_CFG.payOnline,
      requireAddress: PAYMENT_METHOD_META[key]?.requireAddress ?? EMPTY_METHOD_CFG.requireAddress,
    };

    let doc = (await PaymentMethod.findOne({ name: key })) as IPaymentMethod | null;

    if (!doc) {
      await PaymentMethod.create({ ...EMPTY_METHOD_CFG, ...desired });
      console.log(`✅ Created payment method: ${key}`);
      continue;
    }

    const updates: Partial<IPaymentMethod> = {};
    if (doc.label !== desired.label) updates.label = desired.label;
    if (doc.help !== desired.help) updates.help = desired.help;
    if (doc.payOnline !== desired.payOnline) updates.payOnline = desired.payOnline;
    if (doc.requireAddress !== desired.requireAddress) updates.requireAddress = desired.requireAddress;

    if (Object.keys(updates).length > 0) {
      Object.assign(doc, updates);
      await doc.save();
      console.log(`🔄 Updated payment method: ${key} ${JSON.stringify(updates)}`);
    } else {
      console.log(`✔️  Payment method up-to-date: ${key}`);
    }
  }
  const extras = await PaymentMethod.find({ name: { $nin: PAYMENT_METHOD_KEYS } }, { name: 1 }).lean();
  if (extras.length) console.warn(`⚠️  Unknown payment method(s) in DB: ${extras.map((e: any) => e.name).join(", ")}`);
  console.log("✅ Payment methods initialization complete.");
}
