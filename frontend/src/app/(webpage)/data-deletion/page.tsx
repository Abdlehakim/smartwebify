/* ------------------------------------------------------------------
   src/app/(webpage)/data-deletion/page.tsx
   Public Data Deletion instructions (required by Facebook)
------------------------------------------------------------------ */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppression des données | Soukelmeuble",
  description:
    "Comment demander la suppression de vos données personnelles et de votre compte sur soukelmeuble.tn.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  const lastUpdated = "02 Septembre 2025";

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Suppression des données</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {lastUpdated}</p>

      <p className="mb-6">
        Vous pouvez demander la suppression de votre compte et de vos données personnelles liées à{" "}
        <strong>Soukelmeuble</strong>. Nous supprimerons ou anonymiserons vos données, à l’exception de celles que la loi
        nous oblige à conserver (ex. documents comptables et factures pendant la durée légale applicable).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1) Depuis votre compte</h2>
      <p className="mb-4">
        Si un bouton « Supprimer mon compte » est disponible dans votre espace client, utilisez-le pour initier la
        suppression. Vous recevrez une confirmation par e-mail.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2) Par e-mail</h2>
      <p className="mb-4">
        Envoyez une demande à{" "}
        <a className="text-primary underline" href="mailto:support@soukelmeuble.tn">
          support@soukelmeuble.tn
        </a>{" "}
        avec l’objet <em>« Demande de suppression de données »</em>. Utilisez l’adresse e-mail associée à votre compte, ou joignez une preuve
        que vous en êtes bien le titulaire.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3) Si vous avez utilisé Facebook/Google</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Facebook :</strong> accédez à <em>Paramètres &gt; Sécurité et connexion &gt; Applications et sites web</em> et
          retirez l’accès pour « Soukelmeuble ». Vous pouvez ensuite nous demander la suppression côté serveur (voir ci-dessus).
        </li>
        <li>
          <strong>Google :</strong> accédez à <em>Mon compte &gt; Sécurité &gt; Accès des tiers</em> et retirez l’accès pour « Soukelmeuble »,
          puis faites la demande côté serveur si nécessaire.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Données supprimées</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>Profil et identifiants (y compris jetons d’authentification sociale).</li>
        <li>Adresses, préférences, historique des sessions.</li>
        <li>Historique des commandes <em>(hors pièces devant être conservées à des fins légales)</em>.</li>
      </ul>

      <p className="mt-6">
        Pour toute question, contactez-nous à{" "}
        <a className="text-primary underline" href="mailto:support@soukelmeuble.tn">support@soukelmeuble.tn</a>.
      </p>
    </main>
  );
}
