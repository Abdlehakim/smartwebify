/* ------------------------------------------------------------------
   src/app/(webpage)/privacy/page.tsx
   Public Privacy Policy for soukelmeuble.tn
------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Soukelmeuble",
  description:
    "Politique de confidentialité de soukelmeuble.tn : quelles données nous collectons, pourquoi, pendant combien de temps, avec qui nous les partageons et vos droits.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const lastUpdated = "02 Septembre 2025"; // mettez à jour cette date si vous modifiez la page

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdated}</p>

      <p className="mb-6">
        La présente politique explique comment <strong>Soukelmeuble</strong> (« nous », « notre », « nos »)
        collecte, utilise et protège vos données personnelles lorsque vous utilisez notre site{" "}
        <a href="https://soukelmeuble.tn" className="text-primary underline">soukelmeuble.tn</a>,
        créez un compte, passez commande, ou vous connectez via <strong>Facebook</strong> ou <strong>Google</strong>.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">1. Qui est le responsable du traitement ?</h2>
      <p className="mb-4">
        <strong>Soukelmeuble</strong> – Tunis, Tunisie. <br />
        E-mail de contact : <a className="text-primary underline" href="mailto:support@soukelmeuble.tn">support@soukelmeuble.tn</a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Quelles données collectons-nous ?</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Données de compte :</strong> nom, prénom, e-mail, n° de téléphone, mot de passe (haché).
        </li>
        <li>
          <strong>Connexion via Facebook / Google :</strong> identifiant du fournisseur, e-mail, nom/prénom et photo de profil (si disponibles) et
          jetons d’authentification nécessaires à la connexion (jamais votre mot de passe Facebook/Google).
        </li>
        <li>
          <strong>Données de commande et de livraison :</strong> adresses, produits, montants, moyens de paiement (références
          techniques – nous ne stockons pas vos numéros de carte).
        </li>
        <li>
          <strong>Communications :</strong> messages envoyés au support, avis, réponses aux formulaires.
        </li>
        <li>
          <strong>Données techniques :</strong> cookies, identifiants de session, logs de sécurité, type d’appareil et
          informations de navigation générées lors de l’utilisation du site.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Pourquoi utilisons-nous vos données ? (bases légales)</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Fournir le service et exécuter le contrat</strong> (création de compte, panier, commande, livraison, service client).</li>
        <li><strong>Intérêt légitime</strong> (sécurisation des comptes, prévention des fraudes, amélioration du site).</li>
        <li><strong>Obligations légales</strong> (comptabilité, facturation, garanties).</li>
        <li><strong>Consentement</strong> (certaines fonctionnalités optionnelles, cookies non essentiels, newsletters).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Avec qui partageons-nous vos données ?</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Prestataires techniques</strong> (hébergement, sauvegarde, envoi d’e-mails, stockage d’images) strictement nécessaires au service.</li>
        <li><strong>Fournisseurs d’identité</strong> : Meta (Facebook) et Google, uniquement pour l’authentification sociale.</li>
        <li><strong>Prestataires de paiement</strong> (le cas échéant) pour traiter vos transactions en conformité PCI-DSS.</li>
        <li><strong>Autorités</strong> si la loi l’exige, ou pour faire valoir nos droits.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Transferts internationaux</h2>
      <p className="mb-4">
        Certains prestataires peuvent être situés hors de votre pays de résidence. Lorsque c’est le cas, nous mettons en place
        des garanties appropriées (clauses contractuelles types, mesures supplémentaires) lorsque la loi l’exige.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Durées de conservation</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>Compte client : tant que le compte est actif, puis suppression ou anonymisation après demande ou inactivité prolongée.</li>
        <li>Commandes et facturation : durée légale applicable (par ex. obligations comptables).</li>
        <li>Logs de sécurité et sessions : quelques mois au maximum, sauf incident de sécurité.</li>
        <li>Cookies : selon leur finalité (voir ci-dessous).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Cookies et traceurs</h2>
      <p className="mb-4">
        Nous utilisons des cookies nécessaires au fonctionnement du site (session, panier, sécurité). D’autres cookies
        (mesure d’audience, personnalisation) ne sont utilisés qu’avec votre consentement lorsque requis.
        Vous pouvez gérer les cookies depuis les paramètres de votre navigateur.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Vos droits</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>Accès, rectification, mise à jour, portabilité, limitation, opposition et suppression de vos données.</li>
        <li>Retrait du consentement à tout moment pour les traitements basés sur le consentement.</li>
        <li>Pour exercer vos droits : écrivez-nous à <a className="text-primary underline" href="mailto:support@soukelmeuble.tn">support@soukelmeuble.tn</a>.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Sécurité</h2>
      <p className="mb-4">
        Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données
        (chiffrement en transit, contrôle d’accès, journaux de sécurité). Aucun système n’est toutefois parfaitement sécurisé.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Mineurs</h2>
      <p className="mb-4">
        Le site n’est pas destiné aux enfants de moins de 16 ans. Si vous pensez qu’un mineur nous a fourni des données,
        contactez-nous pour les supprimer.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">11. Suppression des données</h2>
      <p className="mb-6">
        Vous pouvez demander la suppression de votre compte et de vos données en suivant les instructions sur la page{" "}
        <Link href="/data-deletion" className="text-primary underline">Suppression des données</Link>.
        Certaines informations peuvent être conservées si la loi l’exige (ex. obligations comptables).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Modifications</h2>
      <p>
        Nous pouvons modifier cette politique pour refléter des évolutions légales ou techniques. La version à jour est publiée
        sur cette page avec la date de mise à jour.
      </p>
    </main>
  );
}
